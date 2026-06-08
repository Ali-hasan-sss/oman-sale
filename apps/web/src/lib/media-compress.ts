import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

import { MAX_IMAGE_DIMENSION, MAX_MEDIA_UPLOAD_BYTES, MAX_VIDEO_DIMENSION } from '@/lib/media-limits';

export class MediaCompressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MediaCompressionError';
  }
}

function replaceExtension(fileName: string, extension: string) {
  return fileName.replace(/\.[^.]+$/, '') + extension;
}

function readFileAsImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new MediaCompressionError('Could not read image file'));
    };

    image.src = url;
  });
}

function scaleDimensions(width: number, height: number, maxDimension: number) {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  const ratio = Math.min(maxDimension / width, maxDimension / height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio))
  };
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

async function renderCompressedImage(file: File, maxDimension: number, mimeType: string, quality: number) {
  const image = await readFileAsImage(file);
  const { width, height } = scaleDimensions(image.naturalWidth, image.naturalHeight, maxDimension);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new MediaCompressionError('Could not prepare image compression');
  }

  context.drawImage(image, 0, 0, width, height);
  const blob = await canvasToBlob(canvas, mimeType, quality);
  if (!blob) {
    throw new MediaCompressionError('Could not compress image');
  }

  const extension = mimeType === 'image/webp' ? '.webp' : '.jpg';
  return new File([blob], replaceExtension(file.name, extension), { type: mimeType, lastModified: Date.now() });
}

export async function compressImageForUpload(file: File, maxBytes = MAX_MEDIA_UPLOAD_BYTES): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  if (file.size <= maxBytes) {
    const image = await readFileAsImage(file);
    const fitsDimensions =
      image.naturalWidth <= MAX_IMAGE_DIMENSION && image.naturalHeight <= MAX_IMAGE_DIMENSION;
    if (fitsDimensions) {
      return file;
    }
  }

  const outputMimeType = file.type === 'image/png' ? 'image/webp' : 'image/jpeg';
  const qualities = [0.86, 0.76, 0.66, 0.56, 0.46];
  const dimensions = [MAX_IMAGE_DIMENSION, 1600, 1280, 1024, 800];

  let smallest: File | null = null;

  for (const maxDimension of dimensions) {
    for (const quality of qualities) {
      const compressed = await renderCompressedImage(file, maxDimension, outputMimeType, quality);
      if (!smallest || compressed.size < smallest.size) {
        smallest = compressed;
      }
      if (compressed.size <= maxBytes) {
        return compressed;
      }
    }
  }

  if (smallest && smallest.size <= maxBytes) {
    return smallest;
  }

  throw new MediaCompressionError('الصورة كبيرة جداً حتى بعد الضغط. جرّب صورة أصغر.');
}

let ffmpegLoader: Promise<FFmpeg> | null = null;

async function getFfmpeg() {
  if (!ffmpegLoader) {
    ffmpegLoader = (async () => {
      const ffmpeg = new FFmpeg();
      const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
      });
      return ffmpeg;
    })();
  }

  return ffmpegLoader;
}

function getVideoExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && ['mp4', 'webm', 'mov', 'quicktime'].includes(fromName)) {
    return fromName === 'quicktime' ? 'mov' : fromName;
  }

  if (file.type === 'video/webm') return 'webm';
  if (file.type === 'video/quicktime') return 'mov';
  return 'mp4';
}

export async function compressVideoForUpload(
  file: File,
  maxBytes = MAX_MEDIA_UPLOAD_BYTES,
  onProgress?: (ratio: number) => void
): Promise<File> {
  if (!file.type.startsWith('video/')) {
    return file;
  }

  if (file.size <= maxBytes) {
    return file;
  }

  const ffmpeg = await getFfmpeg();
  const inputName = `input.${getVideoExtension(file)}`;
  const outputName = 'output.mp4';

  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      onProgress(Math.min(1, Math.max(0, progress)));
    });
  }

  await ffmpeg.writeFile(inputName, await fetchFile(file));

  const scales = [MAX_VIDEO_DIMENSION, 960, 720, 540];
  const crfs = [28, 32, 36, 40];
  let smallest: File | null = null;

  for (const scale of scales) {
    for (const crf of crfs) {
      await ffmpeg.exec([
        '-y',
        '-i',
        inputName,
        '-vf',
        `scale='min(${scale},iw)':-2`,
        '-c:v',
        'libx264',
        '-crf',
        String(crf),
        '-preset',
        'veryfast',
        '-c:a',
        'aac',
        '-b:a',
        '96k',
        '-movflags',
        '+faststart',
        outputName
      ]);

      const data = await ffmpeg.readFile(outputName);
      const bytes = data instanceof Uint8Array ? Uint8Array.from(data) : new TextEncoder().encode(String(data));
      const blob = new Blob([bytes], { type: 'video/mp4' });
      const compressed = new File([blob], replaceExtension(file.name, '.mp4'), {
        type: 'video/mp4',
        lastModified: Date.now()
      });

      if (!smallest || compressed.size < smallest.size) {
        smallest = compressed;
      }

      if (compressed.size <= maxBytes) {
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
        return compressed;
      }
    }
  }

  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  if (smallest && smallest.size <= maxBytes) {
    return smallest;
  }

  throw new MediaCompressionError('الفيديو كبير جداً حتى بعد الضغط. جرّب فيديو أقصر أو بدقة أقل.');
}

export async function prepareMediaForUpload(
  file: File,
  options?: { onCompressProgress?: (ratio: number) => void }
): Promise<File> {
  if (file.type.startsWith('video/')) {
    return compressVideoForUpload(file, MAX_MEDIA_UPLOAD_BYTES, options?.onCompressProgress);
  }

  if (file.type.startsWith('image/')) {
    return compressImageForUpload(file, MAX_MEDIA_UPLOAD_BYTES);
  }

  if (file.size > MAX_MEDIA_UPLOAD_BYTES) {
    throw new MediaCompressionError('File is too large');
  }

  return file;
}

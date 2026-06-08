'use client';

import { Loader2, Video, X } from 'lucide-react';
import { useState } from 'react';

import { ImageUploader } from '@/components/media/image-uploader';
import { registerMediaPreviewUrl, resolveMediaUrl } from '@/lib/media-url';
import { MediaCompressionError, uploadMediaFile } from '@/lib/media-upload';

type ListingAdMediaUploaderLabels = {
  imagesTitle: string;
  imagesHint: string;
  videoTitle: string;
  videoHint: string;
  remove: string;
  uploading?: string;
  compressing?: string;
  uploadError?: string;
};

type ListingAdMediaUploaderProps = {
  imageUrls: string[];
  videoUrl: string | null;
  onImageUrlsChange: (value: string[]) => void;
  onVideoUrlChange: (value: string | null) => void;
  labels: ListingAdMediaUploaderLabels;
  disabled?: boolean;
};

export function ListingAdMediaUploader({
  imageUrls,
  videoUrl,
  onImageUrlsChange,
  onVideoUrlChange,
  labels,
  disabled = false
}: ListingAdMediaUploaderProps) {
  const [videoStage, setVideoStage] = useState<'idle' | 'compressing' | 'uploading'>('idle');
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  const isUploadingVideo = videoStage !== 'idle';

  const uploadVideo = async (file: File) => {
    setError('');
    try {
      const result = await uploadMediaFile(file, 'ads', {
        onStageChange: (stage) => setVideoStage(stage)
      });
      registerMediaPreviewUrl(result.key, result.url);
      setVideoPreviewUrl(result.url);
      onVideoUrlChange(result.key);
    } catch (caught) {
      if (caught instanceof MediaCompressionError) {
        setError(caught.message);
      } else {
        setError(labels.uploadError ?? 'Upload failed');
      }
    } finally {
      setVideoStage('idle');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-bold text-gray-700">{labels.videoTitle}</label>
        {videoUrl ? (
          <div className="relative h-44 overflow-hidden rounded-xl border border-gray-200 bg-black">
            <video
              src={videoPreviewUrl ?? resolveMediaUrl(videoUrl)}
              controls
              playsInline
              className="h-full w-full object-contain"
            />
            <button
              type="button"
              onClick={() => {
                onVideoUrlChange(null);
                setVideoPreviewUrl(null);
              }}
              disabled={disabled || isUploadingVideo}
              className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-red-600 shadow"
              aria-label={labels.remove}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label
            className={`block cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition hover:border-green-500 ${
              disabled || isUploadingVideo ? 'pointer-events-none opacity-60' : ''
            }`}
          >
            {isUploadingVideo ? (
              <Loader2 className="mx-auto mb-3 animate-spin text-gray-400" size={36} />
            ) : (
              <Video className="mx-auto mb-3 text-gray-400" size={36} />
            )}
            <p className="mb-1 text-gray-600">
              {videoStage === 'compressing'
                ? labels.compressing ?? labels.videoTitle
                : videoStage === 'uploading'
                  ? labels.uploading ?? labels.videoTitle
                  : labels.videoTitle}
            </p>
            <p className="text-sm text-gray-500">{labels.videoHint}</p>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              disabled={disabled || isUploadingVideo}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) void uploadVideo(file);
              }}
            />
          </label>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-gray-700">{labels.imagesTitle}</label>
        <ImageUploader
          folder="ads"
          multiple
          maxFiles={8}
          value={imageUrls}
          onChange={onImageUrlsChange}
          labels={{
            title: labels.imagesTitle,
            hint: labels.imagesHint,
            remove: labels.remove,
            uploading: labels.uploading,
            compressing: labels.compressing,
            uploadError: labels.uploadError
          }}
          disabled={disabled}
        />
      </div>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

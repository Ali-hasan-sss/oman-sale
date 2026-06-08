'use client';

import { Loader2, Upload, X } from 'lucide-react';
import { ChangeEvent, useMemo, useState } from 'react';

import { adminApi } from '@/lib/admin-auth';
import { registerMediaPreviewUrl, resolveMediaUrl } from '@/lib/media-url';
import { MediaCompressionError, uploadMediaFile, type MediaFolder } from '@/lib/media-upload';

type ImageUploaderLabels = {
  title: string;
  hint: string;
  remove: string;
  uploading?: string;
  compressing?: string;
  uploadError?: string;
};

type ImageUploaderBaseProps = {
  folder: MediaFolder;
  labels: ImageUploaderLabels;
  disabled?: boolean;
  accept?: string;
  className?: string;
  useAdminAuth?: boolean;
};

type MultipleImageUploaderProps = ImageUploaderBaseProps & {
  multiple: true;
  maxFiles?: number;
  value: string[];
  onChange: (value: string[]) => void;
};

type SingleImageUploaderProps = ImageUploaderBaseProps & {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
};

export type ImageUploaderProps = MultipleImageUploaderProps | SingleImageUploaderProps;

export function ImageUploader(props: ImageUploaderProps) {
  const {
    folder,
    labels,
    disabled = false,
    accept = 'image/jpeg,image/png,image/webp,image/gif',
    className = '',
    useAdminAuth = false
  } = props;

  const [uploadStage, setUploadStage] = useState<'idle' | 'compressing' | 'uploading'>('idle');
  const [error, setError] = useState('');
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  const values = useMemo(() => {
    if (props.multiple) return props.value;
    return props.value ? [props.value] : [];
  }, [props]);

  const maxFiles = props.multiple ? (props.maxFiles ?? 8) : 1;
  const remainingSlots = Math.max(0, maxFiles - values.length);
  const isBusy = uploadStage !== 'idle';

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, remainingSlots);
    event.target.value = '';

    if (files.length === 0 || disabled || isBusy) return;

    setError('');

    const uploadedKeys: string[] = [];

    try {
      for (const file of files) {
        const result = await uploadMediaFile(file, folder, {
          onStageChange: setUploadStage,
          client: useAdminAuth ? adminApi() : undefined
        });
        registerMediaPreviewUrl(result.key, result.url);
        setPreviewUrls((current) => ({ ...current, [result.key]: result.url }));
        uploadedKeys.push(result.key);
      }

      if (props.multiple) {
        props.onChange([...props.value, ...uploadedKeys].slice(0, maxFiles));
      } else if (uploadedKeys[0]) {
        props.onChange(uploadedKeys[0]);
      }
    } catch (caught) {
      if (caught instanceof MediaCompressionError) {
        setError(caught.message);
      } else {
        setError(labels.uploadError ?? 'Upload failed');
      }
    } finally {
      setUploadStage('idle');
    }
  };

  const removeAt = (index: number) => {
    if (props.multiple) {
      props.onChange(props.value.filter((_, currentIndex) => currentIndex !== index));
      return;
    }

    props.onChange('');
  };

  return (
    <div className={className}>
      {values.length > 0 ? (
        <div className={`grid gap-3 ${props.multiple ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1'}`}>
          {values.map((reference, index) => (
            <div key={`${reference}-${index}`} className="relative h-28 overflow-hidden rounded-xl border border-gray-200">
              <img src={previewUrls[reference] ?? resolveMediaUrl(reference)} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(index)}
                disabled={disabled || isBusy}
                className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-red-600 shadow disabled:opacity-60"
                aria-label={labels.remove}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {remainingSlots > 0 ? (
        <label
          className={`mt-4 block cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition hover:border-green-500 ${
            disabled || isBusy ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          {isBusy ? (
            <Loader2 className="mx-auto mb-4 animate-spin text-gray-400" size={40} />
          ) : (
            <Upload className="mx-auto mb-4 text-gray-400" size={48} />
          )}
          <p className="mb-2 text-gray-600">
            {uploadStage === 'compressing'
              ? labels.compressing ?? labels.title
              : uploadStage === 'uploading'
                ? labels.uploading ?? labels.title
                : labels.title}
          </p>
          <p className="text-sm text-gray-500">{labels.hint}</p>
          <input
            type="file"
            accept={accept}
            multiple={props.multiple}
            onChange={handleFiles}
            className="hidden"
            disabled={disabled || isBusy}
          />
        </label>
      ) : null}

      {error ? <p className="mt-2 text-sm font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

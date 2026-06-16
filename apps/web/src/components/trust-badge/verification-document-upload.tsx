'use client';

import { CheckCircle2, FileText, Loader2, Upload, X } from 'lucide-react';
import { useId } from 'react';

type VerificationDocumentUploadProps = {
  label: string;
  required?: boolean;
  fileName?: string;
  isUploading?: boolean;
  disabled?: boolean;
  hint?: string;
  chooseLabel: string;
  changeLabel: string;
  uploadingLabel: string;
  uploadedLabel: string;
  onSelect: (file: File) => void | Promise<void>;
  onClear?: () => void;
};

export function VerificationDocumentUpload({
  label,
  required = false,
  fileName,
  isUploading = false,
  disabled = false,
  hint,
  chooseLabel,
  changeLabel,
  uploadingLabel,
  uploadedLabel,
  onSelect,
  onClear
}: VerificationDocumentUploadProps) {
  const inputId = useId();
  const hasFile = Boolean(fileName);
  const isDisabled = disabled || isUploading;

  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-sm font-bold text-gray-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>

      <div
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition ${
          isUploading
            ? 'border-green-400 bg-green-50/60'
            : hasFile
              ? 'border-green-300 bg-green-50/40'
              : 'border-gray-200 bg-slate-50/80 hover:border-green-300 hover:bg-green-50/30'
        } ${isDisabled && !isUploading ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" aria-hidden />
            <p className="text-sm font-bold text-green-700">{uploadingLabel}</p>
          </div>
        ) : hasFile ? (
          <div className="flex items-center gap-3 px-4 py-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <CheckCircle2 size={22} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-green-700">{uploadedLabel}</p>
              <p className="truncate text-sm font-bold text-gray-900">{fileName}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <label
                htmlFor={inputId}
                className={`cursor-pointer rounded-xl border border-green-200 bg-white px-3 py-2 text-xs font-bold text-green-700 transition hover:bg-green-50 ${
                  isDisabled ? 'pointer-events-none' : ''
                }`}
              >
                {changeLabel}
              </label>
              {onClear ? (
                <button
                  type="button"
                  onClick={onClear}
                  disabled={isDisabled}
                  className="rounded-xl border border-gray-200 bg-white p-2 text-gray-500 transition hover:bg-gray-50 hover:text-red-600 disabled:opacity-60"
                  aria-label={changeLabel}
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <label
            htmlFor={inputId}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 px-4 py-8 text-center ${
              isDisabled ? 'pointer-events-none' : ''
            }`}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-green-600 shadow-sm ring-1 ring-green-100">
              <Upload size={22} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-bold text-gray-900">{chooseLabel}</p>
              {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-600 ring-1 ring-gray-200">
              <FileText size={14} aria-hidden />
              JPG · PNG · PDF
            </span>
          </label>
        )}

        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          disabled={isDisabled}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onSelect(file);
            event.target.value = '';
          }}
        />
      </div>
    </div>
  );
}

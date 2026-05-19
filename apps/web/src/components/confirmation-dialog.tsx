'use client';

import { AlertTriangle, X } from 'lucide-react';

type ConfirmationDialogProps = {
  cancelLabel: string;
  confirmLabel: string;
  description: string;
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  variant?: 'danger' | 'default';
};

export function ConfirmationDialog({
  cancelLabel,
  confirmLabel,
  description,
  isConfirming = false,
  onCancel,
  onConfirm,
  title,
  variant = 'default'
}: ConfirmationDialogProps) {
  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className={`rounded-2xl p-3 ${isDanger ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              <AlertTriangle size={22} />
            </span>
            <div>
              <h2 className="text-xl font-black text-gray-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 disabled:opacity-60"
            aria-label={cancelLabel}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="rounded-xl border border-gray-300 px-5 py-2 font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className={`rounded-xl px-5 py-2 font-bold text-white transition disabled:opacity-70 ${
              isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isConfirming ? `${confirmLabel}...` : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

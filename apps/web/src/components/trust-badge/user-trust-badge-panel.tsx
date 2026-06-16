'use client';

import { useEffect, useState } from 'react';

import { VerifiedBadge } from '@/components/trust-badge/verified-badge';
import { VerificationDocumentUpload } from '@/components/trust-badge/verification-document-upload';
import { api } from '@/lib/api';
import { resolveApiErrorMessage } from '@/lib/api-errors';
import { useI18n } from '@/lib/i18n';
import { uploadVerificationDocument } from '@/lib/verification-upload';

type UserTrustBadge = {
  trustBadgeStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  trustBadgeApproved: boolean;
  trustIdentityDocType?: 'NATIONAL_ID' | 'PASSPORT' | null;
  trustIdentityDocUrl?: string | null;
  trustBadgeRejectionReason?: string | null;
};

export function UserTrustBadgePanel() {
  const { m } = useI18n();
  const text = m.trustBadge;
  const [data, setData] = useState<UserTrustBadge | null>(null);
  const [documentType, setDocumentType] = useState<'NATIONAL_ID' | 'PASSPORT'>('NATIONAL_ID');
  const [documentKey, setDocumentKey] = useState('');
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = () => {
    setIsLoading(true);
    api
      .get<{ data: UserTrustBadge }>('/trust-badge/users/me')
      .then((response) => setData(response.data.data))
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleFileSelect = async (file: File) => {
    setError('');
    setMessage('');
    setIsUploading(true);

    try {
      const uploaded = await uploadVerificationDocument(file);
      setDocumentKey(uploaded.key);
      setFileName(file.name);
    } catch (uploadError) {
      if (uploadError instanceof Error && uploadError.message === 'UNSUPPORTED_VERIFICATION_FILE') {
        setError(text.unsupportedFile);
      } else if (uploadError instanceof Error && uploadError.message === 'VERIFICATION_FILE_TOO_LARGE') {
        setError(text.fileTooLarge);
      } else {
        setError(text.uploadError);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const submit = async () => {
    if (!documentKey) {
      setError(text.documentRequired);
      return;
    }

    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await api.post<{ data: UserTrustBadge }>('/trust-badge/users/me', {
        documentType,
        documentUrl: documentKey
      });
      setData(response.data.data);
      setMessage(text.submitSuccess);
      setDocumentKey('');
      setFileName('');
    } catch (submitError) {
      setError(resolveApiErrorMessage(submitError, m.errors, text.submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-gray-500">{text.loading}</p>;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-bold text-gray-900">{text.userTitle}</h2>
        {data?.trustBadgeApproved ? <VerifiedBadge size="md" title={text.verifiedLabel} /> : null}
      </div>
      <p className="mb-6 text-sm text-gray-600">{text.userDescription}</p>

      {data?.trustBadgeStatus === 'PENDING' ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">{text.pendingReview}</p>
      ) : null}

      {data?.trustBadgeStatus === 'APPROVED' ? (
        <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{text.approvedMessage}</p>
      ) : null}

      {data?.trustBadgeStatus === 'REJECTED' ? (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {text.rejectedMessage}
          {data.trustBadgeRejectionReason ? `: ${data.trustBadgeRejectionReason}` : ''}
        </p>
      ) : null}

      {data?.trustBadgeStatus !== 'PENDING' && data?.trustBadgeStatus !== 'APPROVED' ? (
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">{text.documentType}</label>
            <select
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value as 'NATIONAL_ID' | 'PASSPORT')}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
            >
              <option value="NATIONAL_ID">{text.nationalId}</option>
              <option value="PASSPORT">{text.passport}</option>
            </select>
          </div>

          <VerificationDocumentUpload
            label={text.uploadDocument}
            required
            fileName={fileName}
            isUploading={isUploading}
            disabled={isSubmitting || isUploading}
            chooseLabel={text.chooseDocument}
            changeLabel={text.changeDocument}
            uploadingLabel={text.uploadingDocument}
            uploadedLabel={text.documentUploaded}
            hint={text.fileHint}
            onSelect={handleFileSelect}
            onClear={() => {
              setDocumentKey('');
              setFileName('');
            }}
          />

          {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p> : null}
          {message ? <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{message}</p> : null}

          <button
            type="button"
            onClick={submit}
            disabled={isSubmitting || isUploading}
            className="rounded-xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-70"
          >
            {isSubmitting ? text.submitting : text.submitRequest}
          </button>
        </div>
      ) : null}
    </div>
  );
}

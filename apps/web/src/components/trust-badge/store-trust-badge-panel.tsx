'use client';

import { useEffect, useState } from 'react';

import { VerifiedBadge } from '@/components/trust-badge/verified-badge';
import { VerificationDocumentUpload } from '@/components/trust-badge/verification-document-upload';
import { api } from '@/lib/api';
import { resolveApiErrorMessage } from '@/lib/api-errors';
import { useI18n } from '@/lib/i18n';
import { uploadVerificationDocument } from '@/lib/verification-upload';

type StoreTrustBadge = {
  trustBadgeStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  trustBadgeApproved: boolean;
  trustCommercialRegDocUrl?: string | null;
  trustOcciDocUrl?: string | null;
  trustSmeDocUrl?: string | null;
  trustOtherDocUrl?: string | null;
  trustOtherDocLabel?: string | null;
  trustBadgeRejectionReason?: string | null;
};

type DocumentField = 'commercialRegDocUrl' | 'occiDocUrl' | 'smeDocUrl' | 'otherDocUrl';

export function StoreTrustBadgePanel({ storeId }: { storeId: string }) {
  const { m } = useI18n();
  const text = m.trustBadge;
  const [data, setData] = useState<StoreTrustBadge | null>(null);
  const [documents, setDocuments] = useState<Record<DocumentField, string>>({
    commercialRegDocUrl: '',
    occiDocUrl: '',
    smeDocUrl: '',
    otherDocUrl: ''
  });
  const [fileNames, setFileNames] = useState<Partial<Record<DocumentField, string>>>({});
  const [otherDocLabel, setOtherDocLabel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<DocumentField | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const uploadLabels = {
    chooseLabel: text.chooseDocument,
    changeLabel: text.changeDocument,
    uploadingLabel: text.uploadingDocument,
    uploadedLabel: text.documentUploaded,
    hint: text.fileHint
  };

  const load = () => {
    setIsLoading(true);
    api
      .get<{ data: StoreTrustBadge }>(`/trust-badge/stores/${storeId}`)
      .then((response) => setData(response.data.data))
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
  }, [storeId]);

  const uploadField = async (field: DocumentField, file: File) => {
    setError('');
    setMessage('');
    setUploadingField(field);

    try {
      const uploaded = await uploadVerificationDocument(file);
      setDocuments((current) => ({ ...current, [field]: uploaded.key }));
      setFileNames((current) => ({ ...current, [field]: file.name }));
    } catch (uploadError) {
      if (uploadError instanceof Error && uploadError.message === 'UNSUPPORTED_VERIFICATION_FILE') {
        setError(text.unsupportedFile);
      } else if (uploadError instanceof Error && uploadError.message === 'VERIFICATION_FILE_TOO_LARGE') {
        setError(text.fileTooLarge);
      } else {
        setError(text.uploadError);
      }
    } finally {
      setUploadingField(null);
    }
  };

  const clearField = (field: DocumentField) => {
    setDocuments((current) => ({ ...current, [field]: '' }));
    setFileNames((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const submit = async () => {
    if (!documents.commercialRegDocUrl) {
      setError(text.commercialRegRequired);
      return;
    }

    if (documents.otherDocUrl && !otherDocLabel.trim()) {
      setError(text.otherDocLabelRequired);
      return;
    }

    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await api.post<{ data: StoreTrustBadge }>(`/trust-badge/stores/${storeId}`, {
        commercialRegDocUrl: documents.commercialRegDocUrl,
        occiDocUrl: documents.occiDocUrl || undefined,
        smeDocUrl: documents.smeDocUrl || undefined,
        otherDocUrl: documents.otherDocUrl || undefined,
        otherDocLabel: otherDocLabel.trim() || undefined
      });
      setData(response.data.data);
      setMessage(text.submitSuccess);
      setDocuments({ commercialRegDocUrl: '', occiDocUrl: '', smeDocUrl: '', otherDocUrl: '' });
      setFileNames({});
      setOtherDocLabel('');
    } catch (submitError) {
      setError(resolveApiErrorMessage(submitError, m.errors, text.submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderUploadField = (field: DocumentField, label: string, required = false) => (
    <VerificationDocumentUpload
      label={label}
      required={required}
      fileName={fileNames[field]}
      isUploading={uploadingField === field}
      disabled={Boolean(uploadingField) || isSubmitting}
      onSelect={(file) => uploadField(field, file)}
      onClear={() => clearField(field)}
      {...uploadLabels}
    />
  );

  if (isLoading) {
    return <p className="text-sm text-gray-500">{text.loading}</p>;
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-2xl font-black text-gray-900">{text.storeTitle}</h2>
        {data?.trustBadgeApproved ? <VerifiedBadge size="md" title={text.verifiedLabel} /> : null}
      </div>
      <p className="mb-6 text-sm text-gray-600">{text.storeDescription}</p>

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
          <div className="grid gap-5 lg:grid-cols-2">
            {renderUploadField('commercialRegDocUrl', text.commercialRegistration, true)}
            {renderUploadField('occiDocUrl', text.occiCertificate)}
            {renderUploadField('smeDocUrl', text.smeCard)}
            {renderUploadField('otherDocUrl', text.otherDocument)}
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">{text.otherDocumentLabel}</label>
            <input
              value={otherDocLabel}
              onChange={(event) => setOtherDocLabel(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              placeholder={text.otherDocumentLabelPlaceholder}
            />
          </div>

          {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p> : null}
          {message ? <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{message}</p> : null}

          <button
            type="button"
            onClick={submit}
            disabled={isSubmitting || Boolean(uploadingField)}
            className="rounded-xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-70"
          >
            {isSubmitting ? text.submitting : text.submitRequest}
          </button>
        </div>
      ) : null}
    </div>
  );
}

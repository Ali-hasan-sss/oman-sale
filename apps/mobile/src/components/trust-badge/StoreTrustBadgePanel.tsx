import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../AppText';
import { AppTextInput } from '../AppTextInput';
import { VerifiedBadge } from '../VerifiedBadge';
import { useI18n } from '../../i18n';
import { uploadVerificationDocument } from '../../services/media.service';
import {
  fetchStoreTrustBadge,
  submitStoreTrustBadge,
  type StoreTrustBadge
} from '../../services/trust-badge.service';
import { colors, radius } from '../../theme';

type DocumentField = 'commercialRegDocUrl' | 'occiDocUrl' | 'smeDocUrl' | 'otherDocUrl';

type StoreTrustBadgePanelProps = {
  storeId: string;
};

const fieldLabelMap = {
  commercialRegDocUrl: 'commercialRegistration',
  occiDocUrl: 'occiCertificate',
  smeDocUrl: 'smeCard',
  otherDocUrl: 'otherDocument'
} as const;

export function StoreTrustBadgePanel({ storeId }: StoreTrustBadgePanelProps) {
  const { t } = useI18n();
  const text = t.trustBadge;
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

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setData(await fetchStoreTrustBadge(storeId));
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const pickDocument = async (field: DocumentField) => {
    setError('');
    setMessage('');
    setUploadingField(field);
    try {
      const doc = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false
      });
      if (doc.canceled || !doc.assets[0]) return;
      const asset = doc.assets[0];
      const uploaded = await uploadVerificationDocument({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/pdf',
        size: asset.size
      });
      setDocuments((current) => ({ ...current, [field]: uploaded.key }));
      setFileNames((current) => ({ ...current, [field]: asset.name }));
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
      const result = await submitStoreTrustBadge(storeId, {
        commercialRegDocUrl: documents.commercialRegDocUrl,
        occiDocUrl: documents.occiDocUrl || undefined,
        smeDocUrl: documents.smeDocUrl || undefined,
        otherDocUrl: documents.otherDocUrl || undefined,
        otherDocLabel: otherDocLabel.trim() || undefined
      });
      setData(result);
      setMessage(text.submitSuccess);
    } catch {
      setError(text.submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <AppText style={styles.loading}>{text.loading}</AppText>;
  }

  const canSubmit = data?.trustBadgeStatus !== 'PENDING' && data?.trustBadgeStatus !== 'APPROVED';

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <AppText style={styles.title}>{text.storeTitle}</AppText>
        {data?.trustBadgeApproved ? <VerifiedBadge size="md" /> : null}
      </View>
      <AppText style={styles.description}>{text.storeDescription}</AppText>

      {data?.trustBadgeStatus === 'PENDING' ? (
        <AppText style={styles.pending}>{text.pendingReview}</AppText>
      ) : null}
      {data?.trustBadgeStatus === 'APPROVED' ? (
        <AppText style={styles.approved}>{text.approvedMessage}</AppText>
      ) : null}
      {data?.trustBadgeStatus === 'REJECTED' ? (
        <AppText style={styles.rejected}>
          {text.rejectedMessage}
          {data.trustBadgeRejectionReason ? `: ${data.trustBadgeRejectionReason}` : ''}
        </AppText>
      ) : null}

      {canSubmit ? (
        <>
          {(['commercialRegDocUrl', 'occiDocUrl', 'smeDocUrl', 'otherDocUrl'] as DocumentField[]).map((field) => (
            <View key={field} style={styles.fieldBlock}>
              <AppText style={styles.label}>{text[fieldLabelMap[field]]}</AppText>
              <Pressable
                style={styles.uploadButton}
                onPress={() => void pickDocument(field)}
                disabled={uploadingField === field}
              >
                {uploadingField === field ? (
                  <ActivityIndicator color={colors.brand} />
                ) : (
                  <AppText style={styles.uploadButtonText}>
                    {fileNames[field]
                      ? `${text.changeDocument}: ${fileNames[field]}`
                      : text.chooseDocument}
                  </AppText>
                )}
              </Pressable>
            </View>
          ))}

          {documents.otherDocUrl ? (
            <>
              <AppText style={styles.label}>{text.otherDocumentLabel}</AppText>
              <AppTextInput
                value={otherDocLabel}
                onChangeText={setOtherDocLabel}
                placeholder={text.otherDocumentLabelPlaceholder}
                style={styles.input}
              />
            </>
          ) : null}

          <AppText style={styles.hint}>{text.fileHint}</AppText>
          {error ? <AppText style={styles.error}>{error}</AppText> : null}
          {message ? <AppText style={styles.success}>{message}</AppText> : null}

          <Pressable
            style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
            onPress={() => void submit()}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <AppText style={styles.submitButtonText}>{text.submitRequest}</AppText>
            )}
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 16,
    marginTop: 16
  },
  titleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink
  },
  description: {
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 12
  },
  loading: {
    color: colors.muted,
    marginTop: 16
  },
  pending: {
    backgroundColor: '#fffbeb',
    color: '#b45309',
    padding: 12,
    borderRadius: 12,
    fontWeight: '700',
    marginBottom: 12
  },
  approved: {
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    padding: 12,
    borderRadius: 12,
    fontWeight: '700',
    marginBottom: 12
  },
  rejected: {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    padding: 12,
    borderRadius: 12,
    fontWeight: '700',
    marginBottom: 12
  },
  fieldBlock: {
    marginBottom: 10
  },
  label: {
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  },
  uploadButtonText: {
    color: colors.brandDark,
    fontWeight: '700',
    textAlign: 'center'
  },
  input: {
    marginBottom: 10
  },
  hint: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 12
  },
  error: {
    marginTop: 10,
    color: colors.danger,
    fontWeight: '700'
  },
  success: {
    marginTop: 10,
    color: colors.brandDark,
    fontWeight: '700'
  },
  submitButton: {
    marginTop: 14,
    backgroundColor: colors.brand,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center'
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '800'
  },
  buttonDisabled: {
    opacity: 0.7
  }
});

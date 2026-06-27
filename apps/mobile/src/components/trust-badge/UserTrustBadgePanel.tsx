import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../AppText';
import { VerifiedBadge } from '../VerifiedBadge';
import { useI18n } from '../../i18n';
import { uploadVerificationDocument } from '../../services/media.service';
import {
  fetchUserTrustBadge,
  submitUserTrustBadge,
  type UserTrustBadge
} from '../../services/trust-badge.service';
import { colors, radius } from '../../theme';

export function UserTrustBadgePanel() {
  const { t } = useI18n();
  const text = t.trustBadge;
  const [data, setData] = useState<UserTrustBadge | null>(null);
  const [documentType, setDocumentType] = useState<'NATIONAL_ID' | 'PASSPORT'>('NATIONAL_ID');
  const [documentKey, setDocumentKey] = useState('');
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setData(await fetchUserTrustBadge());
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pickDocument = async () => {
    setError('');
    setMessage('');
    setIsUploading(true);
    try {
      const image = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9
      });
      if (!image.canceled && image.assets[0]) {
        const asset = image.assets[0];
        const uploaded = await uploadVerificationDocument({
          uri: asset.uri,
          name: asset.fileName ?? 'identity.jpg',
          mimeType: asset.mimeType ?? 'image/jpeg',
          size: asset.fileSize
        });
        setDocumentKey(uploaded.key);
        setFileName(asset.fileName ?? 'identity.jpg');
        return;
      }

      const doc = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false
      });
      if (!doc.canceled && doc.assets[0]) {
        const asset = doc.assets[0];
        const uploaded = await uploadVerificationDocument({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? 'application/pdf',
          size: asset.size
        });
        setDocumentKey(uploaded.key);
        setFileName(asset.name);
      }
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
      const result = await submitUserTrustBadge({ documentType, documentUrl: documentKey });
      setData(result);
      setMessage(text.submitSuccess);
      setDocumentKey('');
      setFileName('');
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
        <AppText style={styles.title}>{text.userTitle}</AppText>
        {data?.trustBadgeApproved ? <VerifiedBadge size="md" /> : null}
      </View>
      <AppText style={styles.description}>{text.userDescription}</AppText>

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
          <AppText style={styles.label}>{text.documentType}</AppText>
          <View style={styles.typeRow}>
            {(['NATIONAL_ID', 'PASSPORT'] as const).map((type) => (
              <Pressable
                key={type}
                style={[styles.typeChip, documentType === type && styles.typeChipActive]}
                onPress={() => setDocumentType(type)}
              >
                <AppText style={[styles.typeChipText, documentType === type && styles.typeChipTextActive]}>
                  {type === 'NATIONAL_ID' ? text.nationalId : text.passport}
                </AppText>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.uploadButton} onPress={() => void pickDocument()} disabled={isUploading}>
            {isUploading ? (
              <ActivityIndicator color={colors.brand} />
            ) : (
              <AppText style={styles.uploadButtonText}>
                {fileName ? `${text.changeDocument}: ${fileName}` : text.chooseDocument}
              </AppText>
            )}
          </Pressable>
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
  label: {
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8
  },
  typeRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 12
  },
  typeChip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  typeChipActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft
  },
  typeChipText: {
    color: colors.muted,
    fontWeight: '700'
  },
  typeChipTextActive: {
    color: colors.brandDark
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
  hint: {
    marginTop: 8,
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

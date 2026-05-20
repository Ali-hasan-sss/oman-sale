import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { useI18n } from '../i18n';
import { colors, radius } from '../theme';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = false
}: ConfirmDialogProps) {
  const { isRtl } = useI18n();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <AppText style={[styles.title, isRtl ? styles.rtl : styles.ltr]}>{title}</AppText>
          <AppText style={[styles.message, isRtl ? styles.rtl : styles.ltr]}>{message}</AppText>
          <View style={[styles.actions, isRtl && styles.actionsRtl]}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <AppText style={styles.cancelText}>{cancelLabel}</AppText>
            </Pressable>
            <Pressable
              style={[styles.button, destructive ? styles.destructiveButton : styles.confirmButton]}
              onPress={onConfirm}
            >
              <AppText style={styles.confirmText}>{confirmLabel}</AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 22
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 8
  },
  message: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20
  },
  actions: {
    flexDirection: 'row',
    gap: 10
  },
  actionsRtl: {
    flexDirection: 'row-reverse'
  },
  button: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.line
  },
  confirmButton: {
    backgroundColor: colors.brand
  },
  destructiveButton: {
    backgroundColor: colors.danger
  },
  cancelText: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 14
  },
  confirmText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});

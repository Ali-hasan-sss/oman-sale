import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { PrimaryButton } from './PrimaryButton';
import { useI18n } from '../i18n';
import { colors, radius } from '../theme';

type AuthGateModalProps = {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
};

export function AuthGateModal({ visible, onClose, onLogin, onRegister }: AuthGateModalProps) {
  const { t, isRtl } = useI18n();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <AppText style={[styles.title, isRtl ? styles.rtlText : styles.ltrText]}>{t.common.loginRequired}</AppText>
          <AppText style={[styles.subtitle, isRtl ? styles.rtlText : styles.ltrText]}>{t.common.loginRequiredHint}</AppText>
          <View style={styles.actions}>
            <PrimaryButton label={t.common.login} onPress={onLogin} />
            <PrimaryButton label={t.common.register} onPress={onRegister} variant="soft" />
            <Pressable onPress={onClose}>
              <AppText style={styles.cancel}>{t.common.cancel}</AppText>
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
    backgroundColor: 'rgba(15,23,42,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 24
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 8
  },
  subtitle: {
    color: colors.muted,
    lineHeight: 22,
    marginBottom: 20
  },
  rtlText: {
    textAlign: 'right'
  },
  ltrText: {
    textAlign: 'left'
  },
  actions: {
    gap: 10
  },
  cancel: {
    textAlign: 'center',
    color: colors.muted,
    fontWeight: '700',
    marginTop: 6
  }
});

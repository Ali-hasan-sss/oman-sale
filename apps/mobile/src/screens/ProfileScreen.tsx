import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { useAuthStore } from '../stores';
import { useI18n } from '../i18n';
import { colors, radius } from '../theme';

type ProfileScreenProps = {
  onLogin: () => void;
};

export function ProfileScreen({ onLogin }: ProfileScreenProps) {
  const user = useAuthStore((state) => state.user);
  const { t, isRtl } = useI18n();

  if (!user) {
    return (
      <View style={styles.center}>
        <AppText style={[styles.title, isRtl ? styles.rtl : styles.ltr]}>{t.common.profile}</AppText>
        <AppText style={[styles.subtitle, isRtl ? styles.rtl : styles.ltr]}>{t.common.loginRequiredHint}</AppText>
        <Pressable style={styles.button} onPress={onLogin}>
          <AppText style={styles.buttonText}>{t.common.login}</AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.content}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <AppText style={styles.avatarText}>{user.fullName.slice(0, 1).toUpperCase()}</AppText>
        </View>
        <AppText style={[styles.name, isRtl ? styles.rtl : styles.ltr]}>{user.fullName}</AppText>
        <AppText style={[styles.meta, isRtl ? styles.metaRtl : styles.metaLtr]}>{user.email}</AppText>
        {user.phone ? <AppText style={[styles.meta, isRtl ? styles.metaRtl : styles.metaLtr]}>{user.phone}</AppText> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16
  },
  center: {
    flex: 1,
    padding: 24,
    justifyContent: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink
  },
  subtitle: {
    color: colors.muted,
    marginVertical: 12,
    lineHeight: 22
  },
  button: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '900'
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 24,
    alignItems: 'center',
    alignSelf: 'stretch'
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.brand
  },
  name: {
    alignSelf: 'stretch',
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink
  },
  meta: {
    color: colors.muted,
    marginTop: 6,
    alignSelf: 'stretch'
  },
  metaLtr: {
    textAlign: 'left'
  },
  metaRtl: {
    textAlign: 'right'
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});

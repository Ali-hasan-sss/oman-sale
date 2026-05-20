import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { useI18n } from '../i18n';
import { colors, radius, shadow } from '../theme';

type SuccessNoticeProps = {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
};

const GRADIENT: [string, string] = ['#ecfdf5', '#d1fae5'];

export function SuccessNotice({ title, message, actionLabel, onAction }: SuccessNoticeProps) {
  const { isRtl } = useI18n();

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={GRADIENT} style={styles.card}>
        <View style={styles.iconRing}>
          <Ionicons name="checkmark-circle" size={56} color={colors.brand} />
        </View>
        <AppText style={[styles.title, isRtl ? styles.rtl : styles.ltr]}>{title}</AppText>
        <AppText style={[styles.message, isRtl ? styles.rtl : styles.ltr]}>{message}</AppText>
        <Pressable style={styles.button} onPress={onAction}>
          <AppText style={styles.buttonText}>{actionLabel}</AppText>
          <Ionicons name={isRtl ? 'arrow-back' : 'arrow-forward'} size={18} color="#fff" />
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 24
  },
  card: {
    borderRadius: radius.lg,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    ...shadow
  },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: colors.brandSoft
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.brandDark,
    marginBottom: 8
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 22,
    maxWidth: 300
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: 22,
    paddingVertical: 14
  },
  buttonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});

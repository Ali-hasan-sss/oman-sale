import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { useI18n } from '../i18n';
import { colors, radius } from '../theme';

type ErrorNoticeProps = {
  message: string;
  onDismiss?: () => void;
};

export function ErrorNotice({ message, onDismiss }: ErrorNoticeProps) {
  const { isRtl } = useI18n();

  return (
    <View style={styles.wrap}>
      <Ionicons name="alert-circle-outline" size={22} color={colors.danger} />
      <AppText style={[styles.message, isRtl ? styles.rtl : styles.ltr]}>{message}</AppText>
      {onDismiss ? (
        <Pressable onPress={onDismiss} hitSlop={8}>
          <Ionicons name="close" size={20} color={colors.danger} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14
  },
  message: {
    flex: 1,
    color: colors.danger,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 18
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});

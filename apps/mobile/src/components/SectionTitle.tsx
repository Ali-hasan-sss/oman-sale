import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { useI18n } from '../i18n';
import { rowDirection } from '../lib/layout-direction';
import { colors } from '../theme';

type SectionTitleProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionTitle({ title, actionLabel, onAction }: SectionTitleProps) {
  const { isRtl } = useI18n();

  return (
    <View style={[styles.row, rowDirection(isRtl)]}>
      <AppText style={styles.title}>{title}</AppText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction}>
          <AppText style={styles.action}>{actionLabel}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
    flex: 1
  },
  action: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand
  }
});

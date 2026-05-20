import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { useI18n } from '../i18n';
import { colors } from '../theme';

type SectionTitleProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionTitle({ title, actionLabel, onAction }: SectionTitleProps) {
  const { isRtl } = useI18n();

  return (
    <View style={[styles.row, isRtl && styles.rowRtl]}>
      <AppText style={[styles.title, isRtl ? styles.titleRtl : styles.titleLtr]}>{title}</AppText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction}>
          <AppText style={[styles.action, isRtl ? styles.actionRtl : styles.actionLtr]}>{actionLabel}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  rowRtl: {
    flexDirection: 'row-reverse'
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
    flex: 1
  },
  titleLtr: {
    textAlign: 'left'
  },
  titleRtl: {
    textAlign: 'right'
  },
  action: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand
  },
  actionLtr: {
    textAlign: 'right'
  },
  actionRtl: {
    textAlign: 'left'
  }
});

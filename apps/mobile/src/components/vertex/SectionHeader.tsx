import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../AppText';
import { useI18n } from '../../i18n';
import { alignSelfStart, rowDirection } from '../../lib/layout-direction';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** e.g. a flag before the title */
  leading?: ReactNode;
};

/** Title + red/white/green bar + subtitle, with an underlined link on the opposite side. */
export function SectionHeader({ title, subtitle, actionLabel, onAction, leading }: SectionHeaderProps) {
  const { isRtl } = useI18n();
  return (
    <View style={[styles.row, rowDirection(isRtl)]}>
      <View style={styles.main}>
        <View style={[styles.titleRow, rowDirection(isRtl)]}>
          {leading}
          <AppText style={styles.title}>{title}</AppText>
        </View>
        <View style={[styles.bar, alignSelfStart(isRtl)]}>
          <View style={[styles.barPart, { backgroundColor: '#f32b2b' }]} />
          <View style={[styles.barPart, { backgroundColor: '#e2e8f0' }]} />
          <View style={[styles.barPart, { backgroundColor: '#2da864' }]} />
        </View>
        {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} style={styles.actionWrap}>
          <AppText style={styles.action}>{actionLabel}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16
  },
  main: {
    flex: 1,
    minWidth: 0
  },
  titleRow: {
    alignItems: 'center',
    gap: 10
  },
  title: {
    flexShrink: 1,
    fontSize: 24,
    lineHeight: 34,
    fontWeight: '900',
    color: '#0f172a'
  },
  bar: {
    marginTop: 8,
    width: 72,
    height: 4,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row'
  },
  barPart: {
    flex: 1
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13.5,
    color: '#475569'
  },
  actionWrap: {
    marginTop: 8
  },
  action: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#11703e',
    textDecorationLine: 'underline'
  }
});

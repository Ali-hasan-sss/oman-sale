import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { useI18n } from '../i18n';
import { colors } from '../theme';

type EmptyStateProps = {
  message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
  const { isRtl } = useI18n();

  return (
    <View style={[styles.box, isRtl ? styles.boxRtl : styles.boxLtr]}>
      <AppText style={[styles.text, isRtl ? styles.textRtl : styles.textLtr]}>{message}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 18,
    backgroundColor: colors.surface,
    padding: 28
  },
  boxLtr: {
    alignItems: 'stretch'
  },
  boxRtl: {
    alignItems: 'stretch'
  },
  text: {
    color: colors.muted,
    fontWeight: '700'
  },
  textLtr: {
    textAlign: 'left'
  },
  textRtl: {
    textAlign: 'right'
  }
});

import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { colors } from '../theme';

type EmptyStateProps = {
  message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <View style={styles.box}>
      <AppText style={styles.text}>{message}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 18,
    backgroundColor: colors.surface,
    padding: 28
  },
  text: {
    color: colors.muted,
    fontWeight: '700'
  }
});

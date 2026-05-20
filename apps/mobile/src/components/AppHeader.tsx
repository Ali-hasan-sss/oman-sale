import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../theme';

type AppHeaderProps = {
  onMenuPress: () => void;
};

export function AppHeader({ onMenuPress }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable style={styles.menuButton} onPress={onMenuPress}>
        <Ionicons name="menu" size={24} color={colors.ink} />
      </Pressable>
      <View style={styles.brand}>
        <Image source={require('../../assets/nav-logo.png')} style={styles.logo} resizeMode="contain" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line
  },
  brand: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 78
  },
  logo: {
    width: 78,
    height: 52
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background
  }
});

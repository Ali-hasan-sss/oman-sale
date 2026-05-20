import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useScreenInsets } from '../hooks/use-screen-insets';

import { AppText } from '../components/AppText';
import { useI18n } from '../i18n';
import { colors, radius } from '../theme';

export function SettingsScreen() {
  const { t, isRtl, toggleLocale } = useI18n();
  const { scrollBottomPadding } = useScreenInsets();

  const items = [
    { label: t.common.language, icon: 'language-outline' as const, onPress: toggleLocale },
    { label: t.settings.notifications, icon: 'notifications-outline' as const },
    { label: t.settings.privacy, icon: 'shield-checkmark-outline' as const },
    { label: t.settings.help, icon: 'help-circle-outline' as const }
  ];

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
      showsVerticalScrollIndicator={false}
    >
      <AppText style={[styles.title, isRtl ? styles.rtl : styles.ltr]}>{t.settings.title}</AppText>
      <AppText style={[styles.subtitle, isRtl ? styles.rtl : styles.ltr]}>{t.settings.subtitle}</AppText>
      {items.map((item) => (
        <Pressable key={item.label} style={[styles.row, isRtl && styles.rowRtl]} onPress={item.onPress}>
          <Ionicons name={item.icon} size={22} color={colors.brand} />
          <AppText style={[styles.label, isRtl ? styles.labelRtl : styles.labelLtr]}>{item.label}</AppText>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    flexGrow: 1
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink
  },
  subtitle: {
    color: colors.muted,
    marginTop: 6,
    marginBottom: 16
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 10
  },
  rowRtl: {
    flexDirection: 'row-reverse'
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink
  },
  labelLtr: {
    textAlign: 'left'
  },
  labelRtl: {
    textAlign: 'right'
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});

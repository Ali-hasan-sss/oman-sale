import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useScreenInsets } from '../hooks/use-screen-insets';

import { AppText } from '../components/AppText';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useI18n } from '../i18n';
import { rowDirection } from '../lib/layout-direction';
import { deleteAccountRequest } from '../services/user.service';
import { useAuthStore } from '../stores';
import { colors, radius } from '../theme';

type SettingsScreenProps = {
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  onOpenRefund?: () => void;
};

export function SettingsScreen({ onOpenTerms, onOpenPrivacy, onOpenRefund }: SettingsScreenProps) {
  const { t, isRtl, toggleLocale } = useI18n();
  const { scrollBottomPadding } = useScreenInsets();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const items = [
    { label: t.common.language, icon: 'language-outline' as const, onPress: toggleLocale },
    { label: t.settings.notifications, icon: 'notifications-outline' as const },
    { label: t.settings.terms, icon: 'document-text-outline' as const, onPress: onOpenTerms },
    { label: t.settings.privacy, icon: 'shield-checkmark-outline' as const, onPress: onOpenPrivacy },
    { label: t.settings.refund, icon: 'cash-outline' as const, onPress: onOpenRefund },
    { label: t.settings.help, icon: 'help-circle-outline' as const }
  ];

  const confirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await deleteAccountRequest();
      setDeleteConfirmOpen(false);
      await logout();
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <AppText style={[styles.title, isRtl ? styles.rtl : styles.ltr]}>{t.settings.title}</AppText>
        <AppText style={[styles.subtitle, isRtl ? styles.rtl : styles.ltr]}>{t.settings.subtitle}</AppText>
        {items.map((item) => (
          <Pressable key={item.label} style={[styles.row, rowDirection(isRtl)]} onPress={item.onPress}>
            <Ionicons name={item.icon} size={22} color={colors.brand} />
            <AppText style={styles.label}>{item.label}</AppText>
          </Pressable>
        ))}
        {user ? (
          <Pressable
            style={[styles.row, rowDirection(isRtl)]}
            onPress={() => setDeleteConfirmOpen(true)}
            disabled={isDeletingAccount}
          >
            <Ionicons name="trash-outline" size={22} color={colors.danger} />
            <AppText style={[styles.label, styles.dangerLabel]}>{t.settings.deleteAccount}</AppText>
          </Pressable>
        ) : null}
      </ScrollView>
      <ConfirmDialog
        visible={deleteConfirmOpen}
        title={t.profile.deleteAccountTitle}
        message={t.profile.deleteAccountMessage}
        confirmLabel={isDeletingAccount ? t.profile.deleting : t.profile.deleteAccountConfirm}
        cancelLabel={t.common.cancel}
        destructive
        onCancel={() => {
          if (!isDeletingAccount) setDeleteConfirmOpen(false);
        }}
        onConfirm={() => {
          if (!isDeletingAccount) void confirmDeleteAccount();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
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
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 10
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink
  },
  dangerLabel: {
    color: colors.danger
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});

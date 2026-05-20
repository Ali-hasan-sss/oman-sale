import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';

import { useAuthStore } from '../stores';
import { useI18n } from '../i18n';
import type { ScreenName } from '../types';
import { colors, radius } from '../theme';

const drawerWidth = Math.min(Dimensions.get('window').width * 0.82, 320);

type SideDrawerProps = {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: ScreenName) => void;
};

type DrawerItem = {
  screen: ScreenName;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export function SideDrawer({ visible, onClose, onNavigate }: SideDrawerProps) {
  const { t, toggleLocale, isRtl } = useI18n();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const translateX = useRef(new Animated.Value(-drawerWidth)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(visible);

  const items: DrawerItem[] = [
    { screen: 'profile', label: t.common.profile, icon: 'person-circle-outline' },
    { screen: 'favorites', label: t.common.favorites, icon: 'heart-outline' },
    { screen: 'settings', label: t.common.settings, icon: 'settings-outline' }
  ];

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      translateX.setValue(-drawerWidth);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          damping: 24,
          mass: 0.9,
          stiffness: 210,
          useNativeDriver: true
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true
        })
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -drawerWidth,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true
      })
    ]).start(({ finished }) => {
      if (finished) setShouldRender(false);
    });
  }, [backdropOpacity, translateX, visible]);

  if (!shouldRender) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.drawer, { width: drawerWidth, transform: [{ translateX }] }]}>
        <View style={styles.headerCard}>
          <View style={styles.headerText}>
            <AppText style={[styles.name, isRtl ? styles.textRtl : styles.textLtr]}>{user?.fullName ?? t.common.guest}</AppText>
            <AppText style={[styles.email, isRtl ? styles.textRtl : styles.textLtr]}>{user?.email ?? t.common.guestHint}</AppText>
          </View>
          <UserAvatar avatar={user?.avatar} name={user?.fullName} />
        </View>

        {items.map((item) => (
          <Pressable
            key={item.screen}
            style={styles.item}
            onPress={() => {
              onClose();
              onNavigate(item.screen);
            }}
          >
            <View style={styles.iconBubble}>
              <Ionicons name={item.icon} size={21} color={colors.brand} />
            </View>
            <AppText style={[styles.itemLabel, isRtl ? styles.textRtl : styles.textLtr]}>{item.label}</AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}

        <Pressable style={styles.item} onPress={toggleLocale}>
          <View style={styles.iconBubble}>
            <Ionicons name="language-outline" size={21} color={colors.brand} />
          </View>
          <AppText style={[styles.itemLabel, isRtl ? styles.textRtl : styles.textLtr]}>{t.common.language}</AppText>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>

        {user ? (
          <Pressable
            style={styles.item}
            onPress={() => {
              void logout();
              onClose();
            }}
          >
            <View style={[styles.iconBubble, styles.dangerBubble]}>
              <Ionicons name="log-out-outline" size={21} color={colors.danger} />
            </View>
            <AppText style={[styles.itemLabel, { color: colors.danger }, isRtl ? styles.textRtl : styles.textLtr]}>{t.common.logout}</AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.danger} />
          </Pressable>
        ) : (
          <>
            <Pressable
              style={styles.item}
              onPress={() => {
                onClose();
                onNavigate('login');
              }}
            >
              <View style={styles.iconBubble}>
                <Ionicons name="log-in-outline" size={21} color={colors.brand} />
              </View>
              <AppText style={[styles.itemLabel, isRtl ? styles.textRtl : styles.textLtr]}>{t.common.login}</AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
            <Pressable
              style={styles.item}
              onPress={() => {
                onClose();
                onNavigate('register');
              }}
            >
              <View style={styles.iconBubble}>
                <Ionicons name="person-add-outline" size={21} color={colors.brand} />
              </View>
              <AppText style={[styles.itemLabel, isRtl ? styles.textRtl : styles.textLtr]}>{t.common.register}</AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          </>
        )}
      </Animated.View>
    </View>
  );
}

function UserAvatar({ avatar, name }: { avatar?: string | null; name?: string }) {
  const initial = name?.trim().slice(0, 1).toUpperCase();

  return (
    <View style={styles.avatar}>
      {avatar ? (
        <Image source={{ uri: avatar }} style={styles.avatarImage} />
      ) : initial ? (
        <AppText style={styles.avatarInitial}>{initial}</AppText>
      ) : (
        <Ionicons name="person" size={28} color={colors.brand} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.35)'
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.surface,
    paddingTop: 56,
    paddingHorizontal: 18,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#0f172a',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 12
  },
  headerCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    padding: 14,
    borderRadius: 22,
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: '#d6f2e5'
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: '#c7ead9',
    overflow: 'hidden'
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.brand
  },
  headerText: {
    flex: 1
  },
  name: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink
  },
  email: {
    color: colors.muted,
    marginTop: 4,
    fontSize: 12
  },
  item: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#edf2f7'
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft
  },
  dangerBubble: {
    backgroundColor: '#fee2e2'
  },
  itemLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink
  },
  textLtr: {
    textAlign: 'left'
  },
  textRtl: {
    textAlign: 'right'
  }
});

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { useI18n } from '../i18n';
import { alignSelfStart, rowDirection } from '../lib/layout-direction';
import { fetchMyStores } from '../services/stores.service';
import { useAuthStore } from '../stores';
import { colors, radius, shadow } from '../theme';

type HomeCreateStoreBannerProps = {
  onCreateStore: () => void;
};

export function HomeCreateStoreBanner({ onCreateStore }: HomeCreateStoreBannerProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { t, isRtl } = useI18n();
  const [hasStore, setHasStore] = useState(false);
  const [loaded, setLoaded] = useState(!accessToken);

  useEffect(() => {
    if (!accessToken) {
      setHasStore(false);
      setLoaded(true);
      return;
    }

    fetchMyStores()
      .then((stores) => setHasStore(stores.length > 0))
      .catch(() => setHasStore(false))
      .finally(() => setLoaded(true));
  }, [accessToken]);

  if (!loaded || hasStore) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.banner}>
        <View style={[styles.bannerTop, rowDirection(isRtl)]}>
          <View style={styles.iconWrap}>
            <Ionicons name="storefront" size={26} color="#fff" />
          </View>
          <View style={styles.copy}>
            <AppText style={styles.title}>{t.home.createStoreTitle}</AppText>
            <AppText style={styles.subtitle}>{t.home.createStoreSubtitle}</AppText>
          </View>
        </View>
        <Pressable style={[styles.button, alignSelfStart(isRtl)]} onPress={onCreateStore}>
          <AppText style={styles.buttonText}>{t.common.createStore}</AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, marginBottom: 16 },
  banner: {
    backgroundColor: colors.brandDark,
    borderRadius: radius.lg,
    padding: 16,
    gap: 12,
    ...shadow
  },
  bannerTop: {
    alignItems: 'center',
    gap: 12
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  copy: { flex: 1, gap: 6 },
  title: { color: '#fff', fontSize: 20, fontWeight: '900' },
  subtitle: { color: 'rgba(255,255,255,0.86)', fontSize: 13, lineHeight: 20 },
  button: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  buttonText: { color: colors.brandDark, fontWeight: '900' }
});

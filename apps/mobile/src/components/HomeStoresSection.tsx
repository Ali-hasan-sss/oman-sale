import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { PrimaryButton } from './PrimaryButton';
import { StoreCirclesSkeleton } from './skeleton';
import { SectionTitle } from './SectionTitle';
import { useI18n } from '../i18n';
import { fetchPublicStores, type PublicStore } from '../services/stores.service';
import { colors, radius } from '../theme';

const fallbackLogo = require('../../assets/nav-logo.png');

type HomeStoresSectionProps = {
  onBrowseStores: () => void;
  onStorePress: (slug: string) => void;
};

export function HomeStoresSection({ onBrowseStores, onStorePress }: HomeStoresSectionProps) {
  const { locale, t, isRtl } = useI18n();
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchPublicStores({ page: 1, limit: 12 })
      .then((response) => {
        if (!cancelled) {
          setStores(response.items);
          setHasLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setStores([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const showSkeleton = isLoading && !hasLoaded;
  const showStrip = showSkeleton || stores.length > 0;

  if (!showStrip && hasLoaded) {
    return (
      <View style={styles.section}>
        <PrimaryButton label={t.storesBrowse.browseAll} onPress={onBrowseStores} variant="soft" />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <SectionTitle title={t.home.stores} />

      {showSkeleton ? (
        <StoreCirclesSkeleton count={6} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {stores.map((store) => {
            const name = locale === 'en' ? store.nameEn : store.nameAr;
            return (
              <Pressable
                key={store.id}
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                onPress={() => onStorePress(store.slug)}
              >
                <View style={styles.avatarWrap}>
                  {store.logoUrl ? (
                    <Image source={{ uri: store.logoUrl }} style={styles.avatar} />
                  ) : (
                    <Image source={fallbackLogo} style={styles.avatarFallback} resizeMode="contain" />
                  )}
                </View>
                <AppText style={[styles.name, isRtl && styles.nameRtl]} numberOfLines={2}>
                  {name}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <PrimaryButton label={t.storesBrowse.browseAll} onPress={onBrowseStores} variant="soft" style={styles.browseButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginBottom: 10
  },
  scrollRtl: {
    direction: 'rtl'
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 14,
    paddingEnd: 4,
    paddingBottom: 4
  },
  scrollContentRtl: {
    flexDirection: 'row-reverse'
  },
  item: {
    width: 84,
    alignItems: 'center'
  },
  itemPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }]
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: colors.brandSoft,
    borderWidth: 2,
    borderColor: 'rgba(15, 159, 103, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  avatar: {
    width: '100%',
    height: '100%'
  },
  avatarFallback: {
    width: 44,
    height: 44
  },
  name: {
    width: '100%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
    lineHeight: 16
  },
  nameRtl: {
    textAlign: 'center'
  },
  browseButton: {
    marginTop: 12
  }
});

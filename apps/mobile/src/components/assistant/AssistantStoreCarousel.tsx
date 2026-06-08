import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../AppText';
import { ListingCoverImage } from '../ListingCoverImage';
import type { AssistantStoreCard } from '../../types/assistant';
import type { Locale } from '../../types';
import { colors, radius } from '../../theme';

type AssistantStoreCarouselProps = {
  stores: AssistantStoreCard[];
  locale: Locale;
  listingsLabel: string;
  viewLabel: string;
  onStorePress: (slug: string) => void;
};

export function AssistantStoreCarousel({
  stores,
  locale,
  listingsLabel,
  viewLabel,
  onStorePress
}: AssistantStoreCarouselProps) {
  if (stores.length === 0) return null;

  const rtl = locale === 'ar';

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {stores.map((store) => (
        <View key={store.id} style={styles.card}>
          <View style={styles.imageWrap}>
            <ListingCoverImage
              uri={store.coverUrl || store.logoUrl || undefined}
              variant="card"
              style={styles.image}
            />
          </View>
          <View style={styles.body}>
            <AppText style={[styles.title, rtl ? styles.rtl : styles.ltr]} numberOfLines={2}>
              {store.name}
            </AppText>
            {store.storeTypeName ? (
              <View style={styles.typeBadge}>
                <AppText style={styles.typeText}>{store.storeTypeName}</AppText>
              </View>
            ) : null}
            {store.city ? (
              <AppText style={[styles.meta, rtl ? styles.rtl : styles.ltr]} numberOfLines={1}>
                {store.city}
              </AppText>
            ) : null}
            <AppText style={[styles.meta, rtl ? styles.rtl : styles.ltr]}>
              {store.listingsCount} {listingsLabel}
            </AppText>
            <Pressable style={styles.button} onPress={() => onStorePress(store.slug)}>
              <AppText style={styles.buttonText}>{viewLabel}</AppText>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 12,
    paddingVertical: 2
  },
  card: {
    width: 168,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E8E8'
  },
  imageWrap: {
    height: 96,
    backgroundColor: '#F5F5F5'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  body: {
    padding: 10
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.brandDark,
    marginBottom: 4
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4
  },
  typeText: {
    color: '#047857',
    fontSize: 10,
    fontWeight: '800'
  },
  meta: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 2
  },
  button: {
    backgroundColor: colors.brand,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 6
  },
  buttonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700'
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});

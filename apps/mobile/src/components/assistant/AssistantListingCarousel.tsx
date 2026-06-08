import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../AppText';
import { ListingCoverImage } from '../ListingCoverImage';
import { getListingLocationLabel } from '../../lib/oman-locations';
import type { AssistantListingCard } from '../../types/assistant';
import type { Locale } from '../../types';
import { colors, radius } from '../../theme';

type AssistantListingCarouselProps = {
  listings: AssistantListingCard[];
  locale: Locale;
  featuredLabel: string;
  viewLabel: string;
  onListingPress: (id: string) => void;
};

function formatPrice(price: number | null, currency: string, locale: Locale) {
  if (price === null) return locale === 'ar' ? 'اتفاق' : 'Negotiable';
  return `${price.toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-OM')} ${currency}`;
}

export function AssistantListingCarousel({
  listings,
  locale,
  featuredLabel,
  viewLabel,
  onListingPress
}: AssistantListingCarouselProps) {
  if (listings.length === 0) return null;

  const rtl = locale === 'ar';

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {listings.map((listing) => (
        <View key={listing.id} style={styles.card}>
          <View style={styles.imageWrap}>
            <ListingCoverImage uri={listing.imageUrl ?? undefined} variant="card" style={styles.image} />
            {listing.isFeatured ? (
              <View style={styles.badge}>
                <AppText style={styles.badgeText}>{listing.badgeLabel || featuredLabel}</AppText>
              </View>
            ) : null}
          </View>
          <View style={styles.body}>
            <AppText style={[styles.title, rtl ? styles.rtl : styles.ltr]} numberOfLines={2}>
              {listing.title}
            </AppText>
            <AppText style={[styles.price, rtl ? styles.rtl : styles.ltr]}>
              {formatPrice(listing.price, listing.currency, locale)}
            </AppText>
            <AppText style={[styles.meta, rtl ? styles.rtl : styles.ltr]} numberOfLines={1}>
              {getListingLocationLabel(listing.city, listing.wilayah, listing.area, locale) || '-'}
            </AppText>
            <Pressable style={styles.button} onPress={() => onListingPress(listing.id)}>
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
    width: 152,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E8E8'
  },
  imageWrap: {
    height: 120,
    backgroundColor: '#F5F5F5'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.brand,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800'
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
  price: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 4
  },
  meta: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 8
  },
  button: {
    backgroundColor: colors.brand,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center'
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

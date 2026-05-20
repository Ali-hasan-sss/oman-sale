import { Image, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { formatPrice, getCategoryName } from '../data';
import type { Listing, Locale } from '../types';
import { colors, radius, shadow } from '../theme';

type ListingCardProps = {
  listing: Listing;
  locale: Locale;
  featuredLabel: string;
};

export function ListingCard({ listing, locale, featuredLabel }: ListingCardProps) {
  const image = listing.images?.[0]?.imageUrl;
  const category = getCategoryName(listing, locale);
  const isFeatured = Boolean(listing.promotion);
  const contentRtl = locale === 'ar';

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <AppText style={styles.placeholderText}>Oman Sale</AppText>
          </View>
        )}
        {isFeatured ? (
          <View style={styles.badge}>
            <AppText style={styles.badgeText}>{listing.promotion?.plan?.badgeLabel ?? featuredLabel}</AppText>
          </View>
        ) : null}
        {category ? (
          <View style={styles.category}>
            <AppText style={styles.categoryText}>{category}</AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <AppText style={[styles.title, contentRtl ? styles.textRtl : styles.textLtr]} numberOfLines={1}>
          {listing.title}
        </AppText>
        <AppText style={[styles.price, contentRtl ? styles.textRtl : styles.textLtr]}>{formatPrice(listing.price, listing.currency, locale)}</AppText>
        <AppText style={[styles.location, contentRtl ? styles.textRtl : styles.textLtr]} numberOfLines={1}>
          {listing.area || listing.city || '-'}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: 14,
    ...shadow
  },
  imageWrap: {
    height: 180,
    backgroundColor: colors.brandSoft
  },
  image: {
    width: '100%',
    height: '100%'
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  placeholderText: {
    color: colors.brand,
    fontWeight: '800'
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.brand,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800'
  },
  category: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(15,23,42,0.72)',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  categoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700'
  },
  body: {
    padding: 14
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 6
  },
  price: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.brand,
    marginBottom: 4
  },
  location: {
    color: colors.muted,
    fontSize: 13
  },
  textRtl: {
    textAlign: 'right'
  },
  textLtr: {
    textAlign: 'left'
  }
});

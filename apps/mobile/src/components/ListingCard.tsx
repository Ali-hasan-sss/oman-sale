import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { ListingCoverImage } from './ListingCoverImage';
import { VerifiedBadge } from './VerifiedBadge';
import { formatPrice, getCategoryName } from '../data';
import { getListingLocationLabel } from '../lib/oman-locations';
import type { Listing, Locale } from '../types';
import { colors, radius, shadow } from '../theme';

type ListingCardProps = {
  listing: Listing;
  locale: Locale;
  featuredLabel: string;
  layout?: 'vertical' | 'horizontal';
  onPress?: () => void;
};

export function ListingCard({ listing, locale, featuredLabel, layout = 'vertical', onPress }: ListingCardProps) {
  const isHorizontal = layout === 'horizontal';
  const image = listing.images?.[0]?.imageUrl;
  const category = getCategoryName(listing, locale);
  const isFeatured = Boolean(listing.promotion);
  const storeName = listing.store ? (locale === 'en' ? listing.store.nameEn : listing.store.nameAr) : null;
  const contentRtl = locale === 'ar';

  const content = (
    <>
      <View
        style={[
          styles.imageWrap,
          isHorizontal && styles.imageWrapHorizontal,
          !image && styles.imageWrapNoPhoto
        ]}
      >
        <ListingCoverImage
          uri={image}
          variant={isHorizontal ? 'cardHorizontal' : 'card'}
          style={styles.cover}
        />
        {isFeatured ? (
          <View style={styles.badge}>
            <AppText style={styles.badgeText}>{listing.promotion?.plan?.badgeLabel ?? featuredLabel}</AppText>
          </View>
        ) : null}
        {storeName ? (
          <View style={styles.storeBadge}>
            <AppText style={styles.storeBadgeText}>{storeName}</AppText>
          </View>
        ) : null}
        {category ? (
          <View style={styles.category}>
            <AppText style={styles.categoryText}>{category}</AppText>
          </View>
        ) : null}
      </View>
      <View style={[styles.body, isHorizontal && styles.bodyHorizontal]}>
        <View style={[styles.titleRow, contentRtl ? styles.titleRowRtl : styles.titleRowLtr]}>
          <AppText style={[styles.title, contentRtl ? styles.textRtl : styles.textLtr, styles.titleFlex]} numberOfLines={1}>
            {listing.title}
          </AppText>
          {listing.trustBadgeApproved ? <VerifiedBadge /> : null}
        </View>
        <AppText style={[styles.price, contentRtl ? styles.textRtl : styles.textLtr]}>{formatPrice(listing.price, listing.currency, locale)}</AppText>
        <AppText style={[styles.location, contentRtl ? styles.textRtl : styles.textLtr]} numberOfLines={1}>
          {getListingLocationLabel(listing.city, listing.wilayah, listing.area, locale) || '-'}
        </AppText>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          isHorizontal && styles.cardHorizontal,
          pressed && styles.cardPressed
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.card, isHorizontal && styles.cardHorizontal]}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: 14,
    ...shadow
  },
  cardHorizontal: {
    width: 268,
    marginBottom: 0
  },
  cardPressed: {
    opacity: 0.92
  },
  imageWrap: {
    height: 180,
    backgroundColor: colors.brandSoft
  },
  imageWrapHorizontal: {
    height: 152
  },
  imageWrapNoPhoto: {
    backgroundColor: 'transparent'
  },
  cover: {
    width: '100%',
    height: '100%'
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
  storeBadge: {
    position: 'absolute',
    left: 12,
    top: 44,
    backgroundColor: 'rgba(15,23,42,0.82)',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: '70%'
  },
  storeBadgeText: {
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
  bodyHorizontal: {
    paddingVertical: 12,
    paddingHorizontal: 12
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 6
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6
  },
  titleRowRtl: {
    flexDirection: 'row-reverse'
  },
  titleRowLtr: {
    flexDirection: 'row'
  },
  titleFlex: {
    flex: 1
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

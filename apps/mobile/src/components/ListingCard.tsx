import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { ListingCoverImage } from './ListingCoverImage';
import { VerifiedBadge } from './VerifiedBadge';
import { formatPrice, getCategoryName } from '../data';
import { getListingLocationLabel } from '../lib/oman-locations';
import { alignSelfStart, insetEnd, insetStart, rowDirection } from '../lib/layout-direction';
import type { Listing, Locale } from '../types';
import { colors, radius, shadow } from '../theme';

type ListingCardProps = {
  listing: Listing;
  locale: Locale;
  featuredLabel: string;
  layout?: 'vertical' | 'horizontal';
  embedded?: boolean;
  onPress?: () => void;
  onStorePress?: (slug: string) => void;
};

export function ListingCard({
  listing,
  locale,
  featuredLabel,
  layout = 'vertical',
  embedded = false,
  onPress,
  onStorePress
}: ListingCardProps) {
  const isHorizontal = layout === 'horizontal';
  const image = listing.images?.[0]?.imageUrl;
  const category = getCategoryName(listing, locale);
  const isFeatured = Boolean(listing.promotion);
  const storeName = listing.store ? (locale === 'en' ? listing.store.nameEn : listing.store.nameAr) : null;
  const storeLogo = listing.store?.logoUrl ?? null;
  const contentRtl = locale === 'ar';

  const content = (
    <>
      <View style={[styles.imageWrap, isHorizontal && styles.imageWrapHorizontal]}>
        <ListingCoverImage
          uri={image}
          variant={isHorizontal ? 'cardHorizontal' : 'card'}
          style={styles.cover}
        />
        {isFeatured ? (
          <View style={[styles.badge, insetStart(contentRtl, 12)]}>
            <AppText style={styles.badgeText}>{listing.promotion?.plan?.badgeLabel ?? featuredLabel}</AppText>
          </View>
        ) : null}
        {category ? (
          <View style={[styles.category, insetEnd(contentRtl, 12)]}>
            <AppText style={styles.categoryText}>{category}</AppText>
          </View>
        ) : null}
      </View>
      <View style={[styles.body, isHorizontal && styles.bodyHorizontal]}>
        <View style={[styles.titleRow, rowDirection(contentRtl)]}>
          <AppText style={[styles.title, styles.titleFlex]} numberOfLines={1}>
            {listing.title}
          </AppText>
          {listing.trustBadgeApproved ? <VerifiedBadge /> : null}
        </View>
        {storeName && listing.store ? (
          <Pressable
            style={[styles.storeRow, rowDirection(contentRtl), alignSelfStart(contentRtl)]}
            onPress={(event) => {
              event.stopPropagation?.();
              if (onStorePress) onStorePress(listing.store!.slug);
            }}
            disabled={!onStorePress}
          >
            <View style={styles.storeAvatar}>
              {storeLogo ? (
                <Image source={{ uri: storeLogo }} style={styles.storeAvatarImage} />
              ) : (
                <AppText style={styles.storeAvatarFallback}>{storeName.slice(0, 1)}</AppText>
              )}
            </View>
            <AppText style={styles.storeName} numberOfLines={1}>
              {storeName}
            </AppText>
          </Pressable>
        ) : null}
        <AppText style={styles.price}>{formatPrice(listing.price, listing.currency, locale)}</AppText>
        <AppText style={styles.location} numberOfLines={1}>
          {getListingLocationLabel(listing.city, listing.wilayah, listing.area, locale) || '-'}
        </AppText>
      </View>
    </>
  );

  const cardStyle = [
    styles.card,
    isHorizontal && styles.cardHorizontal,
    embedded && styles.cardEmbedded
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && styles.cardPressed]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{content}</View>;
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
  cardEmbedded: {
    marginBottom: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0
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
  cover: {
    width: '100%',
    height: '100%'
  },
  badge: {
    position: 'absolute',
    top: 12,
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
  storeRow: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    maxWidth: '100%',
    backgroundColor: colors.brandSoft,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 6
  },
  storeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center'
  },
  storeAvatarImage: {
    width: '100%',
    height: '100%'
  },
  storeAvatarFallback: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800'
  },
  storeName: {
    flexShrink: 1,
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
    paddingRight: 4
  },
  category: {
    position: 'absolute',
    bottom: 12,
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
    padding: 14,
    width: '100%'
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
    width: '100%',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6
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
  }
});

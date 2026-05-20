import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View
} from 'react-native';
import { AppText } from '../components/AppText';
import { ListingCard } from '../components/ListingCard';
import { ListingImageModal } from '../components/ListingImageModal';
import { ListingDetailSkeleton } from '../components/skeleton';
import { fallbackListings, formatListingDate, formatPrice, getCategoryName } from '../data';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import {
  fetchFavoriteIds,
  fetchListingById,
  fetchSimilarListings,
  removeFavoriteRequest,
  toggleFavoriteRequest
} from '../services/listings.service';
import { openConversationRequest } from '../services/chat.service';
import { getCachedListing, setCachedListing } from '../lib/screen-data-cache';
import { useAuthStore } from '../stores';
import type { Listing } from '../types';
import { colors, radius, shadow } from '../theme';

type ListingDetailScreenProps = {
  listingId: string;
  onBack: () => void;
  onLoginRequired: () => void;
  onOpenListing: (id: string) => void;
  onOpenChat: (conversationId: string) => void;
};

function isDemoId(id: string) {
  return id.startsWith('demo-');
}

function loadDemoListing(id: string) {
  const listing = fallbackListings.find((item) => item.id === id);
  if (!listing) throw new Error('not found');
  return listing;
}

function loadDemoSimilar(id: string) {
  return fallbackListings.filter((item) => item.id !== id);
}

export function ListingDetailScreen({
  listingId,
  onBack,
  onLoginRequired,
  onOpenListing,
  onOpenChat
}: ListingDetailScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const { scrollBottomPadding } = useScreenInsets();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  const [listing, setListing] = useState<Listing | null>(() => getCachedListing(listingId) ?? null);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatError, setChatError] = useState('');
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const text = t.listingDetail;
  const contentRtl = isRtl;

  const load = useCallback(async () => {
    const cached = getCachedListing(listingId);
    if (!cached) setIsLoading(true);
    setError('');
    setShowPhone(false);
    setActiveImage(0);
    try {
      if (isDemoId(listingId)) {
        const detail = loadDemoListing(listingId);
        setListing(detail);
        setSimilar(loadDemoSimilar(listingId));
        setCachedListing(listingId, detail);
      } else {
        const [detail, related] = await Promise.all([
          fetchListingById(listingId),
          fetchSimilarListings(listingId)
        ]);
        setListing(detail);
        setSimilar(related);
        setCachedListing(listingId, detail);
      }
    } catch {
      if (!cached) {
        setListing(null);
        setSimilar([]);
        setError(text.notFound);
      }
    } finally {
      setIsLoading(false);
    }
  }, [listingId, text.notFound]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  useEffect(() => {
    if (!accessToken || isDemoId(listingId)) {
      setIsFavorited(false);
      return;
    }
    fetchFavoriteIds()
      .then((ids) => setIsFavorited(ids.includes(listingId)))
      .catch(() => setIsFavorited(false));
  }, [accessToken, listingId]);

  const imageUrls = useMemo(() => {
    const urls = listing?.images?.map((img) => img.imageUrl).filter(Boolean) as string[] | undefined;
    return urls && urls.length > 0 ? urls : [];
  }, [listing]);

  const phone = listing?.contactPhone || listing?.user?.phone || '';
  const categoryName = listing ? getCategoryName(listing, locale) : '';
  const memberYear = listing?.user?.createdAt ? new Date(listing.user.createdAt).getFullYear() : '-';

  const shareListing = useCallback(async () => {
    if (!listing) return;
    try {
      await Share.share({
        title: listing.title,
        message: `${listing.title}\n${formatPrice(listing.price, listing.currency, locale)}`
      });
    } catch {
      /* user dismissed */
    }
  }, [listing, locale]);

  const toggleFavorite = async () => {
    if (!accessToken) {
      onLoginRequired();
      return;
    }
    if (isDemoId(listingId)) return;
    setIsTogglingFavorite(true);
    try {
      if (isFavorited) {
        await removeFavoriteRequest(listingId);
        setIsFavorited(false);
      } else {
        await toggleFavoriteRequest(listingId);
        setIsFavorited(true);
      }
    } catch {
      /* ignore */
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const callSeller = () => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => undefined);
  };

  const openChat = async () => {
    if (!accessToken) {
      onLoginRequired();
      return;
    }
    if (!listing?.user?.id) return;
    if (user?.id === listing.user.id) {
      setChatError(text.cannotMessageSelf);
      return;
    }
    setChatError('');
    setIsOpeningChat(true);
    try {
      const conversation = await openConversationRequest(listing.id, listing.user.id);
      onOpenChat(conversation.id);
    } catch {
      setChatError(text.chatError);
    } finally {
      setIsOpeningChat(false);
    }
  };

  if (isLoading && !listing) {
    return <ListingDetailSkeleton />;
  }

  if (error || !listing) {
    return (
      <View style={styles.centered}>
        <AppText style={styles.errorText}>{error || text.notFound}</AppText>
        <Pressable style={styles.backChip} onPress={onBack}>
          <AppText style={styles.backChipText}>{text.back}</AppText>
        </Pressable>
      </View>
    );
  }

  const selectedImage = imageUrls[activeImage] ?? imageUrls[0];
  const location = listing.area || listing.city || '-';

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.hero}
          onPress={() => {
            if (imageUrls.length > 0) setGalleryOpen(true);
          }}
        >
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="image-outline" size={48} color={colors.muted} />
            </View>
          )}
          <View style={[styles.heroActions, isRtl ? styles.heroActionsRtl : styles.heroActionsLtr]}>
            <Pressable style={styles.heroActionBtn} onPress={() => void shareListing()}>
              <Ionicons name="share-social-outline" size={20} color={colors.ink} />
            </Pressable>
            <Pressable style={styles.heroActionBtn} onPress={toggleFavorite} disabled={isTogglingFavorite}>
              {isTogglingFavorite ? (
                <ActivityIndicator size="small" color={colors.brand} />
              ) : (
                <Ionicons
                  name={isFavorited ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFavorited ? colors.danger : colors.ink}
                />
              )}
            </Pressable>
          </View>
          {imageUrls.length > 1 ? (
            <View style={[styles.imageCountBadge, isRtl && styles.imageCountBadgeRtl]}>
              <Ionicons name="images-outline" size={14} color="#fff" />
              <AppText style={styles.imageCountText}>{imageUrls.length}</AppText>
            </View>
          ) : null}
        </Pressable>

        {imageUrls.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.thumbs, isRtl && styles.thumbsRtl]}
          >
            {imageUrls.map((uri, index) => (
              <Pressable
                key={`${uri}-${index}`}
                onPress={() => setActiveImage(index)}
                style={[styles.thumb, activeImage === index && styles.thumbActive]}
              >
                <Image source={{ uri }} style={styles.thumbImage} />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.card}>
          <View style={styles.badges}>
            {categoryName ? (
              <View style={styles.categoryBadge}>
                <AppText style={styles.categoryBadgeText}>{categoryName}</AppText>
              </View>
            ) : null}
            {listing.isSold ? (
              <View style={styles.soldBadge}>
                <AppText style={styles.soldBadgeText}>{text.soldBadge}</AppText>
              </View>
            ) : null}
          </View>

          <AppText style={[styles.title, contentRtl ? styles.textRtl : styles.textLtr]}>{listing.title}</AppText>
          {listing.isActive === false ? (
            <AppText style={styles.inactive}>{text.inactiveNotice}</AppText>
          ) : null}

          <AppText style={[styles.price, contentRtl ? styles.textRtl : styles.textLtr]}>
            {formatPrice(listing.price, listing.currency, locale)}
          </AppText>

          <View style={[styles.metaRow, isRtl && styles.metaRowRtl]}>
            <MetaItem icon="location-outline" label={location} rtl={contentRtl} />
            <MetaItem
              icon="calendar-outline"
              label={formatListingDate(listing.createdAt, locale)}
              rtl={contentRtl}
            />
            <MetaItem icon="eye-outline" label={`${listing.views ?? 0} ${text.views}`} rtl={contentRtl} />
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={[styles.sectionTitle, contentRtl ? styles.textRtl : styles.textLtr]}>
            {text.description}
          </AppText>
          <AppText style={[styles.description, contentRtl ? styles.textRtl : styles.textLtr]}>
            {listing.description || '-'}
          </AppText>
        </View>

        <View style={styles.card}>
          <AppText style={[styles.sectionTitle, contentRtl ? styles.textRtl : styles.textLtr]}>
            {text.sellerInfo}
          </AppText>
          <View style={[styles.sellerRow, isRtl && styles.sellerRowRtl]}>
            <View style={styles.avatar}>
              {listing.user?.avatar ? (
                <Image source={{ uri: listing.user.avatar }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={28} color="#fff" />
              )}
            </View>
            <View style={styles.sellerBody}>
              <AppText style={[styles.sellerName, contentRtl ? styles.textRtl : styles.textLtr]}>
                {listing.user?.fullName ?? '-'}
              </AppText>
              <AppText style={[styles.sellerMeta, contentRtl ? styles.textRtl : styles.textLtr]}>
                {text.memberSince} {memberYear}
              </AppText>
            </View>
          </View>

          <Pressable style={styles.primaryBtn} onPress={() => setShowPhone(true)}>
            <Ionicons name="call-outline" size={20} color="#fff" />
            <AppText style={styles.primaryBtnText}>
              {showPhone ? phone || text.phoneUnavailable : text.showPhone}
            </AppText>
          </Pressable>

          {showPhone && phone ? (
            <Pressable style={styles.outlineBtn} onPress={callSeller}>
              <Ionicons name="call" size={20} color={colors.brand} />
              <AppText style={styles.outlineBtnText}>{text.callSeller}</AppText>
            </Pressable>
          ) : null}

          <Pressable
            style={[styles.outlineBtn, isOpeningChat && styles.btnDisabled]}
            onPress={openChat}
            disabled={isOpeningChat}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.brand} />
            <AppText style={styles.outlineBtnText}>{text.startConversation}</AppText>
          </Pressable>

          {chatError ? <AppText style={styles.chatError}>{chatError}</AppText> : null}

          <View style={styles.contactBlock}>
            <AppText style={[styles.contactTitle, contentRtl ? styles.textRtl : styles.textLtr]}>
              {text.contactInfo}
            </AppText>
            {listing.user?.email ? (
              <AppText style={[styles.contactLine, styles.contactLtr]}>{listing.user.email}</AppText>
            ) : null}
          </View>

          <View style={styles.safetyBox}>
            <AppText style={[styles.safetyText, contentRtl ? styles.textRtl : styles.textLtr]}>
              <AppText style={styles.safetyBold}>{text.safetyTitle}</AppText> {text.safetyText}
            </AppText>
          </View>
        </View>

        <View style={styles.similarSection}>
          <AppText style={[styles.sectionTitle, contentRtl ? styles.textRtl : styles.textLtr, styles.similarTitle]}>
            {text.similar}
          </AppText>
          {similar.length === 0 ? (
            <AppText style={[styles.noSimilar, contentRtl ? styles.textRtl : styles.textLtr]}>{text.noSimilar}</AppText>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.similarScroll, isRtl && styles.similarScrollRtl]}
            >
              {similar.map((item) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  locale={locale}
                  featuredLabel={t.common.featured}
                  layout="horizontal"
                  onPress={() => onOpenListing(item.id)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      <ListingImageModal
        visible={galleryOpen}
        images={imageUrls}
        initialIndex={activeImage}
        title={listing.title}
        imageLabel={text.imageOf}
        onClose={() => setGalleryOpen(false)}
      />
    </View>
  );
}

function MetaItem({
  icon,
  label,
  rtl
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  rtl: boolean;
}) {
  return (
    <View style={[styles.metaItem, rtl && styles.metaItemRtl]}>
      <Ionicons name={icon} size={15} color={colors.muted} />
      <AppText style={[styles.metaLabel, rtl ? styles.textRtl : styles.textLtr]} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background
  },
  loadingText: {
    marginTop: 12,
    color: colors.muted
  },
  errorText: {
    color: colors.danger,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16
  },
  backChip: {
    backgroundColor: colors.brand,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.pill
  },
  backChipText: {
    color: '#fff',
    fontWeight: '700'
  },
  scroll: {},
  hero: {
    height: 280,
    backgroundColor: colors.brandSoft
  },
  heroActions: {
    position: 'absolute',
    top: 12,
    flexDirection: 'row',
    gap: 8
  },
  heroActionsLtr: {
    right: 12
  },
  heroActionsRtl: {
    left: 12
  },
  heroActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    ...shadow
  },
  heroImage: {
    width: '100%',
    height: '100%'
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  imageCountBadge: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15,23,42,0.72)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill
  },
  imageCountBadgeRtl: {
    right: undefined,
    left: 14
  },
  imageCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  },
  thumbs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface
  },
  thumbsRtl: {
    flexDirection: 'row-reverse'
  },
  thumb: {
    width: 72,
    height: 56,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  thumbActive: {
    borderColor: colors.brand
  },
  thumbImage: {
    width: '100%',
    height: '100%'
  },
  card: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    ...shadow
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10
  },
  categoryBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  categoryBadgeText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '700'
  },
  soldBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  soldBadgeText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '800'
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 6
  },
  inactive: {
    color: colors.danger,
    fontWeight: '700',
    marginBottom: 6,
    fontSize: 13
  },
  price: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.brand,
    marginBottom: 12
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  metaRowRtl: {
    flexDirection: 'row-reverse'
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%'
  },
  metaItemRtl: {
    flexDirection: 'row-reverse'
  },
  metaLabel: {
    color: colors.muted,
    fontSize: 13,
    maxWidth: 140
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 10
  },
  description: {
    color: colors.ink,
    lineHeight: 24,
    fontSize: 15
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16
  },
  sellerRowRtl: {
    flexDirection: 'row-reverse'
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  sellerBody: {
    flex: 1
  },
  sellerName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.ink
  },
  sellerMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginBottom: 10
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginBottom: 10,
    backgroundColor: colors.brandSoft
  },
  outlineBtnText: {
    color: colors.brandDark,
    fontWeight: '800',
    fontSize: 15
  },
  btnDisabled: {
    opacity: 0.6
  },
  chatError: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 8
  },
  contactBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 12
  },
  contactTitle: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 6
  },
  contactLine: {
    color: colors.ink,
    fontSize: 14
  },
  contactLtr: {
    textAlign: 'left'
  },
  safetyBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: radius.md,
    padding: 12
  },
  safetyText: {
    color: '#92400e',
    fontSize: 13,
    lineHeight: 20
  },
  safetyBold: {
    fontWeight: '800'
  },
  similarSection: {
    marginTop: 8,
    paddingHorizontal: 16,
    marginBottom: 24
  },
  similarTitle: {
    marginBottom: 12
  },
  noSimilar: {
    color: colors.muted
  },
  similarScroll: {
    flexDirection: 'row',
    gap: 12,
    paddingEnd: 4
  },
  similarScrollRtl: {
    flexDirection: 'row-reverse'
  },
  textRtl: {
    textAlign: 'right'
  },
  textLtr: {
    textAlign: 'left'
  }
});

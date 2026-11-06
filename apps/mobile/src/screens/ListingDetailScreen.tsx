import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent
} from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
import { AppText } from '../components/AppText';
import { AvatarWithBanBadge } from '../components/AvatarWithBanBadge';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { HeroBannersSection } from '../components/HeroBannersSection';
import { ListingCard } from '../components/ListingCard';
import { ListingCoverImage } from '../components/ListingCoverImage';
import { ListingImageModal } from '../components/ListingImageModal';
import { ListingDetailSkeleton } from '../components/skeleton';
import { formatListingDate, formatPrice, getCategoryName } from '../data';
import { isVideoMedia, resolveDeviceMediaUrl } from '../lib/media-url';
import { getListingLocationLabel } from '../lib/oman-locations';
import { insetEnd, rowDirection } from '../lib/layout-direction';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import {
  fetchFavoriteIds,
  fetchListingById,
  fetchSimilarListings,
  removeFavoriteRequest,
  reportListingRequest,
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
  onOpenStore?: (slug: string) => void;
};

export function ListingDetailScreen({
  listingId,
  onBack,
  onLoginRequired,
  onOpenListing,
  onOpenChat,
  onOpenStore
}: ListingDetailScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const { width: pageWidth } = useWindowDimensions();
  const mediaPagerRef = useRef<FlatList<{ uri: string; isVideo: boolean }>>(null);
  const { scrollBottomPadding } = useScreenInsets();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  const [listing, setListing] = useState<Listing | null>(() => getCachedListing(listingId) ?? null);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatError, setChatError] = useState('');
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const text = t.listingDetail;
  const contentRtl = isRtl;

  const load = useCallback(async () => {
    const cached = getCachedListing(listingId);
    if (!cached) setIsLoading(true);
    setError('');
    setShowPhone(false);
    setActiveImage(0);
    setVideoPlaying(false);
    try {
      const [detail, related] = await Promise.all([
        fetchListingById(listingId),
        fetchSimilarListings(listingId)
      ]);
      setListing(detail);
      setSimilar(related);
      setCachedListing(listingId, detail);
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
    if (!accessToken) {
      setIsFavorited(false);
      return;
    }
    fetchFavoriteIds()
      .then((ids) => setIsFavorited(ids.includes(listingId)))
      .catch(() => setIsFavorited(false));
  }, [accessToken, listingId]);

  const gallery = useMemo(() => {
    return (listing?.images ?? [])
      .map((img) => ({
        uri: resolveDeviceMediaUrl(img.imageUrl),
        isVideo: isVideoMedia(img)
      }))
      .filter((item) => item.uri);
  }, [listing]);

  const phone =
    listing?.contactPhone?.trim() ||
    listing?.store?.phone?.trim() ||
    listing?.user?.phone?.trim() ||
    '';
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

  const openReportModal = () => {
    if (!accessToken) {
      onLoginRequired();
      return;
    }
    if (user?.id === listing?.user?.id) {
      setReportError(text.reportOwnListing);
      return;
    }
    setReportReason('');
    setReportError('');
    setReportSuccess('');
    setReportOpen(true);
  };

  const submitReport = async () => {
    if (!listing) return;
    const reason = reportReason.trim();
    if (reason.length < 5) {
      setReportError(text.reportError);
      return;
    }

    setIsSubmittingReport(true);
    setReportError('');
    try {
      await reportListingRequest(listing.id, reason);
      setReportSuccess(text.reportSuccess);
      setReportReason('');
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 409) setReportError(text.reportAlreadySent);
      else if (status === 400) setReportError(text.reportOwnListing);
      else setReportError(text.reportError);
    } finally {
      setIsSubmittingReport(false);
    }
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

  const location = getListingLocationLabel(listing.city, listing.wilayah, listing.area, locale) || '-';

  const showMedia = (index: number) => {
    setVideoPlaying(false);
    setActiveImage(index);
    mediaPagerRef.current?.scrollToIndex({ index, animated: true });
  };

  const onMediaSwipeEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    if (index >= 0 && index < gallery.length && index !== activeImage) {
      setVideoPlaying(false);
      setActiveImage(index);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPadding }]}
        directionalLockEnabled
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          {gallery.length === 0 ? (
            <ListingCoverImage uri={null} variant="hero" style={styles.heroPlaceholder} />
          ) : (
            <FlatList
              ref={mediaPagerRef}
              data={gallery}
              horizontal
              pagingEnabled
              nestedScrollEnabled
              directionalLockEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.heroPager}
              keyExtractor={(item, index) => `${item.uri}-${index}`}
              getItemLayout={(_, index) => ({ length: pageWidth, offset: pageWidth * index, index })}
              extraData={`${activeImage}-${videoPlaying}`}
              onMomentumScrollEnd={onMediaSwipeEnd}
              onScrollToIndexFailed={() => undefined}
              renderItem={({ item, index }) =>
                item.isVideo ? (
                  <View style={[styles.heroVideo, { width: pageWidth }]}>
                    <Video
                      pointerEvents="none"
                      source={{ uri: item.uri }}
                      style={StyleSheet.absoluteFill}
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay={videoPlaying && index === activeImage}
                      isLooping={false}
                    />
                    <Pressable style={styles.videoPlay} onPress={() => setVideoPlaying((playing) => !playing)}>
                      <Ionicons name={videoPlaying && index === activeImage ? 'pause' : 'play'} size={28} color="#fff" />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable style={{ width: pageWidth, height: '100%' }} onPress={() => setGalleryOpen(true)}>
                    <Image source={{ uri: item.uri }} style={styles.heroImage} />
                  </Pressable>
                )
              }
            />
          )}
          <View style={[styles.heroActions, rowDirection(isRtl), insetEnd(isRtl, 12)]}>
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
          {gallery.length > 1 ? (
            <View style={[styles.imageCountBadge, rowDirection(isRtl), insetEnd(isRtl, 14)]}>
              <Ionicons name="images-outline" size={14} color="#fff" />
              <AppText style={styles.imageCountText}>
                {activeImage + 1}/{gallery.length}
              </AppText>
            </View>
          ) : null}
        </View>

        {gallery.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.thumbs, rowDirection(isRtl)]}
          >
            {gallery.map((item, index) => (
              <Pressable
                key={`${item.uri}-${index}`}
                onPress={() => showMedia(index)}
                style={[styles.thumb, activeImage === index && styles.thumbActive]}
              >
                {item.isVideo ? (
                  <View style={styles.videoThumb}>
                    <Ionicons name="videocam" size={22} color="#fff" />
                  </View>
                ) : (
                  <Image source={{ uri: item.uri }} style={styles.thumbImage} />
                )}
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <HeroBannersSection placement="LISTING" />

        <View style={styles.card}>
          <View style={[styles.badges, rowDirection(isRtl)]}>
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

          <View style={[styles.titleRow, rowDirection(contentRtl)]}>
            <AppText style={[styles.title, contentRtl ? styles.textRtl : styles.textLtr, styles.titleFlex]}>{listing.title}</AppText>
            {listing.trustBadgeApproved ? <VerifiedBadge size="md" /> : null}
          </View>
          {listing.isActive === false ? (
            <AppText style={styles.inactive}>{text.inactiveNotice}</AppText>
          ) : null}

          <AppText style={[styles.price, contentRtl ? styles.textRtl : styles.textLtr]}>
            {formatPrice(listing.price, listing.currency, locale)}
          </AppText>

          <View style={[styles.metaRow, rowDirection(isRtl)]}>
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
          <Pressable style={[styles.reportBtn, rowDirection(isRtl)]} onPress={openReportModal}>
            <Ionicons name="flag-outline" size={18} color={colors.danger} />
            <AppText style={styles.reportBtnText}>{text.report}</AppText>
          </Pressable>
          {reportError && !reportOpen ? <AppText style={styles.reportInlineError}>{reportError}</AppText> : null}
        </View>

        <View style={styles.card}>
          <AppText style={[styles.sectionTitle, contentRtl ? styles.textRtl : styles.textLtr]}>
            {text.sellerInfo}
          </AppText>
          {listing.store && onOpenStore ? (
            <Pressable
              style={[styles.sellerRow, rowDirection(isRtl), styles.sellerRowLink]}
              onPress={() => onOpenStore(listing.store!.slug)}
            >
              <AvatarWithBanBadge
                uri={listing.store.logoUrl ?? listing.user?.avatar}
                fallbackLabel={
                  locale === 'en' ? listing.store.nameEn : listing.store.nameAr
                }
                size={56}
                isBlocked={listing.user?.isBlocked}
                badgeLabel={listing.user?.isBlocked ? t.profile.accountBlocked : undefined}
              />
              <View style={styles.sellerBody}>
                <View style={[styles.sellerNameRow, rowDirection(contentRtl)]}>
                  <AppText style={[styles.sellerName, contentRtl ? styles.textRtl : styles.textLtr, styles.sellerNameFlex]}>
                    {locale === 'en' ? listing.store.nameEn : listing.store.nameAr}
                  </AppText>
                  {listing.trustBadgeApproved ? <VerifiedBadge /> : null}
                </View>
                <AppText style={[styles.sellerMeta, styles.sellerStoreMeta, contentRtl ? styles.textRtl : styles.textLtr]}>
                  {text.storeListing}
                </AppText>
              </View>
            </Pressable>
          ) : (
            <View style={[styles.sellerRow, rowDirection(isRtl)]}>
              <AvatarWithBanBadge
                uri={listing.store?.logoUrl ?? listing.user?.avatar}
                fallbackLabel={
                  listing.store
                    ? locale === 'en'
                      ? listing.store.nameEn
                      : listing.store.nameAr
                    : listing.user?.fullName
                }
                size={56}
                isBlocked={listing.user?.isBlocked}
                badgeLabel={listing.user?.isBlocked ? t.profile.accountBlocked : undefined}
              />
              <View style={styles.sellerBody}>
                <View style={[styles.sellerNameRow, rowDirection(contentRtl)]}>
                  <AppText style={[styles.sellerName, contentRtl ? styles.textRtl : styles.textLtr, styles.sellerNameFlex]}>
                    {listing.store
                      ? locale === 'en'
                        ? listing.store.nameEn
                        : listing.store.nameAr
                      : listing.user?.fullName ?? '-'}
                  </AppText>
                  {listing.trustBadgeApproved ? <VerifiedBadge /> : null}
                </View>
                <AppText style={[styles.sellerMeta, contentRtl ? styles.textRtl : styles.textLtr]}>
                  {listing.store ? text.storeListing : `${text.memberSince} ${memberYear}`}
                </AppText>
              </View>
            </View>
          )}

          <Pressable style={[styles.primaryBtn, rowDirection(isRtl)]} onPress={() => setShowPhone(true)}>
            <Ionicons name="call-outline" size={20} color="#fff" />
            <AppText style={styles.primaryBtnText}>
              {showPhone ? phone || text.phoneUnavailable : text.showPhone}
            </AppText>
          </Pressable>

          {showPhone && phone ? (
            <Pressable style={[styles.outlineBtn, rowDirection(isRtl)]} onPress={callSeller}>
              <Ionicons name="call" size={20} color={colors.brand} />
              <AppText style={styles.outlineBtnText}>{text.callSeller}</AppText>
            </Pressable>
          ) : null}

          <Pressable
            style={[styles.outlineBtn, rowDirection(isRtl), isOpeningChat && styles.btnDisabled]}
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
              contentContainerStyle={[styles.similarScroll, rowDirection(isRtl)]}
            >
              {similar.map((item) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  locale={locale}
                  featuredLabel={t.common.featured}
                  layout="horizontal"
                  onPress={() => onOpenListing(item.id)}
                  onStorePress={onOpenStore}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      <ListingImageModal
        visible={galleryOpen}
        images={gallery}
        initialIndex={activeImage}
        title={listing.title}
        imageLabel={text.imageOf}
        onClose={(index) => {
          setGalleryOpen(false);
          if (typeof index === 'number') showMedia(index);
        }}
      />

      <Modal visible={reportOpen} transparent animationType="fade" onRequestClose={() => setReportOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText style={[styles.modalTitle, contentRtl ? styles.textRtl : styles.textLtr]}>{text.reportTitle}</AppText>
            {reportSuccess ? <AppText style={styles.reportSuccess}>{reportSuccess}</AppText> : null}
            {reportError ? <AppText style={styles.reportInlineError}>{reportError}</AppText> : null}
            <AppTextInput
              value={reportReason}
              onChangeText={setReportReason}
              placeholder={text.reportPlaceholder}
              placeholderTextColor={colors.muted}
              multiline
              style={[styles.reportInput, contentRtl ? styles.textRtl : styles.textLtr]}
            />
            <View style={[styles.modalActions, rowDirection(isRtl)]}>
              <Pressable
                style={[styles.primaryBtn, styles.modalPrimaryBtn, rowDirection(isRtl), isSubmittingReport && styles.btnDisabled]}
                onPress={submitReport}
                disabled={isSubmittingReport}
              >
                {isSubmittingReport ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <AppText style={styles.primaryBtnText}>{text.reportSubmit}</AppText>
                )}
              </Pressable>
              <Pressable style={[styles.outlineBtn, rowDirection(isRtl)]} onPress={() => setReportOpen(false)}>
                <AppText style={styles.outlineBtnText}>{text.reportCancel}</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    <View style={[styles.metaItem, rowDirection(rtl)]}>
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
  heroPager: {
    height: 280
  },
  heroActions: {
    position: 'absolute',
    top: 12,
    zIndex: 2,
    elevation: 4,
    gap: 8
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
  heroMedia: {
    width: '100%',
    height: '100%'
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.brandSoft
  },
  heroVideo: {
    height: '100%',
    backgroundColor: '#111827'
  },
  videoPlay: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -24,
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)'
  },
  videoThumb: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827'
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  imageCountBadge: {
    position: 'absolute',
    zIndex: 2,
    bottom: 14,
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
    height: '100%',
    backgroundColor: colors.brandSoft
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  reportBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  reportBtnText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 14
  },
  reportInlineError: {
    marginTop: 10,
    color: colors.danger,
    fontWeight: '700',
    fontSize: 13
  },
  reportSuccess: {
    marginBottom: 10,
    color: colors.brandDark,
    fontWeight: '700',
    fontSize: 13
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    ...shadow
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 12
  },
  reportInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.background,
    textAlignVertical: 'top'
  },
  modalActions: {
    marginTop: 14,
    gap: 10
  },
  modalActionsRtl: {
    direction: 'rtl'
  },
  modalPrimaryBtn: {
    marginBottom: 0
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
  sellerRowLink: {
    borderRadius: radius.md,
    padding: 4,
    marginHorizontal: -4
  },
  sellerStoreMeta: {
    color: colors.brandDark,
    fontWeight: '700'
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
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  sellerNameRowRtl: {
    flexDirection: 'row-reverse'
  },
  sellerNameRowLtr: {
    flexDirection: 'row'
  },
  sellerNameFlex: {
    flex: 1
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

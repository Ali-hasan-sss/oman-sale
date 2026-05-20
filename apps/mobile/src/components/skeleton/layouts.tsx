import { ScrollView, StyleSheet, View } from 'react-native';

import { Skeleton } from './Skeleton';
import { colors, radius, shadow } from '../../theme';

export function ListingCardSkeleton({ layout = 'vertical' }: { layout?: 'vertical' | 'horizontal' }) {
  const horizontal = layout === 'horizontal';

  return (
    <View style={[styles.listingCard, horizontal && styles.listingCardHorizontal]}>
      <Skeleton width="100%" height={horizontal ? 152 : 180} borderRadius={0} />
      <View style={styles.listingBody}>
        <Skeleton width="88%" height={16} />
        <Skeleton width="55%" height={18} style={styles.gapSm} />
        <Skeleton width="70%" height={13} style={styles.gapSm} />
      </View>
    </View>
  );
}

export function ListingCardSkeletonRow({ count = 3, layout = 'horizontal' as const }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalRow}
    >
      {Array.from({ length: count }).map((_, index) => (
        <ListingCardSkeleton key={index} layout={layout} />
      ))}
    </ScrollView>
  );
}

export function ListingListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <ListingCardSkeleton key={index} layout="vertical" />
      ))}
    </View>
  );
}

export function CategoryChipsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.categoryChip}>
          <Skeleton width={52} height={52} borderRadius={26} />
          <Skeleton width={72} height={12} style={styles.gapSm} />
          <Skeleton width={48} height={10} style={styles.gapXs} />
        </View>
      ))}
    </ScrollView>
  );
}

export function HeroBannerSkeleton({ height = 120 }: { height?: number }) {
  return <Skeleton width="100%" height={height} borderRadius={radius.md} />;
}

export function HomeHeroSkeleton({ height = 220, embedded = false }: { height?: number; embedded?: boolean }) {
  return (
    <View style={[embedded ? styles.homeHeroEmbedded : styles.homeHero, !embedded && { height }]}>
      <Skeleton width="75%" height={28} borderRadius={radius.sm} />
      <Skeleton width="92%" height={16} style={styles.gapSm} />
      <Skeleton width="40%" height={44} borderRadius={radius.pill} style={styles.gapMd} />
    </View>
  );
}

export function ChatRowSkeleton() {
  return (
    <View style={styles.chatRow}>
      <Skeleton width={56} height={56} borderRadius={radius.sm} />
      <View style={styles.chatBody}>
        <View style={styles.chatTop}>
          <Skeleton width="45%" height={14} />
          <Skeleton width={48} height={10} />
        </View>
        <Skeleton width="60%" height={12} style={styles.gapXs} />
        <Skeleton width="80%" height={12} style={styles.gapXs} />
      </View>
    </View>
  );
}

export function ChatListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <ChatRowSkeleton key={index} />
      ))}
    </View>
  );
}

export function ChatThreadSkeleton() {
  return (
    <View style={styles.thread}>
      <View style={styles.threadHeader}>
        <Skeleton width={40} height={40} borderRadius={12} />
        <View style={styles.threadPeer}>
          <Skeleton width={120} height={16} />
          <Skeleton width={72} height={11} style={styles.gapXs} />
        </View>
        <Skeleton width={40} height={40} borderRadius={12} />
      </View>
      <View style={styles.adCardSkel}>
        <Skeleton width={56} height={56} borderRadius={radius.sm} />
        <View style={styles.adCardBody}>
          <Skeleton width="40%" height={10} />
          <Skeleton width="85%" height={14} style={styles.gapXs} />
          <Skeleton width="65%" height={11} style={styles.gapXs} />
        </View>
      </View>
      <View style={styles.bubbles}>
        <View style={styles.bubbleOther}>
          <Skeleton width="68%" height={44} borderRadius={radius.md} />
        </View>
        <View style={styles.bubbleMine}>
          <Skeleton width="55%" height={36} borderRadius={radius.md} />
        </View>
        <View style={styles.bubbleOther}>
          <Skeleton width="72%" height={52} borderRadius={radius.md} />
        </View>
      </View>
      <View style={styles.composerSkel}>
        <Skeleton width="100%" height={44} borderRadius={radius.md} />
        <Skeleton width={44} height={44} borderRadius={22} style={styles.composerSend} />
      </View>
    </View>
  );
}

export function ListingDetailSkeleton() {
  return (
    <View style={styles.detail}>
      <Skeleton width="100%" height={280} borderRadius={0} />
      <View style={styles.detailBody}>
        <Skeleton width="90%" height={24} />
        <Skeleton width="50%" height={22} style={styles.gapSm} />
        <Skeleton width="35%" height={14} style={styles.gapSm} />
        <Skeleton width="100%" height={80} borderRadius={radius.md} style={styles.gapMd} />
        <Skeleton width="100%" height={100} borderRadius={radius.md} style={styles.gapSm} />
        <Skeleton width="100%" height={120} borderRadius={radius.md} style={styles.gapSm} />
      </View>
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View style={styles.profilePage}>
      <Skeleton width="100%" height={128} borderRadius={radius.lg} />
      <View style={styles.profileCard}>
        <View style={styles.profileCardHeader}>
          <Skeleton width={96} height={96} borderRadius={48} />
          <View style={styles.profileCardHeaderText}>
            <Skeleton width="70%" height={18} />
            <Skeleton width="90%" height={12} style={styles.gapSm} />
            <Skeleton width={120} height={36} borderRadius={radius.md} style={styles.gapMd} />
          </View>
        </View>
        <FormFieldsSkeleton rows={4} />
        <Skeleton width="100%" height={48} borderRadius={radius.md} style={styles.gapMd} />
      </View>
      <View style={styles.profileCard}>
        <Skeleton width="45%" height={18} style={styles.gapSm} />
        <FormFieldsSkeleton rows={2} />
        <Skeleton width="100%" height={48} borderRadius={radius.md} style={styles.gapMd} />
      </View>
      <View style={styles.profileCard}>
        <Skeleton width="55%" height={18} style={styles.gapSm} />
        <FormFieldsSkeleton rows={2} />
        <Skeleton width="100%" height={48} borderRadius={radius.md} />
      </View>
    </View>
  );
}

export function FormFieldsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.formRow}>
          <Skeleton width="30%" height={12} />
          <Skeleton width="100%" height={48} borderRadius={radius.md} style={styles.gapSm} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: 14,
    ...shadow
  },
  listingCardHorizontal: {
    width: 268,
    marginBottom: 0
  },
  listingBody: {
    padding: 14
  },
  horizontalRow: {
    flexDirection: 'row',
    gap: 12,
    paddingEnd: 4
  },
  categoryChip: {
    width: 108,
    alignItems: 'center',
    paddingVertical: 8
  },
  homeHero: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    justifyContent: 'flex-end',
    ...shadow
  },
  homeHeroEmbedded: {
    flex: 1,
    width: '100%',
    padding: 20,
    backgroundColor: colors.surface,
    justifyContent: 'flex-end'
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 12,
    ...shadow
  },
  chatBody: {
    flex: 1
  },
  chatTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  thread: {
    flex: 1,
    backgroundColor: '#efeae2'
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line
  },
  threadPeer: {
    flex: 1
  },
  adCardSkel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 10,
    padding: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    ...shadow
  },
  adCardBody: {
    flex: 1
  },
  bubbles: {
    flex: 1,
    padding: 12,
    gap: 12
  },
  bubbleOther: {
    alignItems: 'flex-start'
  },
  bubbleMine: {
    alignItems: 'flex-end'
  },
  composerSkel: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line
  },
  composerSend: {
    flexShrink: 0
  },
  detail: {
    flex: 1,
    backgroundColor: colors.background
  },
  detailBody: {
    padding: 16
  },
  profile: {
    padding: 24,
    alignItems: 'center'
  },
  profilePage: {
    padding: 16,
    gap: 14
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    ...shadow
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16
  },
  profileCardHeaderText: {
    flex: 1
  },
  profileAvatar: {
    marginBottom: 16
  },
  formRow: {
    marginBottom: 16
  },
  gapXs: {
    marginTop: 6
  },
  gapSm: {
    marginTop: 10
  },
  gapMd: {
    marginTop: 16
  }
});

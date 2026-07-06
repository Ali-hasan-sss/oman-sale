import { Ionicons } from '@expo/vector-icons';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '../i18n';
import { useChatStore } from '../stores';
import { colors } from '../theme';
import { AppText } from './AppText';
import { Skeleton } from './skeleton/Skeleton';

type ChatThreadBarProps = {
  onBack: () => void;
};

export function ChatThreadBar({ onBack }: ChatThreadBarProps) {
  const { t, isRtl } = useI18n();
  const text = t.chat;
  const safeInsets = useSafeAreaInsets();
  const threadBar = useChatStore((state) => state.threadBar);
  const peerId = threadBar?.peerId;
  const isOtherOnline = useChatStore((state) => (peerId ? state.isUserOnline(peerId) : false));

  const isLoading = threadBar?.isLoading ?? true;
  const peerName = threadBar?.peerName ?? '';
  const peerAvatar = threadBar?.peerAvatar;
  const peerPhone = threadBar?.peerPhone;

  return (
    <View style={[styles.shell, { paddingTop: safeInsets.top }]} pointerEvents="box-none">
      <View style={styles.row} pointerEvents="auto">
        <Pressable style={styles.iconBtn} onPress={onBack}>
          <Ionicons name={isRtl ? 'arrow-forward' : 'arrow-back'} size={22} color={colors.ink} />
        </Pressable>

        {isLoading ? (
          <View style={styles.peerRow}>
            <Skeleton width={44} height={44} borderRadius={22} />
            <View style={styles.peerMeta}>
              <Skeleton width={120} height={16} />
              <Skeleton width={72} height={11} style={styles.gapXs} />
            </View>
          </View>
        ) : (
          <View style={styles.peerRow}>
            <View style={styles.avatar}>
              {peerAvatar ? (
                <Image source={{ uri: peerAvatar }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={22} color="#fff" />
              )}
            </View>
            <View style={styles.peerMeta}>
              <AppText style={[styles.peerName, isRtl && styles.textRtl]} numberOfLines={1}>
                {peerName || '-'}
              </AppText>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, isOtherOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
                <AppText style={styles.statusText}>{isOtherOnline ? text.online : text.offline}</AppText>
              </View>
            </View>
          </View>
        )}

        {isLoading || !peerPhone ? (
          <View style={styles.iconSpacer} />
        ) : (
          <Pressable
            style={styles.iconBtn}
            onPress={() => Linking.openURL(`tel:${peerPhone}`).catch(() => undefined)}
          >
            <Ionicons name="call-outline" size={22} color={colors.brand} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    zIndex: 100,
    elevation: 100
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  rowRtl: {
    flexDirection: 'row-reverse'
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconSpacer: {
    width: 40
  },
  peerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  peerRowRtl: {
    flexDirection: 'row-reverse'
  },
  peerMeta: {
    flex: 1,
    minWidth: 0
  },
  gapXs: {
    marginTop: 4
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.brandSoft
  },
  peerName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink
  },
  textRtl: {
    textAlign: 'right'
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2
  },
  statusRowRtl: {
    flexDirection: 'row-reverse'
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statusDotOnline: {
    backgroundColor: colors.brand
  },
  statusDotOffline: {
    backgroundColor: '#94a3b8'
  },
  statusText: {
    fontSize: 12,
    color: colors.muted
  }
});

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

import { AppText } from './AppText';
import { useI18n } from '../i18n';
import { colors } from '../theme';

const isOfflineState = (connected: boolean | null, reachable: boolean | null) => {
  if (connected === false) return true;
  if (reachable === false) return true;
  return false;
};

export function NetworkStatusBar() {
  const { t, isRtl } = useI18n();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(isOfflineState(state.isConnected, state.isInternetReachable));
    });

    NetInfo.fetch().then((state) => {
      setIsOffline(isOfflineState(state.isConnected, state.isInternetReachable));
    });

    return unsubscribe;
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.bar} accessibilityRole="alert">
      <Ionicons name="cloud-offline-outline" size={18} color="#fff" />
      <View style={styles.textWrap}>
        <AppText style={[styles.title, isRtl ? styles.rtl : styles.ltr]}>{t.common.offlineTitle}</AppText>
        <AppText style={[styles.message, isRtl ? styles.rtl : styles.ltr]}>{t.common.offlineMessage}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.danger,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  textWrap: {
    flex: 1
  },
  title: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13
  },
  message: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});

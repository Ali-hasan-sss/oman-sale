import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, PanResponder, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/AppHeader';
import { AuthGateModal } from '../components/AuthGateModal';
import { BottomTabBar } from '../components/BottomTabBar';
import { SideDrawer } from '../components/SideDrawer';
import { useAuthStore } from '../stores';
import { AddOfferScreen } from '../screens/AddOfferScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MyOffersScreen } from '../screens/MyOffersScreen';
import { OffersScreen } from '../screens/OffersScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import type { ScreenName } from '../types';
import { colors } from '../theme';

const tabScreens: ScreenName[] = ['home', 'offers', 'myOffers', 'chat'];
const protectedScreens: ScreenName[] = ['myOffers', 'chat', 'addOffer'];
const edgeSwipeWidth = 40;
const openSwipeThreshold = 56;

type TabKey = (typeof tabScreens)[number];

export function MainShell() {
  const user = useAuthStore((state) => state.user);
  const [screen, setScreen] = useState<ScreenName>('home');
  const [lastTab, setLastTab] = useState<TabKey>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [pendingScreen, setPendingScreen] = useState<ScreenName | null>(null);
  const drawerOpenRef = useRef(drawerOpen);
  const screenHistoryRef = useRef<ScreenName[]>(['home']);

  drawerOpenRef.current = drawerOpen;

  const pushScreen = (next: ScreenName) => {
    if (next === screen) return;
    screenHistoryRef.current = [...screenHistoryRef.current, next];
    setScreen(next);
  };

  const resetToTab = (next: TabKey) => {
    setLastTab(next);
    screenHistoryRef.current = [next];
    setScreen(next);
  };

  const navigate = (next: ScreenName) => {
    if (protectedScreens.includes(next) && !user) {
      setPendingScreen(next);
      setAuthGateOpen(true);
      return;
    }

    if (tabScreens.includes(next)) {
      resetToTab(next as TabKey);
      return;
    }

    pushScreen(next);
  };

  const goBack = () => {
    if (screenHistoryRef.current.length <= 1) return false;
    const previous = screenHistoryRef.current.slice(0, -1);
    screenHistoryRef.current = previous;
    const target = previous[previous.length - 1] ?? 'home';
    setScreen(target);
    if (tabScreens.includes(target)) setLastTab(target as TabKey);
    return true;
  };

  const handleAuthSuccess = () => {
    const next = pendingScreen ?? lastTab;
    if (tabScreens.includes(next)) {
      resetToTab(next as TabKey);
    } else {
      screenHistoryRef.current = [...screenHistoryRef.current.slice(0, -1), next];
      setScreen(next);
    }
    setPendingScreen(null);
    setAuthGateOpen(false);
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (drawerOpenRef.current) {
        setDrawerOpen(false);
        return true;
      }
      if (authGateOpen) {
        setAuthGateOpen(false);
        setPendingScreen(null);
        return true;
      }
      return goBack();
    });

    return () => subscription.remove();
  }, [authGateOpen]);

  const edgePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, gesture) =>
        !drawerOpenRef.current && gesture.x0 <= edgeSwipeWidth,
      onMoveShouldSetPanResponder: (_, gesture) =>
        !drawerOpenRef.current &&
        gesture.x0 <= edgeSwipeWidth &&
        gesture.dx > 12 &&
        Math.abs(gesture.dy) < Math.abs(gesture.dx),
      onPanResponderRelease: (_, gesture) => {
        if (!drawerOpenRef.current && gesture.dx >= openSwipeThreshold) {
          setDrawerOpen(true);
        }
      }
    })
  ).current;

  const tabBarActiveScreen = tabScreens.includes(screen) ? screen : lastTab;

  const content = useMemo(() => {
    switch (screen) {
      case 'home':
        return <HomeScreen onBrowseOffers={() => navigate('offers')} />;
      case 'offers':
        return <OffersScreen />;
      case 'myOffers':
        return <MyOffersScreen />;
      case 'chat':
        return <ChatScreen />;
      case 'addOffer':
        return <AddOfferScreen />;
      case 'login':
        return (
          <AuthScreen
            mode="login"
            onSwitchMode={() => {
              screenHistoryRef.current = [...screenHistoryRef.current.slice(0, -1), 'register'];
              setScreen('register');
            }}
            onSuccess={handleAuthSuccess}
          />
        );
      case 'register':
        return (
          <AuthScreen
            mode="register"
            onSwitchMode={() => {
              screenHistoryRef.current = [...screenHistoryRef.current.slice(0, -1), 'login'];
              setScreen('login');
            }}
            onSuccess={handleAuthSuccess}
          />
        );
      case 'profile':
        return <ProfileScreen onLogin={() => pushScreen('login')} />;
      case 'settings':
        return <SettingsScreen />;
      case 'favorites':
        return <FavoritesScreen />;
      default:
        return <HomeScreen onBrowseOffers={() => navigate('offers')} />;
    }
  }, [screen, user]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <AppHeader onMenuPress={() => setDrawerOpen(true)} />

      <View style={styles.body}>{content}</View>

      {!drawerOpen ? <View style={styles.edgeSwipeZone} {...edgePanResponder.panHandlers} /> : null}

      <BottomTabBar activeScreen={tabBarActiveScreen} onChange={(tab) => navigate(tab)} onAddPress={() => navigate('addOffer')} />

      <SideDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={(next) => {
          if (next === 'profile' || next === 'settings' || next === 'favorites') {
            pushScreen(next);
            return;
          }
          navigate(next);
        }}
      />

      <AuthGateModal
        visible={authGateOpen}
        onClose={() => {
          setAuthGateOpen(false);
          setPendingScreen(null);
        }}
        onLogin={() => {
          setAuthGateOpen(false);
          pushScreen('login');
        }}
        onRegister={() => {
          setAuthGateOpen(false);
          pushScreen('register');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  body: {
    flex: 1
  },
  edgeSwipeZone: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: edgeSwipeWidth,
    zIndex: 5
  }
});

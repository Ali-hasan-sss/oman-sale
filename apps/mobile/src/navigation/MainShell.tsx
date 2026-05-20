import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, PanResponder, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenInsetsProvider } from '../context/screen-insets-context';

import { AppHeader } from '../components/AppHeader';
import { ScreenTransition, type ScreenTransitionKind } from '../components/ScreenTransition';
import { AuthGateModal } from '../components/AuthGateModal';
import { BottomTabBar } from '../components/BottomTabBar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { NetworkStatusBar } from '../components/NetworkStatusBar';
import { SideDrawer } from '../components/SideDrawer';
import { connectChatRealtime, disconnectChatRealtime, useAuthStore, useChatStore } from '../stores';
import { useI18n } from '../i18n';
import { AddOfferScreen } from '../screens/AddOfferScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { ChatConversationScreen } from '../screens/ChatConversationScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MyOffersScreen } from '../screens/MyOffersScreen';
import { CategoryOffersScreen } from '../screens/CategoryOffersScreen';
import { OffersScreen } from '../screens/OffersScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ListingDetailScreen } from '../screens/ListingDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import type { ScreenName } from '../types';
import { colors } from '../theme';

const tabScreens: ScreenName[] = ['home', 'offers', 'myOffers', 'chat'];
const protectedScreens: ScreenName[] = ['myOffers', 'chat', 'addOffer'];
const edgeSwipeWidth = 40;
const openSwipeThreshold = 56;
/** Chat: exclude header, ad card, and composer from the drawer edge-swipe hit area */
const chatEdgeSwipeTopInset = 230;
const chatEdgeSwipeBottomInset = 100;

type TabKey = (typeof tabScreens)[number];

export function MainShell() {
  const { t, isRtl } = useI18n();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);
  const chatUnreadCount = useChatStore((state) => state.unreadCount);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [screen, setScreen] = useState<ScreenName>('home');
  const [lastTab, setLastTab] = useState<TabKey>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [pendingScreen, setPendingScreen] = useState<ScreenName | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [navTransition, setNavTransition] = useState<ScreenTransitionKind>('tab');
  const drawerOpenRef = useRef(drawerOpen);
  const screenHistoryRef = useRef<ScreenName[]>(['home']);
  drawerOpenRef.current = drawerOpen;

  const pushScreen = (next: ScreenName) => {
    if (next === screen) return;
    setNavTransition('push');
    screenHistoryRef.current = [...screenHistoryRef.current, next];
    setScreen(next);
  };

  const resetToTab = (next: TabKey) => {
    setLastTab(next);
    setNavTransition('tab');
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

  const openListingDetail = (listingId: string) => {
    if (screen === 'listingDetail' && selectedListingId !== listingId) {
      setNavTransition('push');
    }
    setSelectedListingId(listingId);
    if (screen !== 'listingDetail') {
      pushScreen('listingDetail');
    }
  };

  const openChatConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    if (screen !== 'chatConversation') {
      pushScreen('chatConversation');
    }
  };

  const openCategoryOffers = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    if (screen !== 'categoryOffers') {
      pushScreen('categoryOffers');
    }
  };

  const goBack = () => {
    if (screenHistoryRef.current.length <= 1) return false;
    setNavTransition('pop');
    const previous = screenHistoryRef.current.slice(0, -1);
    screenHistoryRef.current = previous;
    const target = previous[previous.length - 1] ?? 'home';
    setScreen(target);
    if (target !== 'listingDetail') setSelectedListingId(null);
    if (target !== 'chatConversation') setSelectedConversationId(null);
    if (target !== 'categoryOffers') setSelectedCategoryId(null);
    if (tabScreens.includes(target)) setLastTab(target as TabKey);
    return true;
  };

  const handleAuthSuccess = () => {
    const next = pendingScreen ?? lastTab;
    if (tabScreens.includes(next)) {
      resetToTab(next as TabKey);
    } else {
      setNavTransition('push');
      screenHistoryRef.current = [...screenHistoryRef.current.slice(0, -1), next];
      setScreen(next);
    }
    setPendingScreen(null);
    setAuthGateOpen(false);
  };

  useEffect(() => {
    if (accessToken) {
      connectChatRealtime();
    } else {
      disconnectChatRealtime();
    }
  }, [accessToken]);

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
  const isChatConversation = screen === 'chatConversation';
  const hideTabBar = isChatConversation;
  const isCategoryOffers = screen === 'categoryOffers';
  const showHeaderBack = screen === 'listingDetail' || isCategoryOffers;

  const content = useMemo(() => {
    switch (screen) {
      case 'home':
        return (
          <HomeScreen
            onBrowseOffers={() => navigate('offers')}
            onListingPress={openListingDetail}
            onCategoryPress={openCategoryOffers}
          />
        );
      case 'categoryOffers':
        return selectedCategoryId ? (
          <CategoryOffersScreen
            key={selectedCategoryId}
            categoryId={selectedCategoryId}
            onListingPress={openListingDetail}
          />
        ) : (
          <HomeScreen
            onBrowseOffers={() => navigate('offers')}
            onListingPress={openListingDetail}
            onCategoryPress={openCategoryOffers}
          />
        );
      case 'offers':
        return <OffersScreen onListingPress={openListingDetail} />;
      case 'myOffers':
        return <MyOffersScreen onListingPress={openListingDetail} />;
      case 'chat':
        return <ChatScreen onConversationPress={openChatConversation} />;
      case 'chatConversation':
        return selectedConversationId ? (
          <ChatConversationScreen
            conversationId={selectedConversationId}
            onBack={goBack}
            onOpenListing={openListingDetail}
          />
        ) : (
          <ChatScreen onConversationPress={openChatConversation} />
        );
      case 'addOffer':
        return <AddOfferScreen onPublished={() => resetToTab('myOffers')} />;
      case 'login':
        return (
          <AuthScreen
            mode="login"
            onSwitchMode={() => {
              setNavTransition('push');
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
              setNavTransition('push');
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
        return <FavoritesScreen onListingPress={openListingDetail} />;
      case 'listingDetail':
        return selectedListingId ? (
          <ListingDetailScreen
            listingId={selectedListingId}
            onBack={goBack}
            onLoginRequired={() => {
              setPendingScreen('listingDetail');
              setAuthGateOpen(true);
            }}
            onOpenListing={openListingDetail}
            onOpenChat={openChatConversation}
          />
        ) : (
          <HomeScreen
            onBrowseOffers={() => navigate('offers')}
            onListingPress={openListingDetail}
            onCategoryPress={openCategoryOffers}
          />
        );
      default:
        return (
          <HomeScreen
            onBrowseOffers={() => navigate('offers')}
            onListingPress={openListingDetail}
            onCategoryPress={openCategoryOffers}
          />
        );
    }
  }, [screen, user, selectedListingId, selectedConversationId, selectedCategoryId]);

  const handleLogoutConfirm = () => {
    setLogoutConfirmOpen(false);
    void logout();
    resetToTab('home');
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <NetworkStatusBar />
        <AppHeader onMenuPress={() => setDrawerOpen(true)} showBack={showHeaderBack} onBackPress={goBack} />

        <ScreenInsetsProvider withTabBar={!hideTabBar}>
          <View style={styles.body}>
            <ScreenTransition
              screenKey={`${screen}-${selectedListingId ?? ''}-${selectedConversationId ?? ''}-${selectedCategoryId ?? ''}`}
              transition={navTransition}
              isRtl={isRtl}
            >
              {content}
            </ScreenTransition>
          </View>
        </ScreenInsetsProvider>

        {!drawerOpen ? (
          <View
            style={[styles.edgeSwipeZone, isChatConversation && styles.edgeSwipeZoneChat]}
            pointerEvents="box-only"
            {...edgePanResponder.panHandlers}
          />
        ) : null}

        {!hideTabBar ? (
          <BottomTabBar
            activeScreen={tabBarActiveScreen}
            onChange={(tab) => navigate(tab)}
            onAddPress={() => navigate('addOffer')}
            chatUnreadCount={chatUnreadCount}
          />
        ) : null}

        <ConfirmDialog
          visible={logoutConfirmOpen}
          title={t.common.logoutConfirmTitle}
          message={t.common.logoutConfirmMessage}
          confirmLabel={t.common.logout}
          cancelLabel={t.common.cancel}
          onConfirm={handleLogoutConfirm}
          onCancel={() => setLogoutConfirmOpen(false)}
          destructive
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

      <SideDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogoutRequest={() => setLogoutConfirmOpen(true)}
        onNavigate={(next) => {
          if (next === 'profile' || next === 'settings' || next === 'favorites') {
            pushScreen(next);
            return;
          }
          navigate(next);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
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
  },
  edgeSwipeZoneChat: {
    top: chatEdgeSwipeTopInset,
    bottom: chatEdgeSwipeBottomInset
  }
});

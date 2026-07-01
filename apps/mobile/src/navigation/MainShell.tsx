import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Keyboard,
  type KeyboardEvent,
  PanResponder,
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenInsetsProvider } from '../context/screen-insets-context';

import { AppHeader } from '../components/AppHeader';
import { ChatThreadBar } from '../components/ChatThreadBar';
import { ScreenTransition, type ScreenTransitionKind } from '../components/ScreenTransition';
import { AuthGateModal } from '../components/AuthGateModal';
import { BottomTabBar } from '../components/BottomTabBar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { NetworkStatusBar } from '../components/NetworkStatusBar';
import { SideDrawer } from '../components/SideDrawer';
import { AssistantChatWidget } from '../components/assistant/AssistantChatWidget';
import { connectChatRealtime, connectNotificationsRealtime, disconnectChatRealtime, useAuthStore, useChatStore, useNotificationsStore } from '../stores';
import { registerMobilePushToken } from '../lib/push-registration';
import { useI18n } from '../i18n';
import { AddOfferScreen } from '../screens/AddOfferScreen';
import { AddStoreScreen } from '../screens/AddStoreScreen';
import { MyStoreScreen } from '../screens/MyStoreScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { CompleteProfileScreen } from '../screens/CompleteProfileScreen';
import { ChatConversationScreen } from '../screens/ChatConversationScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { GlobalSearchScreen } from '../screens/GlobalSearchScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MyOffersScreen } from '../screens/MyOffersScreen';
import { CategoryOffersScreen } from '../screens/CategoryOffersScreen';
import { OffersScreen } from '../screens/OffersScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LegalScreen } from '../screens/LegalScreen';
import { ListingDetailScreen } from '../screens/ListingDetailScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { NewsScreen } from '../screens/NewsScreen';
import { ArticleDetailScreen } from '../screens/ArticleDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { StoreDetailScreen } from '../screens/StoreDetailScreen';
import { StoresBrowseScreen } from '../screens/StoresBrowseScreen';
import type { ScreenName } from '../types';
import { CHAT_THREAD_BAR_BODY_HEIGHT } from '../constants/chat-layout';
import { colors } from '../theme';

const tabScreens: ScreenName[] = ['home', 'offers', 'myOffers', 'chat'];
const protectedScreens: ScreenName[] = ['myOffers', 'chat', 'addOffer', 'addStore', 'myStore', 'notifications'];
const edgeSwipeWidth = 40;
const openSwipeThreshold = 56;
const chatEdgeSwipeBottomInset = 100;

type TabKey = (typeof tabScreens)[number];

export function MainShell() {
  const { t, isRtl } = useI18n();
  const safeInsets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const logout = useAuthStore((state) => state.logout);
  const chatUnreadCount = useChatStore((state) => state.unreadCount);
  const notificationUnreadCount = useNotificationsStore((state) => state.unreadCount);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [screen, setScreen] = useState<ScreenName>('home');
  const [lastTab, setLastTab] = useState<TabKey>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [pendingScreen, setPendingScreen] = useState<ScreenName | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedStoreSlug, setSelectedStoreSlug] = useState<string | null>(null);
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(null);
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
    if (needsProfileCompletion && next !== 'completeProfile' && next !== 'login' && next !== 'register') {
      setPendingScreen(next);
      pushScreen('completeProfile');
      return;
    }

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

  const openArticleDetail = (slug: string) => {
    setSelectedArticleSlug(slug);
    if (screen !== 'articleDetail') {
      pushScreen('articleDetail');
    }
  };

  const openStoreDetail = (slug: string) => {
    if (screen === 'storeDetail' && selectedStoreSlug !== slug) {
      setNavTransition('push');
    }
    setSelectedStoreSlug(slug);
    if (screen !== 'storeDetail') {
      pushScreen('storeDetail');
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
    if (target !== 'storeDetail') setSelectedStoreSlug(null);
    if (tabScreens.includes(target)) setLastTab(target as TabKey);
    return true;
  };

  const handleAuthSuccess = (options?: { profileCompleted?: boolean }) => {
    if (options?.profileCompleted === false) {
      pushScreen('completeProfile');
      return;
    }

    const next = pendingScreen ?? 'home';
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

  const needsProfileCompletion = Boolean(user && user.profileCompleted === false);

  useEffect(() => {
    if (!isHydrated || !accessToken || !user) return;
    if (user.profileCompleted === false && screen !== 'completeProfile' && screen !== 'login' && screen !== 'register') {
      pushScreen('completeProfile');
    }
  }, [accessToken, isHydrated, screen, user?.profileCompleted]);

  useEffect(() => {
    if (accessToken) {
      connectChatRealtime();
      connectNotificationsRealtime();
      void registerMobilePushToken();
    } else {
      disconnectChatRealtime();
    }
  }, [accessToken]);

  useEffect(() => {
    if (screen === 'notifications' && accessToken) {
      void useNotificationsStore.getState().refresh();
    }
  }, [screen, accessToken]);

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
  const hideTabBar = isChatConversation || screen === 'articleDetail' || screen === 'completeProfile';
  const hideAppHeader = isChatConversation;
  const hideAssistant =
    isChatConversation || screen === 'login' || screen === 'register' || screen === 'completeProfile';
  const chatEdgeSwipeTopInset = safeInsets.top + CHAT_THREAD_BAR_BODY_HEIGHT;
  const [tabBarKeyboardOffset, setTabBarKeyboardOffset] = useState(0);
  const isCategoryOffers = screen === 'categoryOffers';
  const showHeaderBack =
    screen === 'listingDetail' ||
    isCategoryOffers ||
    screen === 'myStore' ||
    screen === 'addStore' ||
    screen === 'profile' ||
    screen === 'settings' ||
    screen === 'notifications' ||
    screen === 'news' ||
    screen === 'articleDetail' ||
    screen === 'terms' ||
    screen === 'privacy' ||
    screen === 'favorites' ||
    screen === 'storesBrowse' ||
    screen === 'storeDetail' ||
    screen === 'search';

  const showHeaderSearch = !showHeaderBack;

  const homeScreenProps = {
    onBrowseOffers: () => navigate('offers'),
    onListingPress: openListingDetail,
    onCategoryPress: openCategoryOffers,
    onBrowseStores: () => pushScreen('storesBrowse'),
    onStorePress: openStoreDetail
  };

  const content = useMemo(() => {
    switch (screen) {
      case 'home':
        return <HomeScreen {...homeScreenProps} />;
      case 'categoryOffers':
        return selectedCategoryId ? (
          <CategoryOffersScreen
            key={selectedCategoryId}
            categoryId={selectedCategoryId}
            onListingPress={openListingDetail}
          />
        ) : (
          <HomeScreen {...homeScreenProps} />
        );
      case 'storesBrowse':
        return <StoresBrowseScreen onStorePress={openStoreDetail} />;
      case 'storeDetail':
        return selectedStoreSlug ? (
          <StoreDetailScreen slug={selectedStoreSlug} onListingPress={openListingDetail} />
        ) : (
          <StoresBrowseScreen onStorePress={openStoreDetail} />
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
      case 'addStore':
        return <AddStoreScreen onCreated={() => pushScreen('myStore')} onAlreadyHasStore={() => pushScreen('myStore')} />;
      case 'myStore':
        return (
          <MyStoreScreen
            onCreateStore={() => pushScreen('addStore')}
            onOpenListing={openListingDetail}
          />
        );
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
      case 'completeProfile':
        return (
          <CompleteProfileScreen
            onSuccess={() => handleAuthSuccess({ profileCompleted: true })}
            onNeedsLogin={() => pushScreen('login')}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            onLogin={() => pushScreen('login')}
            onManageStore={() => pushScreen('myStore')}
            onCreateStore={() => pushScreen('addStore')}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            onOpenTerms={() => pushScreen('terms')}
            onOpenPrivacy={() => pushScreen('privacy')}
          />
        );
      case 'terms':
        return <LegalScreen kind="terms" />;
      case 'privacy':
        return <LegalScreen kind="privacy" />;
      case 'notifications':
        return <NotificationsScreen />;
      case 'news':
        return <NewsScreen onOpenArticle={openArticleDetail} />;
      case 'articleDetail':
        return selectedArticleSlug ? (
          <ArticleDetailScreen
            slug={selectedArticleSlug}
            onLoginRequired={() => {
              setPendingScreen('articleDetail');
              setAuthGateOpen(true);
            }}
          />
        ) : (
          <NewsScreen onOpenArticle={openArticleDetail} />
        );
      case 'favorites':
        return <FavoritesScreen onListingPress={openListingDetail} />;
      case 'search':
        return (
          <GlobalSearchScreen
            onListingPress={openListingDetail}
            onStorePress={openStoreDetail}
            onCategoryPress={openCategoryOffers}
            onBrowseOffers={() => pushScreen('offers')}
            onBrowseStores={() => pushScreen('storesBrowse')}
          />
        );
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
            onOpenStore={openStoreDetail}
          />
        ) : (
          <HomeScreen {...homeScreenProps} />
        );
      default:
        return <HomeScreen {...homeScreenProps} />;
    }
  }, [screen, user, selectedListingId, selectedConversationId, selectedCategoryId, selectedStoreSlug]);

  const handleLogoutConfirm = () => {
    setLogoutConfirmOpen(false);
    void logout();
    resetToTab('home');
  };

  useEffect(() => {
    if (hideTabBar) {
      setTabBarKeyboardOffset(0);
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (event: KeyboardEvent) => {
      setTabBarKeyboardOffset(event.endCoordinates.height);
    };
    const onHide = () => setTabBarKeyboardOffset(0);

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
      setTabBarKeyboardOffset(0);
    };
  }, [hideTabBar]);

  useEffect(() => {
    if (!isChatConversation) return;
    if (Platform.OS === 'android') {
      RNStatusBar.setBackgroundColor(colors.surface);
      RNStatusBar.setBarStyle('dark-content');
    }
    return () => {
      if (Platform.OS === 'android') {
        RNStatusBar.setBackgroundColor(colors.background);
        RNStatusBar.setBarStyle('dark-content');
      }
    };
  }, [isChatConversation]);

  return (
    <View style={styles.root}>
      <SafeAreaView
        style={styles.safe}
        edges={isChatConversation ? ['left', 'right'] : ['top', 'left', 'right']}
      >
        <StatusBar
          style="dark"
          backgroundColor={isChatConversation ? colors.surface : colors.background}
        />
        <NetworkStatusBar />
        {!hideAppHeader ? (
          <AppHeader
            onMenuPress={() => setDrawerOpen(true)}
            showBack={showHeaderBack}
            onBackPress={goBack}
            onSearchPress={showHeaderSearch ? () => pushScreen('search') : undefined}
            onNotificationsPress={user ? () => navigate('notifications') : undefined}
            notificationUnreadCount={notificationUnreadCount}
          />
        ) : null}

        <ScreenInsetsProvider withTabBar={!hideTabBar}>
          {isChatConversation ? (
            <View style={styles.chatStage}>
              <View style={styles.body}>
                <ScreenTransition
                  screenKey={`${screen}-${selectedListingId ?? ''}-${selectedConversationId ?? ''}-${selectedCategoryId ?? ''}-${selectedStoreSlug ?? ''}-${selectedArticleSlug ?? ''}`}
                  transition={navTransition}
                  isRtl={isRtl}
                >
                  {content}
                </ScreenTransition>
              </View>
              <ChatThreadBar onBack={goBack} />
            </View>
          ) : (
            <View style={styles.body}>
              <ScreenTransition
                screenKey={`${screen}-${selectedListingId ?? ''}-${selectedConversationId ?? ''}-${selectedCategoryId ?? ''}-${selectedStoreSlug ?? ''}-${selectedArticleSlug ?? ''}`}
                transition={navTransition}
                isRtl={isRtl}
              >
                {content}
              </ScreenTransition>
            </View>
          )}
        </ScreenInsetsProvider>

        {!drawerOpen ? (
          <View
            style={[
              styles.edgeSwipeZone,
              isChatConversation && [styles.edgeSwipeZoneChat, { top: chatEdgeSwipeTopInset }]
            ]}
            pointerEvents="box-none"
          >
            <View
              style={[styles.edgeSwipeHandle, isChatConversation && styles.edgeSwipeHandleChat]}
              {...edgePanResponder.panHandlers}
            />
          </View>
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

      {!hideTabBar ? (
        <View
          style={[
            styles.tabBarDock,
            tabBarKeyboardOffset > 0 && { transform: [{ translateY: tabBarKeyboardOffset }] }
          ]}
        >
          <BottomTabBar
            activeScreen={tabBarActiveScreen}
            onChange={(tab) => navigate(tab)}
            onAddPress={() => navigate('addOffer')}
            chatUnreadCount={chatUnreadCount}
          />
        </View>
      ) : null}

      <SideDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogoutRequest={() => setLogoutConfirmOpen(true)}
        onNavigate={(next) => {
          if (
            next === 'profile' ||
            next === 'settings' ||
            next === 'favorites' ||
            next === 'storesBrowse' ||
            next === 'terms' ||
            next === 'privacy'
          ) {
            pushScreen(next);
            return;
          }
          navigate(next);
        }}
      />

      <AssistantChatWidget
        hidden={hideAssistant}
        onListingPress={openListingDetail}
        onStorePress={openStoreDetail}
        onNavigate={navigate}
        onLogin={() => pushScreen('login')}
        onRegister={() => pushScreen('register')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: colors.background
  },
  safe: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: colors.background
  },
  body: {
    flex: 1,
    width: '100%',
    overflow: 'hidden'
  },
  chatStage: {
    flex: 1,
    position: 'relative'
  },
  tabBarDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    elevation: 40
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
    bottom: chatEdgeSwipeBottomInset
  },
  edgeSwipeHandle: {
    flex: 1,
    width: '100%'
  },
  /** Chat: swipe handle only in the upper strip — composer/send stay touchable below */
  edgeSwipeHandleChat: {
    flex: 0,
    height: 72
  }
});

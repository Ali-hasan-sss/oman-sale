import { Linking } from 'react-native';

import { getWebsiteOrigin, openExternalWebPage } from './open-external-web';
import type { ScreenName } from '../types';

function openWebPath(href: string) {
  const url = href.startsWith('http') ? href : `${getWebsiteOrigin()}${href.startsWith('/') ? href : `/${href}`}`;
  void openExternalWebPage(url);
}

export function handleAssistantAction(
  href: string,
  handlers: {
    onListingPress: (id: string) => void;
    onStorePress: (slug: string) => void;
    onArticlePress: (slug: string) => void;
    onNavigate: (screen: ScreenName) => void;
    onLogin: () => void;
    onRegister: () => void;
    onClose: () => void;
  }
) {
  if (href.startsWith('mailto:') || href.startsWith('tel:')) {
    void Linking.openURL(href);
    return;
  }
  if (href.startsWith('http')) {
    void openExternalWebPage(href);
    return;
  }

  const path = href.replace(/^\/(ar|en)/, '') || '/';

  const listingMatch = path.match(/^\/listing\/([^/?#]+)/);
  if (listingMatch?.[1]) {
    handlers.onClose();
    handlers.onListingPress(listingMatch[1]);
    return;
  }

  const storeMatch = path.match(/^\/stores\/([^/?#]+)/);
  if (storeMatch?.[1] && storeMatch[1] !== 'create') {
    handlers.onClose();
    handlers.onStorePress(storeMatch[1]);
    return;
  }

  const newsMatch = path.match(/^\/news\/([^/?#]+)/);
  if (newsMatch?.[1]) {
    handlers.onClose();
    handlers.onArticlePress(newsMatch[1]);
    return;
  }

  if (path.startsWith('/banner-ad') || path.startsWith('/tourism') || path.startsWith('/destination')) {
    openWebPath(href);
    handlers.onClose();
    return;
  }

  handlers.onClose();

  if (path.startsWith('/stores/create')) {
    handlers.onNavigate('addStore');
    return;
  }
  if (path.startsWith('/stores')) {
    handlers.onNavigate('storesBrowse');
    return;
  }
  if (path.startsWith('/my-listings')) {
    handlers.onNavigate('myOffers');
    return;
  }
  if (path.startsWith('/add-listing')) {
    handlers.onNavigate('addOffer');
    return;
  }
  if (path.startsWith('/favorites')) {
    handlers.onNavigate('favorites');
    return;
  }
  if (path.startsWith('/chats')) {
    handlers.onNavigate('chat');
    return;
  }
  if (path.startsWith('/news')) {
    handlers.onNavigate('news');
    return;
  }
  if (path.startsWith('/login')) {
    handlers.onLogin();
    return;
  }
  if (path.startsWith('/register')) {
    handlers.onRegister();
    return;
  }
  if (path.startsWith('/all-listings') || path.startsWith('/category') || path.startsWith('/search')) {
    handlers.onNavigate('offers');
  }
}

import { Linking } from 'react-native';

import type { ScreenName } from '../types';

export function handleAssistantAction(
  href: string,
  handlers: {
    onListingPress: (id: string) => void;
    onStorePress: (slug: string) => void;
    onNavigate: (screen: ScreenName) => void;
    onLogin: () => void;
    onRegister: () => void;
    onClose: () => void;
  }
) {
  if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('http')) {
    void Linking.openURL(href);
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

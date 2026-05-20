import * as SplashScreen from 'expo-splash-screen';
import { PropsWithChildren, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAppFonts } from './fonts';
import { I18nProvider } from './i18n';
import { MainShell } from './navigation/MainShell';
import { bindAuthStoreToApi, useAuthStore } from './stores';

function FontReadyGate({ children }: PropsWithChildren) {
  const [loaded, error] = useAppFonts();
  const hydrate = useAuthStore((state) => state.hydrate);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    bindAuthStoreToApi();
    hydrate().catch(() => undefined);
  }, [hydrate]);

  useEffect(() => {
    if ((loaded || error) && isHydrated) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loaded, error, isHydrated]);

  if ((!loaded && !error) || !isHydrated) {
    return null;
  }

  return children;
}

export function AppRoot() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <FontReadyGate>
          <MainShell />
        </FontReadyGate>
      </I18nProvider>
    </SafeAreaProvider>
  );
}

import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

import { AppRoot } from './src/AppRoot';

export default AppRoot;

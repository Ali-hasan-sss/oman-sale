import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function getAppName() {
  return Constants.expoConfig?.name ?? 'Oman Sale';
}

export function getAppVersionLabel() {
  const version = Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '0.0.0';

  if (Platform.OS === 'android') {
    const versionCode = Constants.expoConfig?.android?.versionCode;
    if (versionCode) {
      return `v${version} (${versionCode})`;
    }
  }

  return `v${version}`;
}

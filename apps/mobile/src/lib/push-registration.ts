import { Platform } from 'react-native';

import { registerPushToken } from '../services/notifications.service';

export async function registerMobilePushToken() {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;

  try {
    const Device = await import('expo-device');
    const Notifications = await import('expo-notifications');

    if (!Device.isDevice) return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const tokenResult = await Notifications.getDevicePushTokenAsync();
    const token = typeof tokenResult.data === 'string' ? tokenResult.data : tokenResult.data?.token;
    if (!token) return;

    await registerPushToken(token, Platform.OS === 'ios' ? 'IOS' : 'ANDROID');
  } catch (error) {
    console.warn('[push] registration skipped', error);
  }
}

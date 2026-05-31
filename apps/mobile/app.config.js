/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');

const productionApiUrl = 'https://omansale.om/api/v1';

module.exports = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || productionApiUrl;

  return {
    ...appJson,
    expo: {
      ...appJson.expo,
      extra: {
        ...appJson.expo.extra,
        apiUrl,
        eas: {
          projectId:
            process.env.EAS_PROJECT_ID ?? appJson.expo.extra?.eas?.projectId ?? 'e2a334ce-c188-4368-b610-78cb4b24ccc1'
        }
      },
      android: {
        ...appJson.expo.android,
        softwareKeyboardLayoutMode: 'resize',
        versionCode: Number(process.env.ANDROID_VERSION_CODE) || 2,
        usesCleartextTraffic: false,
        permissions: ['INTERNET', 'ACCESS_NETWORK_STATE']
      },
      plugins: [
        'expo-asset',
        'expo-font',
        'expo-av',
        'expo-android-keyboard-fix',
        [
          'expo-build-properties',
          {
            android: {
              usesCleartextTraffic: false,
              // Android 7.0+ (API 24), includes Android 12 (API 31).
              minSdkVersion: 24,
              compileSdkVersion: 35,
              // 34: broader sideload compatibility; use 35 for Play Store later.
              targetSdkVersion: 34,
              softwareKeyboardLayoutMode: 'resize',
              // Helps native libs install on older devices (arm32/arm64/x86).
              useLegacyPackaging: true
            }
          }
        ]
      ]
    }
  };
};

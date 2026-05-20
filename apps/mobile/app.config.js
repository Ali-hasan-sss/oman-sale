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
        versionCode: Number(process.env.ANDROID_VERSION_CODE) || 1,
        usesCleartextTraffic: false,
        permissions: ['INTERNET', 'ACCESS_NETWORK_STATE']
      },
      plugins: [
        'expo-font',
        'expo-av',
        [
          'expo-build-properties',
          {
            android: {
              usesCleartextTraffic: false,
              compileSdkVersion: 35,
              targetSdkVersion: 35
            }
          }
        ]
      ]
    }
  };
};

/** @type {import('expo/config').ExpoConfig} */
const fs = require('fs');
const path = require('path');

const appJson = require('./app.json');

// Single source of truth for app version + Android versionCode. Auto-incremented
// by scripts/bump-version.js before every local build.
let versionInfo = { version: appJson.expo.version, versionCode: appJson.expo.android?.versionCode || 1 };
try {
  versionInfo = require('./version.json');
} catch {
  // Fall back to app.json values when version.json is absent.
}

const productionApiUrl = 'https://omansale.om/api/v1';

// Android FCM (push) requires a google-services.json from the same Firebase
// project the API uses. Resolve it from GOOGLE_SERVICES_JSON or the app root.
const googleServicesPath =
  process.env.GOOGLE_SERVICES_JSON?.trim() || path.resolve(__dirname, 'google-services.json');
const hasGoogleServices = fs.existsSync(googleServicesPath);

// iOS Firebase / Google Sign-In — GoogleService-Info.plist from Firebase Console.
const googleServicesInfoPath =
  process.env.GOOGLE_SERVICES_INFO_PLIST?.trim() || path.resolve(__dirname, 'GoogleService-Info.plist');
const hasGoogleServicesInfo = fs.existsSync(googleServicesInfoPath);

function readReversedClientId(plistPath) {
  try {
    const plist = fs.readFileSync(plistPath, 'utf8');
    const match = plist.match(/<key>REVERSED_CLIENT_ID<\/key>\s*<string>([^<]+)<\/string>/);
    return match?.[1]?.trim() || null;
  } catch {
    return null;
  }
}

const iosUrlScheme = hasGoogleServicesInfo ? readReversedClientId(googleServicesInfoPath) : null;

module.exports = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || productionApiUrl;

  return {
    ...appJson,
    expo: {
      ...appJson.expo,
      version: versionInfo.version || appJson.expo.version,
      extra: {
        ...appJson.expo.extra,
        apiUrl,
        firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
        googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        eas: {
          projectId:
            process.env.EAS_PROJECT_ID ?? appJson.expo.extra?.eas?.projectId ?? 'e2a334ce-c188-4368-b610-78cb4b24ccc1'
        }
      },
      android: {
        ...appJson.expo.android,
        softwareKeyboardLayoutMode: 'pan',
        versionCode: Number(process.env.ANDROID_VERSION_CODE) || versionInfo.versionCode || 3,
        usesCleartextTraffic: false,
        permissions: ['INTERNET', 'ACCESS_NETWORK_STATE', 'POST_NOTIFICATIONS'],
        ...(hasGoogleServices ? { googleServicesFile: googleServicesPath } : {})
      },
      ios: {
        ...appJson.expo.ios,
        infoPlist: {
          ...(appJson.expo.ios?.infoPlist ?? {}),
          ITSAppUsesNonExemptEncryption: false
        },
        ...(hasGoogleServicesInfo ? { googleServicesFile: './GoogleService-Info.plist' } : {})
      },
      plugins: [
        'expo-asset',
        'expo-font',
        'expo-av',
        iosUrlScheme
          ? ['@react-native-google-signin/google-signin', { iosUrlScheme }]
          : '@react-native-google-signin/google-signin',
        [
          'expo-notifications',
          {
            color: '#0f9f67'
          }
        ],
        [
          'expo-build-properties',
          {
            android: {
              usesCleartextTraffic: false,
              // Android 7.0+ (API 24). Google Play requires targetSdk 36 for new uploads.
              minSdkVersion: 24,
              compileSdkVersion: 36,
              targetSdkVersion: 36,
              buildToolsVersion: '36.0.0',
              newArchEnabled: true,
              softwareKeyboardLayoutMode: 'pan',
              // Helps native libs install on older devices (arm32/arm64/x86).
              useLegacyPackaging: true
            },
            // Google Sign-In pulls AppCheckCore 11.3+, which fails Expo's static
            // CocoaPods install unless these pods generate module maps.
            ios: {
              extraPods: [
                { name: 'AppCheckCore', version: '11.2.0' },
                { name: 'GoogleUtilities', modular_headers: true },
                { name: 'RecaptchaInterop', modular_headers: true }
              ]
            }
          }
        ]
      ]
    }
  };
};

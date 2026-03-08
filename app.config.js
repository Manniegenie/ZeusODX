// app.config.js
export default {
  expo: {
    name: "ZeusODX",
    slug: "zeusodx",
    version: "1.5.0",
    orientation: "default",
    icon: "./assets/images/app-icon.png",
    scheme: "zeusodx",
    userInterfaceStyle: "automatic",
    splash: {
      backgroundColor: "#35297F"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.manniegenie.zeusodx",
      buildNumber: "2",
      icon: "./assets/images/app-icon.png",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: "ZeusODX uses the camera to capture video for identity verification and biometric authentication.",
        NSMicrophoneUsageDescription: "ZeusODX uses the microphone to record audio during the video identity confirmation process to verify that you are a real person.",
        NSFaceIDUsageDescription: "ZeusODX uses Face ID to allow you to securely log in to your account without typing your password.",
        NSPhotoLibraryUsageDescription: "ZeusODX requires access to your photo library to allow you to upload identity documents or proof of transaction images.",
        NSUserTrackingUsageDescription: "ZeusODX uses data to measure app performance and improve your experience. No personal financial data is shared with advertisers.",
        UIBackgroundModes: ["remote-notification"]
      }
    },
    android: {
      package: "com.manniegenie.zeusodx",
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/images/app-icon.png",
        backgroundColor: "#35297F"
      },
      edgeToEdgeEnabled: true,
      softwareKeyboardLayoutMode: "pan",
      allowBackup: false,
      permissions: [
        "INTERNET",
        "CAMERA",
        "ACCESS_NETWORK_STATE",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "WAKE_LOCK",
        "RECORD_AUDIO",
        "com.google.android.c2dm.permission.RECEIVE",
        "android.permission.POST_NOTIFICATIONS",
        "com.google.android.gms.permission.AD_ID"
      ],
      versionCode: 147
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/app-icon.png"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-secure-store",
      "react-native-appsflyer",
      "expo-tracking-transparency",
      "./plugins/withAndroidManifestFix.js",
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 35,
            "targetSdkVersion": 35,
            "minSdkVersion": 24,
            "resizeableActivity": true,
            "supportsTablet": true,
            "enableProguardInReleaseBuilds": false,
            "enableShrinkResourcesInReleaseBuilds": false,
            "enableR8": false,
            "enableHermes": true,
            "enableNewArchitecture": false,
            "ndkVersion": "28.0.12433564"
          },
          "ios": {
            "deploymentTarget": "15.1",
            "useFrameworks": "static", // CRITICAL: Required for Firebase
            "extraPods": [
              { "name": "GoogleUtilities", "modular_headers": true },
              { "name": "FirebaseCoreInternal", "modular_headers": true }
            ]
          }
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/images/app-icon.png",
          "color": "#35297F",
          "sounds": [],
          "mode": "production"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "a075e816-5194-4302-a228-e6f53ad53f92"
      },
      // Apple App Store ID - required for iOS store review prompts
      // Find your App ID in App Store Connect or use: https://apps.apple.com/app/id<YOUR_APP_ID>
      appleAppId: process.env.EXPO_PUBLIC_APPLE_APP_ID || ""
    },
    owner: "manniegenie",
    runtimeVersion: {
      policy: "appVersion"
    },
    updates: {
      url: "https://u.expo.dev/a075e816-5194-4302-a228-e6f53ad53f92"
    },
    platforms: ["ios", "android", "web"]
  }
};
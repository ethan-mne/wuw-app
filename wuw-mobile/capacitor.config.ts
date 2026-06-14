import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.winuwatch.wuwapp',
  appName: 'Winuwatch',
  webDir: 'dist',
  ios: {
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Winuwatch uses your location while the app is open to show relevant nearby alerts and improve your experience.',
    },
  },
  plugins: {
    SplashScreen: {
      // Auto-hide as fallback so the app never stays stuck on the native icon splash.
      launchAutoHide: true,
      launchShowDuration: 500,
      launchFadeOutDuration: 200,
      backgroundColor: '#1d1b1c',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'banner', 'list'],
    },
    LocalNotifications: {
      iconColor: '#114f33',
    },
  },
};

export default config;

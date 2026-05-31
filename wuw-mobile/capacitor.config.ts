import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.winuwatch.wuwapp',
  appName: 'Winuwatch',
  webDir: 'dist',
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
  },
};

export default config;

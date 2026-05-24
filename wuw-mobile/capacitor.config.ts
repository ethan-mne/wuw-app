import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.winuwatch.wuwapp',
  appName: 'Winuwatch',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#1d1b1c',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'banner', 'list'],
    },
  },
};

export default config;

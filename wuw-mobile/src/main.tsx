import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { Root } from './app/Root';
import './app/styles.css';

if (Capacitor.isNativePlatform()) {
  void SplashScreen.hide().catch(() => undefined);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);

import { BrowserRouter } from 'react-router-dom';

import { AppSplash } from '../components/AppSplash';
import { PushPermissionPrompt } from '../components/PushPermissionPrompt';
import { useAppSplash } from '../hooks/useAppSplash';
import App from './App';

export function Root() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const skipSplash = /\/dashboard\/competitions\/schedule\/?$/.test(pathname);
  const { showSplash, exiting, onVideoEnded } = useAppSplash({ disabled: skipSplash });

  return (
    <>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <PushPermissionPrompt ready={!showSplash} />
      {showSplash ? <AppSplash exiting={exiting} onVideoEnded={onVideoEnded} /> : null}
    </>
  );
}

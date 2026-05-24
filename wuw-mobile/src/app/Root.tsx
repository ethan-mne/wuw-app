import { BrowserRouter } from 'react-router-dom';

import { AppSplash } from '../components/AppSplash';
import { PushPermissionPrompt } from '../components/PushPermissionPrompt';
import { useAppSplash } from '../hooks/useAppSplash';
import App from './App';

export function Root() {
  const { showSplash, exiting, onVideoEnded } = useAppSplash();

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

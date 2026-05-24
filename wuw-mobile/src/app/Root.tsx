import { BrowserRouter } from 'react-router-dom';

import { AppSplash } from '../components/AppSplash';
import { useAppSplash } from '../hooks/useAppSplash';
import App from './App';

export function Root() {
  const { showSplash, exiting } = useAppSplash();

  return (
    <>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      {showSplash ? <AppSplash exiting={exiting} /> : null}
    </>
  );
}

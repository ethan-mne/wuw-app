import winuLogo from '../../assets/logo.png';

type AppSplashProps = {
  exiting?: boolean;
};

export function AppSplash({ exiting = false }: AppSplashProps) {
  return (
    <div
      className={`app-splash${exiting ? ' app-splash--exiting' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Loading Winuwatch"
    >
      <img className="app-splash__logo" src={winuLogo} alt="" width={224} height={224} />
    </div>
  );
}

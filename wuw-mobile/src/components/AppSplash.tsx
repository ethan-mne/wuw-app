import { useEffect, useRef } from 'react';

type AppSplashProps = {
  exiting?: boolean;
  onVideoEnded: () => void;
};

const SPLASH_VIDEO_SRC = '/splash.mp4';

export function AppSplash({ exiting = false, onVideoEnded }: AppSplashProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    void video.play().catch(() => {
      onVideoEnded();
    });
  }, [onVideoEnded]);

  return (
    <div
      className={`app-splash${exiting ? ' app-splash--exiting' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Loading Winuwatch"
    >
      <video
        ref={videoRef}
        className="app-splash__video"
        src={SPLASH_VIDEO_SRC}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={onVideoEnded}
        onError={onVideoEnded}
      />
    </div>
  );
}

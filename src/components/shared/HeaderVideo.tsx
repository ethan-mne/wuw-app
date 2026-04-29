import React from 'react';

export default function HeaderVideo() {
  // check the browser environment
  //  if the brouser is an safari browser on iphone or ipad
  //  use the mov video format
  //  else use the mp4 format
  const supportsVideoFormat = (type: string) => {
    const video = document.createElement('video');
    return (
      video.canPlayType(type) === 'maybe' ||
      video.canPlayType(type) === 'probably'
    );
  };

  const isSafari = () => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('safari') != -1) {
      if (ua.indexOf('chrome') > -1) {
        return false;
      } else {
        return true;
      }
    }
  };
  const videoFormat = supportsVideoFormat('video/mp4')
    ? 'mp4'
    : supportsVideoFormat('video/quicktime')
      ? 'mov'
      : '';
  const videoSrc = `/images/professional-watches-cosmograph-daytona-cover-video_portrait.${videoFormat}`;

  return (
    <video width='100%' height='100%' autoPlay loop playsInline muted={true}>
      <source
        src={
          isSafari()
            ? videoSrc
            : `/images/professional-watches-cosmograph-daytona-cover-video_portrait.mp4`
        }
        type={isSafari() ? 'video/quicktime' : 'video/mp4'}
      />
      Your browser does not support the video tag.
    </video>
  );
}

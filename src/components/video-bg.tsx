export function VideoBackground() {
  return (
    <div className='absolute inset-0 overflow-hidden z-0'>
      {/* <video
        autoPlay
        muted
        loop
        playsInline
        className='absolute inset-0 w-full h-full object-cover object-center'
      >
        <source src='/video/rolex-bg.mp4' type='video/mp4' />
      </video> */}
      <div className='absolute inset-0 bg-black bg-opacity-85 bg-gradient-to-tr from-black z-10'></div>
    </div>
  );
}

import { useEffect, useState, type ImgHTMLAttributes } from 'react';

export type SafeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string | undefined | null;
};

/**
 * Omits network load when `src` is empty. On error, unmounts the img so the browser does not keep a broken URL in the document.
 */
export function SafeImage({
  src,
  alt = '',
  loading = 'lazy',
  decoding = 'async',
  onError,
  ...rest
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const trimmed = typeof src === 'string' ? src.trim() : '';

  useEffect(() => {
    setFailed(false);
  }, [trimmed]);

  if (!trimmed || failed) {
    return null;
  }

  return (
    <img
      {...rest}
      alt={alt}
      decoding={decoding}
      loading={loading}
      src={trimmed}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
    />
  );
}

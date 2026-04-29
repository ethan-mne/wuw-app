'use client';

///?utm_source=Newsletteer&utm_medium=yohan&utm_campaign=INFLUENCE%2Fyohan&utm_id=ID+YOHAN&utm_term=yohan1&utm_content=INFLUENCE1
// http://localhost:3000/?utm_source=Newsletteer&utm_medium=yohan&utm_campaign=INFLUENCE%2Fyohan&utm_id=ID+YOHAN&utm_term=yohan1&utm_content=INFLUENCE1

const getUtmsfromUrl = (url: URL) => {
  const utm: Record<string, string> = {};
  for (const [key, value] of url.searchParams) {
    if (key.startsWith('utm_')) {
      utm[key] = value;
    }
  }
  return utm;
};

export const UtmCookie = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  const url = new URL(window.location.href);
  const utmCookie = getUtmsfromUrl(url);
  // we need to save the utm cookie in the browser
  // so that we can use it later
  if (Object.keys(utmCookie).length > 1) {
    document.cookie = `utm=${JSON.stringify(utmCookie)}; max-age=3600; path=/`;
  }
  return null;
};

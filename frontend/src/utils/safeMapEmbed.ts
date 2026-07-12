// Safe map-iframe builder.
//
// The map embed code is admin-controlled free text (a settings field), but
// it is rendered into every visitor's page via v-html. Echoing the admin's
// raw markup back — even after a regex "match" — is unsafe: a regex like
// /<iframe[^>]*src=...[^>]*>/ still accepts arbitrary attributes such as
// `onload="…"`, so a compromised admin account could inject script that runs
// for every storefront visitor.
//
// Instead of trying to strip dangerous markup, we extract ONLY the src URL,
// validate it against an allowlist of trusted map hosts, and rebuild the
// iframe element from scratch with a fixed, safe attribute set. Nothing the
// admin typed (other than the validated URL) ends up in the DOM.

const ALLOWED_HOSTS = [
  'www.google.com',
  'google.com',
  'maps.google.com',
  'www.google.com.tr',
  'yandex.com',
  'yandex.ru',
  'yandex.com.tr',
];

const isTrustedMapUrl = (rawUrl: string): boolean => {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  // Exact host match from the explicit allowlist.
  if (ALLOWED_HOSTS.includes(host)) {
    // Google embeds live under /maps; Yandex under /map-widget or /maps.
    if (
      host === 'google.com' ||
      host === 'www.google.com' ||
      host === 'maps.google.com' ||
      host === 'www.google.com.tr'
    ) {
      return url.pathname.startsWith('/maps');
    }
    return true;
  }
  return false;
};

/**
 * Given an admin-supplied iframe embed snippet, return a freshly built,
 * safe <iframe> string pointing at the extracted src — or '' if the src is
 * missing or not a trusted map host. Never returns admin-authored markup.
 */
export const buildSafeMapIframe = (raw: string | null | undefined): string => {
  if (!raw) return '';
  const srcMatch = raw.match(/src=["']([^"']+)["']/i);
  if (!srcMatch) return '';
  const src = srcMatch[1];
  if (!isTrustedMapUrl(src)) return '';
  // Rebuild from scratch: only the validated URL is interpolated, and it has
  // already been confirmed to contain no quote characters by the match above.
  return (
    `<iframe src="${src}" width="100%" height="100%" style="border:0" ` +
    'loading="lazy" referrerpolicy="no-referrer-when-downgrade" ' +
    'allowfullscreen></iframe>'
  );
};

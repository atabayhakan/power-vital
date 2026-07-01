// useShareWishlist — build a shareable URL + plain-text body
// for the visitor's favorites. The URL points back to the site
// (root or a dedicated /wishlist page) with a `?w=...` query
// param that the receiving end can decode via hydrateFromUrl().
//
// The product list is encoded with the same scheme the cart
// abandonment service uses: a compact JSON object base64'd. We
// only persist product NAMES + IMAGES + prices (no PII, no
// auth tokens) so the link is safe to share publicly.
//
// We expose the four channels the visitors actually use in this
// market (KG/RU/TR):
//   • WhatsApp (most-used in Kırgızistan)
//   • Telegram (popular with younger users)
//   • Email (older audience)
//   • Copy link (always available)

import { computed } from 'vue';
import { useFavorites, type FavoriteItem } from './useFavorites';
import { formatPrice } from '../utils/PriceEngine';
import { useTranslate } from './useTranslate';

const ENCODE_VERSION = 'w1'; // bump if the JSON shape changes

const toBase64 = (s: string): string => {
  if (typeof btoa !== 'undefined') return btoa(unescape(encodeURIComponent(s)));
  // Node fallback (used in tests)
  return Buffer.from(s, 'utf-8').toString('base64');
};

const fromBase64 = (s: string): string => {
  if (typeof atob !== 'undefined') return decodeURIComponent(escape(atob(s)));
  return Buffer.from(s, 'base64').toString('utf-8');
};

/** Strip a favorite down to the minimum surface we want to share
 *  publicly — no addedAt (privacy), no auth state, no IDs we
 *  couldn't re-fetch anyway. */
export const serializeItem = (f: FavoriteItem) => ({
  i: f.id,
  n: f.name,
  u: f.imageUrl,
  p: f.basePriceKgs
});

export type SerializedItem = ReturnType<typeof serializeItem>;

/** Build the shareable URL for a list of favorite items. */
export const buildShareUrl = (
  items: FavoriteItem[],
  origin: string = (typeof window !== 'undefined' ? window.location.origin : '')
): string => {
  if (!items.length) return origin;
  const payload = items.map(serializeItem);
  const encoded = toBase64(JSON.stringify(payload));
  return `${origin}/?w=${ENCODE_VERSION}.${encoded}`;
};

/** Parse a share URL (or just the `w` query value) back into
 *  the list of FavoriteItem-shaped objects. Returns [] on
 *  malformed input — never throws. */
export const hydrateFromUrl = (wParam: string | null | undefined): Omit<FavoriteItem, 'addedAt'>[] => {
  if (!wParam || typeof wParam !== 'string') return [];
  const dot = wParam.indexOf('.');
  const version = dot > 0 ? wParam.slice(0, dot) : '';
  const payload = dot > 0 ? wParam.slice(dot + 1) : wParam;
  if (version !== ENCODE_VERSION) return [];
  try {
    const json = fromBase64(payload);
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((i: any) => i && typeof i.i === 'string' && i.i.length > 0)
      .map((i: any) => ({
        id: String(i.i),
        name: String(i.n || ''),
        imageUrl: String(i.u || ''),
        basePriceKgs: Number(i.p) || 0
      }));
  } catch {
    return [];
  }
};

/** Best-effort: read the share param off the current URL and
 *  return the parsed items, or [] if the URL is clean. Safe to
 *  call from anywhere on the storefront. */
export const readShareFromLocation = (): Omit<FavoriteItem, 'addedAt'>[] => {
  if (typeof window === 'undefined') return [];
  try {
    const params = new URLSearchParams(window.location.search);
    return hydrateFromUrl(params.get('w'));
  } catch {
    return [];
  }
};

export interface ShareChannel {
  id: 'whatsapp' | 'telegram' | 'email' | 'copy';
  label: string;
  icon: string;
  /** Build a deep link / mailto: / copy payload for the given
   *  text. Returned URL is opened in a new tab. */
  buildUrl: (text: string, url: string) => string;
}

export function useShareWishlist() {
  const favorites = useFavorites();
  const { t } = useTranslate();

  const items = computed(() => favorites.recent.value);

  const shareUrl = computed(() => buildShareUrl(items.value));

  const itemCount = computed(() => items.value.length);

  /** Plain-text body used in WhatsApp / Telegram / Email subject. */
  const body = computed(() => {
    if (!items.value.length) return '';
    const lines: string[] = [];
    lines.push(t('share.bodyHeader', { count: items.value.length, name: 'Power Vital' }));
    for (const f of items.value) {
      const price = `${formatPrice(f.basePriceKgs)} KGS`;
      lines.push(`• ${f.name} — ${price}`);
    }
    lines.push('');
    lines.push(shareUrl.value);
    return lines.join('\n');
  });

  /** Subject line for the mailto: link. Short enough to fit a
   *  notification preview. */
  const subject = computed(() => t('share.subject', { count: items.value.length }));

  const channels: ShareChannel[] = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: '💬',
      buildUrl: (text, _url) => `https://wa.me/?text=${encodeURIComponent(text)}`
    },
    {
      id: 'telegram',
      label: 'Telegram',
      icon: '✈️',
      buildUrl: (text, _url) => {
        // Telegram's share/url expects both `url` and `text`; we
        // fold the most-informative line (the trailing product
        // name or the share URL itself) into `text`.
        const tail = text.split('\n').filter((l) => l.trim().length).pop() || '';
        return `https://t.me/share/url?text=${encodeURIComponent(tail)}`;
      }
    },
    {
      id: 'email',
      label: 'Email',
      icon: '✉️',
      buildUrl: (text, _url) => `mailto:?subject=${encodeURIComponent(subject.value)}&body=${encodeURIComponent(text)}`
    }
  ];

  const copy = async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return false;
    try {
      await navigator.clipboard.writeText(shareUrl.value);
      return true;
    } catch {
      return false;
    }
  };

  const open = (channel: ShareChannel): void => {
    if (typeof window === 'undefined') return;
    window.open(channel.buildUrl(body.value, shareUrl.value), '_blank', 'noopener,noreferrer');
  };

  return { items, shareUrl, body, subject, itemCount, channels, copy, open };
}

export default useShareWishlist;

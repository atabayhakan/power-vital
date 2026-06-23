// csvDownload — trigger a browser download of a CSV file fetched from
// the given URL using the caller's auth token.
//
// We can't use a plain <a href> because the endpoint requires the
// Authorization header, so we go via fetch() + Blob.
import axios from 'axios';

export async function downloadCsv(opts: {
  url: string;
  filename: string;
  token?: string | null;
} | string, fallbackFilename?: string): Promise<void> {
  // Overload: accept either a single options object OR (url, filename).
  // The legacy 2-arg form is used by BulkAction callbacks that pass
  // `(action.endpoint, action.download)` directly.
  const resolved = typeof opts === 'string'
    ? { url: opts, filename: fallbackFilename ?? 'export.csv' }
    : opts;
  const token = (resolved as { token?: string | null }).token
    ?? (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const res = await axios.get<Blob>(resolved.url, {
    responseType: 'blob',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });
  const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = resolved.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a tick so the browser has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// pickFilename — extract a sensible filename from the
// Content-Disposition header, falling back to the provided default.
export function pickFilename(cdHeader: string | null | undefined, fallback: string): string {
  if (!cdHeader) return fallback;
  const m = cdHeader.match(/filename="?([^";]+)"?/i);
  return m ? m[1] : fallback;
}

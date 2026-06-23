// Power Vital service worker — Web Push + notification click handler.
//
// Activated by usePushSubscription.ts → navigator.serviceWorker.register('/sw.js').
// Receives push events from the server (web-push lib), shows a native
// notification, and routes clicks to the in-page URL payload.

self.addEventListener('install', (event) => {
  // Activate immediately on first install.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take over all clients on first activation.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    // Server sent a plain text body — show it raw.
    payload = { title: 'Power Vital', body: event.data.text() };
  }

  const { title, body, url, icon, badge, tag } = payload;
  const opts = {
    body: body || '',
    icon: icon || '/icons.svg',
    badge: badge || '/icons.svg',
    tag: tag || 'pv-notification',
    // Visual cues
    badge: '/icons.svg',
    requireInteraction: false,
    // Vibration pattern (mobile)
    vibrate: [100, 50, 100],
    data: { url: url || '/', eventKey: payload.eventKey || 'unknown' }
  };

  event.waitUntil(self.registration.showNotification(title || 'Power Vital', opts));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil((async () => {
    // If the app already has an open tab, focus it and navigate.
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of allClients) {
      const u = new URL(client.url);
      if (u.origin === self.location.origin) {
        await client.focus();
        // Navigate the existing tab to the target URL.
        if ('navigate' in client) {
          try { return client.navigate(targetUrl); } catch { /* ignore */ }
        }
        // Fallback: postMessage so the SPA can react.
        client.postMessage({ type: 'pv-navigate', url: targetUrl });
        return;
      }
    }
    // No matching tab → open a fresh one.
    return self.clients.openWindow(targetUrl);
  })());
});

// Optional: respond to in-app messages for skipWaiting / config.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

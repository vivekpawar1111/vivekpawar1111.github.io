/*
 * Care+ notification click handler, imported into the generated Workbox
 * service worker via `workbox.importScripts` (see vite.config.ts).
 *
 * Websites can only raise a system notification from a service worker
 * registration on Android, so the tap has to be handled here: focus an open
 * Care+ window when there is one, otherwise open the deep link.
 */

self.addEventListener('notificationclick', (event) => {
  const data = (event.notification && event.notification.data) || {};
  const target = typeof data.url === 'string' && data.url ? data.url : '/?module=courier-tracking';

  event.notification.close();

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of windows) {
        try {
          const url = new URL(client.url);
          if (url.origin !== self.location.origin) continue;
          await client.focus();
          if (typeof client.navigate === 'function') {
            await client.navigate(target);
          }
          return;
        } catch {
          /* try the next window */
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(target);
      }
    })(),
  );
});

workbox.core.setCacheNameDetails({
  prefix: 'my-manga-app',
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

workbox.precaching.precacheAndRoute(self.__precacheManifest || []);


workbox.routing.registerRoute(
  /.*\.html/,
  new workbox.strategies.NetworkFirst()
)

workbox.routing.registerRoute(
  // Cache CSS files
  /.*\.css/,
  new workbox.strategies.CacheFirst()
);

workbox.routing.registerRoute(
  /.*\.js/,
  new workbox.strategies.CacheFirst()
);

workbox.routing.registerRoute(
  /\.(?:png|gif|jpg|jpeg|svg|cur)$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60
      })
    ]
  })
);
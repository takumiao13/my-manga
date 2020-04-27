workbox.core.setCacheNameDetails({
  prefix: 'my-manga-app'
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

workbox.precaching.precacheAndRoute(self.__precacheManifest || []);


// for static assets
workbox.routing.registerRoute(
  /assets\/css\/.*\.css/,
  new workbox.strategies.CacheFirst()
);

workbox.routing.registerRoute(
  /assets\/js\/.*\.js/,
  new workbox.strategies.CacheFirst()
);

workbox.routing.registerRoute(
  /\.(?:png|gif|jpg|jpeg|svg|cur)$/,
  new workbox.strategies.StaleWhileRevalidate()
);

// for SW
workbox.routing.registerRoute(
  /service-worker\.js/,
  new workbox.strategies.NetworkFirst()
);

// for API
workbox.routing.registerRoute(
  /\/api\/.*/,
  new workbox.strategies.NetworkFirst()
);
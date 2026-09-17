/**
 * Pencilwood Service Worker Router
 * Provides dynamic clean URLs without .html extensions
 * and routes /product/:slug to product-details.html seamlessly.
 */

const CACHE_NAME = 'pencilwood-clean-router-v1';

const STATIC_ROUTES = {
  '/': '/index.html',
  '/index': '/index.html',
  '/product-list': '/product-list.html',
  '/all_product': '/all_product.html',
  '/about-us': '/about-us.html',
  '/contact-us': '/contact-us.html',
  '/cart': '/cart.html',
  '/checkout': '/checkout.html',
  '/wishlist': '/wishlist.html',
  '/login': '/login.html',
  '/profile': '/profile.html',
  '/my-orders': '/my-orders.html',
  '/address': '/address.html',
  '/order': '/order.html',
  '/privacy-policy': '/privacy-policy.html',
  '/return-policy': '/return-policy.html',
  '/terms-and-conditions': '/terms-and-conditions.html'
};

// Immediate installation & takeover
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Only handle same-origin GET requests
  if (req.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // 2. Pass through API requests, WebSockets, or live reload scripts
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('browser-sync') ||
    url.pathname.includes('ws')
  ) {
    return;
  }

  let pathname = url.pathname;

  // 3. Fix relative asset fetches when user is in /product/:slug (e.g. /product/css/..., /product/js/...)
  if (pathname.startsWith('/product/')) {
    const assetMatch = pathname.match(
      /\/product\/(css|js|images|components)\/(.+)/i
    );
    if (assetMatch) {
      const rewrittenUrl = '/' + assetMatch[1] + '/' + assetMatch[2] + url.search;
      event.respondWith(fetch(rewrittenUrl));
      return;
    }
  }

  // Normalize trailing slash (e.g., /about-us/ -> /about-us)
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  // 4. Match Known Static Clean Routes (/product-list, /about-us, /cart, etc.)
  if (STATIC_ROUTES[pathname]) {
    const targetFile = STATIC_ROUTES[pathname] + url.search;
    event.respondWith(
      fetch(targetFile).catch(() => caches.match(targetFile))
    );
    return;
  }

  // 5. Match Product Detail Clean Route: /product/:slug
  if (pathname.startsWith('/product/')) {
    const slug = pathname.replace(/^\/product\//, '').split('/')[0];
    if (slug) {
      const targetFile = '/product-details.html' + url.search;
      event.respondWith(
        fetch(targetFile).catch(() => caches.match(targetFile))
      );
      return;
    }
  }

  // 6. Fallback for navigation requests without file extensions
  if (req.mode === 'navigate' && !pathname.includes('.')) {
    const potentialFile = pathname + '.html' + url.search;
    event.respondWith(
      fetch(potentialFile).catch(() => fetch('/index.html'))
    );
    return;
  }
});

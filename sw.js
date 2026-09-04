/* ===================================================
   PENCILWOOD SERVICE WORKER - CLEAN URL ROUTING
   Supports VS Code Live Server & Static Hosting
=================================================== */

const CACHE_NAME = 'pencilwood-clean-urls-v1';

const STATIC_ROUTES = {
  '/': '/index.html',
  '/product-list': '/product-list.html',
  '/about-us': '/about-us.html',
  '/contact-us': '/contact-us.html',
  '/privacy-policy': '/privacy-policy.html',
  '/terms-and-conditions': '/terms-and-conditions.html',
  '/return-policy': '/return-policy.html',
  '/login': '/login.html',
  '/profile': '/profile.html',
  '/my-orders': '/my-orders.html',
  '/order': '/order.html',
  '/checkout': '/checkout.html',
  '/wishlist': '/wishlist.html',
  '/cart': '/cart.html',
  '/address': '/address.html',
  '/all_product': '/all_product.html',
  '/product-details': '/product-details.html',
  '/index': '/index.html'
};

const RESERVED_PREFIXES = [
  '/api',
  '/css',
  '/js',
  '/images',
  '/components',
  '/.well-known'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only intercept same-origin navigation requests (HTML page visits)
  if (request.mode !== 'navigate' || request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Ignore cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  let pathname = url.pathname;
  // Remove trailing slash if present (except for root '/')
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  // 1. Check exact static route match
  if (STATIC_ROUTES[pathname]) {
    event.respondWith(
      fetch(STATIC_ROUTES[pathname] + url.search).catch(() => fetch(event.request))
    );
    return;
  }

  // 2. Check if request is for static assets or files with extension (.html, .js, .css, .png, etc.)
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(pathname);
  const isReserved = RESERVED_PREFIXES.some(prefix => pathname.startsWith(prefix));

  if (hasExtension || isReserved) {
    // Normal pass-through
    return;
  }

  // 3. Dynamic Product Slug Route: /:slug (e.g. /cushion or /bike-throttle-...)
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 1) {
    const slug = segments[0];
    // Transparently serve product-details.html with slug preserved in query
    const targetUrl = `/product-details.html?slug=${encodeURIComponent(slug)}${url.search ? '&' + url.search.slice(1) : ''}`;
    event.respondWith(
      fetch(targetUrl).catch(() => fetch('/product-details.html')).catch(() => fetch(event.request))
    );
    return;
  }
});

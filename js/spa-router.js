/**
 * Pencilwood Dynamic SPA & Clean URL Router
 * - Registers and manages Service Worker (sw.js)
 * - Automatically normalizes URLs in the browser address bar (removes .html)
 * - Maps product details to /product/:slug
 * - Intercepts anchor links to keep URLs clean without reloads
 */

(function () {
  'use strict';

  // 1. REGISTER SERVICE WORKER
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          // Check for worker updates
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (
                  installingWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  // New worker available
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('Service Worker registration skipped/failed:', err);
        });
    });
  }

  // 2. DETECT PRODUCT SLUG FROM PATHNAME OR QUERY
  function extractProductSlug() {
    // Check /product/:slug pattern
    const match = window.location.pathname.match(/\/product\/([^/?#]+)/i);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
    // Fallback to query parameter ?slug=...
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    if (slug) {
      return slug;
    }
    return null;
  }

  const detectedSlug = extractProductSlug();
  if (detectedSlug) {
    window.__PRODUCT_SLUG__ = detectedSlug;
  }

  // Global helper for any script to retrieve the current product slug
  window.getProductSlug = function () {
    return window.__PRODUCT_SLUG__ || extractProductSlug();
  };

  // 3. NORMALIZE BROWSER ADDRESS BAR (Remove .html seamlessly)
  function cleanCurrentUrl() {
    const pathname = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;

    // Handle product-details.html?slug=xyz
    if (pathname.endsWith('product-details.html')) {
      const params = new URLSearchParams(search);
      const slug = params.get('slug') || detectedSlug;
      if (slug) {
        params.delete('slug');
        const remainingQuery = params.toString() ? '?' + params.toString() : '';
        const cleanPath = '/product/' + encodeURIComponent(slug) + remainingQuery + hash;
        window.history.replaceState(null, '', cleanPath);
        return;
      }
    }

    // Handle index.html -> /
    if (pathname.endsWith('/index.html') || pathname === '/index.html') {
      const cleanPath = '/' + (search || '') + (hash || '');
      window.history.replaceState(null, '', cleanPath);
      return;
    }

    // Handle any other page ending with .html
    if (pathname.endsWith('.html')) {
      const cleanName = pathname.replace(/\.html$/i, '');
      const cleanPath = cleanName + (search || '') + (hash || '');
      window.history.replaceState(null, '', cleanPath);
    }
  }

  // Run cleanup as early as possible
  cleanCurrentUrl();

  // 4. INTERCEPT INTERNAL LINK CLICKS
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a');
    if (!link || !link.href) return;

    // Only process same-origin links
    if (link.origin !== window.location.origin) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;

    try {
      const destUrl = new URL(link.href);
      const pathname = destUrl.pathname;

      // Check for product-details.html?slug=xyz
      if (pathname.endsWith('product-details.html')) {
        const slug = destUrl.searchParams.get('slug');
        if (slug) {
          e.preventDefault();
          destUrl.searchParams.delete('slug');
          const remainingQuery = destUrl.searchParams.toString()
            ? '?' + destUrl.searchParams.toString()
            : '';
          const target = '/product/' + encodeURIComponent(slug) + remainingQuery + destUrl.hash;
          window.location.href = target;
          return;
        }
      }

      // Check for general .html link
      if (pathname.endsWith('.html')) {
        e.preventDefault();
        let clean = pathname.replace(/\.html$/i, '');
        if (clean === '/index') clean = '/';
        const target = clean + destUrl.search + destUrl.hash;
        window.location.href = target;
        return;
      }
    } catch (err) {
      // Allow default link behavior on error
    }
  });

  // Global clean navigation helper
  window.navigateTo = function (url) {
    if (!url) return;
    // If it points to product-details.html?slug=...
    if (url.includes('product-details.html')) {
      try {
        const parsed = new URL(url, window.location.origin);
        const slug = parsed.searchParams.get('slug');
        if (slug) {
          parsed.searchParams.delete('slug');
          const q = parsed.searchParams.toString() ? '?' + parsed.searchParams.toString() : '';
          window.location.href = '/product/' + encodeURIComponent(slug) + q + parsed.hash;
          return;
        }
      } catch (e) {}
    }
    // Clean .html
    const cleanUrl = url.replace(/([a-zA-Z0-9_-]+)\.html(\?|#|$)/, '$1$2');
    window.location.href = cleanUrl;
  };
})();

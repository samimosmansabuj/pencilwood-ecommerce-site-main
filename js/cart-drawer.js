/* ==========================================================================
   CART SLIDE DRAWER CONTROLLER
   Fast, responsive slide-out cart drawer with instant quantity and removal
   ========================================================================== */

(function () {
  "use strict";

  let DRAWER_ITEMS_CACHE = [];

  /* =========================
     AUTH / TOKEN HELPERS
  ========================= */
  function getAuthToken() {
    return localStorage.getItem("access") || localStorage.getItem("token") || "";
  }

  function isUserLoggedIn() {
    return !!getAuthToken();
  }

  function getApiBase() {
    if (typeof API_BASE !== "undefined" && API_BASE) return API_BASE;
    if (window.API_BASE) return window.API_BASE;
    return "https://api.pencilwoodbd.com/api"; // Default fallback
  }

  /* =========================
     GUEST CART HELPERS
  ========================= */
  const GUEST_KEY = "guest_cart";

  function getLocalGuestCart() {
    try {
      return JSON.parse(localStorage.getItem(GUEST_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveLocalGuestCart(cart) {
    localStorage.setItem(GUEST_KEY, JSON.stringify(cart));
  }

  function countGuestItems() {
    return getLocalGuestCart().reduce((sum, i) => sum + Number(i.quantity || 0), 0);
  }

  /* =========================
     IMAGE FIXER
  ========================= */
  function resolveImgUrl(img) {
    if (!img) return "images/pencilwood-bd-logo.png";
    if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("data:")) return img;
    const base = getApiBase();
    if (img.startsWith("/")) return base + img;
    return base + "/" + img;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* =========================
     OPEN & CLOSE DRAWER
  ========================= */
  function openCartDrawer() {
    const drawer = document.getElementById("cartDrawer");
    const overlay = document.getElementById("cartDrawerOverlay");

    if (!drawer || !overlay) {
      // If component not yet in DOM, fallback to cart.html
      window.location.href = "cart.html";
      return;
    }

    drawer.classList.add("open");
    overlay.classList.add("open");
    document.body.classList.add("cart-drawer-open");

    loadCartDrawerItems();
  }

  function closeCartDrawer() {
    const drawer = document.getElementById("cartDrawer");
    const overlay = document.getElementById("cartDrawerOverlay");

    if (drawer) drawer.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
    document.body.classList.remove("cart-drawer-open");
  }

  function continueShoppingFromDrawer() {
    closeCartDrawer();
    const current = window.location.pathname.split("/").pop();
    if (current !== "product-list.html" && current !== "all_product.html") {
      window.location.href = "product-list.html";
    }
  }

  /* Keyboard shortcut (Esc) to close */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const drawer = document.getElementById("cartDrawer");
      if (drawer && drawer.classList.contains("open")) {
        closeCartDrawer();
      }
    }
  });

  /* =========================
     LOAD & RENDER ITEMS
  ========================= */
  async function loadCartDrawerItems() {
    const container = document.getElementById("drawerCartItems");
    const emptyBox = document.getElementById("drawerCartEmpty");
    const loadingBox = document.getElementById("drawerCartLoading");
    const footer = document.getElementById("drawerCartFooter");
    const countBadge = document.getElementById("drawerCartCount");

    if (!container) return;

    if (loadingBox) loadingBox.style.display = "flex";
    if (emptyBox) emptyBox.style.display = "none";
    container.innerHTML = "";

    let items = [];

    try {
      if (isUserLoggedIn()) {
        const res = await fetch(`${getApiBase()}/cart/`, {
          headers: { "Authorization": `Bearer ${getAuthToken()}` }
        });
        const data = await res.json();

        if (data && data.status && Array.isArray(data.data)) {
          items = data.data.map(i => ({
            key: `db-${i.id}`,
            server_id: i.id,
            product_id: i.product_id,
            variant_id: i.variant_id || null,
            product: i.product || "Product",
            image: i.image,
            quantity: Number(i.quantity || 1),
            price: Number(i.price || 0),
            total: Number(i.total || (i.price * i.quantity)),
            attributes: i.variant || null,
            out_of_stock: false,
          }));
        }
      } else {
        let guestCart = getLocalGuestCart();

        if (guestCart.length > 0) {
          try {
            const ids = guestCart.map(i => i.product_id).filter(Boolean).join(",");
            if (ids) {
              const res = await fetch(`${getApiBase()}/cart/guest-refresh/?ids=${ids}`);
              const data = await res.json();

              if (data && data.status && Array.isArray(data.data)) {
                guestCart = guestCart.map(item => {
                  const live = data.data.find(p => p.id === item.product_id);
                  if (!live) return item;

                  let livePrice = live.price;
                  let liveDiscount = live.discount_price;
                  let liveStock = live.stock;

                  if (item.variant_id && Array.isArray(live.variants)) {
                    const v = live.variants.find(v => v.id === item.variant_id);
                    if (v) {
                      livePrice = v.price;
                      liveDiscount = v.discount_price;
                      liveStock = v.stock;
                    }
                  }

                  return {
                    ...item,
                    name: live.name || item.name,
                    image: live.image || item.image,
                    price: livePrice,
                    discount_price: liveDiscount,
                    stock: liveStock,
                  };
                });

                saveLocalGuestCart(guestCart);
              }
            }
          } catch (err) {
            console.warn("Drawer guest cart live refresh notice:", err);
          }
        }

        items = guestCart.map(i => {
          const unit = Number(i.discount_price || i.price || 0);
          const qty = Number(i.quantity || 1);
          const outOfStock = typeof i.stock === "number" && i.stock < qty;
          return {
            key: `guest-${i.product_id}-${i.variant_id || 0}`,
            server_id: null,
            product_id: i.product_id,
            variant_id: i.variant_id,
            product: i.name || "Product",
            image: i.image,
            quantity: qty,
            price: unit,
            total: unit * qty,
            attributes: i.attributes,
            out_of_stock: outOfStock,
          };
        });
      }
    } catch (err) {
      console.error("Cart drawer load error:", err);
    }

    if (loadingBox) loadingBox.style.display = "none";
    DRAWER_ITEMS_CACHE = items;

    // EMPTY CART STATE
    if (!items.length) {
      if (emptyBox) emptyBox.style.display = "flex";
      if (footer) footer.style.display = "none";
      if (countBadge) countBadge.textContent = "0";
      syncAllCartBadges(0);
      return;
    }

    // POPULATE ITEMS
    if (emptyBox) emptyBox.style.display = "none";
    if (footer) footer.style.display = "block";

    let html = "";
    items.forEach(item => {
      const img = resolveImgUrl(item.image);
      const title = escapeHtml(item.product);

      let variantStr = "";
      if (item.attributes) {
        if (typeof item.attributes === "object") {
          variantStr = Object.values(item.attributes).join(" / ");
        } else if (typeof item.attributes === "string") {
          variantStr = item.attributes;
        }
      }

      const stockWarning = item.out_of_stock
        ? `<div class="drawer-item-stock-warn">Quantity exceeds available stock</div>`
        : "";

      html += `
        <div class="drawer-item" data-key="${item.key}">
          <input type="checkbox" class="drawer-item-check" data-key="${item.key}"
            ${item.out_of_stock ? "" : "checked"} onchange="updateDrawerSummary()">
          <img class="drawer-item-img" src="${img}" alt="${title}" loading="lazy" />
          <div class="drawer-item-info">
            <span class="drawer-item-title" title="${title}">${title}</span>
            ${variantStr ? `<span class="drawer-item-variant">${escapeHtml(variantStr)}</span>` : ""}
            <div class="drawer-item-price-row">
              <span class="drawer-item-total">৳ ${item.total.toLocaleString()}</span>
              <span class="drawer-item-unit">${item.quantity} × ৳ ${item.price.toLocaleString()}</span>
            </div>
            ${stockWarning}
          </div>
          <div class="drawer-item-actions">
            <button class="drawer-item-remove" onclick="removeDrawerItem('${item.key}')" title="Remove item" aria-label="Remove item">
              <i class="fa fa-trash-o"></i>
            </button>
            <div class="drawer-qty-pill">
              <button class="drawer-qty-btn" onclick="changeDrawerQty('${item.key}', ${item.quantity - 1})" aria-label="Decrease quantity">−</button>
              <span class="drawer-qty-val">${item.quantity}</span>
              <button class="drawer-qty-btn" onclick="changeDrawerQty('${item.key}', ${item.quantity + 1})" aria-label="Increase quantity">+</button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    updateDrawerSummary();
  }

  /* =========================
     SUMMARY & SELECTION
  ========================= */
  function getDrawerSelectedItems() {
    const checks = document.querySelectorAll(".drawer-item-check:checked");
    const keys = Array.from(checks).map(cb => cb.dataset.key);
    return DRAWER_ITEMS_CACHE.filter(item => keys.includes(item.key));
  }

  function updateDrawerSummary() {
    const subtotalEl = document.getElementById("drawerCartSubtotal");
    const countBadge = document.getElementById("drawerCartCount");

    const selected = getDrawerSelectedItems();
    let subtotal = 0;
    let totalQty = 0;

    selected.forEach(item => {
      subtotal += Number(item.total || 0);
      totalQty += Number(item.quantity || 0);
    });

    // Total count across all items in cart
    const overallCount = DRAWER_ITEMS_CACHE.reduce((acc, i) => acc + Number(i.quantity || 0), 0);

    if (subtotalEl) subtotalEl.textContent = `৳ ${subtotal.toLocaleString()}`;
    if (countBadge) countBadge.textContent = overallCount;

    syncAllCartBadges(overallCount);
  }

  /* =========================
     QUANTITY & REMOVAL
  ========================= */
  async function changeDrawerQty(key, quantity) {
    if (quantity < 1) {
      // If reduced to 0, ask or directly remove
      removeDrawerItem(key);
      return;
    }

    const item = DRAWER_ITEMS_CACHE.find(i => i.key === key);
    if (!item) return;

    // Optimistic UI update on quantity pill
    const itemCard = document.querySelector(`.drawer-item[data-key="${key}"]`);
    if (itemCard) {
      const valEl = itemCard.querySelector(".drawer-qty-val");
      const totalEl = itemCard.querySelector(".drawer-item-total");
      const unitEl = itemCard.querySelector(".drawer-item-unit");
      if (valEl) valEl.textContent = quantity;
      if (totalEl) totalEl.textContent = `৳ ${(item.price * quantity).toLocaleString()}`;
      if (unitEl) unitEl.textContent = `${quantity} × ৳ ${item.price.toLocaleString()}`;
      item.quantity = quantity;
      item.total = item.price * quantity;
      updateDrawerSummary();
    }

    if (item.server_id) {
      try {
        const res = await fetch(`${getApiBase()}/cart/update/${item.server_id}/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify({ quantity })
        });
        const data = await res.json();
        if (!data.status) {
          // If update failed, revert by reloading
          loadCartDrawerItems();
        }
      } catch (err) {
        console.error("Drawer qty update error:", err);
        loadCartDrawerItems();
      }
    } else {
      // Guest cart update
      let guestCart = getLocalGuestCart();
      const gi = guestCart.find(i =>
        i.product_id === item.product_id && (i.variant_id || null) === (item.variant_id || null)
      );
      if (gi) {
        gi.quantity = quantity;
        saveLocalGuestCart(guestCart);
      }
    }

    // Sync external cart page if open
    if (typeof loadCartItems === "function" && document.getElementById("cartItemsContainer")) {
      loadCartItems();
    }
  }

  async function removeDrawerItem(key) {
    const item = DRAWER_ITEMS_CACHE.find(i => i.key === key);
    if (!item) return;

    // Optimistic remove animation
    const itemCard = document.querySelector(`.drawer-item[data-key="${key}"]`);
    if (itemCard) {
      itemCard.style.opacity = "0.4";
      itemCard.style.transform = "scale(0.96)";
      itemCard.style.transition = "all 0.2s ease";
    }

    if (item.server_id) {
      try {
        const res = await fetch(`${getApiBase()}/cart/remove/${item.server_id}/`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${getAuthToken()}`
          }
        });
        const data = await res.json();
        if (data.status) {
          loadCartDrawerItems();
        } else {
          loadCartDrawerItems();
        }
      } catch (err) {
        console.error("Drawer remove error:", err);
        loadCartDrawerItems();
      }
    } else {
      let guestCart = getLocalGuestCart();
      guestCart = guestCart.filter(i =>
        !(i.product_id === item.product_id && (i.variant_id || null) === (item.variant_id || null))
      );
      saveLocalGuestCart(guestCart);
      loadCartDrawerItems();
    }

    // Sync external cart page if open
    if (typeof loadCartItems === "function" && document.getElementById("cartItemsContainer")) {
      loadCartItems();
    }
  }

  /* =========================
     CHECKOUT FLOW
  ========================= */
  function goToCheckoutFromDrawer() {
    const selected = getDrawerSelectedItems();

    if (!selected.length) {
      if (typeof toast === "function") {
        toast("Please select at least one product to checkout");
      } else {
        alert("Please select at least one product to checkout");
      }
      return;
    }

    if (isUserLoggedIn()) {
      const selectedIds = selected.map(i => i.server_id).filter(Boolean);
      localStorage.setItem("checkout_cart_ids", JSON.stringify(selectedIds));
      localStorage.removeItem("checkout_guest_items");
    } else {
      const selectedItems = selected.map(i => ({
        product_id: i.product_id,
        variant_id: i.variant_id,
        quantity: i.quantity
      }));
      localStorage.setItem("checkout_guest_items", JSON.stringify(selectedItems));
      localStorage.removeItem("checkout_cart_ids");
    }

    closeCartDrawer();
    window.location.href = "checkout.html";
  }

  /* =========================
     SYNC ALL BADGES
  ========================= */
  function syncAllCartBadges(count) {
    if (typeof count === "undefined") {
      count = isUserLoggedIn()
        ? DRAWER_ITEMS_CACHE.reduce((acc, i) => acc + Number(i.quantity || 0), 0)
        : countGuestItems();
    }

    const dots = [
      document.getElementById("cartDot"),
      document.getElementById("navCartDot"),
      document.getElementById("drawerCartCount")
    ];

    dots.forEach(dot => {
      if (dot) dot.textContent = count;
    });

    if (typeof updateCartCountFromBackend === "function") {
      // Also notify main.js if needed
    }
  }

  /* =========================
     GLOBAL EXPORTS
  ========================= */
  window.openCartDrawer = openCartDrawer;
  window.closeCartDrawer = closeCartDrawer;
  window.continueShoppingFromDrawer = continueShoppingFromDrawer;
  window.loadCartDrawerItems = loadCartDrawerItems;
  window.updateDrawerSummary = updateDrawerSummary;
  window.changeDrawerQty = changeDrawerQty;
  window.removeDrawerItem = removeDrawerItem;
  window.goToCheckoutFromDrawer = goToCheckoutFromDrawer;
  window.syncAllCartBadges = syncAllCartBadges;

  // Auto-init badge count on DOMContentLoaded
  document.addEventListener("DOMContentLoaded", function () {
    if (!isUserLoggedIn()) {
      syncAllCartBadges(countGuestItems());
    }
  });

})();

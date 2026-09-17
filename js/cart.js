/* =========================
   TOKEN
========================= */
function getToken() {
    return localStorage.getItem("access") || localStorage.getItem("token") || "";
}
function isLoggedIn() {
    return !!getToken();
}

/* =========================
   GUEST CART (localStorage)
   Shape: [{ product_id, variant_id, quantity, name, image, price, discount_price, attributes }]
========================= */
const GUEST_CART_KEY = "guest_cart";

function getGuestCart() {
    try {
        return JSON.parse(localStorage.getItem(GUEST_CART_KEY)) || [];
    } catch {
        return [];
    }
}

function saveGuestCart(cart) {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
}

function guestCartCount() {
    return getGuestCart().reduce((sum, i) => sum + Number(i.quantity || 0), 0);
}

function guestCartAdd(productId, variantId, quantity, snapshot = {}) {
    const cart = getGuestCart();
    const existing = cart.find(i =>
        i.product_id === productId && (i.variant_id || null) === (variantId || null)
    );

    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({
            product_id: productId,
            variant_id: variantId || null,
            quantity,
            name: snapshot.name || "",
            image: snapshot.image || "",
            price: snapshot.price || 0,
            discount_price: snapshot.discount_price || null,
            attributes: snapshot.attributes || null,
        });
    }
    saveGuestCart(cart);
}

function guestCartUpdateQty(productId, variantId, quantity) {
    const cart = getGuestCart();
    const item = cart.find(i =>
        i.product_id === productId && (i.variant_id || null) === (variantId || null)
    );
    if (item) {
        item.quantity = quantity;
        saveGuestCart(cart);
    }
}

function guestCartRemove(productId, variantId) {
    let cart = getGuestCart();
    cart = cart.filter(i =>
        !(i.product_id === productId && (i.variant_id || null) === (variantId || null))
    );
    saveGuestCart(cart);
}

function clearGuestCart() {
    localStorage.removeItem(GUEST_CART_KEY);
}

/* =========================
   UNIFIED CART STATE
========================= */
let CART_ITEMS_CACHE = [];

function getSelectedItems() {
    const checkboxes = document.querySelectorAll(".cart-check:checked");
    const selectedKeys = Array.from(checkboxes).map(cb => cb.dataset.key);
    return CART_ITEMS_CACHE.filter(item => selectedKeys.includes(item.key));
}

function updateSummaryFromSelection() {
    const summaryList = document.getElementById("cartSummaryList");
    const subtotalEl = document.getElementById("cartSubtotal");
    const itemCountEl = document.getElementById("cartItemCount");
    if (!summaryList || !subtotalEl || !itemCountEl) return;

    const selected = getSelectedItems();
    let totalQty = 0, subtotal = 0;
    summaryList.innerHTML = "";

    selected.forEach(item => {
        const productName = item.product.split(' ').slice(0, 5).join(' ') +
            (item.product.split(' ').length > 5 ? '...' : '');
        totalQty += Number(item.quantity || 0);
        subtotal += Number(item.total || 0);

        summaryList.innerHTML += `
            <div class="summary-row">
                <span>${productName} × ${item.quantity}</span>
                <span>৳ ${item.total}</span>
            </div>
        `;
    });

    subtotalEl.textContent = `৳ ${subtotal}`;
    itemCountEl.textContent = `${totalQty} Items`;
}

/* =========================
   LOAD CART (auth or guest)
========================= */
function fixImage(img) {
    if (!img) return "";
    if (img.startsWith("http")) return img;
    return API_BASE + img;
}

async function loadCartItems() {
    const container = document.getElementById("cartItemsContainer");
    const emptyBox = document.getElementById("emptyCartBox");
    if (!container) return;

    container.innerHTML = `<p>Loading cart...</p>`;

    let items = [];

    try {
        if (isLoggedIn()) {
            const res = await fetch(`${API_BASE}/cart/`, {
                headers: { "Authorization": `Bearer ${getToken()}` }
            });
            const data = await res.json();

            if (data.status && Array.isArray(data.data)) {
                items = data.data.map(i => ({
                    key: `db-${i.id}`,
                    server_id: i.id,
                    product_id: i.product_id,
                    variant_id: i.variant_id || null,
                    product: i.product,
                    image: i.image,
                    quantity: i.quantity,
                    price: i.price,
                    total: i.total,
                    attributes: i.variant,
                    out_of_stock: false,
                }));
            }
        } else {
            let guestCart = getGuestCart();

            if (guestCart.length) {
                // 🔥 REFRESH PRICE/STOCK FROM BACKEND (batch, single call)
                try {
                    const ids = guestCart.map(i => i.product_id).join(",");
                    const res = await fetch(`${API_BASE}/cart/guest-refresh/?ids=${ids}`);
                    const data = await res.json();

                    if (data.status && Array.isArray(data.data)) {
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

                        saveGuestCart(guestCart); // persist refreshed snapshot
                    }
                } catch (err) {
                    console.error("GUEST CART REFRESH ERROR:", err);
                    // fail hole purano snapshot diyei continue
                }
            }

            items = guestCart.map(i => {
                const unit = i.discount_price || i.price || 0;
                const outOfStock = typeof i.stock === "number" && i.stock < i.quantity;
                return {
                    key: `guest-${i.product_id}-${i.variant_id || 0}`,
                    server_id: null,
                    product_id: i.product_id,
                    variant_id: i.variant_id,
                    product: i.name,
                    image: i.image,
                    quantity: i.quantity,
                    price: unit,
                    total: unit * i.quantity,
                    attributes: i.attributes,
                    out_of_stock: outOfStock,
                };
            });
        }
    } catch (err) {
        console.error(err);
        container.innerHTML = `<p style="color:red">Failed to load cart</p>`;
        return;
    }

    CART_ITEMS_CACHE = items;
    const cartLayout = document.querySelector(".cart-layout");

    if (!items.length) {
        if (cartLayout) cartLayout.style.display = "none";
        if (emptyBox) emptyBox.style.display = "block";
        return;
    }

    if (emptyBox) emptyBox.style.display = "none";
    container.innerHTML = "";

    items.forEach(item => {
        const img = fixImage(item.image);
        const productName = item.product.split(' ').slice(0, 5).join(' ') +
            (item.product.split(' ').length > 5 ? '...' : '');
    
        const variantText = item.attributes && typeof item.attributes === "object"
            ? Object.values(item.attributes).join(" / ")
            : "";
    
        const stockWarning = item.out_of_stock
            ? `<div class="cart-stock-warning" style="color:red;font-size:12px">Stock unavailable for this quantity</div>`
            : "";
    
        container.innerHTML += `
            <div class="cart-item">
                <input type="checkbox" class="cart-check" data-key="${item.key}" ${item.out_of_stock ? "" : "checked"} onchange="updateSummaryFromSelection()">
                <img class="cart-img" src="${img}" />
                <div class="cart-info">
                    <div class="cart-name">
                        ${productName}
                        ${variantText ? `<span style="color:#888;font-size:12px"> (${variantText})</span>` : ""}
                    </div>
                    <div class="cart-total-price">৳ ${item.total}</div>
                    <div class="cart-subtotal-mini">${item.quantity} x ৳ ${item.price}</div>
                    ${stockWarning}
                </div>
                <div class="cart-qty">
                    <button class="cart-qty-btn cart-qty-minus ${item.quantity <= 1 ? "disabled" : ""}"
                        onclick="stepCartQty('${item.key}', -1)" aria-label="Decrease quantity" ${item.quantity <= 1 ? "disabled" : ""}>−</button>
                    <span class="cart-qty-val">${item.quantity}</span>
                    <button class="cart-qty-btn cart-qty-plus"
                        onclick="stepCartQty('${item.key}', 1)" aria-label="Increase quantity">+</button>
                </div>
                <button class="remove-btn" onclick="removeCartItem('${item.key}')" title="Remove item" aria-label="Remove item">×</button>
            </div>
        `;
    });

    setTimeout(updateSummaryFromSelection, 100);
}

/* =========================
   CHECKOUT
========================= */
function goToCheckout() {
    const selected = getSelectedItems();
    if (!selected.length) {
        toast("Select at least one product");
        return;
    }

    if (isLoggedIn()) {
        const selectedIds = selected.map(i => i.server_id);
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

    window.location.href = "/checkout";
}

/* =========================
   QTY / REMOVE (auth or guest, dispatched by key)
========================= */
const pendingCartPageUpdates = new Map();

async function stepCartQty(key, delta) {
    const item = CART_ITEMS_CACHE.find(i => i.key === key);
    if (!item) return;

    const currentQty = Number(item.quantity || 1);
    const newQty = currentQty + delta;

    // Minimum is 1! Never 0 or negative, never auto-remove on minus!
    if (newQty < 1) return;

    // Synchronous update in memory
    item.quantity = newQty;
    item.total = Math.round(item.price * newQty);

    // Optimistic DOM update on card
    const card = document.querySelector(`.cart-check[data-key="${key}"]`)?.closest(".cart-item");
    if (card) {
        const valSpan = card.querySelector(".cart-qty-val") || card.querySelector(".cart-qty span");
        const totalDiv = card.querySelector(".cart-total-price");
        const subtotalMini = card.querySelector(".cart-subtotal-mini");
        const minusBtn = card.querySelector(".cart-qty-minus");

        if (valSpan) valSpan.textContent = newQty;
        if (totalDiv) totalDiv.textContent = `৳ ${item.total.toLocaleString()}`;
        if (subtotalMini) subtotalMini.textContent = `${newQty} x ৳ ${item.price.toLocaleString()}`;

        if (minusBtn) {
            if (newQty <= 1) {
                minusBtn.classList.add("disabled");
                minusBtn.setAttribute("disabled", "true");
            } else {
                minusBtn.classList.remove("disabled");
                minusBtn.removeAttribute("disabled");
            }
        }
    }

    updateSummaryFromSelection();

    if (item.server_id) {
        if (pendingCartPageUpdates.has(key)) {
            clearTimeout(pendingCartPageUpdates.get(key));
        }
        const timer = setTimeout(async () => {
            pendingCartPageUpdates.delete(key);
            try {
                const res = await fetch(`${API_BASE}/cart/update/${item.server_id}/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
                    body: JSON.stringify({ quantity: item.quantity })
                });
                const data = await res.json();
                if (!data.status) {
                    loadCartItems();
                }
            } catch (err) {
                console.error("Cart qty update error:", err);
                loadCartItems();
            }
        }, 250);
        pendingCartPageUpdates.set(key, timer);
    } else {
        guestCartUpdateQty(item.product_id, item.variant_id, newQty);
        updateCartCountFromBackend?.();
    }

    if (typeof loadCartDrawerItems === "function") {
        loadCartDrawerItems();
    }
}

async function changeQty(key, val) {
    if (val === 1 || val === -1) {
        return stepCartQty(key, val);
    }
    const item = CART_ITEMS_CACHE.find(i => i.key === key);
    if (!item) return;
    const delta = val - item.quantity;
    return stepCartQty(key, delta);
}

async function removeCartItem(key) {
    const item = CART_ITEMS_CACHE.find(i => i.key === key);
    if (!item) return;

    if (item.server_id) {
        const res = await fetch(`${API_BASE}/cart/remove/${item.server_id}/`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (data.status) loadCartItems();
    } else {
        guestCartRemove(item.product_id, item.variant_id);
        loadCartItems();
        updateCartCountFromBackend?.();
    }
}

/* =========================
   CART COUNT (used by navbar)
========================= */
function updateCartCountFromBackend() {
    const dot = document.getElementById("cartDot");
    if (!dot) return;

    if (!isLoggedIn()) {
        dot.textContent = guestCartCount();
        return;
    }

    fetch(`${API_BASE}/cart/`, { headers: { "Authorization": `Bearer ${getToken()}` } })
        .then(res => res.json())
        .then(data => {
            const items = data.data || [];
            let total = 0;
            items.forEach(i => { total += i.quantity || 0; });
            dot.textContent = total;
        })
        .catch(console.error);
}

/* =========================
   TOAST
========================= */
function toast(msg) {
    const c = document.getElementById("toast-container");
    if (!c) { alert(msg); return; }
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(() => el.classList.add("show"), 50);
    setTimeout(() => {
        el.classList.remove("show");
        setTimeout(() => el.remove(), 300);
    }, 2500);
}

/* =========================
   EXPORTS & INIT
========================= */
window.stepCartQty = stepCartQty;
window.changeQty = changeQty;
window.removeCartItem = removeCartItem;

window.addEventListener("DOMContentLoaded", () => {
    loadCartItems();
});
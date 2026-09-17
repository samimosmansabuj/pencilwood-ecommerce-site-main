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
                    <button onclick="changeQty('${item.key}', ${item.quantity - 1})">−</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeQty('${item.key}', ${item.quantity + 1})">+</button>
                </div>
                <button class="remove-btn" onclick="removeCartItem('${item.key}')">×</button>
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
async function changeQty(key, quantity) {
    if (quantity < 1) return;
    const item = CART_ITEMS_CACHE.find(i => i.key === key);
    if (!item) return;

    if (item.server_id) {
        const res = await fetch(`${API_BASE}/cart/update/${item.server_id}/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
            body: JSON.stringify({ quantity })
        });
        const data = await res.json();
        if (data.status) loadCartItems();
    } else {
        guestCartUpdateQty(item.product_id, item.variant_id, quantity);
        loadCartItems();
        updateCartCountFromBackend?.();
    }
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
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
    loadCartItems();
});
function getToken() {
    return (
        localStorage.getItem("access") ||
        localStorage.getItem("token") ||
        ""
    );
}

/* =========================
   IMAGE FIX
========================= */
function fixImage(img) {
    if (!img) return "";
    if (img.startsWith("http")) return img;
    return API_BASE + img;
}

/* =========================
   GLOBAL STATE (NEW)
========================= */
let CART_ITEMS_CACHE = [];

/* =========================
   GET SELECTED ITEMS
========================= */
function getSelectedItems() {
    const checkboxes = document.querySelectorAll(".cart-check:checked");

    const selectedIds = Array.from(checkboxes).map(cb =>
        Number(cb.dataset.id)
    );

    return CART_ITEMS_CACHE.filter(item =>
        selectedIds.includes(item.id)
    );
}

/* =========================
   UPDATE SUMMARY BASED ON CHECKBOX
========================= */
function updateSummaryFromSelection() {
    const summaryList = document.getElementById("cartSummaryList");
    const subtotalEl = document.getElementById("cartSubtotal");
    const itemCountEl = document.getElementById("cartItemCount");

    // Element na pele crash korbe na
    if (!summaryList || !subtotalEl || !itemCountEl) {
        console.warn("Cart summary elements not found");
        return;
    }

    const selected = getSelectedItems();

    let totalQty = 0;
    let subtotal = 0;

    summaryList.innerHTML = "";

    selected.forEach(item => {
        const productName = item.product
        .split(' ')
        .slice(0, 5)
        .join(' ') + (item.product.split(' ').length > 5 ? '...' : '');
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
   LOAD CART
========================= */
async function loadCartItems() {

    const container = document.getElementById("cartItemsContainer");
    const emptyBox = document.getElementById("emptyCartBox");

    container.innerHTML = `<p>Loading cart...</p>`;

    try {

        const res = await fetch(`${API_BASE}/cart/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${getToken()}`
            }
        });

        const data = await res.json();
        if (!data.status || !Array.isArray(data.data)) {
            container.innerHTML = `<p>Failed to load cart</p>`;
            return;
        }

        const items = data.data;
        CART_ITEMS_CACHE = items;
        const cartLayout = document.querySelector(".cart-layout");

        if (!items.length) {
            if (cartLayout) {
                cartLayout.style.display = "none";
            }
            emptyBox.style.display = "block";
            return;
        }

        emptyBox.style.display = "none";
        if (cartLayout) {
            // cartLayout.style.display = "grid";
        }

        container.innerHTML = "";

        let totalQty = 0;

        items.forEach(item => {
            totalQty += Number(item.quantity || 0);
            const img = fixImage(item.image);
            const newPrice = item.price;
            const productName = item.product
            .split(' ')
            .slice(0, 5)
            .join(' ') + (item.product.split(' ').length > 5 ? '...' : '');

            container.innerHTML += `
                <div class="cart-item">

                    <input type="checkbox" class="cart-check" data-id="${item.id}" checked onchange="updateSummaryFromSelection()"s>
                    <img class="cart-img" src="${img}" />

                    <div class="cart-info">
                        <div class="cart-name">
                            ${productName}
                        </div>
                        <div class="cart-total-price">
                            ৳ ${item.total}
                        </div>
                        <div class="cart-subtotal-mini">
                            ${item.quantity} x ৳ ${newPrice}
                        </div>
                    </div>

                    <div class="cart-qty">
                        <button onclick="changeQty(${item.id}, ${item.quantity - 1})">−</button>
                        <span>${item.quantity}</span>
                        <button onclick="changeQty(${item.id}, ${item.quantity + 1})">+</button>
                    </div>

                    <button class="remove-btn" onclick="removeCartItem(${item.id})">×</button>

                </div>
            `;

        });

        // initial summary = all selected
        setTimeout(() => {
            updateSummaryFromSelection();
        }, 100);

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p style="color:red">Failed to load cart</p>`;
    }
}

/* =========================
   CHECKOUT BUTTON FIX (IMPORTANT)
========================= */
function goToCheckout() {

    const selected = getSelectedItems();

    if (!selected.length) {
        toast("Select at least one product");
        return;
    }

    const selectedIds = selected.map(i => i.id);

    localStorage.setItem(
        "checkout_cart_ids",
        JSON.stringify(selectedIds)
    );

    window.location.href = "checkout.html";
}

/* =========================
   QTY
========================= */
async function changeQty(cartId, quantity) {
    if (quantity < 1) return;

    const res = await fetch(`${API_BASE}/cart/update/${cartId}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({ quantity })
    });

    const data = await res.json();

    if (data.status) loadCartItems();
}

/* =========================
   REMOVE
========================= */
async function removeCartItem(cartId) {

    const res = await fetch(`${API_BASE}/cart/remove/${cartId}/`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    });

    const data = await res.json();

    if (data.status) loadCartItems();
}

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
    loadCartItems();
});
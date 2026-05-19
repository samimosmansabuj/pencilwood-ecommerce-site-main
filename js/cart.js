
document.addEventListener("DOMContentLoaded", () => {
    loadCartItems();
});

/* =========================
   TOKEN
========================= */
function getToken() {
    return (
        localStorage.getItem("access") ||
        localStorage.getItem("token") ||
        ""
    );
}

/* =========================
   LOAD CART ITEMS
========================= */
async function loadCartItems() {

    const container = document.getElementById("cartItemsContainer");
    const summaryList = document.getElementById("cartSummaryList");
    const subtotalEl = document.getElementById("cartSubtotal");

    if (!container) return;

    container.innerHTML = `<p>Loading cart...</p>`;

    try {

        const res = await fetch(`${API_BASE}/cart/`, {
            method: "GET",
            headers: {
                "Authorization": `Token ${getToken()}`
            }
        });

        const data = await res.json();

        console.log("CART RESPONSE:", data);

        if (!data.status || !data.data?.length) {

            container.innerHTML = `<p>Your cart is empty 🛒</p>`;
            summaryList.innerHTML = "";
            subtotalEl.innerText = "৳ 0";
            return;
        }

        const items = data.data;

        container.innerHTML = "";
        summaryList.innerHTML = "";

        let total = 0;

        items.forEach(item => {

            total += item.total || (item.price * item.quantity);

            container.innerHTML += `
                <div class="cart-item">

                    <div class="cart-item-left">

                        <div class="cart-item-info">
                            <h3>${item.product}</h3>

                            ${item.variant ? `<p>${item.variant}</p>` : ""}

                            <div class="cart-price">
                                ৳ ${item.price}
                            </div>

                            <div class="cart-qty">
                                <button onclick="changeQty(${item.id}, ${item.quantity - 1})">-</button>
                                <span>${item.quantity}</span>
                                <button onclick="changeQty(${item.id}, ${item.quantity + 1})">+</button>
                            </div>

                        </div>
                    </div>

                    <div class="cart-item-right">
                        <div class="cart-total">
                            ৳ ${item.total}
                        </div>

                        <button onclick="removeCartItem(${item.id})">
                            Remove
                        </button>
                    </div>

                </div>
            `;

            summaryList.innerHTML += `
                <div class="summary-row">
                    <span>${item.product} × ${item.quantity}</span>
                    <span>৳ ${item.total}</span>
                </div>
            `;
        });

        subtotalEl.innerText = `৳ ${total}`;

    } catch (err) {

        console.error("CART ERROR:", err);

        container.innerHTML = `<p style="color:red">Failed to load cart</p>`;
    }
}

/* =========================
   UPDATE QTY
========================= */
async function changeQty(cartId, quantity) {

    if (quantity < 1) return;

    try {

        const res = await fetch(`${API_BASE}/cart/update/${cartId}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${getToken()}`
            },
            body: JSON.stringify({ quantity })
        });

        const data = await res.json();

        if (data.status) {
            toast("Updated");
            loadCartItems();
        } else {
            toast(data.message || "Failed");
        }

    } catch (err) {
        console.error(err);
        toast("Error updating cart");
    }
}

/* =========================
   REMOVE ITEM
========================= */
async function removeCartItem(cartId) {

    try {

        const res = await fetch(`${API_BASE}/cart/remove/${cartId}/`, {
            method: "DELETE",
            headers: {
                "Authorization": `Token ${getToken()}`
            }
        });

        const data = await res.json();

        if (data.status) {
            toast("Removed");
            loadCartItems();
        } else {
            toast(data.message || "Failed");
        }

    } catch (err) {
        console.error(err);
        toast("Error removing item");
    }
}

/* =========================
   CHECKOUT
========================= */
function goToCheckout() {

    const selected = [];

    document.querySelectorAll(".cart-check:checked").forEach(cb => {
        selected.push(cb.dataset.id);
    });

    if (!selected.length) {
        toast("Select items first");
        return;
    }

    localStorage.setItem(
        "checkout_cart_ids",
        JSON.stringify(selected)
    );

    window.location.href = "checkout.html";
}

/* =========================
   TOAST
========================= */
function toast(msg) {

    const c = document.getElementById("toast-container");

    if (!c) {
        alert(msg);
        return;
    }

    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;

    c.appendChild(el);

    setTimeout(() => el.classList.add("show"), 50);

    setTimeout(() => {
        el.classList.remove("show");
        setTimeout(() => el.remove(), 300);
    }, 2000);
}
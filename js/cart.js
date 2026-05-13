/* =========================
   CONFIG
========================= */
const API_BASE = "http://127.0.0.1:8000";

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
    loadCartItems();
});

/* =========================
   AUTH TOKEN
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

    container.innerHTML = `<p>Loading cart...</p>`;

    try {

        const response = await fetch(`${API_BASE}/cart/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${getToken()}`
            }
        });

        const data = await response.json();

        console.log("CART DATA:", data);

        if (!data.status) {
            container.innerHTML = `
                <p>Your cart is empty 🛒</p>
            `;
            summaryList.innerHTML = "";
            subtotalEl.innerText = "৳ 0";
            return;
        }

        const items = data.data || [];

        if (!items.length) {
            container.innerHTML = `
                <p>Your cart is empty 🛒</p>
            `;
            summaryList.innerHTML = "";
            subtotalEl.innerText = "৳ 0";
            return;
        }

        container.innerHTML = "";
        summaryList.innerHTML = "";

        items.forEach(item => {

            const itemHTML = `
                <div class="cart-item">

                    <div class="cart-item-left">

                        <input 
                            type="checkbox"
                            class="cart-check"
                            data-id="${item.id}"
                            checked
                        >

                        <div class="cart-item-info">
                            <h3>${item.product}</h3>

                            ${
                                item.variant
                                ? `<p>${item.variant}</p>`
                                : ""
                            }

                            <div class="cart-price">
                                ৳ ${item.price}
                            </div>

                            <div class="cart-qty">

                                <button onclick="changeQty(${item.id}, ${item.quantity - 1})">
                                    -
                                </button>

                                <span>${item.quantity}</span>

                                <button onclick="changeQty(${item.id}, ${item.quantity + 1})">
                                    +
                                </button>

                            </div>

                        </div>

                    </div>

                    <div class="cart-item-right">

                        <div class="cart-total">
                            ৳ ${item.total}
                        </div>

                        <button 
                            class="remove-btn"
                            onclick="removeCartItem(${item.id})"
                        >
                            Remove
                        </button>

                    </div>

                </div>
            `;

            container.innerHTML += itemHTML;

            summaryList.innerHTML += `
                <div class="summary-row">
                    <span>
                        ${item.product} × ${item.quantity}
                    </span>

                    <span>
                        ৳ ${item.total}
                    </span>
                </div>
            `;
        });

        subtotalEl.innerText = `৳ ${data.cart_total}`;

    } catch (error) {

        console.error("CART LOAD ERROR:", error);

        container.innerHTML = `
            <p style="color:red">
                Failed to load cart
            </p>
        `;
    }
}

/* =========================
   UPDATE QUANTITY
========================= */
async function changeQty(cartId, quantity) {

    if (quantity < 1) return;

    try {

        const response = await fetch(
            `${API_BASE}/cart/update/${cartId}/`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Token ${getToken()}`
                },
                body: JSON.stringify({
                    quantity: quantity
                })
            }
        );

        const data = await response.json();

        if (data.status) {

            toast("Cart updated");

            loadCartItems();

        } else {

            toast(data.message || "Update failed");
        }

    } catch (error) {

        console.error(error);

        toast("Something went wrong");
    }
}

/* =========================
   REMOVE CART ITEM
========================= */
async function removeCartItem(cartId) {

    try {

        const response = await fetch(
            `${API_BASE}/cart/remove/${cartId}/`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Token ${getToken()}`
                }
            }
        );

        const data = await response.json();

        if (data.status) {

            toast("Removed from cart");

            loadCartItems();

        } else {

            toast(data.message || "Remove failed");
        }

    } catch (error) {

        console.error(error);

        toast("Something went wrong");
    }
}

/* =========================
   CHECKOUT
========================= */
function goToCheckout() {

    const selected = [];

    document.querySelectorAll(".cart-check:checked")
        .forEach(cb => {
            selected.push(cb.dataset.id);
        });

    if (!selected.length) {

        toast("Select at least one item");

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
function toast(message) {

    const container =
        document.getElementById("toast-container");

    if (!container) {
        alert(message);
        return;
    }

    const toastEl = document.createElement("div");

    toastEl.className = "toast";
    toastEl.innerText = message;

    container.appendChild(toastEl);

    setTimeout(() => {
        toastEl.classList.add("show");
    }, 50);

    setTimeout(() => {

        toastEl.classList.remove("show");

        setTimeout(() => {
            toastEl.remove();
        }, 300);

    }, 2000);
}
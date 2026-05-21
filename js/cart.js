/* =========================
   ── TOKEN
========================= */
function getToken() {

    return (
        localStorage.getItem("access") ||
        localStorage.getItem("token") ||
        ""
    );
}

/* =========================
   ── LOAD CART ITEMS
========================= */
async function loadCartItems() {

    const container =
        document.getElementById(
            "cartItemsContainer"
        );

    const summaryList =
        document.getElementById(
            "cartSummaryList"
        );

    const subtotalEl =
        document.getElementById(
            "cartSubtotal"
        );

    const grandTotalEl =
        document.getElementById(
            "cartGrandTotal"
        );

    const itemCountEl =
        document.getElementById(
            "cartItemCount"
        );

    const emptyBox =
        document.getElementById(
            "emptyCartBox"
        );

    if (!container) return;

    container.innerHTML = `
        <p>Loading cart...</p>
    `;

    try {

        const res = await fetch(
            `${API_BASE}/cart/`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Token ${getToken()}`
                }
            }
        );

        const data =
            await res.json();

        console.log(
            "CART RESPONSE:",
            data
        );

        if (
            !data.status ||
            !Array.isArray(data.data)
        ) {

            container.innerHTML = `
                <p>
                    Failed to load cart
                </p>
            `;

            return;
        }

        const items = data.data;

        /* EMPTY CART */
        if (!items.length) {

            document.querySelector(".cart-layout").style.display = "none";
            
            summaryList.innerHTML = "";

            subtotalEl.textContent =
                "৳ 0";

            grandTotalEl.textContent =
                "৳ 0";

            itemCountEl.textContent =
                "0 Items";

            emptyBox.style.display =
                "block";

            return;
        }

        emptyBox.style.display =
            "none";

        document.querySelector(".cart-layout").style.display = "grid";
        summaryList.innerHTML = "";

        let totalQty = 0;

        items.forEach(item => {

            totalQty += Number(
                item.quantity || 0
            );

            container.innerHTML += `
            <div class="cart-item">

                <div class="cart-item-left">

                    <input
                        type="checkbox"
                        class="cart-check"
                        data-id="${item.id}"
                        checked>

                    <div class="cart-item-info">

                        <h3>
                            ${item.product}
                        </h3>

                        ${
                            item.variant
                            ? `
                            <p>
                                ${
                                    typeof item.variant === "object"
                                    ? Object.entries(item.variant)
                                        .map(([k, v]) => `${k}: ${v}`)
                                        .join(", ")
                                    : item.variant
                                }
                            </p>
                            `
                            : ""
                        }

                        <div class="cart-price">
                            ৳ ${item.price}
                        </div>

                        <div class="cart-qty">

                            <button
                                onclick="changeQty(${item.id}, ${item.quantity - 1})">

                                −

                            </button>

                            <span>
                                ${item.quantity}
                            </span>

                            <button
                                onclick="changeQty(${item.id}, ${item.quantity + 1})">

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
                        onclick="removeCartItem(${item.id})">

                        Remove

                    </button>

                </div>

            </div>
            `;

            summaryList.innerHTML += `
            <div class="summary-row">

                <span>
                    ${item.product}
                    × ${item.quantity}
                </span>

                <span>
                    ৳ ${item.total}
                </span>

            </div>
            `;
        });

        /* BACKEND TOTAL */
        subtotalEl.textContent =
            `৳ ${data.cart_total}`;

        grandTotalEl.textContent =
            `৳ ${data.cart_total}`;

        itemCountEl.textContent =
            `${totalQty} Items`;

        updateCartCountFromBackend?.();

    } catch (err) {

        console.error(
            "CART ERROR:",
            err
        );

        container.innerHTML = `
            <p style="color:red">
                Failed to load cart
            </p>
        `;
    }
}

/* =========================
   ── UPDATE QTY
========================= */
async function changeQty(
    cartId,
    quantity
) {

    if (quantity < 1) return;

    try {

        const res = await fetch(
            `${API_BASE}/cart/update/${cartId}/`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Token ${getToken()}`
                },

                body: JSON.stringify({
                    quantity
                })
            }
        );

        const data =
            await res.json();

        if (data.status) {

            toast(
                "Cart updated"
            );

            loadCartItems();

        } else {

            toast(
                data.message ||
                "Update failed"
            );
        }

    } catch (err) {

        console.error(err);

        toast(
            "Error updating cart"
        );
    }
}

/* =========================
   ── REMOVE ITEM
========================= */
async function removeCartItem(
    cartId
) {

    try {

        const res = await fetch(
            `${API_BASE}/cart/remove/${cartId}/`,
            {
                method: "DELETE",

                headers: {
                    "Authorization":
                        `Token ${getToken()}`
                }
            }
        );

        const data =
            await res.json();

        if (data.status) {

            toast(
                "Removed from cart"
            );

            loadCartItems();

        } else {

            toast(
                data.message ||
                "Remove failed"
            );
        }

    } catch (err) {

        console.error(err);

        toast(
            "Error removing item"
        );
    }
}

/* =========================
   ── CHECKOUT
========================= */
function goToCheckout() {

    const selected = [];

    document
        .querySelectorAll(
            ".cart-check:checked"
        )
        .forEach(cb => {

            selected.push(
                cb.dataset.id
            );
        });

    if (!selected.length) {

        toast(
            "Select at least one item"
        );

        return;
    }

    localStorage.setItem(
        "checkout_cart_ids",
        JSON.stringify(selected)
    );

    window.location.href =
        "checkout.html";
}

/* =========================
   ── INIT
========================= */
window.addEventListener(
    "DOMContentLoaded",
    () => {

        loadCartItems();

        updateCartCountFromBackend?.();
    }
);
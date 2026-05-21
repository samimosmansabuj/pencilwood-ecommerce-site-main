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
   ── LOAD WISHLIST
========================= */
async function loadWishlist() {

    const container =
        document.getElementById(
            "wishlistContainer"
        );

    const emptyBox =
        document.getElementById(
            "emptyWishlist"
        );

    const countText =
        document.getElementById(
            "wishlistCountText"
        );

    if (!container) return;

    container.innerHTML = `
        <p>Loading wishlist...</p>
    `;

    try {

        const response = await fetch(
            `${API_BASE}/wishlist/`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Token ${getToken()}`
                }
            }
        );

        const data =
            await response.json();

        console.log(
            "WISHLIST RESPONSE:",
            data
        );

        if (
            !data.status ||
            !Array.isArray(data.data)
        ) {

            container.innerHTML = `
                <p>
                    Failed to load wishlist
                </p>
            `;

            return;
        }

        const items = data.data;

        /* EMPTY */
        if (!items.length) {

            container.style.display =
                "none";

            emptyBox.style.display =
                "flex";

            countText.textContent =
                "0 Items";

            return;
        }

        container.style.display =
            "grid";

        emptyBox.style.display =
            "none";

        container.innerHTML = "";

        countText.textContent =
            `${items.length} Item${items.length > 1 ? "s" : ""}`;

        items.forEach(item => {

            const image =
                item.image
                    ? (
                        item.image.startsWith("http")
                            ? item.image
                            : API_BASE + item.image
                    )
                    : "";

            const slug =
                item.slug || "";

            container.innerHTML += `
            <div class="prod-card">

                <div
                    class="prod-img"
                    onclick="openProduct('${slug}')">

                    <img
                        src="${image}"
                        alt="${item.name}">

                </div>

                <div
                    class="prod-name"
                    onclick="openProduct('${slug}')">

                    ${item.name}

                </div>

                <div class="prod-price">

                    ৳ ${
                        item.discount_price ||
                        item.price
                    }

                    ${
                        item.discount_price
                        ? `
                        <span class="prod-orig">
                            ৳ ${item.price}
                        </span>
                        `
                        : ""
                    }

                </div>

                <div class="wishlist-actions">

                    <button
                        class="prod-cart"
                        onclick="addToCart(${item.product_id})">

                        + Cart

                    </button>

                    <button
                        class="remove-btn"
                        onclick="removeWishlist(${item.id})">

                        Remove

                    </button>

                </div>

            </div>
            `;
        });

    } catch (error) {

        console.error(
            "WISHLIST ERROR:",
            error
        );

        container.innerHTML = `
            <p style="color:red">
                Failed to load wishlist
            </p>
        `;
    }
}

/* =========================
   ── REMOVE WISHLIST
========================= */
async function removeWishlist(id) {

    try {

        const response = await fetch(
            `${API_BASE}/wishlist/remove/${id}/`,
            {
                method: "DELETE",

                headers: {
                    "Authorization":
                        `Token ${getToken()}`
                }
            }
        );

        const data =
            await response.json();

        if (data.status) {

            toast?.(
                "Removed from wishlist"
            );

            loadWishlist();

            updateWishlistCount?.();

        } else {

            toast?.(
                data.message ||
                "Remove failed"
            );
        }

    } catch (error) {

        console.error(error);

        toast?.(
            "Something went wrong"
        );
    }
}

/* =========================
   ── ADD TO CART
========================= */
async function addToCart(productId) {

    try {

        const response = await fetch(
            `${API_BASE}/cart/add/`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Token ${getToken()}`
                },

                body: JSON.stringify({
                    product_id: productId,
                    quantity: 1
                })
            }
        );

        const data =
            await response.json();

        if (data.status) {

            toast?.(
                "Added to cart 🛒"
            );

            updateCartCountFromBackend?.();

        } else {

            toast?.(
                data.message ||
                "Failed to add"
            );
        }

    } catch (error) {

        console.error(error);

        toast?.(
            "Something went wrong"
        );
    }
}

/* =========================
   ── OPEN PRODUCT
========================= */
function openProduct(slug) {

    if (!slug) return;

    window.location.href =
        `product-details.html?slug=${slug}`;
}

/* =========================
   ── INIT
========================= */
window.addEventListener(
    "DOMContentLoaded",
    () => {

        loadWishlist();

        updateCartCountFromBackend?.();

        updateWishlistCount?.();
    }
);
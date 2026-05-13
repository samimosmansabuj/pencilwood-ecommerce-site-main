/* =========================
   CONFIG
========================= */
const API_BASE = "http://127.0.0.1:8000";

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
    loadWishlist();
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
   LOAD WISHLIST
========================= */
async function loadWishlist() {

    const container =
        document.getElementById("wishlistContainer");

    container.innerHTML = `
        <p>Loading wishlist...</p>
    `;

    try {

        const response = await fetch(
            `${API_BASE}/wishlist/`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Token ${getToken()}`
                }
            }
        );

        const data = await response.json();

        console.log("WISHLIST:", data);

        if (!data.status || !data.data.length) {

            container.innerHTML = `
                <p>Your wishlist is empty ❤️</p>
            `;

            return;
        }

        container.innerHTML = "";

        data.data.forEach(item => {

            const slug = item.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-");

            container.innerHTML += `
                <div class="prod-card">

                    <div class="prod-img"
                         onclick="openProduct('${slug}')">

                        <img 
                            src="${item.image ? API_BASE + item.image : ''}"
                            alt="${item.name}"
                        >

                    </div>

                    <div class="prod-name"
                         onclick="openProduct('${slug}')">

                        ${item.name}

                    </div>

                    <div class="prod-price">

                        ৳ ${item.discount_price || item.price}

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

        console.error("WISHLIST ERROR:", error);

        container.innerHTML = `
            <p style="color:red">
                Failed to load wishlist
            </p>
        `;
    }
}

/* =========================
   REMOVE WISHLIST
========================= */
async function removeWishlist(id) {

    try {

        const response = await fetch(
            `${API_BASE}/wishlist/remove/${id}/`,
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

            toast("Removed from wishlist");

            loadWishlist();

        } else {

            toast(data.message || "Remove failed");
        }

    } catch (error) {

        console.error(error);

        toast("Something went wrong");
    }
}

/* =========================
   ADD TO CART
========================= */
async function addToCart(productId) {

    try {

        const response = await fetch(
            `${API_BASE}/cart/add/`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Token ${getToken()}`
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: 1
                })
            }
        );

        const data = await response.json();

        if (data.status) {

            toast("Added to cart 🛒");

        } else {

            toast(data.message || "Failed to add");
        }

    } catch (error) {

        console.error(error);

        toast("Something went wrong");
    }
}

/* =========================
   OPEN PRODUCT
========================= */
function openProduct(slug) {

    window.location.href =
        `product-details.html?slug=${slug}`;
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
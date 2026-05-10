let CURRENT_PRODUCT = null;

async function loadProductDetails() {
    const params = new URLSearchParams(window.location.search);

    const slug = params.get("slug");

    if (!slug) {
        console.error("No slug found in URL");
        return;
    }

    const url = `${API_BASE}/api/ecom/products/${slug}/`;

    console.log("FETCH URL:", url);

    try {
        const res = await fetch(url);
        const data = await res.json();

        console.log("API RESPONSE:", data);

        if (!data || data.status === false) {
            console.error("Product not found");
            return;
        }

        const product = data.data || data;

        CURRENT_PRODUCT = product;

        /* =========================
           FIELD MAPPING
        ========================= */
        const name = product.name || "Untitled";
        const price = Number(product.price || 0);
        const discountPrice = product.discount_price || null;

        let image = product.image || "";

        if (image && !image.startsWith("http")) {
            image = API_BASE + image;
        }

        const finalPrice = discountPrice || price;

        /* =========================
           DOM UPDATE
        ========================= */
        const img = document.getElementById("productImage");
        if (img) img.src = image;

        const title = document.getElementById("productTitle");
        if (title) title.textContent = name;

        const priceEl = document.getElementById("productPrice");
        if (priceEl) priceEl.textContent = `৳ ${finalPrice}`;

        const oldPriceEl = document.getElementById("productOldPrice");
        if (oldPriceEl) {
            oldPriceEl.textContent =
                discountPrice && price > discountPrice ? `৳ ${price}` : "";
        }

        const stickyPrice = document.getElementById("stickyPrice");
        if (stickyPrice) stickyPrice.textContent = `৳ ${finalPrice}`;

        const stickyOldPrice = document.getElementById("stickyOldPrice");
        if (stickyOldPrice) {
            stickyOldPrice.textContent =
                discountPrice && price > discountPrice ? `৳ ${price}` : "";
        }

        const discountEl = document.getElementById("productDiscount");

        if (discountEl && discountPrice && price > discountPrice) {
            const off = Math.round(((price - discountPrice) / price) * 100);
            discountEl.textContent = `${off}% OFF`;
        }

    } catch (err) {
        console.error("Product load failed:", err);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    loadProductDetails();
    updateCartCount?.();
});
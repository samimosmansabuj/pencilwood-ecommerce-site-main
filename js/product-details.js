let CURRENT_PRODUCT = null;

async function loadProductDetails() {

    const params = new URLSearchParams(window.location.search);

    const slug = params.get("slug");

    if (!slug) {
        console.error("No slug found");
        return;
    }

    try {

        const url =
            `${API_BASE}/api/ecom/products/${slug}/`;

        console.log("DETAIL URL:", url);

        const res = await fetch(url);

        const data = await res.json();

        console.log("DETAIL RESPONSE:", data);

        if (!data || data.status === false) {
            console.error("Product not found");
            return;
        }

        const product = data.data;

        CURRENT_PRODUCT = product;

        // =========================
        // BASIC DATA
        // =========================

        const name = product.name || "";

        const price =
            Number(product.price || 0);

        const discountPrice =
            product.discount_price
                ? Number(product.discount_price)
                : null;

        const finalPrice =
            discountPrice || price;

        const stock =
            Number(product.stock || 0);

        const brand =
            product.brand_name || "Pencilwood";

        const sku =
            product.sku || "";

        const shortDescription =
            product.short_description || "";

        const rating =
            product.rating || "4.8";

        const reviewCount =
            product.review_count || 0;

        const soldCount =
            product.sold_count || 0;

        // =========================
        // MAIN IMAGE
        // =========================

        let image = "";

        if (product.images?.length > 0) {
            image = product.images[0];
        }

        if (image && !image.startsWith("http")) {
            image = API_BASE + image;
        }

        const img =
            document.getElementById("productImage");

        if (img) {
            img.src = image;
        }

        // =========================
        // TITLE
        // =========================

        const title =
            document.getElementById("productTitle");

        if (title) {
            title.textContent = name;
        }

        // =========================
        // SHORT DESCRIPTION
        // =========================

        const shortDesc =
            document.querySelector(".prod-bn");

        if (shortDesc && shortDescription) {
            shortDesc.textContent =
                shortDescription;
        }

        // =========================
        // BRAND
        // =========================

        const brandEl =
            document.querySelector(".brand-lnk");

        if (brandEl) {
            brandEl.textContent = brand;
        }

        // =========================
        // SKU
        // =========================

        const skuEl =
            document.querySelector(".sku-lbl");

        if (skuEl) {
            skuEl.textContent =
                `SKU: ${sku}`;
        }

        // =========================
        // PRICE
        // =========================

        const priceEl =
            document.getElementById("productPrice");

        if (priceEl) {
            priceEl.textContent =
                `৳ ${finalPrice}`;
        }

        // =========================
        // OLD PRICE
        // =========================

        const oldPriceEl =
            document.getElementById("productOldPrice");

        if (oldPriceEl) {

            oldPriceEl.textContent =
                discountPrice &&
                price > discountPrice
                    ? `৳ ${price}`
                    : "";
        }

        // =========================
        // STICKY PRICE
        // =========================

        const stickyPrice =
            document.getElementById("stickyPrice");

        if (stickyPrice) {
            stickyPrice.textContent =
                `৳ ${finalPrice}`;
        }

        // =========================
        // STICKY OLD PRICE
        // =========================

        const stickyOldPrice =
            document.getElementById("stickyOldPrice");

        if (stickyOldPrice) {

            stickyOldPrice.textContent =
                discountPrice &&
                price > discountPrice
                    ? `৳ ${price}`
                    : "";
        }

        // =========================
        // DISCOUNT
        // =========================

        const discountEl =
            document.getElementById("productDiscount");

        if (
            discountEl &&
            discountPrice &&
            price > discountPrice
        ) {

            const off = Math.round(
                ((price - discountPrice) / price) * 100
            );

            discountEl.textContent =
                `${off}% OFF`;

        } else if (discountEl) {

            discountEl.textContent = "";
        }

        // =========================
        // TOP SALE BADGE
        // =========================

        const saleBadge =
            document.querySelector(".g-sale");

        if (
            saleBadge &&
            discountPrice &&
            price > discountPrice
        ) {

            const off = Math.round(
                ((price - discountPrice) / price) * 100
            );

            saleBadge.textContent =
                `-${off}% OFF`;

        } else if (saleBadge) {

            saleBadge.style.display = "none";
        }

        // =========================
        // RATING
        // =========================

        const scoreEl =
            document.querySelector(".r-score");

        if (scoreEl) {
            scoreEl.textContent = rating;
        }

        // =========================
        // REVIEW COUNT
        // =========================

        const reviewEl =
            document.querySelector(".r-cnt");

        if (reviewEl) {
            reviewEl.textContent =
                `${reviewCount} ratings`;
        }

        // =========================
        // SOLD COUNT
        // =========================

        const soldEl =
            document.querySelector(".r-sold");

        if (soldEl) {
            soldEl.textContent =
                `${soldCount}+ sold`;
        }

        // =========================
        // STOCK
        // =========================

        const stockLeft =
            document.getElementById("stockLeft");

        if (stockLeft) {
            stockLeft.textContent = stock;
        }

        const stockChip =
            document.querySelector(".stock-chip");

        if (stockChip) {

            if (stock > 0) {

                stockChip.innerHTML =
                    "✔ In Stock";

            } else {

                stockChip.innerHTML =
                    "✖ Out of Stock";
            }
        }

        // =========================
        // DESCRIPTION
        // =========================

        const descBody =
            document.querySelector(".desc-body");

        if (
            descBody &&
            product.description
        ) {

            descBody.textContent =
                product.description;
        }

        // =========================
        // BUY NOW BUTTON
        // =========================

        const buyBtn =
            document.getElementById("buyBtn");

        if (buyBtn) {

            buyBtn.onclick = () => {

                window.location.href =
                    `checkout.html?slug=${slug}`;
            };
        }

        // =========================
        // STICKY BUY BUTTON
        // =========================

        const stickyBuyBtn =
            document.getElementById("stickyBuyBtn");

        if (stickyBuyBtn) {

            stickyBuyBtn.onclick = () => {

                window.location.href =
                    `checkout.html?slug=${slug}`;
            };
        }

    } catch (err) {

        console.error(
            "PRODUCT DETAILS ERROR:",
            err
        );
    }
}


window.addEventListener("DOMContentLoaded", () => {

    loadProductDetails();

    updateCartCount?.();
});
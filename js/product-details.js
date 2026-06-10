/* =========================
   PRODUCT DETAILS JS
========================= */

let CURRENT_PRODUCT = null;

/* =========================
   LOAD PRODUCT DETAILS
========================= */
async function loadProductDetails() {

    const params =
        new URLSearchParams(window.location.search);

    const slug =
        params.get("slug");

    if (!slug) {
        console.error("No slug found");
        return;
    }

    try {

        const res = await fetch(
            `${API_BASE}/api/ecom/products/${slug}/`
        );

        const data = await res.json();

        let product = null;

        if (data?.data) {
            product = data.data;
        }
        else {
            product = data;
        }

        if (!product) {
            console.error("Product not found");
            return;
        }

        CURRENT_PRODUCT = product;

        /* =========================
           BASIC DATA
        ========================= */

        const name =
            product.name || "";

        const price =
            Number(product.price || 0);

        const discountPrice =
            Number(product.discount_price || 0);

        const finalPrice =
            discountPrice || price;

        const stock =
            parseInt(product.stock ?? 0, 10);

        const sku =
            product.sku || "";

        const rating =
            Number(product.rating || 4.8);

        const reviewCount =
            Number(product.review_count || 500);

        const soldCount =
            Number(product.sold_count || 1000);

        /* =========================
           IMAGE FIX
        ========================= */

        let image = "";

        if (
            product.images &&
            Array.isArray(product.images) &&
            product.images.length > 0
        ) {

            image = product.images[0];
        }
        else if (product.image) {

            image = product.image;
        }

        if (
            image &&
            !image.startsWith("http")
        ) {

            image =
                API_BASE + image;
        }

        const productImage =
            document.getElementById(
                "productImage"
            );

        if (productImage) {

            productImage.src = image;

            productImage.onerror = () => {
                productImage.src =
                    "https://placehold.co/600x600?text=No+Image";
            };
        }

        /* =========================
           THUMB IMAGES
        ========================= */

        const thumbGrid =
            document.getElementById(
                "thumbGrid"
            );

        if (thumbGrid) {

            thumbGrid.innerHTML = "";

            let images = [];

            if (
                product.images &&
                Array.isArray(product.images)
            ) {

                images = product.images;
            }
            else if (product.image) {

                images = [product.image];
            }

            images.forEach(img => {

                let finalImg = img;

                if (
                    finalImg &&
                    !finalImg.startsWith("http")
                ) {

                    finalImg =
                        API_BASE + finalImg;
                }

                thumbGrid.innerHTML += `
                <div
                    class="thumb"
                    onclick="
                        document.getElementById('productImage').src='${finalImg}'
                    ">

                    <img
                        src="${finalImg}"
                        alt="${name}">

                </div>
                `;
            });
        }

        /* =========================
           TITLE
        ========================= */

        document.getElementById(
            "productTitle"
        ).textContent =
            name;

        /* =========================
           SHORT DESCRIPTION
        ========================= */

        document.getElementById(
            "productShortDescription"
        ).textContent =
            product.short_description ||
            "";

        /* =========================
           SKU
        ========================= */

        document.getElementById(
            "productSKU"
        ).textContent =
            sku
                ? `SKU: ${sku}`
                : "";

        /* =========================
           PRICE
        ========================= */

        document.getElementById(
            "productPrice"
        ).textContent =
            `৳ ${finalPrice}`;

        document.getElementById(
            "stickyPrice"
        ).textContent =
            `৳ ${finalPrice}`;

        /* OLD PRICE */

        const oldPriceText =
            (
                discountPrice &&
                discountPrice < price
            )
                ? `৳ ${price}`
                : "";

        document.getElementById(
            "productOldPrice"
        ).textContent =
            oldPriceText;

        document.getElementById(
            "stickyOldPrice"
        ).textContent =
            oldPriceText;

        /* =========================
           DISCOUNT
        ========================= */

        const discountEl =
            document.getElementById(
                "productDiscount"
            );

        if (
            discountPrice &&
            discountPrice < price
        ) {

            const off =
                Math.round(
                    ((price - discountPrice) / price) * 100
                );

            discountEl.textContent =
                `${off}% OFF`;

        }
        else {

            discountEl.textContent = "";
        }

        /* =========================
           STOCK
        ========================= */

        const stockLeftEl =
            document.getElementById("stockLeft");

        const stockStatusEl =
            document.getElementById("stockStatus");

        // DEFAULT hide stock note
        stockLeftEl.parentElement.style.display = "none";

        if (stock <= 0) {

            stockStatusEl.textContent = "✖ Out of Stock";
            stockStatusEl.style.color = "#dc2626";

        } else if (stock <= 10) {

            stockStatusEl.textContent = `⚠ Only ${stock} left`;
            stockStatusEl.style.color = "#dc2626";

            stockLeftEl.textContent = stock;
            stockLeftEl.parentElement.style.display = "block";

        } else {

            stockStatusEl.textContent = "✔ In Stock";
            stockStatusEl.style.color = "#16a34a";
        }

        const isOutOfStock = stock <= 0;

        const buttons = [
            document.getElementById("buyBtn"),
            document.getElementById("stickyBuyBtn"),
            document.getElementById("ctaBuyBtn"),
            document.getElementById("cartBtn"),
            document.getElementById("cartBtnSticky")
        ];
        
        buttons.forEach(btn => {
        
            if (!btn) return;
        
            if (isOutOfStock) {
        
                btn.disabled = true;
                btn.style.opacity = "0.5";
                btn.style.cursor = "not-allowed";
                btn.innerText = "Out of Stock";
        
            } else {
        
                btn.disabled = false;
                btn.style.opacity = "1";
                btn.style.cursor = "pointer";
            }
        });



        /* =========================
           RATING
        ========================= */

        document.querySelector(
            ".r-score"
        ).textContent =
            rating;

        document.querySelector(
            ".r-cnt"
        ).textContent =
            `${reviewCount} ratings`;

        document.querySelector(
            ".r-sold"
        ).textContent =
            `${soldCount}+ sold`;

        mkStars("prodStars", rating, 16);
        mkStars("bigStars", rating, 20);

        /* =========================
           DESCRIPTION
        ========================= */

        const desc =
            document.getElementById(
                "productDescription"
            );

        if (desc) {

            desc.textContent =
                product.description ||
                "No description available.";
        }

        /* =========================
           DELIVERY SECTION FIX
        ========================= */

        const deliveryNote =
            document.getElementById(
                "deliveryNote"
            );

        if (deliveryNote) {

            deliveryNote.innerHTML = `
                🚚 Dhaka: 1-2 Days Delivery · 
                Outside Dhaka: 2-4 Days
            `;
        }

        /* =========================
           BUTTONS
        ========================= */

        setupButtons(product, slug);
        initWishlist(product.id);

        /* =========================
           RELATED PRODUCTS
        ========================= */

        loadRelatedProducts(product);

    }
    catch (err) {

        console.error(
            "PRODUCT DETAILS ERROR:",
            err
        );
    }
}

/* =========================
   BUTTONS
========================= */
function setupButtons(product, slug) {

    const buyBtns = [
        document.getElementById("buyBtn"),
        document.getElementById("stickyBuyBtn"),
        document.getElementById("ctaBuyBtn")
    ];

    buyBtns.forEach(btn => {

        if (!btn) return;
    
        btn.onclick = async () => {
    
            try {
    
                const token =
                    localStorage.getItem("access") ||
                    localStorage.getItem("token");
    
                if (!token) {
    
                    alert("Please login first");
                    return;
                }
    
                // ADD TO CART
                const addRes = await fetch(
                    `${API_BASE}/cart/add/`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            product_id: product.id,
                            quantity: 1
                        })
                    }
                );
    
                if (!addRes.ok) {
    
                    const errorText =
                        await addRes.text();
    
                    console.error(
                        "ADD CART ERROR:",
                        errorText
                    );
    
                    alert("Add to cart failed");
                    return;
                }
    
                const addData =
                    await addRes.json();
    
                console.log(
                    "ADD TO CART:",
                    addData
                );
    
                if (!addData.status) {
    
                    alert(
                        addData.message ||
                        "Failed to add cart"
                    );
    
                    return;
                }
    
                // LOAD CART
                const cartRes = await fetch(
                    `${API_BASE}/cart/`,
                    {
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    }
                );
    
                if (!cartRes.ok) {
    
                    const errorText =
                        await cartRes.text();
    
                    console.error(
                        "CART ERROR:",
                        errorText
                    );
    
                    alert("Failed to load cart");
                    return;
                }
    
                const cartData =
                    await cartRes.json();
    
                console.log(
                    "CART DATA:",
                    cartData
                );
    
                if (
                    !cartData.status ||
                    !Array.isArray(cartData.data) ||
                    !cartData.data.length
                ) {
    
                    alert("Cart is empty");
                    return;
                }
    
                // LAST ADDED ITEM
                const cartItem =
                    cartData.data[
                        cartData.data.length - 1
                    ];
    
                localStorage.setItem(
                    "checkout_cart_ids",
                    JSON.stringify([
                        cartItem.id
                    ])
                );
    
                console.log(
                    "checkout_cart_ids:",
                    localStorage.getItem(
                        "checkout_cart_ids"
                    )
                );
    
                window.location.href =
                    "checkout.html";
    
            }
            catch (err) {
    
                console.error(
                    "BUY NOW ERROR:",
                    err
                );
    
                alert(
                    "Buy now failed"
                );
            }
        };
    });

    const cartBtns = [
        document.getElementById("cartBtn"),
        document.getElementById("cartBtnSticky")
    ];

    cartBtns.forEach(btn => {

        if (!btn) return;

        btn.onclick = () => {
            quickAddCart(product.id);
        };
    });

    const waBtn =
        document.getElementById(
            "ctaWhatsappBtn"
        );

    if (waBtn) {

        waBtn.onclick = () => {

            const msg =
                `I want to order: ${product.name}`;

            window.open(
                `https://wa.me/?text=${encodeURIComponent(msg)}`,
                "_blank"
            );
        };
    }

    const wishBtn =
    document.getElementById("wishBtn");

    const wishIco =
        document.getElementById("wishIco");

    wishBtn?.addEventListener(
        "click",
        () => toggleWishlist(product.id)
    );

    wishIco?.addEventListener(
        "click",
        () => toggleWishlist(product.id)
    );
}


/* ========================= WISHLIST ========================= */

let WISHLIST_ID = null;
let IS_WISHLISTED = false;

async function initWishlist(productId) {

    const token =
        localStorage.getItem("access") ||
        localStorage.getItem("token");

    if (!token) return;

    try {

        const res = await fetch(
            `${API_BASE}/wishlist/`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await res.json();

        if (
            data.status &&
            Array.isArray(data.data)
        ) {

            const item =
                data.data.find(
                    x => x.product_id == productId
                );

            if (item) {

                IS_WISHLISTED = true;
                WISHLIST_ID = item.id;

                renderWishlistState();
            }
        }

    } catch (err) {

        console.error(err);
    }
}

function renderWishlistState() {

    const btn =
        document.getElementById("wishBtn");

    const icon =
        document.getElementById("wishIco");

    if (IS_WISHLISTED) {

        if (btn)
            btn.innerHTML =
            "❤️ Wishlisted";

        if (icon)
            icon.innerHTML = "❤️";

    }
    else {

        if (btn)
            btn.innerHTML =
            "♡ Wishlist";

        if (icon)
            icon.innerHTML = "♡";
    }
}

async function toggleWishlist(productId) {

    const token =
        localStorage.getItem("access") ||
        localStorage.getItem("token");

    if (!token) {

        window.location.href =
            "login.html";

        return;
    }

    try {

        if (IS_WISHLISTED) {

            const res = await fetch(
                `${API_BASE}/wishlist/remove/${WISHLIST_ID}/`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization":
                        `Bearer ${token}`
                    }
                }
            );

            const data =
                await res.json();

            if (data.status) {

                IS_WISHLISTED = false;
                WISHLIST_ID = null;

                renderWishlistState();

                updateWishlistCount();

                toast?.(
                    "Removed from wishlist"
                );
            }

        } else {

            const res = await fetch(
                `${API_BASE}/wishlist/add/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                        `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        product_id: productId
                    })
                }
            );

            const data =
                await res.json();

            if (data.status) {

                IS_WISHLISTED = true;

                renderWishlistState();

                updateWishlistCount();

                toast?.(
                    "Added to wishlist ❤️"
                );

                initWishlist(productId);
            }
        }

    } catch (err) {

        console.error(err);

        toast?.(
            "Wishlist failed"
        );
    }
}


/* =========================
   RELATED PRODUCTS
========================= */
async function loadRelatedProducts(product) {

    const container =
        document.getElementById(
            "relatedProducts"
        );

    if (!container) return;

    try {

        const res = await fetch(
            `${API_BASE}/api/ecom/products/`
        );

        const data = await res.json();

        let products = [];

        if (data?.results?.data) {
            products = data.results.data;
        }
        else if (data?.data) {
            products = data.data;
        }
        else if (Array.isArray(data)) {
            products = data;
        }

        const related =
            products
                .filter(p => p.id !== product.id)
                .slice(0, 6);

        container.innerHTML = "";

        related.forEach(p => {

            const slug =
                p.slug || makeSlug(p.name);

            let image = "";

            if (
                p.images &&
                Array.isArray(p.images) &&
                p.images.length > 0
            ) {

                image = p.images[0];
            }
            else if (p.image) {

                image = p.image;
            }

            if (
                image &&
                !image.startsWith("http")
            ) {

                image =
                    API_BASE + image;
            }

            container.innerHTML += `
            <div class="prod-card">

                <div
                    class="prod-img"
                    onclick="openProduct('${slug}')">

                    <img
                        src="${image}"
                        alt="${p.name}">

                </div>

                <div
                    class="prod-name"
                    onclick="openProduct('${slug}')">

                    ${p.name}

                </div>

                <div class="prod-price">

                    ৳ ${p.discount_price || p.price}

                </div>

                <button
                    class="prod-cart"
                    onclick="quickAddCart(${p.id})">

                    + Cart

                </button>

            </div>
            `;
        });

    }
    catch (err) {

        console.error(
            "RELATED PRODUCTS ERROR:",
            err
        );
    }
}

/* =========================
   FAQ TOGGLE
========================= */
function faqToggle(el) {

    const item =
        el.parentElement;

    item.classList.toggle("open");
}

/* =========================
   TAB SWITCH
========================= */
function switchTab(tab) {

    document
        .querySelectorAll(".tab-btn")
        .forEach(btn =>
            btn.classList.remove("on")
        );

    document
        .querySelectorAll(".tab-pane")
        .forEach(pane =>
            pane.classList.remove("on")
        );

    document
        .getElementById(`pane-${tab}`)
        ?.classList.add("on");

    event.target.classList.add("on");
}

function openShare() {
    document.getElementById("shareOverlay").classList.add("active");
}

function closeShare(e) {
    if (!e || e.target.id === "shareOverlay") {
        document.getElementById("shareOverlay").classList.remove("active");
    }
}

function shareTo(type) {

    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);

    if (type === "wa") {
        window.open(`https://wa.me/?text=${title}%20${url}`, "_blank");
    }

    else if (type === "fb") {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
    }

    else if (type === "ig") {
        // Instagram direct share allowed না → copy fallback
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied for Instagram share!");
    }

    else if (type === "copy") {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied!");
    }

    closeShare();
}

/* =========================
   INIT
========================= */
window.addEventListener(
    "DOMContentLoaded",
    () => {

        loadProductDetails();

        updateCartCountFromBackend?.();
    }
);
/* =========================
   CONFIG
========================= */
const API_BASE = "http://127.0.0.1:8000";

/* =========================
   STATE
========================= */
let currentPage = 1;
let totalPages = 1;
let currentCategory = "all";
let currentSort = "popularity";

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
    loadProducts(1);
});

/* =========================
   LOAD PRODUCTS (API)
========================= */
async function loadProducts(page = 1) {

    const grid =
        document.getElementById("productsGrid");

    const totalText =
        document.getElementById("totalProducts");

    try {

        const params = new URLSearchParams();

        params.append("page", page);

        // CATEGORY
        if (currentCategory !== "all") {
            params.append(
                "category",
                currentCategory
            );
        }

        // SORT
        if (currentSort === "price-low-high") {
            params.append("sort", "price_low");
        }

        if (currentSort === "price-high-low") {
            params.append("sort", "price_high");
        }

        if (currentSort === "newest") {
            params.append("sort", "newest");
        }

        const res = await fetch(
            `${API_BASE}/api/ecom/products/?${params.toString()}`
        );

        const data = await res.json();

        console.log("PRODUCT LIST:", data);

        const products =
            data?.results?.data || [];

        totalPages = Math.ceil(
            (data?.count || 0) / 10
        );

        currentPage = page;

        renderProducts(products);

        renderPagination();

        if (totalText) {

            totalText.innerText =
                `Showing ${products.length} products (Page ${currentPage} of ${totalPages})`;
        }

    } catch (err) {

        console.error("LOAD ERROR:", err);

        grid.innerHTML = `
            <p style="color:red">
                Failed to load products
            </p>
        `;
    }
}

/* =========================
   RENDER PRODUCTS
========================= */
function renderProducts(products) {

    const grid = document.getElementById("productsGrid");

    grid.innerHTML = "";

    if (!products.length) {
        grid.innerHTML = `<p>No products found</p>`;
        return;
    }

    products.forEach(p => {

        const slug = p.slug ||
            p.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-");

        const price = Number(p.price || 0);

        const discountPrice =
            p.discount_price || null;

        const finalPrice =
            discountPrice || price;

        let image = "";

        if (p.image) {
            image = p.image;
        }

        if (image && !image.startsWith("http")) {
            image = API_BASE + image;
        }

        let oldPriceHTML = "";

        if (
            discountPrice &&
            price > discountPrice
        ) {

            oldPriceHTML = `
                <span class="rel-orig">
                    ৳ ${price}
                </span>
            `;
        }

        grid.innerHTML += `
        <div class="rel-item">

            <div class="rel-img"
                 onclick="openProduct('${slug}')">

                <img
                    src="${image}"
                    alt="${p.name}"
                    style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                    "
                >
            </div>

            <div class="rel-name"
                 onclick="openProduct('${slug}')">

                ${p.name}
            </div>

            <div>
                <span class="rel-price">
                    ৳ ${finalPrice}
                </span>

                ${oldPriceHTML}
            </div>

            <div class="btn-group"
                 style="margin-top:10px">

                <button
                    class="btn-cart"
                    onclick="addToCart('${slug}')">

                    + Cart
                </button>

                <button
                    class="btn-buy"
                    onclick="buyNow('${slug}')">

                    🛒 Buy Now
                </button>

            </div>

        </div>
        `;
    });
}

/* =========================
   FILTER
========================= */
function applyFilters() {

    currentCategory =
        document.getElementById(
            "filterCategory"
        ).value;

    currentSort =
        document.getElementById(
            "sortBy"
        ).value;

    loadProducts(1);
}

/* =========================
   PAGINATION
========================= */
function renderPagination() {

    const el =
        document.getElementById("pageNumbers");

    if (!el) return;

    let html = "";

    for (
        let i = 1;
        i <= totalPages;
        i++
    ) {

        html += `
            <button
                onclick="goPage(${i})"
                class="${
                    i === currentPage
                        ? "active"
                        : ""
                }">

                ${i}

            </button>
        `;
    }

    el.innerHTML = html;
}

function goPage(page) {

    if (
        page < 1 ||
        page > totalPages
    ) return;

    loadProducts(page);
}

function nextPage() {

    if (currentPage < totalPages) {

        loadProducts(
            currentPage + 1
        );
    }
}

function prevPage() {

    if (currentPage > 1) {

        loadProducts(
            currentPage - 1
        );
    }
}

/* =========================
   OPEN PRODUCT
========================= */
function openProduct(slug) {

    window.location.href =
        `product-detail.html?slug=${slug}`;
}

/* =========================
   BUY NOW
========================= */
function buyNow(slug) {

    window.location.href =
        `checkout.html?slug=${slug}`;
}

/* =========================
   ADD TO CART
========================= */
function addToCart(slug) {

    toast("Added to cart 🛒");

    console.log(
        "ADD TO CART:",
        slug
    );
}

/* =========================
   TOAST
========================= */
function toast(msg) {

    const c =
        document.getElementById(
            "toast-container"
        );

    if (!c) return;

    const el =
        document.createElement("div");

    el.className = "toast";

    el.innerText = msg;

    c.appendChild(el);

    setTimeout(() => {
        el.classList.add("show");
    }, 50);

    setTimeout(() => {

        el.classList.remove("show");

        setTimeout(() => {
            el.remove();
        }, 300);

    }, 2000);
}
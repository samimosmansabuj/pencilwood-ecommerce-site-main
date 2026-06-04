/* =========================
   🔗 BACKEND CONFIG
========================= */
const API_BASE = window.API_BASE;

/* =========================
   ── GLOBAL DATA
========================= */
let ALL_PRODUCTS = [];
let filteredProducts = [];
let SLIDES = [];
let currentSlide = 0;

/* PAGINATION */
let currentPage = 1;
let perPage = 6;

/* PRODUCT LIST PAGE = 10 */
if (
    window.location.pathname
        .includes("product-list.html")
) {
    perPage = 10;
}
/* DYNAMIC CATEGORY */
let ALL_CATEGORIES = [];

/* =========================
   ── HELPERS
========================= */
function makeSlug(text) {
    return text
        ?.toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/* =========================
   ── STARS
========================= */
function mkStars(id, score, sz) {

    const el = document.getElementById(id);

    if (!el) return;

    el.innerHTML = "";
    el.style.cssText = "display:flex;gap:2px";

    for (let i = 1; i <= 5; i++) {

        const s = document.createElement("div");

        s.className = "star " + (
            i <= Math.floor(score)
                ? "f"
                : (i - score < 1 && score % 1 >= .5 ? "h" : "")
        );

        if (sz) {
            s.style.width = sz + "px";
            s.style.height = sz + "px";
        }

        el.appendChild(s);
    }
}

/* =========================
   ── LOAD PRODUCTS
========================= */
async function loadProducts() {

    const grid =
        document.getElementById("productsGrid");

    const total =
        document.getElementById("totalProducts");

    if (!grid) return;

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

        if (!Array.isArray(products)) {
            throw new Error("Invalid API response");
        }

        ALL_PRODUCTS = products;
        filteredProducts = [...products];

        /* DYNAMIC CATEGORY LOAD */
        loadCategories(products);

        /* NEWEST FIRST DEFAULT */
        filteredProducts.sort((a, b) => {
            return (b.id || 0) - (a.id || 0);
        });

        /* HERO SLIDER */
        SLIDES = [...filteredProducts].slice(0, 3);

        renderSlider();
        goPage(1);

        if (total) {
            total.textContent =
                `${products.length} Products`;
        }

    } catch (err) {

        console.error(
            "LOAD PRODUCTS ERROR:",
            err
        );

        grid.innerHTML = `
            <p style="color:red">
                Failed to load products
            </p>
        `;
    }
}

/* =========================
   ── DYNAMIC CATEGORY
========================= */
function loadCategories(products) {

    const select =
        document.getElementById("filterCategory");

    if (!select) return;

    const categories = [];

    products.forEach(p => {

        let cat = "";

        if (typeof p.category === "object") {
            cat =
                p.category?.name ||
                "";
        } else {
            cat = p.category || "";
        }

        if (
            cat &&
            !categories.includes(cat)
        ) {
            categories.push(cat);
        }
    });

    ALL_CATEGORIES = categories;

    select.innerHTML = `
        <option value="all">
            All
        </option>
    `;

    categories.forEach(cat => {

        select.innerHTML += `
            <option value="${cat}">
                ${cat}
            </option>
        `;
    });
}

/* =========================
   ── HERO SLIDER
========================= */
function renderSlider() {

    const slider =
        document.querySelector(".hero-slider");

    if (!slider || SLIDES.length === 0) return;

    let dots = "";

    const slidesHTML = SLIDES.map((p, i) => {

        dots += `
            <span
                onclick="goSlide(${i})"
                class="${i === 0 ? "active" : ""}">
            </span>
        `;

        let image = "";

        if (p.image) {

            image = p.image.startsWith("http")
                ? p.image
                : API_BASE + p.image;
        }

        return `
        <div class="slide ${i === 0 ? "active" : ""}">

            <div class="slide-content">

                <div class="slide-text">

                    <h2>${p.name}</h2>

                    <p>
                        ৳ ${p.discount_price || p.price}
                    </p>

                    <button
                        onclick="openProduct('${p.slug || makeSlug(p.name)}')">

                        View Product

                    </button>

                </div>

                <div class="slide-img">

                    <img
                        src="${image}"
                        alt="${p.name}">

                </div>

            </div>

        </div>
        `;

    }).join("");

    slider.innerHTML = `
        ${slidesHTML}

        <button
            class="slide-prev"
            onclick="prevSlide()">

            ‹

        </button>

        <button
            class="slide-next"
            onclick="nextSlide()">

            ›

        </button>

        <div class="slider-dots">
            ${dots}
        </div>
    `;
}

/* =========================
   ── SLIDER CONTROLS
========================= */
function showSlide(i) {

    const slides =
        document.querySelectorAll(".slide");

    const dots =
        document.querySelectorAll(".slider-dots span");

    if (!slides.length) return;

    slides.forEach(s =>
        s.classList.remove("active")
    );

    dots.forEach(d =>
        d.classList.remove("active")
    );

    currentSlide =
        (i + slides.length) % slides.length;

    slides[currentSlide]
        .classList.add("active");

    if (dots[currentSlide]) {
        dots[currentSlide]
            .classList.add("active");
    }
}

function nextSlide() {
    showSlide(currentSlide + 1);
}

function prevSlide() {
    showSlide(currentSlide - 1);
}

function goSlide(i) {
    showSlide(i);
}

setInterval(() => {

    if (SLIDES.length > 0) {
        nextSlide();
    }

}, 3000);

/* =========================
   ── PRODUCTS GRID
========================= */
function renderProducts(products) {

    const grid =
        document.getElementById("productsGrid");

    if (!grid) return;

    grid.innerHTML = "";

    if (!products.length) {

        grid.innerHTML = `
            <p>No products found</p>
        `;

        return;
    }

    products.forEach(p => {

        const slug =
            p.slug || makeSlug(p.name);

        let image = "";

        if (p.image) {

            image = p.image.startsWith("http")
                ? p.image
                : API_BASE + p.image;
        }

        grid.innerHTML += `
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

/* =========================
   ── PAGINATION
========================= */
function goPage(page) {

    const totalPages =
        Math.ceil(filteredProducts.length / perPage);

    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    currentPage = page;

    const start =
        (page - 1) * perPage;

    const end =
        start + perPage;

    const pageData =
        filteredProducts.slice(start, end);

    renderProducts(pageData);
    renderPagination(totalPages);
}

function nextPage() {
    goPage(currentPage + 1);
}

function prevPage() {
    goPage(currentPage - 1);
}

function renderPagination(totalPages) {

    const box =
        document.getElementById("pageNumbers");

    if (!box) return;

    let html = "";

    for (let i = 1; i <= totalPages; i++) {

        html += `
            <button
                onclick="goPage(${i})"
                class="${i === currentPage ? "active" : ""}">

                ${i}

            </button>
        `;
    }

    box.innerHTML = html;
}

/* =========================
   ── FILTERS
========================= */
function applyFilters() {

    const cat =
        document.getElementById("filterCategory")?.value;

    const sort =
        document.getElementById("sortBy")?.value;

    let data = [...ALL_PRODUCTS];

   /* CATEGORY */
if (
    cat &&
    cat !== "all"
) {

    data = data.filter(p => {

        let productCat = "";

        if (
            p.category &&
            typeof p.category === "object"
        ) {

            productCat =
                p.category.name ||
                p.category.title ||
                "";

        } else {

            productCat =
                p.category || "";
        }

        return (
            productCat
                .toString()
                .trim()
                .toLowerCase()
            ===
            cat
                .toString()
                .trim()
                .toLowerCase()
        );
    });
}

    /* PRICE LOW */
    if (sort === "price-low-high") {

        data.sort((a, b) => {
            return (
                Number(a.discount_price || a.price || 0)
                -
                Number(b.discount_price || b.price || 0)
            );
        });
    }

    /* PRICE HIGH */
    if (sort === "price-high-low") {

        data.sort((a, b) => {
            return (
                Number(b.discount_price || b.price || 0)
                -
                Number(a.discount_price || a.price || 0)
            );
        });
    }

    /* NEWEST */
    if (sort === "newest") {

        data.sort((a, b) => {
            return (b.id || 0) - (a.id || 0);
        });
    }

    /* POPULARITY */
    if (sort === "popularity") {

        data.sort((a, b) => {

            return (
                Number(b.total_sales || b.popularity || 0)
                -
                Number(a.total_sales || a.popularity || 0)
            );
        });
    }

    filteredProducts = data;

    goPage(1);
}

/* =========================
   ── OPEN PRODUCT
========================= */
function openProduct(slug) {

    window.location.href =
        `product-details.html?slug=${slug}`;
}

/* =========================
   ── CART COUNT
========================= */
function updateCartCountFromBackend() {

    const token =
        localStorage.getItem("access") ||
        localStorage.getItem("token");

    if (!token) return;

    fetch(`${API_BASE}/cart/`, {

        headers: {
            "Authorization": `Bearer ${token}`
        }

    })
    .then(res => res.json())
    .then(data => {

        const dot =
            document.getElementById("cartDot");

        if (!dot) return;

        const items =
            data.data ||
            data.results ||
            data.cart_items ||
            [];

        let total = 0;

        items.forEach(i => {
            total += i.quantity || 0;
        });

        dot.textContent = total;

    })
    .catch(console.error);
}

/* =========================
   ── QUICK ADD CART
========================= */
async function quickAddCart(productId) {

    try {

        const token =
            localStorage.getItem("access") ||
            localStorage.getItem("token");

        if (!token) {

            toast("Please login first");

            return;
        }

        const response = await fetch(
            `${API_BASE}/cart/add/`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
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

            toast("Added to cart 🛒");

            updateCartCountFromBackend();

        } else {

            toast(
                data.message ||
                "Failed to add cart"
            );
        }

    } catch (err) {

        console.error(err);

        toast("Something went wrong");
    }
}

/* =========================
   ── TOAST
========================= */
function toast(msg) {

    const c =
        document.getElementById("toast-container");

    if (!c) return;

    const el =
        document.createElement("div");

    el.className = "toast";
    el.textContent = msg;

    c.appendChild(el);

    setTimeout(() => {
        el.classList.add("show");
    }, 50);

    setTimeout(() => {

        el.classList.remove("show");

        setTimeout(() => {
            el.remove();
        }, 300);

    }, 2500);
}

/* =========================
   ── DRAWER
========================= */
function openDrw() {

    document
        .getElementById("drawer")
        ?.classList.add("on");

    document
        .getElementById("drawerOverlay")
        ?.classList.add("on");
}

function closeDrw() {

    document
        .getElementById("drawer")
        ?.classList.remove("on");

    document
        .getElementById("drawerOverlay")
        ?.classList.remove("on");
}

/* =========================
   AUTH BUTTON TOGGLE
========================= */
function updateAuthButtons() {

    const loggedIn =
        typeof isLoggedIn === "function"
            ? isLoggedIn()
            : false;

    const loginBtns =
        document.querySelectorAll(".login-btn");

    const accountBtns =
        document.querySelectorAll(".account-btn");

    if (loggedIn) {

        loginBtns.forEach(btn => {
            btn.style.display = "none";
        });

        accountBtns.forEach(btn => {
            btn.style.display = "";
        });

    } else {

        loginBtns.forEach(btn => {
            btn.style.display = "";
        });

        accountBtns.forEach(btn => {
            btn.style.display = "none";
        });
    }
}

/* =========================
   GLOBAL NAVIGATION
========================= */

function openCart() {
    const token =
        localStorage.getItem("access") ||
        localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    window.location.href = "cart.html";
}

function openWishlist() {
    const token =
        localStorage.getItem("access") ||
        localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    window.location.href = "wishlist.html";
}

/* =========================
   ── INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {

    updateAuthButtons();

    updateCartCountFromBackend();

    if (
        document.getElementById("productsGrid")
    ) {
        loadProducts();
    }
});
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
let sliderInterval = null;
let sliderPaused = false;

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
    const grid =document.getElementById("productsGrid");
    const total =document.getElementById("totalProducts");

    if (!grid) return;

    try {

        const params = new URLSearchParams(window.location.search);

        const search = params.get("search");
        const category = params.get("category");
        const sort = params.get("sort");

        let apiUrl = `${API_BASE}/api/ecom/products/`;

        const queryParams = new URLSearchParams();

        if (search) queryParams.append("search", search);
        if (category) queryParams.append("category", category);
        if (sort) queryParams.append("sort", sort);

        if (queryParams.toString()) {
            apiUrl += `?${queryParams.toString()}`;
        }

        const res = await fetch(apiUrl);

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

    const slider = document.querySelector(".hero-slider");

    if (!slider || SLIDES.length === 0) return;

    currentSlide = 0; // ✅ IMPORTANT FIX

    let dots = "";

    const slidesHTML = SLIDES.map((p, i) => {

        dots += `
            <span onclick="goSlide(${i})"
                class="${i === 0 ? "active" : ""}">
            </span>
        `;

        let image = p.image
            ? (p.image.startsWith("http")
                ? p.image
                : API_BASE + p.image)
            : "";

        return `
        <div class="slide ${i === 0 ? "active" : ""}">

            <div class="slide-content">

                <div class="slide-text">

                    <h2>${p.name}</h2>

                    <p>৳ ${p.discount_price || p.price}</p>

                    <button onclick="openProduct('${p.slug || makeSlug(p.name)}')">
                        View Product
                    </button>

                </div>

                <div class="slide-img">
                    <img src="${image}" alt="${p.name}">
                </div>

            </div>

        </div>
        `;
    }).join("");

    slider.innerHTML = `
        ${slidesHTML}

        <button class="slide-prev" onclick="prevSlide()">‹</button>
        <button class="slide-next" onclick="nextSlide()">›</button>

        <div class="slider-dots">
            ${dots}
        </div>
    `;

    startSliderAuto(); // ✅ IMPORTANT
}

function startSliderAuto() {

    if (sliderInterval) {
        clearInterval(sliderInterval);
    }

    const sliderEl = document.querySelector(".hero-slider");

    if (!sliderEl) return;

    sliderInterval = setInterval(() => {

        if (sliderPaused) return;

        if (SLIDES.length > 0) {
            nextSlide();
        }

    }, 3000);
}

/* =========================
   ── SLIDER CONTROLS
========================= */
function showSlide(i) {

    const slides = document.querySelectorAll(".slide");
    const dots = document.querySelectorAll(".slider-dots span");

    if (!slides.length) return;

    slides.forEach(s => s.classList.remove("active"));
    dots.forEach(d => d.classList.remove("active"));

    currentSlide = (i + slides.length) % slides.length;

    slides[currentSlide].classList.add("active");

    if (dots[currentSlide]) {
        dots[currentSlide].classList.add("active");
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

    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    grid.innerHTML = "";

    if (!products.length) {
        grid.innerHTML = `<p>No products found</p>`;
        return;
    }

    products.forEach(p => {

        const slug = p.slug || makeSlug(p.name);

        let image = "";
        if (p.image) {
            image = p.image.startsWith("http") ? p.image : API_BASE + p.image;
        }

        const productName = p.name
            .split(' ').slice(0, 5).join(' ') + (p.name.split(' ').length > 5 ? '...' : '');

        const hasVariants = !!p.has_variants;

        grid.innerHTML += `
        <div class="prod-card">

            <div class="prod-img" onclick="openProduct('${slug}')">
                <img src="${image}" alt="${productName}">
            </div>

            <div class="prod-name" onclick="openProduct('${slug}')">
                ${productName}
            </div>

            <div class="prod-price">
                ৳ ${p.discount_price || p.price}
            </div>

            <button
                class="prod-cart"
                onclick="handleListCartClick(${p.id}, '${slug}', ${hasVariants})">
                + Cart
            </button>

        </div>
        `;
    });
}

/* =========================
   ── LIST-PAGE CART CLICK (variant-aware)
========================= */
function handleListCartClick(productId, slug, hasVariants) {
    if (hasVariants) {
        // Can't pick a variant from a card — send them to the product page,
        // and tell it to auto-prompt for variant selection on load.
        sessionStorage.setItem("prompt_variant_on_load", "cart");
        window.location.href = `product-details.html?slug=${slug}`;
        return;
    }
    quickAddCart(productId);
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
   ── CART COUNT (guest + logged-in)
========================= */
function updateCartCountFromBackend() {

    const dot = document.getElementById("cartDot");
    if (!dot) return;

    const token = localStorage.getItem("access") || localStorage.getItem("token");

    if (!token) {
        dot.textContent = typeof guestCartCount === "function" ? guestCartCount() : "0";
        return;
    }

    fetch(`${API_BASE}/cart/`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(data => {
            const items = data.data || data.results || data.cart_items || [];
            let total = 0;
            items.forEach(i => { total += i.quantity || 0; });
            dot.textContent = total;
        })
        .catch(console.error);
}

/* =========================
   ── WISHLIST COUNT
========================= */
async function updateWishlistCount() {

    const token =
        localStorage.getItem("access") ||
        localStorage.getItem("token");

    const dot =
        document.getElementById("wishCount");

    if (!dot) return;

    if (!token) {
        dot.textContent = "0";
        return;
    }

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
            dot.textContent =
                data.data.length;
        }
        else {
            dot.textContent = "0";
        }

    }
    catch (err) {

        console.error(
            "Wishlist Count Error:",
            err
        );

        dot.textContent = "0";
    }
}

/* =========================
   ── QUICK ADD CART (guest + logged-in, simple products only)
========================= */
async function quickAddCart(productId, variantId = null, snapshot = null) {

    const token = localStorage.getItem("access") || localStorage.getItem("token");

    if (!token) {
        const product = ALL_PRODUCTS.find(p => p.id === productId);
        guestCartAdd(productId, variantId, 1, snapshot || {
            name: product?.name || "",
            image: product?.image || "",
            price: product?.price || 0,
            discount_price: product?.discount_price || null,
        });
        toast("Added to cart 🛒");
        updateCartCountFromBackend();
        return;
    }

    try {
        const payload = { product_id: productId, quantity: 1 };
        if (variantId) payload.variant_id = variantId;

        const response = await fetch(`${API_BASE}/cart/add/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.status) {
            toast("Added to cart 🛒");
            updateCartCountFromBackend();
        } else {
            toast(data.message || "Failed to add cart");
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
    window.location.href = "cart.html";
}

function openWishlist() {
    window.location.href = "wishlist.html";
}

function openSearch() {
    document.getElementById("searchOverlay")
        ?.classList.add("on");

    setTimeout(() => {
        document.getElementById("mobileSearchInput")?.focus();
    }, 100);
}

function closeSearch() {
    document.getElementById("searchOverlay")
        ?.classList.remove("on");
}

function applySearch(query) {

    query = query.toLowerCase().trim();

    if (!query) {
        filteredProducts = [...ALL_PRODUCTS];
    } else {
        filteredProducts = ALL_PRODUCTS.filter(p => {
            return (
                (p.name || "").toLowerCase().includes(query) ||
                (p.category?.name || p.category || "")
                    .toString()
                    .toLowerCase()
                    .includes(query)
            );
        });
    }

    goPage(1);
}

function goSearch(query) {
    if (!query) return;

    // page reload with query
    window.location.href =
        `product-list.html?search=${encodeURIComponent(query)}`;
}

function bindSearch() {

    const searchInput = document.querySelector(".search-in");

    const mobileInput = document.getElementById("mobileSearchInput");
    const mobileBtn = document.getElementById("mobileSearchBtn");
    const closeBtn = document.getElementById("closeSearch");

    // desktop input ENTER only
    if (searchInput) {
        searchInput.onkeypress = (e) => {
            if (e.key === "Enter") {
                const q = searchInput.value.trim();
                if (q) goSearch(q);
            }
        };
    }

    // mobile search
    if (mobileBtn && mobileInput) {

        mobileBtn.onclick = () => {
            const q = mobileInput.value.trim();
            if (q) goSearch(q);
        };

        mobileInput.onkeypress = (e) => {
            if (e.key === "Enter") {
                const q = mobileInput.value.trim();
                if (q) goSearch(q);
            }
        };
    }

    // close overlay
    if (closeBtn) {
        closeBtn.onclick = closeSearch;
    }
}
/* =========================
   ── INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {

    updateAuthButtons();

    updateCartCountFromBackend();

    updateWishlistCount();

    if (
        document.getElementById("productsGrid")
    ) {
        loadProducts();
    }

    const sliderEl = document.querySelector(".hero-slider");

    if (sliderEl) {

        sliderEl.addEventListener("mouseenter", () => {
            sliderPaused = true;
        });

        sliderEl.addEventListener("mouseleave", () => {
            sliderPaused = false;
        });
    }
});
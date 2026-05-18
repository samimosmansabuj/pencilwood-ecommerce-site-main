/* =========================
   🔗 BACKEND CONFIG
========================= */
const API_BASE = "http://127.0.0.1:8000";

/* =========================
   ── GLOBAL DATA
========================= */
let ALL_PRODUCTS = [];
let filteredProducts = [];
let SLIDES = [];
let currentSlide = 0;

/* PAGINATION STATE */
let currentPage = 1;
const perPage = 10;

/* =========================
   ── HELPER
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
   ── STARS (UNCHANGED)
========================= */
function mkStars(id, score, sz) {
    const el = document.getElementById(id);
    if (!el) return;

    el.style.cssText = 'display:flex;gap:2px';

    for (let i = 1; i <= 5; i++) {
        const s = document.createElement('div');

        s.className = 'star ' + (
            i <= Math.floor(score)
                ? 'f'
                : (i - score < 1 && score % 1 >= .5 ? 'h' : '')
        );

        if (sz) {
            s.style.width = sz + 'px';
            s.style.height = sz + 'px';
        }

        el.appendChild(s);
    }
}

function safeStars(id, score, sz) {
    const el = document.getElementById(id);
    if (!el) return;
    mkStars(id, score, sz);
}

/* =========================
   ── LOAD PRODUCTS
========================= */
async function loadProducts() {

    const grid = document.getElementById("productsGrid");
    const total = document.getElementById("totalProducts");

    if (!grid) return;

    try {

        const res = await fetch(`${API_BASE}/api/ecom/products/`);
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
        filteredProducts = products;

        SLIDES = products.slice(0, 3);
        renderSlider();

        goPage(1);

        if (total) {
            total.textContent = `${products.length} Products`;
        }

    } catch (err) {

        console.error("LOAD PRODUCTS ERROR:", err);

        grid.innerHTML = `
            <p style="color:red">
                Failed to load products
            </p>
        `;
    }
}

/* =========================
   ── SLIDER (UNCHANGED)
========================= */
function renderSlider() {

    const slider = document.querySelector(".hero-slider");

    if (!slider || SLIDES.length === 0) return;

    let dots = "";

    const slidesHTML = SLIDES.map((p, i) => {

        dots += `
            <span onclick="goSlide(${i})" class="${i === 0 ? 'active' : ''}"></span>
        `;

        return `
        <div class="slide ${i === 0 ? 'active' : ''}">
            <div class="slide-content">

                <div class="slide-text">
                    <h2>${p.name}</h2>
                    <p>৳ ${p.discount_price || p.price}</p>

                    <button onclick="openProduct('${makeSlug(p.name)}')">
                        View Product
                    </button>
                </div>

                <div class="slide-img">
                    <img src="${p.image ? API_BASE + p.image : ''}">
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
}

/* =========================
   ── SLIDER CONTROLS (UNCHANGED)
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

function nextSlide() { showSlide(currentSlide + 1); }
function prevSlide() { showSlide(currentSlide - 1); }
function goSlide(i) { showSlide(i); }

setInterval(() => {
    if (SLIDES.length > 0) nextSlide();
}, 3000);

/* =========================
   ── PRODUCTS GRID
========================= */
function renderProducts(products) {

    const grid = document.getElementById("productsGrid");

    if (!grid) return;

    grid.innerHTML = "";

    products.forEach(p => {

        const slug = makeSlug(p.name);

        grid.innerHTML += `
        <div class="prod-card">

            <div class="prod-img">
                <img src="${p.image ? API_BASE + p.image : ''}">
            </div>

            <div class="prod-name" onclick="openProduct('${slug}')">
                ${p.name}
            </div>

            <div class="prod-price">
                ৳ ${p.discount_price || p.price}
            </div>

            <button onclick="quickAddCart(${p.id}, '${p.name}', ${p.price})">
                + Cart
            </button>

        </div>
        `;
    });
}

/* =========================
   ── PAGINATION CORE
========================= */
function goPage(page) {

    const totalPages = Math.ceil(filteredProducts.length / perPage);

    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    currentPage = page;

    const start = (page - 1) * perPage;
    const end = start + perPage;

    const pageData = filteredProducts.slice(start, end);

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

    const box = document.getElementById("pageNumbers");
    if (!box) return;

    let html = "";

    for (let i = 1; i <= totalPages; i++) {

        html += `
            <button onclick="goPage(${i})"
                class="${i === currentPage ? 'active' : ''}">
                ${i}
            </button>
        `;
    }

    box.innerHTML = html;
}

/* =========================
   ── FILTER (FIXED)
========================= */
function applyFilters() {

    const cat = document.getElementById("filterCategory")?.value;
    const sort = document.getElementById("sortBy")?.value;

    let data = [...ALL_PRODUCTS];

    if (cat !== "all") {
        data = data.filter(p =>
            (p.category || "").toLowerCase() === cat
        );
    }

    if (sort === "price-low-high") {
        data.sort((a, b) => a.price - b.price);
    }

    if (sort === "price-high-low") {
        data.sort((a, b) => b.price - a.price);
    }

    filteredProducts = data;
    goPage(1);
}

/* =========================
   ── OPEN PRODUCT
========================= */
function openProduct(slug) {
    window.location.href = `product-details.html?slug=${slug}`;
}

/* =========================
   ── CART (UNCHANGED)
========================= */
function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function setCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {

    const dot = document.getElementById('cartDot');

    if (!dot) return;

    const cart = getCart();

    const total = cart.reduce((s, i) => s + i.qty, 0);

    dot.textContent = total;
}

function quickAddCart(id, name, price) {

    let cart = getCart();

    const exist = cart.find(i => i.id === id);

    if (exist) exist.qty += 1;
    else cart.push({ id, name, price, qty: 1 });

    setCart(cart);
    updateCartCount();
    toast("Added 🛒");
}

/* =========================
   ── TOAST
========================= */
function toast(msg) {

    const c = document.getElementById("toast-container");

    if (!c) return;

    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;

    c.appendChild(el);

    setTimeout(() => el.classList.add("show"), 50);

    setTimeout(() => {
        el.classList.remove("show");
        setTimeout(() => el.remove(), 300);
    }, 2500);
}


/* =========================
   ── INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {

    updateCartCount();
    loadProducts();
});
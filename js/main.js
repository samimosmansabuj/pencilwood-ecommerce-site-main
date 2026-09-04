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

/* =========================
   SERVICE WORKER REGISTRATION (Clean URL Routing)
========================= */
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js", { scope: "/" })
        .catch((err) => {
            console.warn("SW registration error:", err);
        });
}

/* PAGINATION */
let currentPage = 1;
let perPage = 6;

/* PRODUCT LIST PAGE = 10 */
if (
    window.location.pathname.includes("product-list")
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
   ── HERO SLIDER (now backend-driven — manual + product slides)
========================= */
async function loadHeroSlider() {

    const slider = document.querySelector(".hero-slider");
    if (!slider) return;

    try {
        const res = await fetch(`${API_BASE}/api/ecom/home-slider/`);
        const data = await res.json();

        if (data.status && Array.isArray(data.data)) {
            SLIDES = data.data;
        } else {
            SLIDES = [];
        }

        renderSlider();
        if (typeof window.hideLoader === "function") window.hideLoader();

    } catch (err) {
        console.error("HERO SLIDER LOAD ERROR:", err);
        SLIDES = [];
        renderSlider();
        if (typeof window.hideLoader === "function") window.hideLoader();
    }
}

function renderSlider() {

    const slider = document.querySelector(".hero-slider");

    if (!slider) return;

    if (!SLIDES.length) {
        slider.innerHTML = "";
        return;
    }

    currentSlide = 0;

    let dots = "";

    const slidesHTML = SLIDES.map((s, i) => {

        dots += `
            <span onclick="goSlide(${i})"
                class="${i === 0 ? "active" : ""}">
            </span>
        `;

        let image = s.image
            ? (s.image.startsWith("http")
                ? s.image
                : API_BASE + s.image)
            : "";

        const priceHTML = s.price
            ? `<p>৳ ${s.price}</p>`
            : "";

        return `
        <div class="slide ${i === 0 ? "active" : ""}">

            <div class="slide-content">

                <div class="slide-text">

                    <h2>${s.title || ""}</h2>

                    ${priceHTML}

                    <button onclick="goSliderLink('${s.url}')">
                        ${s.button_name || "Shop Now"}
                    </button>

                </div>

                <div class="slide-img">
                    <img src="${image}" alt="${s.title || ""}">
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

    startSliderAuto();
}

function goSliderLink(url) {
    if (!url || url === "#") return;
    window.location.href = url;
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
        sessionStorage.setItem("prompt_variant_on_load", "cart");
        window.location.href = "/" + encodeURIComponent(slug);
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
            console.log("filter: ", productCat)
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
    if (!slug) return;
    window.location.href = "/" + encodeURIComponent(slug);
}

/* =========================
   ── CART COUNT (guest + logged-in)
========================= */
function updateCartCountFromBackend() {

    const dots = [
        document.getElementById("cartDot"),
        document.getElementById("navCartDot"),
        document.getElementById("drawerCartCount")
    ].filter(Boolean);

    if (!dots.length) return;

    const token = localStorage.getItem("access") || localStorage.getItem("token");

    if (!token) {
        let count = "0";
        if (typeof guestCartCount === "function") {
            count = guestCartCount();
        } else {
            try {
                const gc = JSON.parse(localStorage.getItem("guest_cart")) || [];
                count = gc.reduce((s, i) => s + Number(i.quantity || 0), 0);
            } catch { count = "0"; }
        }
        dots.forEach(d => d.textContent = count);
        return;
    }

    fetch(`${API_BASE}/cart/`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(data => {
            const items = data.data || data.results || data.cart_items || [];
            let total = 0;
            items.forEach(i => { total += Number(i.quantity || 0); });
            dots.forEach(d => d.textContent = total);
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

    const mbnDot =
        document.getElementById("mbnWishCount");

    if (!token) {
        if (dot) dot.textContent = "0";
        if (mbnDot) mbnDot.textContent = "0";
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
            if (dot) dot.textContent =
                data.data.length;
            if (mbnDot) mbnDot.textContent =
                data.data.length;
        }
        else {
            if (dot) dot.textContent = "0";
            if (mbnDot) mbnDot.textContent = "0";
        }

    }
    catch (err) {

        console.error(
            "Wishlist Count Error:",
            err
        );

        if (dot) dot.textContent = "0";
        if (mbnDot) mbnDot.textContent = "0";
    }
}

/* =========================
   ── QUICK ADD CART (guest + logged-in, simple products only)
========================= */
async function quickAddCart(productId, variantId = null, snapshot = null) {

    const token = localStorage.getItem("access") || localStorage.getItem("token");
    const product = ALL_PRODUCTS.find(p => p.id === productId);

    GAAddToCartEvent({
        id: productId,
        name: snapshot?.name || product?.name || "",
        discount_price: snapshot?.discount_price ?? snapshot?.price ?? product?.discount_price ?? product?.price
    });

    if (!token) {
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
   LOGOUT
========================= */
function logoutUser() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("token");

    toast("Logged out ✅");

    setTimeout(() => {
        window.location.href = "/";
    }, 500);
}

/* =========================
   GLOBAL NAVIGATION
========================= */
function openCart() {
    if (typeof openCartDrawer === "function") {
        openCartDrawer();
    } else {
        window.location.href = "/cart";
    }
}

function openWishlist() {
    window.location.href = "/wishlist";
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
            const n = p.name ? p.name.toLowerCase() : "";
            const cat = typeof p.category === 'object' ? (p.category?.name || "").toLowerCase() : (p.category || "").toLowerCase();
            const desc = p.description ? p.description.toLowerCase() : "";
            return n.includes(query) || cat.includes(query) || desc.includes(query);
        });
    }

    goPage(1);
}

function goSearch(query) {
    if (!query) return;

    window.location.href =
        `/product-list?search=${encodeURIComponent(query)}`;
}

function bindSearch() {

    const searchInput = document.querySelector(".search-in");

    const mobileInput = document.getElementById("mobileSearchInput");
    const mobileBtn = document.getElementById("mobileSearchBtn");
    const closeBtn = document.getElementById("closeSearch");

    if (searchInput) {
        searchInput.onkeypress = (e) => {
            if (e.key === "Enter") {
                const q = searchInput.value.trim();
                if (q) goSearch(q);
            }
        };
    }

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

    if (closeBtn) {
        closeBtn.onclick = closeSearch;
    }
}

/* =========================
   ── INIT
   NOTE: site-content.js owns loadSiteContent() / nav / footer / social /
   news rendering. It's called from loadComponents.js's initComponents()
   after footer-container is injected. Do NOT redefine loadSiteContent()
   or renderNavMenuLinks() here — a duplicate here will silently
   overwrite the real one depending on script load order and the footer
   links will stop rendering (this is what broke login.html).
========================= */
window.addEventListener("DOMContentLoaded", () => {

    updateAuthButtons();

    updateCartCountFromBackend();

    updateWishlistCount();


    document.querySelector(".logout-btn")?.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });

    if (
        document.getElementById("productsGrid")
    ) {
        loadProducts();
    }

    if (document.getElementById("kidzProductsGrid")){
        featureSectionAdd();
    }

    if (document.querySelector(".hero-slider")) {
        loadHeroSlider();
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

/* ==========================================================
   GLOBAL LOADER 
========================================================== */
window.hideLoader = function() {
    const loader = document.getElementById("global-loader");
    if (loader) {
        loader.classList.add("hidden");
        setTimeout(() => {
            if (loader.parentNode) {
                loader.parentNode.removeChild(loader);
            }
        }, 200);
    }
};

window.addEventListener("load", () => {
    // Fallback: hide loader after 1 second if no specific API call does it
    setTimeout(() => {
        if (typeof window.hideLoader === "function") {
            window.hideLoader();
        }
    }, 1000);
});

/* ==========================================================
   DRAGGABLE FLOATING BUTTONS
========================================================== */
function makeDraggable(el, storageKey) {
    if (!el) return;

    const saved = localStorage.getItem(storageKey);
    if (saved) {
        try {
            const pos = JSON.parse(saved);
            el.style.left = pos.left;
            el.style.top = pos.top;
            el.style.right = 'auto';
            el.style.bottom = 'auto';
            el.style.transform = 'none';
        } catch (e) { }
    }

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    let clickPrevented = false;

    el.addEventListener('click', function (e) {
        if (clickPrevented) {
            e.preventDefault();
            e.stopPropagation();
            clickPrevented = false;
        }
    }, true);

    function onStart(e) {
        if (e.type === 'mousedown' && e.button !== 0) return;

        isDragging = false;
        clickPrevented = false;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        startX = clientX;
        startY = clientY;

        const rect = el.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        el.style.transition = 'none';

        document.addEventListener('mousemove', onMove, { passive: false });
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }

    function onMove(e) {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const dx = clientX - startX;
        const dy = clientY - startY;

        if (!isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            isDragging = true;
            clickPrevented = true;
        }

        if (isDragging) {
            if(e.cancelable) e.preventDefault();

            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;

            const maxX = window.innerWidth - el.offsetWidth;
            const maxY = window.innerHeight - el.offsetHeight;

            newLeft = Math.max(0, Math.min(newLeft, maxX));
            newTop = Math.max(0, Math.min(newTop, maxY));

            el.style.left = newLeft + 'px';
            el.style.top = newTop + 'px';
            el.style.right = 'auto';
            el.style.bottom = 'auto';
            el.style.transform = 'none';
        }
    }

    function onEnd() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);

        if (isDragging) {
            el.style.transition = 'left 0.3s ease, top 0.3s ease';

            const rect = el.getBoundingClientRect();
            const w = window.innerWidth;
            const h = window.innerHeight;

            const distLeft = rect.left;
            const distRight = w - rect.right;

            const padding = 10;
            let percentTop = (rect.top / h) * 100;
            
            // Constrain top percentage so it doesn't go off screen
            percentTop = Math.max(0, Math.min(percentTop, 100));

            if (distLeft < distRight) {
                // Snap Left
                el.style.left = padding + 'px';
                el.style.top = percentTop + '%';
            } else {
                // Snap Right
                el.style.left = 'calc(100% - ' + (rect.width + padding) + 'px)';
                el.style.top = percentTop + '%';
            }

            setTimeout(() => {
                localStorage.setItem(storageKey, JSON.stringify({
                    left: el.style.left,
                    top: el.style.top
                }));
            }, 300);
        } else {
            el.style.transition = '';
        }
    }

    el.addEventListener('mousedown', onStart);
    el.addEventListener('touchstart', onStart, { passive: false });
}
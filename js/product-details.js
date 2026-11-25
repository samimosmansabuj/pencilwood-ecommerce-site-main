/* =========================
   PRODUCT DETAILS JS
========================= */

let CURRENT_PRODUCT = null;
let SELECTED_VARIANT = null;
let VARIANT_ATTR_STATE = {};
let CUSTOM_MODE = false;
let LAST_PRICE_ARGS = null;
let CURRENT_GALLERY_KEY = "";
let CAMPAIGN_CTX = null;      // campaign_pricing object when ?campaign=<slug> is valid
let CAMPAIGN_NOTICE = null;   // "ended" | "not_in_campaign" | "not_started"
let CAMPAIGN_META = null;     // { title, end_at, ... } from the campaign list

// ===== Hover (desktop) / drag (mobile) zoom on product image =====
(function () {
    const galMain = document.getElementById('galMain');
    const img = document.getElementById('productImage');
    if (!galMain || !img) return;

    const hint = document.createElement('div');
    hint.className = 'zoom-hint';
    hint.textContent = '+';
    galMain.appendChild(hint);

    function setZoomPoint(clientX, clientY) {
        const rect = galMain.getBoundingClientRect();
        const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
        const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
        img.style.transformOrigin = `${x}% ${y}%`;
    }

    // ---- DESKTOP: hover to zoom, move to pan ----
    galMain.addEventListener('mouseenter', () => {
        galMain.classList.add('zoomed');
    });

    galMain.addEventListener('mousemove', (e) => {
        setZoomPoint(e.clientX, e.clientY);
    });

    galMain.addEventListener('mouseleave', () => {
        galMain.classList.remove('zoomed');
        img.style.transformOrigin = 'center center';
    });

    // ---- MOBILE: touch and hold + slide to zoom/pan ----
    galMain.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        setZoomPoint(t.clientX, t.clientY);
        galMain.classList.add('zoomed');
    }, { passive: true });

    galMain.addEventListener('touchmove', (e) => {
        const t = e.touches[0];
        setZoomPoint(t.clientX, t.clientY);
    }, { passive: true });

    galMain.addEventListener('touchend', () => {
        galMain.classList.remove('zoomed');
        img.style.transformOrigin = 'center center';
    });
})();

function requireVariantSelection() {
    toast?.("Please select a variant");

    const groups = document.querySelectorAll(".variant-group");
    groups.forEach(group => {
        group.classList.add("variant-glow");
    });

    // auto-remove the glow once they click any option
    document.querySelectorAll(".variant-option").forEach(btn => {
        btn.addEventListener("click", clearVariantGlow, { once: true });
    });

    // also clear it automatically after a few seconds so it doesn't nag forever
    clearTimeout(window._variantGlowTimeout);
    window._variantGlowTimeout = setTimeout(clearVariantGlow, 2500);

    // scroll the picker into view so they actually see it
    document.getElementById("variantPickerWrap")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearVariantGlow() {
    document.querySelectorAll(".variant-group").forEach(g => g.classList.remove("variant-glow"));
}

function openProduct(slug) {
    if (!slug) return;
    window.location.href = `/product/${slug}`;
}

function getProductSlug() {
    if (window.__PRODUCT_SLUG__) return window.__PRODUCT_SLUG__;
    const match = window.location.pathname.match(/\/product\/([^/?#]+)/i);
    if (match && match[1]) return decodeURIComponent(match[1]);
    const params = new URLSearchParams(window.location.search);
    return params.get("slug");
}

/* =========================
   LOAD PRODUCT DETAILS
========================= */
async function loadProductDetails() {

    const slug = getProductSlug();
    const campaignParam = getCampaignParam();

    if (!slug) {
        console.error("No slug found");
        window.location.href = "/";
        return;
    }

    try {

        const res = campaignParam
            ? await fetch(`${API_BASE}/api/ecom/products/${slug}/?campaign=${encodeURIComponent(campaignParam)}`, { cache: "no-store" })
            : await fetch(`${API_BASE}/api/ecom/products/${slug}/`);
        
        if (!res.ok) {
            window.location.href = "/";
            return;
        }

        const data = await res.json();

        let product = data?.data ? data.data : data;

        if (!product || product.detail === "Not found." || data.status === false) {
            console.error("Product not found");
            window.location.href = "/";
            return;
        }

        CURRENT_PRODUCT = product;
        CAMPAIGN_CTX = null;
        CAMPAIGN_NOTICE = null;
        if (campaignParam) {
            if (product.server_now && window.PWCampaign) PWCampaign.setServerNow(product.server_now);
            if (product.campaign_pricing) CAMPAIGN_CTX = product.campaign_pricing;
            else if (product.campaign_notice) CAMPAIGN_NOTICE = product.campaign_notice;
        }
        window.__CURRENT_PRODUCT_ID__ = product.id;
        if (window.__runTracking) window.__runTracking();
        SELECTED_VARIANT = null;
        VARIANT_ATTR_STATE = {};

        GAViewItemEvent(CAMPAIGN_CTX
            ? { ...product, discount_price: CAMPAIGN_CTX.campaign_price, campaign: CAMPAIGN_CTX.campaign_slug, campaign_price: CAMPAIGN_CTX.campaign_price }
            : product);

        const name = product.name || "";
        const sku = product.sku || "";
        const rating = Number(product.rating || 0);
        const reviewCount = Number(product.review_count || 0);
        const soldCount = Number(product.sold_count || 0);

        /* =========================
           TITLE / SKU / DESC
        ========================= */
        document.getElementById("productTitle").textContent = name;
        document.getElementById("productShortDescription").textContent = product.short_description || "";
        document.getElementById("productSKU").textContent = sku ? `SKU: ${sku}` : "";

        const desc = document.getElementById("productDescription");
        if (desc) {
            desc.innerHTML = product.description || "No description available.";
        }
        
        /* =========================
           RATING
        ========================= */
        document.querySelector(".r-score").textContent = rating.toFixed(1);
        document.querySelector(".r-cnt").textContent = `${reviewCount} ratings`;
        document.querySelector(".r-sold").textContent = `${soldCount}+ sold`;
        mkStars("prodStars", rating, 16);
        mkStars("bigStars", rating, 20);

        /* =========================
           BADGES (bestseller etc.)
        ========================= */
        renderBadges(product);
        renderGifts(product);
        renderProductOffers(product);
        renderCampaignBox();

        /* =========================
           IMAGES (default = product-level images)
        ========================= */
        CURRENT_GALLERY_KEY = (product.images || []).join("|");
        renderImages(product.images || []);

        /* =========================
           CUSTOMIZATION (Standard / Customized)
        ========================= */
        renderCustomization(product);

        /* =========================
           VARIANTS
        ========================= */
        if (Array.isArray(product.variants) && product.variants.length > 0) {
            renderVariantPicker(product.variants);
            const firstAvailable =
                product.variants.find(v => v.id === product.default_variant_id) ||
                product.variants.find(v => v.stock > 0) ||
                product.variants[0];
            selectVariantByAttributes(firstAvailable.attributes, product.variants);
        } else {
            SELECTED_VARIANT = null;
            renderPriceAndStock(product.price, product.discount_price, product.stock);
            const vWrap = document.getElementById("variantPickerWrap");
            if (vWrap) vWrap.innerHTML = "";
        }

        /* =========================
           FEATURES
        ========================= */
        renderFeatures(product.features || []);

        /* =========================
           REVIEWS
        ========================= */
        renderReviews(product.reviews || [], rating, reviewCount);

        /* =========================
           FAQ
        ========================= */
        renderFAQs(product.faqs || []);

        /* =========================
           SPEC TABLE (built from features too, if present)
        ========================= */
        renderSpecTable(product.features || []);

        /* =========================
           DELIVERY NOTE
        ========================= */
        const deliveryNote = document.getElementById("deliveryNote");
        if (deliveryNote) {
            deliveryNote.innerHTML = `🚚 Dhaka: 1-2 Days Delivery · Outside Dhaka: 2-4 Days`;
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

        /* =========================
           VARIANT PROMPT (from wishlist/cart redirect flows)
        ========================= */
        const pendingAction = sessionStorage.getItem("prompt_variant_on_load");
        if (pendingAction && Array.isArray(product.variants) && product.variants.length > 0) {
            sessionStorage.removeItem("prompt_variant_on_load");
            // let the DOM paint first, then nudge
            setTimeout(() => requireVariantSelection(), 300);
        }

        if (typeof window.hideLoader === "function") window.hideLoader();

    } catch (err) {
        console.error("PRODUCT DETAILS ERROR:", err);
        if (typeof window.hideLoader === "function") window.hideLoader();
        window.location.href = "/";
    }
}

/* =========================
   BADGES (bestseller / verified / etc.)
========================= */
function renderBadges(product) {
    const wrap = document.getElementById("productBadges");
    if (!wrap) return;

    let html = "";
    if (product.is_bestseller) {
        html += `<span class="badge-chip badge-bestseller">🔥 Bestseller</span>`;
    }
    if (CAMPAIGN_CTX) {
        
        html += `<span class="badge-chip badge-campaign" id="cmpBadgeChip" style="display:none"></span>`;
    } else if (Number(product.discount_price) > 0 && Number(product.discount_price) < Number(product.price)) {
        const off = Math.round(((product.price - product.discount_price) / product.price) * 100);
        html += `<span class="badge-chip badge-discount">${off}% OFF</span>`;
    }
    wrap.innerHTML = html;
}

function renderGifts(product) {
    const wrap = document.getElementById("productGiftWrap");
    if (!wrap) return;

    const gifts = Array.isArray(product.gift_product) ? product.gift_product : [];
    // campaign context with gifts switched off: never show the gift block
    if (!gifts.length || (CAMPAIGN_CTX && CAMPAIGN_CTX.gifts_included === false)) {
        wrap.style.display = "none";
        wrap.innerHTML = "";
        return;
    }

    let itemsHtml = "";
    gifts.forEach(g => {
        const giftProd = g.gift_product;
        if (!giftProd) return;

        let tag = "";
        if (g.gift_type === "FREE") tag = "FREE";
        else if (g.gift_type === "FLAT") tag = `−৳${g.value} OFF`;
        else if (g.gift_type === "DISCOUNT") tag = `${g.value}% OFF`;

        let image = giftProd.image || "";
        if (image && !image.startsWith("http")) image = API_BASE + image;
        if (!image) image = "https://placehold.co/80x80?text=Gift";

        itemsHtml += `
            <div class="product-gift-item">
                <img src="${image}" alt="${escapeHtml(giftProd.name || "")}">
                <div class="product-gift-item-info">
                    <span class="product-gift-item-name">${escapeHtml(giftProd.name || "")}</span>
                    <span class="product-gift-item-tag">🎁 ${tag}</span>
                </div>
            </div>
        `;
    });

    if (!itemsHtml) {
        wrap.style.display = "none";
        wrap.innerHTML = "";
        return;
    }

    wrap.innerHTML = `<div class="product-gift-title">🎁 This product comes with a Free Gift</div>${itemsHtml}`;
    wrap.style.display = "block";
}

/* =========================
   FEATURES TAB
========================= */
function renderFeatures(features) {
    const grid = document.getElementById("featureGrid");
    if (!grid) return;

    if (!Array.isArray(features) || !features.length) {
        grid.innerHTML = `<div class="feat-empty">No feature details added for this product yet.</div>`;
        return;
    }

    grid.innerHTML = features.map(f => `
        <div class="feat-card">
            <span class="feat-icon">${escapeHtml(f.icon || "✔")}</span>
            <div>
                <div class="feat-name">${escapeHtml(f.title || "")}</div>
                <div class="feat-desc">${escapeHtml(f.description || "")}</div>
            </div>
        </div>
    `).join("");
}

/* =========================
   SPEC TABLE (reuses features as name/value rows)
========================= */
function renderSpecTable(features) {
    const table = document.getElementById("specTable");
    if (!table) return;

    if (!Array.isArray(features) || !features.length) {
        table.innerHTML = "";
        return;
    }

    table.innerHTML = features.map(f => `
        <tr>
            <td class="spec-key">${escapeHtml(f.title || "")}</td>
            <td class="spec-val">${escapeHtml(f.description || "")}</td>
        </tr>
    `).join("");
}

/* =========================
   REVIEWS TAB — with pagination 
========================= */
let ALL_REVIEWS = [];
let REVIEWS_SHOWN = 3;
const REVIEWS_INITIAL = 3;
const REVIEWS_STEP = 10;

function renderReviews(reviews, rating, reviewCount) {
    const scoreEl = document.getElementById("reviewScore");
    const countEl = document.getElementById("reviewCountText");

    if (scoreEl) scoreEl.textContent = rating.toFixed(1);
    if (countEl) countEl.textContent = `${reviewCount} reviews`;

    ALL_REVIEWS = Array.isArray(reviews) ? reviews : [];
    REVIEWS_SHOWN = REVIEWS_INITIAL;

    renderReviewList();
}

function renderReviewList() {
    const listEl = document.getElementById("reviewList");
    if (!listEl) return;

    if (!ALL_REVIEWS.length) {
        listEl.innerHTML = `<div class="rv-item"><p>No reviews yet</p></div>`;
        removeReviewToggle();
        return;
    }

    const visible = ALL_REVIEWS.slice(0, REVIEWS_SHOWN);

    listEl.innerHTML = visible.map(r => `
        <div class="rv-item">
            <div class="rv-item-head">
                <span class="rv-name">${escapeHtml(r.name || "Anonymous")}</span>
                ${r.verified ? `<span class="rv-verified">✔ Verified Purchase</span>` : ""}
                <span class="rv-date">${escapeHtml(r.date || "")}</span>
            </div>
            <div class="rv-stars">${"★".repeat(Math.round(r.rating || 0))}${"☆".repeat(5 - Math.round(r.rating || 0))}</div>
            <p class="rv-comment">${escapeHtml(r.comment || "")}</p>
        </div>
    `).join("");

    renderReviewToggle();
}

function renderReviewToggle() {
    removeReviewToggle();

    const container = document.getElementById("pane-reviews");
    if (!container) return;

    const total = ALL_REVIEWS.length;

    // nothing to expand or collapse (e.g. total <= REVIEWS_INITIAL)
    if (total <= REVIEWS_INITIAL) return;

    const wrap = document.createElement("div");
    wrap.className = "rv-toggle-wrap";
    wrap.id = "rvToggleWrap";

    const hasMore = REVIEWS_SHOWN < total;
    const isExpanded = REVIEWS_SHOWN > REVIEWS_INITIAL;

    if (hasMore) {
        const moreBtn = document.createElement("button");
        moreBtn.className = "rv-toggle-btn";
        moreBtn.textContent = "See More";
        moreBtn.onclick = () => {
            REVIEWS_SHOWN = Math.min(REVIEWS_SHOWN + REVIEWS_STEP, total);
            renderReviewList();
            document.getElementById("rvToggleWrap")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        };
        wrap.appendChild(moreBtn);
    }

    if (isExpanded) {
        const lessBtn = document.createElement("button");
        lessBtn.className = "rv-toggle-btn";
        lessBtn.textContent = "See Less";
        lessBtn.onclick = () => {
            REVIEWS_SHOWN = REVIEWS_INITIAL;
            renderReviewList();
            document.getElementById("pane-reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
        };
        wrap.appendChild(lessBtn);
    }

    container.appendChild(wrap);
}

function removeReviewToggle() {
    document.getElementById("rvToggleWrap")?.remove();
}
/* =========================
   FAQ TAB
========================= */
function renderFAQs(faqs) {
    const listEl = document.getElementById("faqList");
    if (!listEl) return;

    if (!Array.isArray(faqs) || !faqs.length) {
        listEl.innerHTML = `<div class="faq-item"><div class="faq-q"><span class="faq-q-txt">No FAQs available for this product yet.</span></div></div>`;
        return;
    }

    listEl.innerHTML = faqs.map(f => `
        <div class="faq-item">
            <div class="faq-q" onclick="faqToggle(this)">
                <span class="faq-q-txt">${escapeHtml(f.question || "")}</span>
    
                <svg class="faq-ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path d="M6 9l6 6 6-6"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="3"
                          stroke-linecap="round"
                          stroke-linejoin="round"/>
                </svg>
    
            </div>
            <div class="faq-a">
                <p>${escapeHtml(f.answer || "")}</p>
            </div>
        </div>
    `).join("");
}



/* =========================
   SMALL UTIL: escape user/CMS text before injecting as HTML
========================= */
function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================
   RENDER IMAGES (product-level, used as fallback / default)
========================= */
function renderImages(images) {

    let imgList = Array.isArray(images) ? images.slice() : [];

    let mainImage = imgList.length > 0 ? imgList[0] : "";

    if (mainImage && !mainImage.startsWith("http")) {
        mainImage = API_BASE + mainImage;
    }

    const productImage = document.getElementById("productImage");
    if (productImage) {
        productImage.src = mainImage || "https://placehold.co/600x600?text=No+Image";
        productImage.onerror = () => {
            productImage.src = "https://placehold.co/600x600?text=No+Image";
        };
    }

    const thumbGrid = document.getElementById("thumbGrid");
    if (thumbGrid) {
        thumbGrid.innerHTML = "";
        imgList.forEach(img => {
            let finalImg = img;
            if (finalImg && !finalImg.startsWith("http")) {
                finalImg = API_BASE + finalImg;
            }
            thumbGrid.innerHTML += `
                <div class="thumb" onclick="document.getElementById('productImage').src='${finalImg}'">
                    <img src="${finalImg}" alt="thumbnail">
                </div>
            `;
        });
    }
}

/* =========================
   SET MAIN IMAGE (used when a variant is picked and has its own image)
========================= */
function setMainImage(url) {
    const productImage = document.getElementById("productImage");
    if (!productImage) return;
    let finalUrl = url;
    if (finalUrl && !finalUrl.startsWith("http")) {
        finalUrl = API_BASE + finalUrl;
    }
    productImage.src = finalUrl || "https://placehold.co/600x600?text=No+Image";
}

/* =========================
   RENDER VARIANT PICKER
   Groups all attribute keys across variants (e.g. color, size)
   and renders a swatch/button group for each.
========================= */
function renderVariantPicker(variants) {

    const wrap = document.getElementById("variantPickerWrap");
    if (!wrap) return;

    // Collect attribute keys -> possible values (preserve first-seen order)
    const attrMap = {};

    variants.forEach(v => {
        const attrs = v.attributes || {};
        Object.keys(attrs).forEach(key => {
            if (!attrMap[key]) attrMap[key] = [];
            if (!attrMap[key].includes(attrs[key])) {
                attrMap[key].push(attrs[key]);
            }
        });
    });

    let html = "";

    Object.keys(attrMap).forEach(attrKey => {

        html += `
            <div class="variant-group" data-attr-key="${attrKey}">
                <div class="variant-group-label">${capitalize(attrKey)}</div>
                <div class="variant-options">
        `;

        attrMap[attrKey].forEach(val => {
            html += `
                <button
                    type="button"
                    class="variant-option"
                    data-attr-key="${attrKey}"
                    data-attr-value="${val}"
                    onclick="onVariantOptionClick('${attrKey}', '${val.replace(/'/g, "\\'")}')">
                    ${val}
                </button>
            `;
        });

        html += `</div></div>`;
    });

    wrap.innerHTML = html;
}

function capitalize(s) {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/* =========================
   HANDLE VARIANT OPTION CLICK
========================= */
function onVariantOptionClick(attrKey, attrValue) {

    VARIANT_ATTR_STATE[attrKey] = attrValue;

    const variants = CURRENT_PRODUCT?.variants || [];

    selectVariantByAttributes(VARIANT_ATTR_STATE, variants, true);
}

/* =========================
   SELECT VARIANT MATCHING GIVEN ATTRIBUTES
   (exact match if all attrs given; otherwise finds first variant
   that matches the attrs currently chosen so far)
========================= */
function selectVariantByAttributes(attrsWanted, variants, isUserClick = false) {

    if (!Array.isArray(variants) || !variants.length) return;

    // Try exact match on all currently selected attribute keys
    let match = variants.find(v => {
        const va = v.attributes || {};
        return Object.keys(attrsWanted).every(k => va[k] === attrsWanted[k]);
    });

    // Fallback: if no exact match (invalid combo), keep whichever partial
    // matches the most selected keys
    if (!match) {
        let bestScore = -1;
        variants.forEach(v => {
            const va = v.attributes || {};
            let score = 0;
            Object.keys(attrsWanted).forEach(k => {
                if (va[k] === attrsWanted[k]) score++;
            });
            if (score > bestScore) {
                bestScore = score;
                match = v;
            }
        });
    }

    if (!match) return;

    const variantChanged = !SELECTED_VARIANT || SELECTED_VARIANT.id !== match.id;
    SELECTED_VARIANT = match;
    VARIANT_ATTR_STATE = { ...(match.attributes || {}) };

    if (isUserClick && variantChanged && typeof window.trackEvent === "function" && CURRENT_PRODUCT) {
        window.trackEvent("variant_view", {
            product_id: CURRENT_PRODUCT.id,
            variant_id: match.id,
            attributes: match.attributes || {},
        });
    }

    // Update active state on buttons
    document.querySelectorAll(".variant-option").forEach(btn => {
        const key = btn.dataset.attrKey;
        const val = btn.dataset.attrValue;
        btn.classList.toggle("active", VARIANT_ATTR_STATE[key] === val);
    });

    // Update price + stock display
    renderPriceAndStock(match.price, match.discount_price, match.stock);

    // at the end of selectVariantByAttributes(), after renderPriceAndStock(...)
    initWishlist(CURRENT_PRODUCT.id);

    const variantImgs = variantOwnImages(match);
    const gallery = mergeGalleries(CURRENT_PRODUCT?.images, variantImgs);
    const galleryKey = gallery.join("|");
    if (galleryKey !== CURRENT_GALLERY_KEY) {
        CURRENT_GALLERY_KEY = galleryKey;
        renderImages(gallery);
    }
    if (isUserClick && variantImgs.length) {
        setMainImage(variantImgs[0]);
    }
}

function variantOwnImages(v) {
    if (!v) return [];
    if (Array.isArray(v.images) && v.images.length) return v.images;
    return v.image ? [v.image] : [];
}

function mergeGalleries(productImages, variantImages) {
    const seen = new Set();
    const out = [];
    [...(productImages || []), ...(variantImages || [])].forEach(u => {
        if (u && !seen.has(u)) {
            seen.add(u);
            out.push(u);
        }
    });
    return out;
}

/* =========================
   CUSTOMIZATION:
========================= */

function customExtraAmount() {
    const p = CURRENT_PRODUCT;
    if (!p || !p.has_customization) return 0;
    if (SELECTED_VARIANT && SELECTED_VARIANT.customization_price != null) {
        return Number(SELECTED_VARIANT.customization_price);
    }
    return Number(p.customization_price || 0);
}

function getCustomExtra() {
    return CUSTOM_MODE ? customExtraAmount() : 0;
}

function updateCustomLabel() {
    const btn = document.querySelector('#customizeWrap .customize-opt[data-mode="custom"]');
    if (!btn) return;
    const extra = customExtraAmount();
    btn.textContent = extra > 0 ? `Customized (+৳ ${extra})` : "Customized";
}

function repaintPrice() {
    if (LAST_PRICE_ARGS) renderPriceAndStock(...LAST_PRICE_ARGS);
}

function renderCustomization(product) {
    const wrap = document.getElementById("customizeWrap");
    if (!wrap) return;
    CUSTOM_MODE = false;

    const mode = product.customization_mode || (product.has_customization ? "optional" : "off");

    if (!product.has_customization || mode === "off") {
        wrap.style.display = "none";
        wrap.innerHTML = "";
        return;
    }

    if (mode === "mandatory") {
        CUSTOM_MODE = true;
        wrap.style.display = "none";
        wrap.innerHTML = "";
        return;
    }

    const extra = customExtraAmount();
    const extraText = extra > 0 ? ` (+৳ ${extra})` : "";

    wrap.style.display = "block";
    wrap.innerHTML = `
        <div class="customize-title">Type</div>
        <div class="customize-seg" role="group" aria-label="Standard or customized">
            <button type="button" class="customize-opt active" data-mode="standard">Standard</button>
            <button type="button" class="customize-opt" data-mode="custom">Customized${extraText}</button>
        </div>
        <div id="customizeHint" style="display:none;font-size:13px;color:#8a6d2b;margin-top:6px;">
            ✏️ কাস্টমাইজেশনের বিবরণ আপনি অর্ডার ফর্মে লিখবেন।
        </div>
    `;

    const hint = document.getElementById("customizeHint");

    wrap.querySelectorAll(".customize-opt").forEach(btn => {
        btn.addEventListener("click", () => {
            CUSTOM_MODE = btn.dataset.mode === "custom";
            wrap.querySelectorAll(".customize-opt").forEach(b => b.classList.toggle("active", b === btn));
            if (hint) hint.style.display = CUSTOM_MODE ? "block" : "none";
            repaintPrice();
        });
    });
}

function readCustomization(product) {
    const customized = !!(product && product.has_customization && CUSTOM_MODE);
    return { ok: true, customized, note: "" };
}

function currentVariantImage(product) {
    return SELECTED_VARIANT?.image || product.images?.[0] || "";
}

/* =========================
   RENDER PRICE + STOCK (shared by simple & variant products)
========================= */
function renderPriceAndStock(price, discountPrice, stock) {

    LAST_PRICE_ARGS = [price, discountPrice, stock];

    // per-variant campaign values (null when this page is not in a valid campaign context)
    const cp = campaignVariantPricing();

    price = Number(price || 0);
    discountPrice = Number(discountPrice || 0);

    updateCustomLabel();
    const customExtra = getCustomExtra();
    if (customExtra) {
        price += customExtra;
        if (discountPrice) discountPrice += customExtra;
    }
    let finalPrice = discountPrice || price;
    let oldPriceText = (discountPrice && discountPrice < price) ? `৳ ${price}` : "";
    let discountText = "";
    if (discountPrice && discountPrice < price) {
        const off = Math.round(((price - discountPrice) / price) * 100);
        discountText = `${off}% OFF`;
    }
    stock = parseInt(stock ?? 0, 10);

    let campaignSoldOut = false;
    let campaignLimited = false;
    let showStrike = false;
    if (cp) {
        const camp = Number(cp.campaign_price || 0);
        const strike = Number(cp.strike_price || 0);
        showStrike = strike > camp;                       // no visible discount -> no strike, no badge
        finalPrice = camp + customExtra;
        oldPriceText = showStrike ? `৳ ${strike + customExtra}` : "";
        discountText = showStrike ? (cp.badge_text || "") : "";
        if (cp.stock_limit != null) {
            const left = Math.max(0, Number(cp.stock_left != null ? cp.stock_left : cp.stock_limit));
            if (left <= 0) campaignSoldOut = true;
            else if (left <= stock) { stock = left; campaignLimited = true; }
        }
    }

    document.getElementById("productPrice").textContent = `৳ ${finalPrice}`;
    document.getElementById("stickyPrice").textContent = `৳ ${finalPrice}`;

    document.getElementById("productOldPrice").textContent = oldPriceText;
    document.getElementById("stickyOldPrice").textContent = oldPriceText;

    const discountEl = document.getElementById("productDiscount");
    discountEl.textContent = discountText;

    const stockLeftEl = document.getElementById("stockLeft");
    const stockStatusEl = document.getElementById("stockStatus");

    stockLeftEl.parentElement.style.display = "none";

    if (campaignSoldOut) {
        stockStatusEl.textContent = "✖ Campaign stock finished";
        stockStatusEl.style.color = "#dc2626";
    } else if (stock <= 0) {
        stockStatusEl.textContent = "✖ Out of Stock";
        stockStatusEl.style.color = "#dc2626";
    } else if (campaignLimited) {
        stockStatusEl.textContent = `⚠ Only ${stock} left at campaign price`;
        stockStatusEl.style.color = "#dc2626";
        stockLeftEl.textContent = stock;
        stockLeftEl.parentElement.style.display = "block";
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
        if (campaignSoldOut) {
            if (btn.innerText !== "Campaign stock finished" && btn.innerText !== "Out of Stock") btn.dataset.originalText = btn.innerText;
            btn.disabled = true;
            btn.style.opacity = "0.5";
            btn.style.cursor = "not-allowed";
            btn.innerText = "Campaign stock finished";
        } else if (isOutOfStock) {
            btn.disabled = true;
            btn.style.opacity = "0.5";
            btn.style.cursor = "not-allowed";
            btn.innerText = "Out of Stock";
        } else {
            btn.disabled = false;
            btn.style.opacity = "1";
            btn.style.cursor = "pointer";
            // restore original label if it was overwritten
            if (btn.innerText === "Out of Stock" || btn.innerText === "Campaign stock finished") {
                btn.innerText = btn.dataset.originalText || "Buy Now";
            }
        }
    });

    paintCampaignBox(cp, showStrike, campaignSoldOut);
}

/* =========================
   CAMPAIGN CONTEXT (?campaign=<slug>)
   Only a valid campaign_pricing from the API switches the page into campaign mode.
   campaign_notice (ended / not_in_campaign / not_started) = normal price + a small notice.
========================= */
function getCampaignParam() {
    const v = (new URLSearchParams(window.location.search).get("campaign") || "").trim();
    return /^[A-Za-z0-9_-]+$/.test(v) ? v : "";
}

function activeCampaignSlug() {
    return CAMPAIGN_CTX ? CAMPAIGN_CTX.campaign_slug : null;
}

/* per-variant values; falls back to the product-level values (no variants / variant not listed) */
function campaignVariantPricing() {
    if (!CAMPAIGN_CTX) return null;
    const base = CAMPAIGN_CTX;
    if (SELECTED_VARIANT && Array.isArray(base.variants)) {
        const v = base.variants.find(x => Number(x.variant_id) === Number(SELECTED_VARIANT.id));
        if (v) return { ...v, campaign_slug: base.campaign_slug, stock_limit: base.stock_limit, stock_left: base.stock_left };
    }
    return base;
}

function campaignTitle() {
    if (CAMPAIGN_META && CAMPAIGN_META.title) return CAMPAIGN_META.title;
    return window.PWCampaign ? PWCampaign.prettySlug(activeCampaignSlug()) : (activeCampaignSlug() || "");
}

/* what a cart line carries when added from a campaign page (null on a normal page) */
function campaignLineSnapshot() {
    const slug = activeCampaignSlug();
    if (!slug) return null;
    const cp = campaignVariantPricing();
    const camp = Number(cp.campaign_price || 0);
    const strike = Number(cp.strike_price || 0);
    return {
        campaign: slug,
        campaign_title: campaignTitle(),
        campaign_price: camp,
        price: strike > camp ? strike : Number(cp.regular_price || camp),
        discount_price: camp
    };
}

const CAMPAIGN_NOTICE_TEXT = {
    ended: "This campaign has ended — the regular price is shown.",
    not_in_campaign: "This product is not part of that campaign — the regular price is shown.",
    not_started: "This campaign has not started yet — the regular price is shown."
};

function renderCampaignBox() {
    const box = document.getElementById("cmpPdBox");
    const note = document.getElementById("cmpPdNotice");
    if (note) { note.style.display = "none"; note.textContent = ""; }
    if (box) { box.style.display = "none"; box.innerHTML = ""; }

    if (CAMPAIGN_NOTICE && note) {
        note.textContent = CAMPAIGN_NOTICE_TEXT[CAMPAIGN_NOTICE] || "This campaign is not available — the regular price is shown.";
        note.style.display = "block";
    }
    if (!CAMPAIGN_CTX || !box) return;

    const slug = CAMPAIGN_CTX.campaign_slug;
    box.innerHTML = `
        <div class="cmp-pd-label">
            <span class="cmp-pd-chip">🏷 <span id="cmpPdTitle">${escapeHtml(campaignTitle())}</span></span>
            <span class="cmp-pd-ends" id="cmpPdEnds"></span>
        </div>
        <div class="cmp-pd-save" id="cmpPdSave"></div>
        <div class="cmp-pd-out" id="cmpPdOut" style="display:none;"></div>`;
    box.style.display = "block";

    // the product response has no campaign title / end time -> take them from the campaign list
    if (window.PWCampaign) {
        PWCampaign.ensureCss();
        PWCampaign.startTicker();
        PWCampaign.getList().then(list => {
            const c = (list || []).find(x => x.slug === slug);
            if (!c) return;
            CAMPAIGN_META = c;
            const t = document.getElementById("cmpPdTitle");
            if (t) t.textContent = c.title;
            const ends = document.getElementById("cmpPdEnds");
            const ms = Date.parse(c.end_at);
            if (ends && isFinite(ms)) {
                ends.setAttribute("data-cmp-count", String(ms));
                ends.setAttribute("data-cmp-fmt", "label-end");
                ends.setAttribute("data-cmp-kind", "end");
                ends.setAttribute("data-cmp-slug", slug);
                PWCampaign.tick();
            }
        }).catch(() => { });
    }
}

/* called from renderPriceAndStock on every price repaint (variant change, customization toggle) */
function paintCampaignBox(cp, showStrike, soldOut) {
    const chip = document.getElementById("cmpBadgeChip");
    if (chip) {
        chip.textContent = showStrike && cp && cp.badge_text ? `🏷 ${cp.badge_text}` : "";
        chip.style.display = chip.textContent ? "" : "none";
    }
    const save = document.getElementById("cmpPdSave");
    if (save) {
        save.textContent = (cp && showStrike && Number(cp.savings_amount) > 0)
            ? `You save ৳ ${cp.savings_amount} (${cp.savings_percent}%)` : "";
    }
    const out = document.getElementById("cmpPdOut");
    if (out) {
        if (soldOut && CURRENT_PRODUCT && CURRENT_PRODUCT.slug) {
            out.innerHTML = `Campaign stock is finished. <a href="/product-details.html?slug=${encodeURIComponent(CURRENT_PRODUCT.slug)}">Buy at the regular price →</a>`;
            out.style.display = "block";
        } else {
            out.style.display = "none";
        }
    }
}

// campaign ended while the page is open: reload once so the server answers with campaign_notice
document.addEventListener("pwcampaign:expired", e => {
    if (!e.detail || e.detail.kind !== "end" || !CAMPAIGN_CTX || e.detail.slug !== CAMPAIGN_CTX.campaign_slug) return;
    const key = "cmp_reload_" + e.detail.slug;
    try {
        if (Date.now() - Number(sessionStorage.getItem(key) || 0) < 60000) return;   // never loop
        sessionStorage.setItem(key, String(Date.now()));
    } catch (err) { }
    toast?.("Campaign has ended — updating the price");
    setTimeout(() => window.location.reload(), 1500);
});

/* =========================
   BUTTONS (updated)
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

            if (product.variants && product.variants.length > 0 && !SELECTED_VARIANT) {
                requireVariantSelection();
                return;
            }

            const custom = readCustomization(product);
            if (!custom.ok) return;

            const camp = campaignLineSnapshot();
            GAAddToCartEvent({
                id: product.id,
                name: product.name,
                discount_price: camp ? camp.campaign_price : (SELECTED_VARIANT ? SELECTED_VARIANT.discount_price : product.discount_price),
                ...(camp ? { campaign: camp.campaign, campaign_price: camp.campaign_price } : {})
            });

            if (typeof window.trackEvent === "function") {
                window.trackEvent("add_to_cart", {
                    product_id: product.id,
                    variant_id: SELECTED_VARIANT ? SELECTED_VARIANT.id : null,
                    quantity: 1,
                    ...(camp ? { campaign: camp.campaign } : {}),
                });
            }

            const token = localStorage.getItem("access") || localStorage.getItem("token");

            if (!token) {
                const variant = SELECTED_VARIANT;
                guestCartAdd(product.id, variant ? variant.id : null, 1, {
                    name: product.name,
                    image: currentVariantImage(product),
                    price: variant ? variant.price : product.price,
                    discount_price: variant ? variant.discount_price : product.discount_price,
                    attributes: variant ? variant.attributes : null,
                    is_customized: custom.customized,
                    customization_price: customExtraAmount(),
                    ...(camp || {}),
                });

                localStorage.setItem("checkout_guest_items", JSON.stringify([{
                    product_id: product.id,
                    variant_id: variant ? variant.id : null,
                    quantity: 1,
                    is_customized: custom.customized,
                    ...(camp ? { campaign: camp.campaign } : {})
                }]));
                localStorage.removeItem("checkout_cart_ids");

                window.location.href = "/checkout";
                return;
            }

            try {
                const payload = { product_id: product.id, quantity: 1 };
                if (SELECTED_VARIANT) payload.variant_id = SELECTED_VARIANT.id;
                if (custom.customized) payload.is_customized = true;
                if (camp) payload.campaign = camp.campaign;

                const addRes = await fetch(`${API_BASE}/cart/add/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });

                if (!addRes.ok) {
                    console.error("ADD CART ERROR:", await addRes.text());
                    toast?.("Add to cart failed");
                    return;
                }

                const addData = await addRes.json();
                if (!addData.status) {
                    toast?.(addData.message || "Failed to add cart");
                    return;
                }

                const cartRes = await fetch(`${API_BASE}/cart/`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const cartData = await cartRes.json();

                if (!cartData.status || !Array.isArray(cartData.data) || !cartData.data.length) {
                    toast?.("Cart is empty");
                    return;
                }

                const cartItem = cartData.data.find(ci => addData.cart_id && ci.id === addData.cart_id) ||
                    cartData.data.slice().reverse().find(ci =>
                        ci.product_id === product.id &&
                        (ci.variant_id || null) === (SELECTED_VARIANT ? SELECTED_VARIANT.id : null) &&
                        !!ci.is_customized === custom.customized &&
                        (!("campaign" in ci) || (ci.campaign || null) === (camp ? camp.campaign : null))
                    ) || cartData.data[cartData.data.length - 1];
                localStorage.setItem("checkout_cart_ids", JSON.stringify([cartItem.id]));
                localStorage.removeItem("checkout_guest_items");

                window.location.href = "/checkout";

            } catch (err) {
                console.error("BUY NOW ERROR:", err);
                toast?.("Buy now failed");
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
            if (product.variants && product.variants.length > 0 && !SELECTED_VARIANT) {
                requireVariantSelection();
                return;
            }
            const custom = readCustomization(product);
            if (!custom.ok) return;
            const camp = campaignLineSnapshot();
            quickAddCart(product.id, SELECTED_VARIANT ? SELECTED_VARIANT.id : null, {
                name: product.name,
                image: currentVariantImage(product),
                price: SELECTED_VARIANT ? SELECTED_VARIANT.price : product.price,
                discount_price: SELECTED_VARIANT ? SELECTED_VARIANT.discount_price : product.discount_price,
                attributes: SELECTED_VARIANT ? SELECTED_VARIANT.attributes : null,
                is_customized: custom.customized,
                customization_price: customExtraAmount(),
                ...(camp || {}),
            });
        };
    });

    const waBtn = document.getElementById("ctaWhatsappBtn");
    if (waBtn) {
        waBtn.onclick = () => {
            const msg = `I want to order: ${product.name}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
        };
    }

    const wishBtn = document.getElementById("wishBtn");
    const wishIco = document.getElementById("wishIco");

    const wishHandler = () => {
        if (product.variants && product.variants.length > 0 && !SELECTED_VARIANT) {
            requireVariantSelection();
            return;
        }
        toggleWishlist(product.id);
    };

    wishBtn?.addEventListener("click", wishHandler);
    wishIco?.addEventListener("click", wishHandler);
}

/* ========================= WISHLIST ========================= */

let WISHLIST_ID = null;
let IS_WISHLISTED = false;

async function initWishlist(productId) {
    const token = localStorage.getItem("access") || localStorage.getItem("token");
    const variantId = SELECTED_VARIANT ? SELECTED_VARIANT.id : null;

    if (!token) {
        IS_WISHLISTED = guestWishlistHas(productId, variantId);
        renderWishlistState();
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/wishlist/`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();

        IS_WISHLISTED = false;
        WISHLIST_ID = null;

        if (data.status && Array.isArray(data.data)) {
            const item = data.data.find(x =>
                x.product_id == productId && (x.variant_id || null) === (variantId || null)
            );
            if (item) {
                IS_WISHLISTED = true;
                WISHLIST_ID = item.id;
            }
        }
        renderWishlistState();
    } catch (err) {
        console.error(err);
    }
}

function renderWishlistState() {
    const btn = document.getElementById("wishBtn");
    const icon = document.getElementById("wishIco");

    if (IS_WISHLISTED) {
        if (btn) btn.innerHTML = "❤️ Wishlisted";
        if (icon) icon.innerHTML = "❤️";
    } else {
        if (btn) btn.innerHTML = "♡ Wishlist";
        if (icon) icon.innerHTML = "♡";
    }
}

async function toggleWishlist(productId) {
    const token = localStorage.getItem("access") || localStorage.getItem("token");
    const variantId = SELECTED_VARIANT ? SELECTED_VARIANT.id : null;

    if (typeof window.trackEvent === "function") {
        window.trackEvent(IS_WISHLISTED ? "wishlist_remove" : "wishlist_add", {
            product_id: productId,
            variant_id: variantId,
        });
    }

    if (!token) {
        if (IS_WISHLISTED) {
            guestWishlistRemove(productId, variantId);
            IS_WISHLISTED = false;
            toast?.("Removed from wishlist");
        } else {
            guestWishlistAdd(productId, {
                slug: CURRENT_PRODUCT?.slug || "",
                name: CURRENT_PRODUCT?.name || "",
                image: SELECTED_VARIANT?.image || CURRENT_PRODUCT?.images?.[0] || "",
                price: SELECTED_VARIANT ? SELECTED_VARIANT.price : CURRENT_PRODUCT?.price || 0,
                discount_price: SELECTED_VARIANT ? SELECTED_VARIANT.discount_price : CURRENT_PRODUCT?.discount_price || null,
                variant_id: variantId,
                attributes: SELECTED_VARIANT ? SELECTED_VARIANT.attributes : null,
            });
            IS_WISHLISTED = true;
            toast?.("Added to wishlist ❤️");
        }
        renderWishlistState();
        updateWishlistCount?.();
        return;
    }

    try {
        if (IS_WISHLISTED) {
            const res = await fetch(`${API_BASE}/wishlist/remove/${WISHLIST_ID}/`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status) {
                IS_WISHLISTED = false;
                WISHLIST_ID = null;
                renderWishlistState();
                updateWishlistCount();
                toast?.("Removed from wishlist");
            }
        } else {
            const res = await fetch(`${API_BASE}/wishlist/add/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ product_id: productId, variant_id: variantId })
            });
            const data = await res.json();
            if (data.status) {
                IS_WISHLISTED = true;
                renderWishlistState();
                updateWishlistCount();
                toast?.("Added to wishlist ❤️");
                initWishlist(productId);
            }
        }
    } catch (err) {
        console.error(err);
        toast?.("Wishlist failed");
    }
}

/* =========================
   RELATED PRODUCTS
========================= */
async function loadRelatedProducts(product) {

    const container = document.getElementById("relatedProducts");
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/api/ecom/products/`);
        const data = await res.json();

        let products = [];
        if (data?.results?.data) products = data.results.data;
        else if (data?.data) products = data.data;
        else if (Array.isArray(data)) products = data;

        const related = products.filter(p => p.id !== product.id).slice(0, 6);

        container.innerHTML = "";

        related.forEach(p => {

            const slug = p.slug || makeSlug(p.name);

            let image = "";
            if (p.images && Array.isArray(p.images) && p.images.length > 0) {
                image = p.images[0];
            } else if (p.image) {
                image = p.image;
            }

            if (image && !image.startsWith("http")) {
                image = API_BASE + image;
            }

            container.innerHTML += `
            <div class="prod-card">
                <div class="prod-img" onclick="openProduct('${slug}')">
                    <img src="${image}" alt="${p.name}">
                </div>
                <div class="prod-name" onclick="openProduct('${slug}')">${p.name}</div>
                <div class="prod-price">
                    ৳ ${p.discount_price || p.price} <span class="price-orig">${p.discount_price ? `৳ ${p.price}` : ""}</span>
                </div>
                <button class="prod-cart" onclick="quickAddCart(${p.id})">+ Cart</button>
            </div>
            `;
        });

    } catch (err) {
        console.error("RELATED PRODUCTS ERROR:", err);
    }
}

/* =========================
   FAQ TOGGLE
========================= */
function faqToggle(el) {
    const item = el.parentElement;
    item.classList.toggle("open");
}

/* =========================
   TAB SWITCH
========================= */
function switchTab(tab, evt) {
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("on"));
    document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("on"));
    document.getElementById(`pane-${tab}`)?.classList.add("on");
    const target = evt?.target || window.event?.target;
    target?.classList.add("on");
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
    } else if (type === "fb") {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
    } else if (type === "ig") {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied for Instagram share!");
    } else if (type === "copy") {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied!");
    }

    closeShare();
}


/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
    loadProductDetails();
    updateCartCountFromBackend?.();
});

/* =========================================
   OFFERS (buy X get Y free) + combo partners
========================================= */
const poToBn = n => String(n == null ? "" : n).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]);

async function renderProductOffers(product) {
    const wrap = document.getElementById("productOfferWrap");
    if (!wrap) return;
    try {
        const res = await fetch(`${API_BASE}/api/offers/product/${product.id}/`);
        const json = await res.json();
        // campaign context with offers switched off: no buy-X-get-Y card (combo suggestions stay)
        const offersOff = !!(CAMPAIGN_CTX && CAMPAIGN_CTX.offers_included === false);
        const offers = offersOff ? [] : ((json.data && json.data.offers) || []);
        const combos = (json.data && json.data.combos) || [];
        const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
        let html = "";

        offers.forEach(o => {
            // what must be bought: any product / same product (any variant) / exact same variant
            const what = o.count_mode === "variant" ? "একই ভ্যারিয়েন্টের " : (o.count_mode === "product" ? "এই প্রোডাক্টের (যেকোনো ভ্যারিয়েন্ট) " : "");
            const rules = o.tiers.map(t => o.mode === "choose"
                ? `<span class="po-chip">${what}${poToBn(t.buy_qty)}টি কিনলে ${poToBn(t.free_qty)}টি ফ্রি</span>` : `<span class="po-chip">${what}${poToBn(t.buy_qty)}টি কিনলে ফ্রি গিফট</span>`).join("");
            const anyVariantGift = (o.gifts || []).some(g => g.variant_count > 0);
            const gifts = (o.gifts || []).slice(0, 8).map(g => `<img src="${esc(g.image)}" title="${esc(g.name)}" alt="${esc(g.name)}">`).join("");
            html += `<div class="po-card"><div class="po-title">🎁 ${esc(o.name)}</div>
                ${o.description ? `<div class="po-desc">${esc(o.description)}</div>` : ""}
                <div class="po-chips">${rules}</div>
                ${gifts ? `<div class="po-gifts">${gifts}</div>` : ""}
                <div class="po-note">${o.mode === "choose" ? (anyVariantGift ? "ফ্রি ফ্রেমের ভ্যারিয়েন্ট চেকআউটে নিজের পছন্দমতো বেছে নিতে পারবেন।" : "ফ্রি ফ্রেম চেকআউটে নিজের পছন্দমতো বেছে নিতে পারবেন।") : "ফ্রি গিফট অর্ডারে অটো যোগ হবে।"}</div></div>`;
        });

        if (combos.length) {
            html += `<div class="po-card"><div class="po-title">💞 এর সাথে দারুণ মানায়</div><div class="po-combos">` +
                combos.map(c => `<a href="product-details.html?slug=${encodeURIComponent(c.slug)}" class="po-combo"><img src="${esc(c.image)}" alt="${esc(c.name)}"><span>${esc(c.name)}</span></a>`).join("") +
                `</div></div>`;
        }

        wrap.innerHTML = html;
        wrap.style.display = html ? "block" : "none";
    } catch (e) {
        wrap.style.display = "none";
    }
}
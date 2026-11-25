/* ==========================================================================
   CAMPAIGN MODULE
========================================================================== */
(function () {
    "use strict";
    if (window.PWCampaign) return;

    /* =========================
       BASIC HELPERS
    ========================= */
    function apiBase() { return window.API_BASE || ""; }
    function listPath() { return window.CAMPAIGN_API_PATH || "/api/ecom/campaigns/"; }

    function esc(str) {
        return String(str == null ? "" : str)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function imgUrl(path) {
        if (!path) return "";
        if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:")) return path;
        return apiBase() + (path.startsWith("/") ? "" : "/") + path;
    }

    function slugify(text) {
        return String(text == null ? "" : text).toLowerCase().trim()
            .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }

    function prettySlug(slug) {
        return String(slug || "").split(/[-_]+/).filter(Boolean)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }

    function num(v, d) {
        const n = Number(v);
        return isFinite(n) ? n : (d == null ? 0 : d);
    }

    /* Product link form: product-details.html?slug=<product slug>[&campaign=<campaign slug>]
       (spa-router.js turns it into the clean /product/<slug>?campaign=<slug> address) */
    function productUrl(productSlug, campaignSlug) {
        return "/product-details.html?slug=" + encodeURIComponent(productSlug) +
            (campaignSlug ? "&campaign=" + encodeURIComponent(campaignSlug) : "");
    }

    function campaignUrl(slug) {
        return "/campaign/" + encodeURIComponent(slug);
    }

    function ensureCss() {
        if (document.querySelector('link[href*="campaign.css"]')) return;
        const l = document.createElement("link");
        l.rel = "stylesheet";
        l.href = "css/campaign.css?v=2";
        document.head.appendChild(l);
    }

    /* =========================
       FETCH (never cached: campaign state changes by the second)
    ========================= */
    async function fetchJson(url, options) {
        const res = await fetch(url, Object.assign({ cache: "no-store" }, options || {}));
        let json = null;
        try { json = await res.json(); } catch (e) { json = null; }
        if (json) {
            const sn = json.server_now || (json.data && json.data.campaign && json.data.campaign.server_now);
            if (sn) setServerNow(sn);
        }
        return { ok: res.ok, status: res.status, json: json };
    }

    /* =========================
       SERVER CLOCK (corrects a wrong device clock)
    ========================= */
    let clockOffset = 0;      // serverMs - deviceMs
    function setServerNow(iso) {
        const t = Date.parse(iso);
        if (isFinite(t)) clockOffset = t - Date.now();
    }
    function now() { return Date.now() + clockOffset; }

    /* =========================
       COUNTDOWN TICKER
       Any element with data-cmp-count="<epoch ms>" is kept up to date by ONE interval.
       data-cmp-fmt: chip-start | chip-end | label-end | boxes
       When a target is reached the element fires "pwcampaign:expired" once.
    ========================= */
    function pad(n) { return String(n).padStart(2, "0"); }

    function split(ms) {
        let s = Math.max(0, Math.floor(ms / 1000));
        const d = Math.floor(s / 86400); s -= d * 86400;
        const h = Math.floor(s / 3600); s -= h * 3600;
        const m = Math.floor(s / 60); s -= m * 60;
        return { d: d, h: h, m: m, s: s };
    }

    function fmtShort(ms) {
        const p = split(ms);
        if (p.d > 0) return pad(p.d) + "d " + pad(p.h) + "h";
        if (p.h > 0) return pad(p.h) + "h " + pad(p.m) + "m";
        return pad(p.m) + "m " + pad(p.s) + "s";
    }

    function paint(el, fmt, ms) {
        if (fmt === "boxes") {
            const p = split(ms);
            ["d", "h", "m", "s"].forEach(u => {
                const b = el.querySelector('[data-u="' + u + '"]');
                if (b) b.textContent = pad(p[u]);
            });
            return;
        }
        if (fmt === "full-start" || fmt === "full-end") {
            const q = split(ms);
            const txt = (q.d > 0 ? q.d + "d " : "") + pad(q.h) + "h " + pad(q.m) + "m " + pad(q.s) + "s";
            if (fmt === "full-start") el.textContent = ms > 0 ? "Starts in " + txt : "Starting…";
            else el.textContent = ms > 0 ? "Ends in " + txt : "Ended";
            return;
        }
        const t = fmtShort(ms);
        if (fmt === "chip-start") el.textContent = ms > 0 ? "Starts in " + t : "Starting…";
        else if (fmt === "chip-end" || fmt === "label-end") el.textContent = ms > 0 ? "Ends in " + t : "Ended";
        else el.textContent = t;
    }

    function tick() {
        const nowMs = now();
        document.querySelectorAll("[data-cmp-count]").forEach(el => {
            const target = Number(el.getAttribute("data-cmp-count"));
            if (!isFinite(target)) return;
            const ms = target - nowMs;
            paint(el, el.getAttribute("data-cmp-fmt") || "chip-end", Math.max(0, ms));
            if (ms <= 0 && !el.__cmpDone) {
                el.__cmpDone = true;
                document.dispatchEvent(new CustomEvent("pwcampaign:expired", {
                    detail: { el: el, kind: el.getAttribute("data-cmp-kind") || "", slug: el.getAttribute("data-cmp-slug") || "" }
                }));
            }
        });
    }

    let tickerStarted = false;
    function startTicker() {
        if (tickerStarted) return;
        tickerStarted = true;
        setInterval(tick, 1000);
        document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });
    }

    function countAttrs(iso, fmt, kind, slug) {
        const t = Date.parse(iso);
        if (!isFinite(t)) return "";
        return 'data-cmp-count="' + t + '" data-cmp-fmt="' + fmt + '" data-cmp-kind="' + kind + '" data-cmp-slug="' + esc(slug || "") + '"';
    }

    function boxesHtml(iso, kind, slug) {
        return '<div class="cmp-boxes" ' + countAttrs(iso, "boxes", kind, slug) + '>' +
            ["d:Days", "h:Hours", "m:Mins", "s:Secs"].map(x => {
                const p = x.split(":");
                return '<div class="cmp-box"><b data-u="' + p[0] + '">00</b><span>' + p[1] + '</span></div>';
            }).join("") + '</div>';
    }

    /* =========================
       CAMPAIGN LIST (cached per page load, 20s)
    ========================= */
    let listCache = null, listCacheAt = 0;
    async function getList(force) {
        if (!force && listCache && Date.now() - listCacheAt < 20000) return listCache;
        const r = await fetchJson(apiBase() + listPath());
        if (!r.ok || !r.json || r.json.status === false) throw new Error("campaign list failed");
        let list = Array.isArray(r.json.data) ? r.json.data.slice() : [];
        list = list.filter(c => c && (c.status === "live" || c.status === "upcoming"));
        // live first (ending soonest), then upcoming (starting soonest)
        list.sort((a, b) => {
            if (a.status !== b.status) return a.status === "live" ? -1 : 1;
            const ka = a.status === "live" ? Date.parse(a.end_at) : Date.parse(a.start_at);
            const kb = b.status === "live" ? Date.parse(b.end_at) : Date.parse(b.start_at);
            return (ka || 0) - (kb || 0);
        });
        listCache = list; listCacheAt = Date.now();
        return list;
    }

    /* =========================
       CAMPAIGN CARD (home section + campaigns page)
    ========================= */
    /* Slim full-width row: the campaign's hero banner as a thin strip, title + countdown on top of it */
    function campaignCardHtml(c) {
        const pic = imgUrl(c.banner_desktop || c.thumbnail || c.banner_mobile);
        const live = c.status === "live";
        const media = pic
            ? '<img src="' + esc(pic) + '" alt="" loading="lazy">'
            : "";
        const chip = live
            ? '<span class="cmp-chip cmp-chip-live"><i></i>Live</span>'
            : '<span class="cmp-chip cmp-chip-soon">Coming soon</span>';
        const count = live
            ? '<span class="cmp-row-count" ' + countAttrs(c.end_at, "full-end", "end", c.slug) + '></span>'
            : '<span class="cmp-row-count" ' + countAttrs(c.start_at, "full-start", "start", c.slug) + '></span>';
        const title = c.hero_title || c.title;
        return '<a class="cmp-row' + (pic ? "" : " cmp-row-plain") + '" href="' + campaignUrl(c.slug) + '" aria-label="' + esc(c.title) + '">' +
            '<div class="cmp-row-media">' + media + '</div>' +
            '<div class="cmp-row-over">' +
            '<div class="cmp-row-text"><div class="cmp-row-title">' + esc(title) + '</div>' +
            (c.short_description ? '<div class="cmp-row-desc">' + esc(c.short_description) + '</div>' : "") + '</div>' +
            '<div class="cmp-row-side">' + chip + count + '<span class="cmp-row-go">Shop now &rarr;</span></div>' +
            '</div></a>';
    }

    function campaignCardHtmlOld(c) {
        const thumb = imgUrl(c.thumbnail || c.banner_desktop || c.banner_mobile);
        const live = c.status === "live";
        const media = thumb
            ? '<img src="' + esc(thumb) + '" alt="' + esc(c.title) + '" loading="lazy">'
            : '<span class="cmp-card-ph">' + esc(c.title) + '</span>';
        const chip = live
            ? '<span class="cmp-chip cmp-chip-live"><i></i>Live</span>'
            : '<span class="cmp-chip cmp-chip-soon" ' + countAttrs(c.start_at, "chip-start", "start", c.slug) + '>Starts in ' + fmtShort(Date.parse(c.start_at) - now()) + '</span>';
        const meta = live
            ? '<span class="cmp-card-meta" ' + countAttrs(c.end_at, "chip-end", "end", c.slug) + '>Ends in ' + fmtShort(Date.parse(c.end_at) - now()) + '</span>'
            : "";
        return '<a class="cmp-card" href="' + campaignUrl(c.slug) + '" aria-label="' + esc(c.title) + '">' +
            '<div class="cmp-card-media">' + media + '</div>' +
            '<div class="cmp-card-body">' +
            '<div class="cmp-card-title">' + esc(c.title) + '</div>' +
            (c.short_description ? '<div class="cmp-card-desc">' + esc(c.short_description) + '</div>' : "") +
            '<div class="cmp-card-foot">' + chip + meta + '</div>' +
            '</div></a>';
    }

    /* ---------- HOME SECTION ---------- */
    async function initHomeSection() {
        const sec = document.getElementById("campaignsSection");
        const grid = document.getElementById("campaignsGrid");
        if (!sec || !grid) return;

        async function render(force) {
            let list = [];
            try { list = await getList(force); } catch (e) { list = []; }
            if (!list.length) { sec.style.display = "none"; grid.innerHTML = ""; return; }
            grid.innerHTML = list.slice(0, 6).map(campaignCardHtml).join("");
            sec.style.display = "";
            const more = document.getElementById("campaignsViewAll");
            if (more) more.style.display = list.length > 2 ? "" : "none";
        }
        await render(false);

        let t = null;
        document.addEventListener("pwcampaign:expired", e => {
            if (!sec.contains(e.detail.el)) return;
            clearTimeout(t);
            t = setTimeout(() => render(true), 1500);   // status changed -> fetch again
        });
    }

    /* ---------- CAMPAIGNS PAGE ---------- */
    async function initCampaignsPage() {
        const box = document.getElementById("cmpListPage");
        if (!box) return;
        box.innerHTML = '<div class="cmp-loading"><div class="cmp-spin"></div></div>';

        async function render(force) {
            let list;
            try { list = await getList(force); }
            catch (e) {
                box.innerHTML = messageHtml("😕", "Could not load campaigns", "Please check your connection and try again.", '<button type="button" class="cmp-btn" id="cmpRetry">Try again</button>');
                const b = document.getElementById("cmpRetry");
                if (b) b.onclick = () => render(true);
                return;
            }
            if (!list.length) {
                box.innerHTML = messageHtml("🛍️", "No campaigns right now", "New offers are coming — check back soon.", '<a class="cmp-btn" href="/product-list">Browse all products</a>');
                return;
            }
            box.innerHTML = '<div class="cmp-rows">' + list.map(campaignCardHtml).join("") + '</div>';
        }
        await render(false);

        let t = null;
        document.addEventListener("pwcampaign:expired", e => {
            if (!box.contains(e.detail.el)) return;
            clearTimeout(t);
            t = setTimeout(() => render(true), 1500);
        });
    }

    function messageHtml(icon, title, text, actionHtml) {
        return '<div class="cmp-msg"><div class="cmp-msg-ic">' + icon + '</div>' +
            '<h2>' + esc(title) + '</h2><p>' + esc(text) + '</p>' + (actionHtml || "") + '</div>';
    }

    /* =========================
       CAMPAIGN PAGE  (/campaign/<slug>  or  campaign.html?slug=...)
    ========================= */
    const PAGE = { slug: "", products: new Map(), campaign: null, retry: 0, expectLive: false };

    function slugFromLocation() {
        const m = window.location.pathname.match(/\/campaign\/([^/?#]+)/i);
        if (m && m[1]) { try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; } }
        return new URLSearchParams(window.location.search).get("slug") || "";
    }

    function setBreadcrumb(text) {
        let tries = 0;
        (function go() {
            const el = document.querySelector("#bc-br .bc-cur");
            if (el) { el.textContent = text; return; }
            if (++tries < 25) setTimeout(go, 150);
        })();
    }

    function heroHtml(c, opts) {
        const desk = imgUrl(c.banner_desktop), mob = imgUrl(c.banner_mobile);
        const title = c.hero_title || c.title;
        const sub = c.hero_subtitle || c.short_description || "";
        const btn = (opts && opts.button && c.hero_button_text)
            ? '<button type="button" class="cmp-hero-btn" data-cmp-scroll="cmpProducts">' + esc(c.hero_button_text) + '</button>' : "";
        let pic = "";
        if (desk || mob) {
            pic = '<picture>' +
                (mob ? '<source media="(max-width: 768px)" srcset="' + esc(mob) + '">' : "") +
                '<img src="' + esc(desk || mob) + '" alt="' + esc(c.title) + '">' +
                '</picture>';
        }
        const showText = !pic || c.hero_title || c.hero_subtitle || btn;
        return '<section class="cmp-hero' + (pic ? "" : " cmp-hero-plain") + '">' + pic +
            (showText ? '<div class="cmp-hero-text' + (pic ? " cmp-hero-over" : "") + '">' +
                '<h1>' + esc(title) + '</h1>' + (sub ? '<p>' + esc(sub) + '</p>' : "") + btn + '</div>' : "") +
            '</section>';
    }

    function campCornerHtml(text) {
        const parts = String(text).split(" · ");
        const inner = parts.length > 1
            ? "<small>" + parts[0] + "</small><span>" + parts.slice(1).join(" · ") + "</span>"
            : "<span>" + text + "</span>";
        return '<span class="camp-corner"><span class="camp-band">' + inner + "</span></span>";
    }

    /* ----- product card for the campaign grid (same .prod-card as the store) ----- */
    function productCardHtml(p, cslug) {
        const cp = p.campaign_pricing || {};
        const pslug = p.slug || slugify(p.name);
        const href = productUrl(pslug, cslug);
        const campaignPrice = cp.campaign_price != null ? num(cp.campaign_price) : num(p.discount_price || p.price);
        const strike = num(cp.strike_price);
        const showStrike = strike > campaignPrice;
        const badge = (showStrike && cp.badge_text) ? campCornerHtml(esc(cp.badge_text)) : "";
        const gift = (cp.gifts_included === true && p.has_gift === true) ? '<span class="cmp-gift">🎁 Free Gift</span>' : "";

        const limited = cp.stock_limit != null;
        const left = limited ? Math.max(0, num(cp.stock_left != null ? cp.stock_left : cp.stock_limit)) : null;
        const out = limited && left <= 0;

        let stockRow;
        if (out) stockRow = '<div class="cmp-stock cmp-stock-out">Campaign stock finished</div>';
        else if (limited) stockRow = '<div class="cmp-stock cmp-stock-low">Only ' + left + ' left</div>';
        else stockRow = '<div class="cmp-stock">Limited-time price</div>';

        const image = imgUrl(p.image);
        const imgHtml = image
            ? '<img src="' + esc(image) + '" alt="' + esc(p.name) + '" loading="lazy">'
            : '<span class="cmp-noimg" aria-hidden="true">' + esc((p.name || "?").charAt(0)) + '</span>';

        const btn = out
            ? '<button type="button" class="prod-cart cmp-btn-out" disabled>Campaign stock finished</button>'
            : '<button type="button" class="prod-cart cmp-add">+ Cart</button>';

        return '<div class="prod-card cmp-prod' + (out ? " cmp-prod-out" : "") + '" data-pid="' + esc(p.id) + '" data-pslug="' + esc(pslug) + '">' +
            gift +
            '<a class="prod-img" href="' + href + '" tabindex="-1" aria-hidden="true">' + badge + imgHtml + '</a>' +
            '<a class="prod-name cmp-name" href="' + href + '" title="' + esc(p.name) + '">' + esc(p.name) + '</a>' +
            '<div class="prod-price cmp-price-row"><span class="cmp-price">৳ ' + campaignPrice + '</span>' +
            (showStrike ? '<span class="price-orig">৳ ' + strike + '</span>' : "") + '</div>' +
            stockRow + btn + '</div>';
    }

    function cardAdd(card) {
        const pid = Number(card.getAttribute("data-pid"));
        const p = PAGE.products.get(pid);
        if (!p) return;
        const cp = p.campaign_pricing || {};
        const pslug = p.slug || slugify(p.name);
        const cslug = PAGE.slug;

        // variant products: the customer must pick a variant on the product page
        if (p.has_variants) {
            try { sessionStorage.setItem("prompt_variant_on_load", "cart"); } catch (e) { }
            window.location.href = productUrl(pslug, cslug);
            return;
        }
        const campaignPrice = num(cp.campaign_price);
        const strike = num(cp.strike_price);
        const regular = num(cp.regular_price || p.price);
        if (typeof quickAddCart !== "function") { window.location.href = productUrl(pslug, cslug); return; }
        quickAddCart(p.id, null, {
            name: p.name,
            image: p.image || "",
            price: strike > campaignPrice ? strike : regular,
            discount_price: campaignPrice,
            campaign: cslug,
            campaign_title: (PAGE.campaign && PAGE.campaign.title) || prettySlug(cslug),
            campaign_price: campaignPrice,
            is_customized: p.customization_mode === "mandatory",
            customization_price: p.customization_price || 0
        });
    }

    /* Columns follow the product count: up to 6 per row on a computer (4 on tablets, 2 on phones).
       Fewer products -> that many columns, so the row is always filled and never breaks. */
    function gridColsStyle(n) {
        n = Math.max(1, Number(n) || 1);
        return "--c-d:" + Math.min(n, 6) + ";--c-t:" + Math.min(n, 4) + ";--c-m:" + Math.min(n, 2) + ";";
    }

    function liveViewHtml(c, products) {
        PAGE.products = new Map();
        products.forEach(p => PAGE.products.set(Number(p.id), p));
        const grid = products.length
            ? '<div class="products-grid cmp-products" id="cmpProducts" data-n="' + products.length + '" style="' + gridColsStyle(products.length) + '">' + products.map(p => productCardHtml(p, c.slug)).join("") + '</div>'
            : '<div id="cmpProducts">' + messageHtml("🛒", "Products are being added", "Please check back in a moment.", "") + '</div>';
        return heroHtml(c, { button: true }) +
            '<div class="cmp-countbar"><div class="cmp-countbar-l"><span class="cmp-chip cmp-chip-live"><i></i>Live</span>' +
            '<span class="cmp-countbar-t">Offer ends in</span></div>' + boxesHtml(c.end_at, "end", c.slug) + '</div>' +
            '<div class="lp-section"><div class="lp-head"><div class="lp-title">' + esc(c.title) + '</div>' +
            '<span class="cmp-count-note">' + products.length + ' product' + (products.length === 1 ? "" : "s") + '</span></div>' +
            '<div class="cmp-grid-wrap">' + grid + '</div></div>';
    }

    function upcomingViewHtml(c) {
        return heroHtml(c, { button: false }) +
            '<div class="cmp-soon"><span class="cmp-chip cmp-chip-soon">Coming soon</span>' +
            '<h2>' + esc(c.title) + ' starts in</h2>' + boxesHtml(c.start_at, "start", c.slug) +
            '<p class="cmp-soon-note">The products and prices will appear here the moment the campaign starts.</p>' +
            '<a class="cmp-btn cmp-btn-ghost" href="/product-list">Browse the store meanwhile</a></div>';
    }

    function endedViewHtml(text) {
        return messageHtml("🎉", "This campaign has ended",
            text || "Thank you for being with us — please check our other offers.",
            '<div class="cmp-msg-actions"><a class="cmp-btn" href="/product-list">Back to the store</a><a class="cmp-btn cmp-btn-ghost" href="/campaigns">Other campaigns</a></div>');
    }

    function notFoundHtml() {
        return messageHtml("🔍", "Campaign not found",
            "This campaign does not exist or is not available.",
            '<a class="cmp-btn" href="/product-list">Back to the store</a>');
    }

    async function loadCampaignPage(isRefetch) {
        const root = document.getElementById("cmpPage");
        if (!root) return;
        if (!PAGE.slug) { root.innerHTML = notFoundHtml(); hideLoader(); return; }

        if (!isRefetch) root.innerHTML = '<div class="cmp-loading"><div class="cmp-spin"></div></div>';

        let r;
        try {
            r = await fetchJson(apiBase() + listPath() + encodeURIComponent(PAGE.slug) + "/");
        } catch (e) {
            if (isRefetch) { scheduleRetry(); return; }
            root.innerHTML = messageHtml("😕", "Could not load this campaign", "Please check your connection and try again.", '<button type="button" class="cmp-btn" id="cmpRetry">Try again</button>');
            const b = document.getElementById("cmpRetry");
            if (b) b.onclick = () => loadCampaignPage(false);
            hideLoader();
            return;
        }
        hideLoader();

        if (r.status === 410) { root.innerHTML = endedViewHtml(r.json && r.json.message); document.title = "Campaign ended — Pencilwood"; setBreadcrumb("Campaign ended"); return; }
        if (r.status === 404) { root.innerHTML = notFoundHtml(); setBreadcrumb("Not found"); return; }
        if (!r.ok || !r.json || r.json.status === false || !r.json.data || !r.json.data.campaign) {
            if (isRefetch) { scheduleRetry(); return; }
            root.innerHTML = messageHtml("😕", "Could not load this campaign", "Please try again in a moment.", '<button type="button" class="cmp-btn" id="cmpRetry">Try again</button>');
            const b = document.getElementById("cmpRetry");
            if (b) b.onclick = () => loadCampaignPage(false);
            return;
        }

        const c = r.json.data.campaign;
        const products = Array.isArray(r.json.data.products) ? r.json.data.products : [];
        PAGE.campaign = c;
        document.title = c.title + " — Pencilwood";
        setBreadcrumb(c.title);

        if (c.status === "live") {
            PAGE.retry = 0; PAGE.expectLive = false;
            root.innerHTML = liveViewHtml(c, products);
        } else if (c.status === "upcoming") {
            // switching moment: our countdown hit zero but the server still says "upcoming" -> retry shortly
            if (PAGE.expectLive) { scheduleRetry(); return; }
            root.innerHTML = upcomingViewHtml(c);
        } else {
            root.innerHTML = notFoundHtml();
        }
        tick();
    }

    /* After a countdown hits zero the server clock may be a second behind: retry a few times */
    let retryTimer = null;
    function scheduleRetry() {
        clearTimeout(retryTimer);
        if (PAGE.retry >= 8) {
            PAGE.retry = 0; PAGE.expectLive = false;
            const note = document.querySelector("#cmpPage .cmp-soon-note");
            if (note) note.textContent = "Taking longer than expected — please refresh the page.";
            return;
        }
        PAGE.retry++;
        retryTimer = setTimeout(() => loadCampaignPage(true), 2000);
    }

    function hideLoader() { if (typeof window.hideLoader === "function") window.hideLoader(); }

    function initCampaignPage() {
        const root = document.getElementById("cmpPage");
        if (!root) return;
        PAGE.slug = slugFromLocation();

        root.addEventListener("click", e => {
            const add = e.target.closest(".cmp-add");
            if (add) { const card = add.closest(".cmp-prod"); if (card) cardAdd(card); return; }
            const sc = e.target.closest("[data-cmp-scroll]");
            if (sc) {
                const t = document.getElementById(sc.getAttribute("data-cmp-scroll"));
                if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });

        document.addEventListener("pwcampaign:expired", e => {
            if (!root.contains(e.detail.el)) return;
            const k = e.detail.kind;
            if (k === "start") {          // upcoming -> live without a refresh
                const note = root.querySelector(".cmp-soon-note");
                if (note) note.textContent = "Starting now…";
                PAGE.retry = 0; PAGE.expectLive = true;
                loadCampaignPage(true);
            } else if (k === "end") {     // live -> ended (or extended)
                PAGE.retry = 0; PAGE.expectLive = false;
                loadCampaignPage(true);
            }
        });

        loadCampaignPage(false);
    }

    /* =========================
       CART-LINE HELPERS (guest cart, cart page, drawer, checkout)
    ========================= */
    function pricingForVariant(cp, variantId) {
        if (!cp) return null;
        if (variantId && Array.isArray(cp.variants)) {
            const v = cp.variants.find(x => Number(x.variant_id) === Number(variantId));
            if (v) return v;
        }
        return cp;
    }

    /* "&campaign_lines=[...]" for GET /cart/guest-refresh/ (only when the cart has campaign lines) */
    function campaignLinesQuery(cart) {
        const seen = new Set(), lines = [];
        (cart || []).forEach(i => {
            if (!i || !i.campaign) return;
            const k = i.product_id + "|" + i.campaign;
            if (seen.has(k)) return;
            seen.add(k);
            lines.push({ product_id: i.product_id, campaign: i.campaign });
        });
        return lines.length ? "&campaign_lines=" + encodeURIComponent(JSON.stringify(lines)) : "";
    }

    function hasCampaignLines(cart) {
        return (cart || []).some(i => i && i.campaign);
    }

    /* merge the server's campaign_lines answer into ONE guest line */
    function mergeGuestLine(item, refreshJson) {
        if (!item || !item.campaign) return item;
        const out = Object.assign({}, item);
        const list = (refreshJson && Array.isArray(refreshJson.campaign_lines)) ? refreshJson.campaign_lines : [];
        const cl = list.find(x => Number(x.product_id) === Number(item.product_id) && x.campaign === item.campaign);
        if (!cl) { out.campaign_valid = null; return out; }
        out.campaign_valid = !!cl.valid;
        out.campaign_reason = cl.reason || null;
        out.campaign_remaining = cl.remaining == null ? null : Number(cl.remaining);
        const pv = pricingForVariant(cl.campaign_pricing, item.variant_id);
        if (pv && cl.valid) {
            const cprice = num(pv.campaign_price);
            out.campaign_unit = cprice;
            out.campaign_strike = num(pv.strike_price) > cprice ? num(pv.strike_price) : null;
            out.campaign_badge = pv.badge_text || "";
        }
        return out;
    }

    /* unit price of a guest line (without customization extra) */
    function guestBaseUnit(i) {
        if (i && i.campaign && i.campaign_valid && i.campaign_unit != null) return num(i.campaign_unit);
        return num(i.discount_price || i.price || 0);
    }

    function reasonKind(reason, remaining) {
        const r = String(reason || "").toLowerCase();
        if (remaining != null && Number(remaining) > 0) return "limited";
        if (/stock|exhaust|sold|limit|finish/.test(r)) return "stock";
        return "ended";
    }

    function reasonText(kind, info) {
        const np = info && info.normalUnit != null ? " (৳ " + info.normalUnit + ")" : "";
        if (kind === "limited") return "Only " + Number(info.remaining) + " left at the campaign price.";
        if (kind === "stock") return "Campaign stock finished — the regular price" + np + " applies.";
        return "This campaign has ended — the regular price" + np + " applies.";
    }

    /* small tag + warning under a cart / drawer / checkout line.
       info = { campaign, title, badge, valid, reason, remaining, message, normalUnit } */
    function lineTag(info) {
        if (!info || !info.campaign) return "";
        const title = info.title || prettySlug(info.campaign);
        let h = '<div class="cmp-line-tag"><span aria-hidden="true">🏷</span> ' + esc(title) +
            (info.badge ? ' <b>' + esc(info.badge) + '</b>' : "") + '</div>';
        if (info.valid === false) {
            const kind = reasonKind(info.reason, info.remaining);
            h += '<div class="cmp-line-warn">' + esc(info.message || reasonText(kind, info)) + '</div>';
        } else if (info.remaining != null && Number(info.remaining) > 0 && Number(info.remaining) <= 10) {
            h += '<div class="cmp-line-note">Only ' + Number(info.remaining) + ' left at the campaign price</div>';
        }
        return h;
    }

    function lineTagFromGuest(i) {
        if (!i || !i.campaign) return "";
        return lineTag({
            campaign: i.campaign, title: i.campaign_title, badge: i.campaign_valid ? i.campaign_badge : "",
            valid: i.campaign_valid === false ? false : (i.campaign_valid ? true : undefined),
            reason: i.campaign_reason, remaining: i.campaign_remaining,
            normalUnit: num(i.discount_price || i.price) || null
        });
    }

    /* checkout summary item (server fields) -> tag */
    function lineTagFromSummary(item) {
        if (!item || !item.campaign || item.is_gift) return "";
        return lineTag({
            campaign: item.campaign, title: item.campaign_title,
            badge: item.campaign_valid === false ? "" : item.badge_text,
            valid: item.campaign_valid, reason: item.campaign_reason,
            remaining: item.campaign_stock_left, message: item.campaign_message,
            normalUnit: item.normal_unit_price
        });
    }

    /* ----- guest cart actions used by the checkout "price changed" panel ----- */
    const GUEST_KEY = "guest_cart";
    function readGuest() { try { return JSON.parse(localStorage.getItem(GUEST_KEY)) || []; } catch (e) { return []; } }
    function writeGuest(c) { localStorage.setItem(GUEST_KEY, JSON.stringify(c)); }
    function sameBase(a, b) {
        return Number(a.product_id) === Number(b.product_id) && (a.variant_id || null) === (b.variant_id || null) &&
            !!a.is_customized === !!b.is_customized;
    }

    /* turn a campaign line into a normal line (merging into an existing normal line) */
    function guestSwitchToNormal(productId, variantId, campaign) {
        const cart = readGuest();
        const idx = cart.findIndex(i => i.campaign === campaign && Number(i.product_id) === Number(productId) && (i.variant_id || null) === (variantId || null));
        if (idx < 0) return;
        const line = cart[idx];
        const twin = cart.find((i, k) => k !== idx && !i.campaign && sameBase(i, line));
        if (twin) {
            twin.quantity = num(twin.quantity) + num(line.quantity);
            cart.splice(idx, 1);
        } else {
            delete line.campaign; delete line.campaign_title; delete line.campaign_valid; delete line.campaign_reason;
            delete line.campaign_remaining; delete line.campaign_unit; delete line.campaign_strike; delete line.campaign_badge; delete line.surface;
        }
        writeGuest(cart);
    }

    function guestRemoveLine(productId, variantId, campaign) {
        writeGuest(readGuest().filter(i => !(Number(i.product_id) === Number(productId) &&
            (i.variant_id || null) === (variantId || null) && (i.campaign || null) === (campaign || null))));
    }

    function guestSetQty(productId, variantId, campaign, qty) {
        const cart = readGuest();
        const line = cart.find(i => Number(i.product_id) === Number(productId) &&
            (i.variant_id || null) === (variantId || null) && (i.campaign || null) === (campaign || null));
        if (line) { line.quantity = qty; writeGuest(cart); }
    }

    /* =========================
       INIT
    ========================= */
    function boot() {
        ensureCss();
        startTicker();
        if (document.getElementById("campaignsSection")) initHomeSection();
        if (document.getElementById("cmpListPage")) initCampaignsPage();
        if (document.getElementById("cmpPage")) initCampaignPage();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    window.PWCampaign = {
        esc: esc, imgUrl: imgUrl, slugify: slugify, prettySlug: prettySlug, num: num,
        productUrl: productUrl, campaignUrl: campaignUrl,
        fetchJson: fetchJson, setServerNow: setServerNow, now: now,
        getList: getList, countAttrs: countAttrs, fmtShort: fmtShort, startTicker: startTicker, tick: tick, ensureCss: ensureCss,
        pricingForVariant: pricingForVariant,
        campaignLinesQuery: campaignLinesQuery, hasCampaignLines: hasCampaignLines,
        mergeGuestLine: mergeGuestLine, guestBaseUnit: guestBaseUnit,
        reasonKind: reasonKind, reasonText: reasonText,
        lineTag: lineTag, lineTagFromGuest: lineTagFromGuest, lineTagFromSummary: lineTagFromSummary,
        guestSwitchToNormal: guestSwitchToNormal, guestRemoveLine: guestRemoveLine, guestSetQty: guestSetQty
    };
})();

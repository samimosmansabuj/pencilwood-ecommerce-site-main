/* ==========================================================================
   SITE POPUP (campaign poster)
========================================================================== */
(function () {
    "use strict";
    if (window.PWPopup) return;

    var SHOW_DELAY_MS = 1000;
    var KEY_PREFIX = "pwbd_popup_";
    var DAY_MS = 24 * 60 * 60 * 1000;

    /* ---------- where the popup may appear ---------- */
    function cleanPath() {
        var p = window.location.pathname.replace(/\/+$/, "").replace(/\.html$/i, "");
        return p === "" || p === "/index" ? "/" : p;
    }

    function isBlockedPage(path) {
        // never on cart, checkout, login (and never on the landing pages)
        return /^\/(cart|checkout|login)(\/|$)/i.test(path) || /^\/(lan|L)\//.test(path);
    }

    function pageAllowed(pages, path) {
        if (isBlockedPage(path)) return false;
        var rule = String(pages || "ALL_PAGES").toUpperCase();
        if (rule === "HOME_ONLY") return path === "/";
        return true;
    }

    /* ---------- response (exact contract shape) ---------- */
    function normalizePopup(json) {
        if (!json || json.status !== true || !json.data || typeof json.data !== "object") return null;
        var d = json.data;
        if (!d.image_desktop && !d.image_mobile) return null;
        return {
            id: d.id,
            version: d.updated_at || "",
            title: d.title || "",
            imageDesktop: d.image_desktop || "",
            imageMobile: d.image_mobile || d.image_desktop || "",   // API already falls back to desktop
            target: d.target_url || "",
            buttonText: d.button_text || "",
            frequency: String(d.frequency || "ONCE_PER_SESSION").toUpperCase(),
            pages: String(d.pages || "ALL_PAGES").toUpperCase()
        };
    }

    /* ---------- frequency rule ---------- */
    function storageKey(p) { return KEY_PREFIX + p.id + "_" + p.version; }

    function alreadySeen(p) {
        try {
            if (p.frequency === "EVERY_VISIT") return false;
            if (p.frequency === "ONCE_PER_DAY") {
                var t = Number(localStorage.getItem(storageKey(p)) || 0);
                return t > 0 && Date.now() - t < DAY_MS;
            }
            return sessionStorage.getItem(storageKey(p)) === "1";        // ONCE_PER_SESSION (default)
        } catch (e) { return false; }
    }

    function markSeen(p) {
        try {
            if (p.frequency === "EVERY_VISIT") return;
            if (p.frequency === "ONCE_PER_DAY") localStorage.setItem(storageKey(p), String(Date.now()));
            else sessionStorage.setItem(storageKey(p), "1");
        } catch (e) { }
    }

    /* ---------- helpers ---------- */
    function esc(str) {
        return String(str == null ? "" : str).replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function mediaUrl(path) {
        if (!path) return "";
        if (/^(https?:)?\/\//i.test(path) || path.indexOf("data:") === 0) return path;
        return (window.API_BASE || "") + (path.charAt(0) === "/" ? "" : "/") + path;
    }

    /* accept only http(s) or same-site relative targets (blocks javascript: etc.) */
    function safeTarget(url) {
        if (!url) return "";
        var u = String(url).trim();
        if (/^(https?:)?\/\//i.test(u)) return u;
        if (u.charAt(0) === "/") return u;
        return "";
    }

    function ensureCss() {
        if (document.querySelector('link[href*="campaign.css"]')) return;
        var l = document.createElement("link");
        l.rel = "stylesheet";
        l.href = "css/campaign.css?v=1";
        document.head.appendChild(l);
    }

    /* ---------- the dialog ---------- */
    var FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function open(p) {
        if (document.getElementById("pwPopup")) return;
        ensureCss();

        var target = safeTarget(p.target);
        var external = /^(https?:)?\/\//i.test(target) && target.indexOf(window.location.origin) !== 0;
        var d = mediaUrl(p.imageDesktop), m = mediaUrl(p.imageMobile);
        var pic = '<picture>' +
            (m ? '<source media="(max-width: 600px)" srcset="' + esc(m) + '">' : "") +
            '<img src="' + esc(d || m) + '" alt="' + esc(p.title || "Special offer") + '">' +
            '</picture>';

        var linkAttrs = target ? ' href="' + esc(target) + '"' + (external ? ' target="_blank" rel="noopener noreferrer"' : "") : "";
        var poster = target ? '<a class="pwp-poster"' + linkAttrs + '>' + pic + '</a>' : '<div class="pwp-poster">' + pic + '</div>';
        var cta = (target && p.buttonText) ? '<a class="pwp-cta"' + linkAttrs + '>' + esc(p.buttonText) + '</a>' : "";

        var overlay = document.createElement("div");
        overlay.id = "pwPopup";
        overlay.className = "pwp-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-label", p.title || "Special offer");
        overlay.innerHTML =
            '<div class="pwp-card">' +
            '<button type="button" class="pwp-close" aria-label="Close">&times;</button>' +
            poster + cta + '</div>';

        var previouslyFocused = document.activeElement;
        document.body.appendChild(overlay);
        document.body.classList.add("pwp-open");
        requestAnimationFrame(function () { overlay.classList.add("pwp-show"); });

        var closeBtn = overlay.querySelector(".pwp-close");
        if (closeBtn) closeBtn.focus();

        function close() {
            document.removeEventListener("keydown", onKey, true);
            overlay.classList.remove("pwp-show");
            document.body.classList.remove("pwp-open");
            setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 200);
            if (previouslyFocused && previouslyFocused.focus) { try { previouslyFocused.focus(); } catch (e) { } }
        }

        function onKey(e) {
            if (e.key === "Escape" || e.key === "Esc") { e.preventDefault(); close(); return; }
            if (e.key !== "Tab") return;
            // focus trap
            var nodes = overlay.querySelectorAll(FOCUSABLE);
            if (!nodes.length) { e.preventDefault(); return; }
            var first = nodes[0], last = nodes[nodes.length - 1];
            if (e.shiftKey && (document.activeElement === first || !overlay.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }

        document.addEventListener("keydown", onKey, true);
        closeBtn.addEventListener("click", close);
        overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
        overlay.addEventListener("click", function (e) { if (e.target.closest("a[href]")) markSeen(p); });

        markSeen(p);
    }

    /* ---------- entry ---------- */
    async function init() {
        var path = cleanPath();
        if (isBlockedPage(path)) return;
        if (!window.API_BASE || !window.POPUP_API_PATH) return;

        var data = null;
        try {
            var res = await fetch(window.API_BASE + window.POPUP_API_PATH, { cache: "no-store" });
            if (!res.ok) return;                       // 404 / 204 = no popup
            data = await res.json();
        } catch (e) { return; }

        var p = normalizePopup(data);
        if (!p) return;
        if (!pageAllowed(p.pages, path)) return;
        if (alreadySeen(p)) return;

        setTimeout(function () {
            // the page may have changed state in the meantime (e.g. cart drawer opened) - keep it simple: show once
            if (!pageAllowed(p.pages, cleanPath())) return;
            open(p);
        }, SHOW_DELAY_MS);
    }

    window.PWPopup = { init: init, normalizePopup: normalizePopup, _pageAllowed: pageAllowed, _alreadySeen: alreadySeen };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();

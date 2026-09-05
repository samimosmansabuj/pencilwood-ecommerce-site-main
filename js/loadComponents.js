async function loadComponent(id, file) {
    const el = document.getElementById(id);

    if (!el) {
        console.warn("Missing container:", id);
        return;
    }

    let dynamicTitle = "";
    if (id === "bc-br") {
        const titleEl = el.querySelector("title");
        if (titleEl) {
            dynamicTitle = titleEl.textContent;
        }
    }

    try {
        const resp = await fetch(file);
        if (!resp.ok) throw new Error(`Failed to fetch ${file}: ${resp.status}`);
        const html = await resp.text();
        el.innerHTML = html;

        if (id === "bc-br" && dynamicTitle) {
            const bcCur = el.querySelector(".bc-cur");
            if (bcCur) {
                bcCur.textContent = dynamicTitle;
            }
        }
    } catch (err) {
        console.error(`Error loading component "${id}" from "${file}":`, err);
    }
}

/* =========================
   INIT COMPONENTS
========================= */
async function initComponents() {
    await loadComponent("topnavbar-container", "components/navbar.html");
    await loadComponent("global-loader", "components/global-loader.html")
    loadComponent("drawer-container", "components/drawer.html");
    loadComponent("mobile-bottom-nav-container", "components/mobile-bottom-nav.html");

    // Cart Drawer Component
    if (!document.getElementById("cart-drawer-container")) {
        const cdc = document.createElement("div");
        cdc.id = "cart-drawer-container";
        document.body.appendChild(cdc);
    }
    loadComponent("cart-drawer-container", "components/cart-drawer.html");

    // Ensure cart-drawer.js is loaded
    if (!window.openCartDrawer && !document.querySelector('script[src*="cart-drawer.js"]')) {
        const cdScript = document.createElement("script");
        cdScript.src = "js/cart-drawer.js?v=13";
        document.body.appendChild(cdScript);
    }

    loadComponent("toast-container", "components/toast.html");
    loadComponent("float-wa", "components/float-wa.html");
    loadComponent("float-cart", "components/float-cart.html");
    loadComponent("eco-container", "components/eco-bar.html");
    loadComponent("bc-br", "components/breadcrumb.html");

    if (document.getElementById("footer-container")) {
        await loadComponent("footer-container", "components/footer.html");
    }

    setTimeout(() => {
        if (typeof bindSearch === "function") bindSearch();
        if (typeof updateAuthButtons === "function") updateAuthButtons();
        if (typeof updateCartCountFromBackend === "function") updateCartCountFromBackend();
        if (typeof updateWishlistCount === "function") updateWishlistCount();
        if (typeof loadSiteContent === "function") loadSiteContent();

        if (typeof makeDraggable === "function") {
            makeDraggable(document.querySelector(".float-cart-btn"), "floatCartPos");
            makeDraggable(document.querySelector(".float-wa-btn"), "floatWaPos");
        }
    }, 100);
}

initComponents();
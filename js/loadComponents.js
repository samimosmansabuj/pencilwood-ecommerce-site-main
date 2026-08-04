async function loadComponent(id, file) {
    const el = document.getElementById(id);

    if (!el) {
        console.warn("Missing container:", id);
        return;
    }

    const resp = await fetch(file);
    const html = await resp.text();

    el.innerHTML = html;
}

/* =========================
   INIT COMPONENTS
========================= */
async function initComponents() {

    // 1. navbar load
    await loadComponent("topnavbar-container", "components/navbar.html");

    loadComponent("drawer-container", "components/drawer.html");
    loadComponent("toast-container", "components/toast.html");
    loadComponent("eco-container", "components/eco-bar.html");
    loadComponent("bc-br", "components/breadcrumb.html");

    if (document.getElementById("footer-container")) {
        await loadComponent("footer-container", "components/footer.html");
    }

    // 3. wait DOM injection complete
    setTimeout(() => {
        if (typeof bindSearch === "function") bindSearch();
        if (typeof updateAuthButtons === "function") updateAuthButtons();
        if (typeof updateCartCountFromBackend === "function") updateCartCountFromBackend();
        if (typeof updateWishlistCount === "function") updateWishlistCount();
        if (typeof loadSiteContent === "function") loadSiteContent();
    }, 100);
}

initComponents();
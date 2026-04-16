// loadComponents.js
async function loadComponent(id, file) {
    const resp = await fetch(file);
    const html = await resp.text();
    document.getElementById(id).innerHTML = html;
}

/* 🔥 IMPORTANT: wait for navbar → then update count */
async function initComponents() {

    await loadComponent('topnavbar-container', 'components/navbar.html');

    // ✅ AFTER navbar loads → update count
    if (typeof updateCartCount === "function") updateCartCount();
    if (typeof updateWishlistCount === "function") updateWishlistCount();

    // rest load (no need to wait)
    loadComponent('drawer-container', 'components/drawer.html');
    loadComponent('toast-container', 'components/toast.html');
    loadComponent('footer-container', 'components/footer.html');
    loadComponent('eco-container', 'components/eco-bar.html');
    loadComponent('bc-br', 'components/breadcrumb.html');
    loadComponent('prod-hero-inner', './product.html');
}

initComponents();
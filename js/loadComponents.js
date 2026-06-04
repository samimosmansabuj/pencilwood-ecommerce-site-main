async function loadComponent(id, file) {

    const el =
        document.getElementById(id);

    if (!el) {

        console.warn(
            "Missing container:",
            id
        );

        return;
    }

    const resp =
        await fetch(file);

    const html =
        await resp.text();

    el.innerHTML = html;
}

/* =========================
   INIT COMPONENTS
========================= */
async function initComponents() {

    // 1. Load navbar FIRST
    await loadComponent(
        "topnavbar-container",
        "components/navbar.html"
    );

    // 2. small delay to ensure DOM is painted
    setTimeout(() => {

        /* AUTH BUTTON UPDATE */
        if (typeof updateAuthButtons === "function") {
            updateAuthButtons();
        }

        if (typeof updateCartCount === "function") {
            updateCartCount();
        }

        if (typeof updateWishlistCount === "function") {
            updateWishlistCount();
        }

    }, 50);

    // 3. other components (parallel ok)
    loadComponent(
        "drawer-container",
        "components/drawer.html"
    );

    loadComponent(
        "toast-container",
        "components/toast.html"
    );

    loadComponent(
        "eco-container",
        "components/eco-bar.html"
    );

    loadComponent(
        "bc-br",
        "components/breadcrumb.html"
    );
}

initComponents();
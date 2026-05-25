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

    await loadComponent(
        "topnavbar-container",
        "components/navbar.html"
    );

    if (
        typeof updateCartCount ===
        "function"
    ) {

        updateCartCount();
    }

    if (
        typeof updateWishlistCount ===
        "function"
    ) {

        updateWishlistCount();
    }

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
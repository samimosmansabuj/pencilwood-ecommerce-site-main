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

    loadComponent("drawer-container", "components/drawer.html");
    loadComponent("toast-container", "components/toast.html");
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
    }, 100);
}

initComponents();
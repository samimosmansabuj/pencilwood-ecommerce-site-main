// loadComponents.js
async function loadComponent(id, file) {
    const resp = await fetch(file);
    const html = await resp.text();
    document.getElementById(id).innerHTML = html;
}

loadComponent('topnavbar-container', 'components/navbar.html');
loadComponent('drawer-container', 'components/drawer.html');
loadComponent('toast-container', 'components/toast.html');
loadComponent('footer-container', 'components/footer.html');
loadComponent('eco-container', 'components/eco-bar.html');
loadComponent('bc-br', 'components/breadcrumb.html');
loadComponent('prod-hero-inner', './product.html');
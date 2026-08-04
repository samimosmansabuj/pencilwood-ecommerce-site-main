/* =========================
   SITE CONTENT (dynamic, controlled from dashboard)
========================= */

async function loadSiteContent() {
    try {
        const yearEl = document.getElementById("footerYear");
        if (yearEl) yearEl.textContent = new Date().getFullYear();

        const res = await fetch(`${API_BASE}/api/ecom/site-content/`);
        const json = await res.json();

        if (!json || !json.status) return;

        const data = json.data || {};

        renderNavMenu(data.nav_menu || []);
        renderFooterLinks(data.footer_links || []);
        renderSocialLinks(data.social_links || []);
        renderNewsFeed(data.news_feed || []);

    } catch (err) {
        console.warn("Failed to load site content:", err);
    }
}

function renderNavMenu(links) {
    const subnav = document.querySelector(".subnav-in");
    if (!subnav) return;

    links.forEach((link) => {
        const a = document.createElement("a");
        a.href = link.url || "#";
        a.textContent = link.name;
        if (link.open_new_tab) {
            a.target = "_blank";
            a.rel = "noopener";
        }
        subnav.appendChild(a);
    });
}

function renderFooterLinks(links) {
    const container = document.getElementById("footerLinksList");
    if (!container) return;

    if (!links.length) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = links
        .map((link, i) => {
            const separator = i < links.length - 1 ? " | " : "";
            return `<a href="${link.url || '#'}">${escapeHtml(link.name)}</a>${separator}`;
        })
        .join("");
}

function renderSocialLinks(links) {
    const container = document.getElementById("footerSocialLinksList");
    if (!container) return;

    if (!links.length) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = links
        .map((link) => {
            const iconMarkup = link.icon
                ? (link.icon.startsWith("bi-")
                    ? `<i class="bi ${link.icon}"></i>`
                    : link.icon)
                : link.name;
            return `<a href="${link.url || '#'}" target="_blank" rel="noopener" title="${escapeHtml(link.name)}">${iconMarkup}</a>`;
        })
        .join("");
}

function renderNewsFeed(items) {
    if (!items.length) return;

    let ticker = document.getElementById("newsFeedTicker");
    if (!ticker) {
        ticker = document.createElement("div");
        ticker.id = "newsFeedTicker";
        ticker.className = "news-feed-ticker";
        document.body.insertBefore(ticker, document.body.firstChild);
    }

    const track = document.createElement("div");
    track.className = "news-feed-track";
    track.innerHTML = items
        .map((item) => {
            const text = escapeHtml(item.text);
            return item.url
                ? `<a href="${item.url}">${text}</a>`
                : `<span>${text}</span>`;
        })
        .join("<span class='news-feed-sep'>•</span>");

    ticker.innerHTML = "";
    ticker.appendChild(track);
}

function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
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
        applySectionVisibility(data.sections || {});
        renderWhyChooseUs(data.why_choose_us || []);
        renderCustomSections(data.custom_sections || []);

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
            // const separator = i < links.length - 1 ? " | " : "";
            const separator = i < links.length - 1 ? `<span class="footer-policy-sep" aria-hidden="true">|</span>` : "";
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


function applySectionVisibility(sections) {
 
    const sectionElMap = {
        "hero_slider": document.getElementById("heroSliderSection"),
        "kidz_product": document.getElementById("kidzProductSection"),
        "filter_products_grid": document.getElementById("filterProductsSection"),
        "social_proof_banner": document.getElementById("socialProofSection"),
        "why_choose": document.getElementById("whyChooseSection"),
        "showcase": document.getElementById("showcaseSection"),
        "ecosystem": document.getElementById("ecoSection"),
    };

    Object.keys(sectionElMap).forEach((key) => {
        const el = sectionElMap[key];
        if (!el) return;
        const isActive = key in sections ? sections[key] : true;
        el.style.display = isActive ? "" : "none";
    });
}

function renderWhyChooseUs(cards) {
    const grid = document.getElementById("whyChooseGrid");
    if (!grid) return;

    if (!cards.length) {
        const section = document.getElementById("whyChooseSection");
        if (section) section.style.display = "none";
        return;
    }

    grid.innerHTML = cards
        .map((c) => `
            <div class="why-card">
                <div class="why-icon">${c.icon || ""}</div>
                <div class="why-name">${escapeHtml(c.title)}</div>
                <div class="why-desc">${escapeHtml(c.description)}</div>
            </div>
        `)
        .join("");
}


function renderCustomSections(customSections) {
    if (!customSections.length) return;


    const isHomePage = !!document.getElementById("whyChooseSection");
    if (!isHomePage) return;

    const page = document.querySelector(".page");
    if (!page) return;

    customSections.forEach((section) => {
        const wrapper = document.createElement("div");
        wrapper.className = `lp-section custom-home-section size-${section.size || "normal"}`;
        wrapper.id = `customSection_${section.section_key}`;

        if (section.min_height_px && section.design_style !== "banner_product_combo") {
            wrapper.style.minHeight = section.min_height_px + "px";
        }
        wrapper.style.marginTop = "24px";
        wrapper.style.marginBottom = "24px";

        const rendered = section.content_type === "product"
            ? renderProductHomeSection(wrapper, section)
            : renderBannerHomeSection(wrapper, section);

        if (rendered !== false) {
            page.appendChild(wrapper);
        }
    });
}

/* ---------- Text Styling helpers ---------- */
function hexToRgba(hex, opacityPercent) {
    if (!hex) return null;
    hex = hex.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    if (hex.length !== 6) return null;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const a = Math.max(0, Math.min(100, Number(opacityPercent) || 0)) / 100;
    return `rgba(${r},${g},${b},${a})`;
}

function getSectionTextStyles(section) {
    let common = "";
    if (section.text_font_family) common += `font-family:${section.text_font_family};`;
    if (section.text_color) common += `color:${section.text_color};`;
    if (section.text_font_weight === "bold") common += "font-weight:700;";
    if (section.text_font_style === "italic") common += "font-style:italic;";

    const headingStyle = common + (section.text_font_size ? `font-size:${section.text_font_size}px;` : "");
    const subheadingStyle = common + (section.text_font_size ? `font-size:${Math.round(section.text_font_size * 0.55)}px;` : "");
    const bodyStyle = common;

    let bgStyle = "";
    const bgColor = hexToRgba(section.text_bg_color, section.text_bg_opacity);
    if (bgColor) {
        bgStyle = `background:${bgColor};padding:10px 14px;border-radius:8px;display:inline-block;`;
    }
    return { headingStyle, subheadingStyle, bodyStyle, bgStyle };
}

function buildSectionHeadHtml(section) {
    if (!section.heading && !section.subheading) return "";
    const st = getSectionTextStyles(section);
    return `
        <div class="lp-head">
            <div style="${st.bgStyle}">
                ${section.heading ? `<div class="lp-title" style="${st.headingStyle}">${escapeHtml(section.heading)}</div>` : ""}
                ${section.subheading ? `<div class="custom-section-subheading" style="${st.subheadingStyle}">${escapeHtml(section.subheading)}</div>` : ""}
            </div>
        </div>
    `;
}

function renderBannerHomeSection(wrapper, section) {
    const st = getSectionTextStyles(section);

    const imageHtml = section.image
        ? `<img src="${resolveSiteAssetUrl(section.image)}" alt="${escapeHtml(section.heading)}" class="custom-section-image">`
        : "";

    const buttonHtml = (section.button_text && section.button_url)
        ? `<a href="${section.button_url}" class="custom-section-btn">${escapeHtml(section.button_text)}</a>`
        : "";

    wrapper.innerHTML = `
        ${section.heading ? `<div class="lp-head"><div style="${st.bgStyle}"><div class="lp-title" style="${st.headingStyle}">${escapeHtml(section.heading)}</div></div></div>` : ""}
        <div class="lp-body custom-section-body">
            ${imageHtml}
            ${section.subheading ? `<div class="custom-section-subheading" style="${st.subheadingStyle}">${escapeHtml(section.subheading)}</div>` : ""}
            ${section.body_html ? `<div class="custom-section-text" style="${st.bodyStyle}">${escapeHtml(section.body_html)}</div>` : ""}
            ${buttonHtml}
        </div>
    `;
}

function renderProductHomeSection(wrapper, section) {
    const items = section.items || [];
    const tabs = section.tabs || [];

    if (section.design_style === "tabbed_products") {
        if (!tabs.length || !tabs.some(t => (t.items || []).length)) return false;
    } else if (!items.length) {
        return false;
    }

    const headHtml = buildSectionHeadHtml(section);

    if (section.design_style === "category_tiles") {
        wrapper.innerHTML = `
            ${headHtml}
            <div class="lp-body category-tiles-grid">
                ${items.map((c) => `
                    <a class="category-tile" href="product-list.html?category=${c.id}">
                        <div class="category-tile-img">
                            <img src="${c.banner ? resolveSiteAssetUrl(c.banner) : 'images/placeholder.png'}" alt="${escapeHtml(c.name)}">
                        </div>
                        <div class="category-tile-name">${escapeHtml(c.name)}</div>
                    </a>
                `).join("")}
            </div>
        `;
        return true;
    }

    if (section.design_style === "tabbed_products") {
        renderTabbedProductsSection(wrapper, section, headHtml, tabs);
        return true;
    }

    if (section.design_style === "banner_product_combo") {
        renderBannerProductComboSection(wrapper, section, items);
        return true;
    }


    const bodyClass = section.design_style === "product_slider" ? "products-slider" : "products-grid";
    const badge = section.design_style === "bestseller_strip" ? (section.badge_text || "Best Seller") : null;
    wrapper.innerHTML = `
        ${headHtml}
        <div class="feature-section-body">
            <div class="${bodyClass}">${items.map((p) => renderHomeSectionProductCard(p, badge)).join("")}</div>
        </div>
    `;
}

function renderTabbedProductsSection(wrapper, section, headHtml, tabs) {
    const tabsId = `tabs_${section.section_key}`;

    wrapper.innerHTML = `
        ${headHtml}
        <div class="lp-body home-tabs" id="${tabsId}">
            <div class="home-tabs-nav">
                ${tabs.map((t, i) => `
                    <button type="button" class="home-tab-btn${i === 0 ? " active" : ""}" data-tab-index="${i}">${escapeHtml(t.name)}</button>
                `).join("")}
            </div>
            ${tabs.map((t, i) => `
                <div class="home-tab-panel${i === 0 ? " active" : ""}" data-tab-panel="${i}">
                    <div class="products-grid">${(t.items || []).map((p) => renderHomeSectionProductCard(p)).join("")}</div>
                </div>
            `).join("")}
        </div>
    `;

    const root = wrapper.querySelector(`#${CSS.escape(tabsId)}`);
    root.querySelectorAll(".home-tab-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const index = btn.dataset.tabIndex;
            root.querySelectorAll(".home-tab-btn").forEach((b) => b.classList.toggle("active", b === btn));
            root.querySelectorAll(".home-tab-panel").forEach((p) => p.classList.toggle("active", p.dataset.tabPanel === index));
        });
    });
}

function renderBannerProductComboSection(wrapper, section, items) {
    const heightStyle = section.min_height_px ? ` style="height:${section.min_height_px}px;"` : "";
    const st = getSectionTextStyles(section);

    const imageHtml = section.image
        ? `<img src="${resolveSiteAssetUrl(section.image)}" alt="${escapeHtml(section.heading || "")}" class="combo-banner-image">`
        : "";
    const buttonHtml = (section.button_text && section.button_url)
        ? `<a href="${section.button_url}" class="custom-section-btn">${escapeHtml(section.button_text)}</a>`
        : "";

    wrapper.innerHTML = `
        <div class="lp-body banner-product-combo">
            <div class="combo-banner"${heightStyle}>
                ${imageHtml}
                <div class="combo-banner-text">
                    <div style="${st.bgStyle}">
                        ${section.heading ? `<div class="lp-title" style="${st.headingStyle}">${escapeHtml(section.heading)}</div>` : ""}
                        ${section.subheading ? `<div class="custom-section-subheading" style="${st.subheadingStyle}">${escapeHtml(section.subheading)}</div>` : ""}
                        ${section.body_html ? `<div class="custom-section-text" style="${st.bodyStyle}">${escapeHtml(section.body_html)}</div>` : ""}
                        ${buttonHtml}
                    </div>
                </div>
            </div>
            <div class="combo-products products-slider">
                ${items.map((p) => renderHomeSectionProductCard(p)).join("")}
            </div>
        </div>
    `;
}

function renderHomeSectionProductCard(p, badgeText) {
    const slug = p.slug || makeSlug(p.name);
    const image = p.image ? (p.image.startsWith("http") ? p.image : resolveSiteAssetUrl(p.image)) : "";
    const productName = p.name.split(' ').slice(0, 5).join(' ') + (p.name.split(' ').length > 5 ? '...' : '');
    const hasVariants = !!p.has_variants;
    const badgeHtml = badgeText ? `<span class="prod-badge">${escapeHtml(badgeText)}</span>` : "";

    return `
        <div class="prod-card">
            ${badgeHtml}
            <div class="prod-img" onclick="openProduct('${slug}')">
                <img src="${image}" alt="${escapeHtml(productName)}">
            </div>
            <div class="prod-name" onclick="openProduct('${slug}')">${escapeHtml(productName)}</div>
            <div class="prod-price">
                ৳ ${p.discount_price || p.price} <span class="price-orig">${p.discount_price ? `৳ ${p.price}` : ""}</span>
            </div>
            <button class="prod-cart" onclick="handleListCartClick(${p.id}, '${slug}', ${hasVariants})">+ Cart</button>
        </div>
    `;
}

function resolveSiteAssetUrl(path) {
    if (!path) return "";
    return path.startsWith("http") ? path : API_BASE + path;
}
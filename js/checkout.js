/* =========================================
   STATE
========================================= */
let checkoutData = null;

let selectedDistrictId = null;

let selectedDeliveryCharge = 0;

let districtsData = [];

let CUSTOMER_PROFILE = null;

/* =========================================
   INIT
========================================= */
window.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadDistricts();

        await loadCustomerProfile();

        await loadSavedAddresses();

        await loadCheckoutSummary();

        bindDistrictChange();

        bindAddressSelect();

        bindLiveValidationClear();
    }
);

/* =========================================
   TOKEN
========================================= */
function getToken() {

    return (
        localStorage.getItem("access") ||
        localStorage.getItem("token") ||
        ""
    );
}

/* =========================================
   AUTH HEADERS
========================================= */
function getAuthHeaders() {
    const headers = {
        "Content-Type": "application/json"
    };

    const token = getToken();

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
}

/* =========================================
   CUSTOMER PROFILE
========================================= */
async function loadCustomerProfile() {
    if (!isLoggedIn()) return;

    try {
        const res = await fetch(`${API_BASE}/api/auth/profile/`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        const data = await res.json();

        if (!data.status) return;

        CUSTOMER_PROFILE = data.data;

        const nameField = document.getElementById("ckName");
        const phoneField = document.getElementById("ckPhone");

        const phone = CUSTOMER_PROFILE.phone || "";
        const name = CUSTOMER_PROFILE.name || "";

        if (phoneField) {
            phoneField.value = phone;
            phoneField.readOnly = true;
            phoneField.classList.add("field-locked");
        }

        const hasRealName = name && name !== phone;

        if (nameField) {
            if (hasRealName) {
                nameField.value = name;
                nameField.readOnly = true;
                nameField.classList.add("field-locked");
            } else {
                nameField.readOnly = false;
                nameField.classList.remove("field-locked");
            }
        }

    } catch (err) {
        console.error("PROFILE LOAD ERROR:", err);
    }
}

/* =========================================
   LOAD DISTRICTS FROM BACKEND API
========================================= */
async function loadDistricts() {

    const districtSelect =
        document.getElementById("ckDistrict");

    if (!districtSelect) return;

    try {

        const res = await fetch(
            "https://bdapi.vercel.app/api/v.1/district"
        );

        const data = await res.json();

        districtSelect.innerHTML = `
            <option value="">
                Select District
            </option>
        `;

        if (
            data.status === 200 &&
            data.success
        ) {

            districtsData = data.data;

            data.data.forEach(district => {

                districtSelect.innerHTML += `
                    <option
                        value="${district.name}"
                        data-id="${district.id}">
                        ${district.bn_name}
                    </option>
                `;
            });
        }

    } catch (err) {

        console.error(
            "DISTRICT ERROR:",
            err
        );
    }
}

/* =========================================
   DISTRICT CHANGE
========================================= */
function bindDistrictChange() {

    const districtSelect =
        document.getElementById("ckDistrict");

    if (!districtSelect) return;

    districtSelect.addEventListener(
        "change",
        async () => {

            selectedDistrictId =
                districtSelect.value;

            await loadCheckoutSummary();
        }
    );
}

/* =========================================
   LOAD CHECKOUT SUMMARY (auth or guest)
========================================= */
async function loadCheckoutSummary() {

    try {
        const district = document.getElementById("ckDistrict")?.value;

        if (isLoggedIn()) {
            const selectedCartIds = JSON.parse(localStorage.getItem("checkout_cart_ids")) || [];
            const params = new URLSearchParams();
            selectedCartIds.forEach(id => params.append("cart_ids", id));
            if (district) params.append("district", district);

            const res = await fetch(`${API_BASE}/api/checkout/summary/?${params.toString()}`, {
                method: "GET",
                headers: getAuthHeaders()
            });
            const data = await res.json();

            if (!data.status) {
                toast(data.message || "Checkout failed");
                return;
            }

            checkoutData = data.data;
            selectedDeliveryCharge = Number(data.data.delivery_charge || 0);
            renderDeliveryChargeText();
            renderCheckoutProducts(data.data.items || []);
            renderSummary(data.data.items || [], data.data.subtotal || 0);

            GAInitiateCheckoutEvent(
                (data.data.items || []).map(item => ({
                    id: item.product_id,
                    name: item.product,
                    price: item.total / item.quantity,
                    quantity: item.quantity
                })),
                data.data.subtotal || 0
            );

        } else {
            const guestItems = JSON.parse(localStorage.getItem("checkout_guest_items")) || [];

            if (!guestItems.length) {
                toast("No items to checkout");
                return;
            }

            const params = new URLSearchParams();
            params.append("items", JSON.stringify(guestItems));
            if (district) params.append("district", district);

            const res = await fetch(`${API_BASE}/api/checkout/summary/?${params.toString()}`, {
                method: "GET"
            });
            const data = await res.json();

            if (!data.status) {
                toast(data.message || "Checkout failed");
                return;
            }

            checkoutData = data.data;
            selectedDeliveryCharge = Number(data.data.delivery_charge || 0);
            renderDeliveryChargeText();
            renderCheckoutProducts(data.data.items || []);
            renderSummary(data.data.items || [], data.data.subtotal || 0);

            GAInitiateCheckoutEvent(
                (data.data.items || []).map(item => ({
                    id: item.product_id,
                    name: item.product,
                    price: item.total / item.quantity,
                    quantity: item.quantity
                })),
                data.data.subtotal || 0
            );
        }

    } catch (err) {
        console.error("CHECKOUT ERROR:", err);
        toast("Failed to load checkout");
    }
}

function renderDeliveryChargeText() {
    const deliveryText = document.getElementById("deliveryChargeText");
    if (deliveryText) deliveryText.innerText = `৳ ${selectedDeliveryCharge}`;
}

/* =========================================
   RENDER PRODUCTS
========================================= */
function renderCheckoutProducts(items) {
    const container = document.getElementById("checkoutProducts");
    if (!container) return;
    container.innerHTML = "";

    if (!items.length) {
        container.innerHTML = `<div class="empty-checkout">No checkout items found</div>`;
        return;
    }

    items.forEach(item => {
        const variantText = item.variant && typeof item.variant === "object"
            ? Object.values(item.variant).join(" / ")
            : "";

        container.innerHTML += `
            <div class="ck-product">
                <div class="ck-product-info">
                    <div class="ck-product-name">
                        ${item.product}
                        ${variantText ? `<span style="color:#888;font-size:12px"> (${variantText})</span>` : ""}
                    </div>
                    <div class="ck-product-meta">
                        Qty: ${item.quantity}
                    </div>
                </div>
                <div class="ck-product-right">
                    <div class="ck-product-price">
                        ৳ ${item.total}
                    </div>
                </div>
            </div>
        `;
    });
}

/* =========================================
   RENDER SUMMARY
========================================= */
function renderSummary(items, subtotal) {
    const summaryBox = document.getElementById("checkoutSummaryItems");
    if (!summaryBox) return;
    summaryBox.innerHTML = "";
    let breakdownHtml = "";

    items.forEach(item => {
        const variantText = item.variant && typeof item.variant === "object"
            ? Object.values(item.variant).join(" / ")
            : "";

        summaryBox.innerHTML += `
            <div class="sum-row">
                <span>
                    ${item.product}${variantText ? ` (${variantText})` : ""}
                    × ${item.quantity}
                </span>
                <span>
                    ৳ ${item.total}
                </span>
            </div>
        `;

        if (Number(item.delivery_charge || 0) > 0) {
            breakdownHtml += `
                <div class="delivery-item">
                    <span class="delivery-item-name">${item.product}</span>
                    <span class="delivery-item-charge">৳ ${item.delivery_charge}</span>
                </div>
            `;
        }
    });

    document.getElementById("ckSubtotal").innerText = subtotal;

    const breakdown = document.getElementById("deliveryBreakdown");
    if (breakdown) {
        breakdown.innerHTML = breakdownHtml || `<div class="delivery-item">No delivery charge</div>`;
    }

    updateTotals();
}

/* =========================================
   UPDATE TOTALS
========================================= */
function updateTotals() {

    const subtotal =
        Number(
            document.getElementById(
                "ckSubtotal"
            ).innerText || 0
        );

    const shipping =
        Number(
            selectedDeliveryCharge || 0
        );

    const total =
        subtotal + shipping;

    document.getElementById(
        "ckShipping"
    ).innerText = shipping;

    document.getElementById(
        "ckTotal"
    ).innerText = total;
}

/* =========================================
   LOAD SAVED ADDRESSES
========================================= */
async function loadSavedAddresses() {

    const select =
        document.getElementById(
            "ckAddressSelect"
        );

    if (!select) return;

    const addresses =
        JSON.parse(
            localStorage.getItem(
                "pw_addresses"
            )
        ) || [];

    select.innerHTML = `
        <option value="">
            Select Saved Address
        </option>
    `;

    addresses.forEach((addr, index) => {

        select.innerHTML += `
            <option value="${index}">
                ${addr.name} — ${addr.district}
            </option>
        `;
    });
}

/* =========================================
   ADDRESS SELECT
========================================= */
function bindAddressSelect() {

    const select =
        document.getElementById(
            "ckAddressSelect"
        );

    if (!select) return;

    select.addEventListener(
        "change",
        () => {

            const addresses =
                JSON.parse(
                    localStorage.getItem(
                        "pw_addresses"
                    )
                ) || [];

            const selected =
                addresses[select.value];

            if (!selected) return;

            const nameField = document.getElementById("ckName");
            const phoneField = document.getElementById("ckPhone");

            if (nameField && !nameField.readOnly) {
                nameField.value = selected.name || "";
            }

            if (phoneField && !phoneField.readOnly) {
                phoneField.value = selected.phone || "";
            }

            document.getElementById(
                "ckAddress"
            ).value = selected.address || "";

            const districtSelect =
                document.getElementById(
                    "ckDistrict"
                );

            districtSelect.value =
                selected.district || "";

            selectedDistrictId =
                selected.district || "";

            loadCheckoutSummary();
        }
    );
}

/* =========================================
   VALIDATION
========================================= */

// Fields checked on submit, in the order they appear on the form.
// `label` is used in the toast message shown to the user.
const CHECKOUT_REQUIRED_FIELDS = [
    { id: "ckName", label: "Full Name" },
    { id: "ckPhone", label: "Phone Number" },
    { id: "ckAddress", label: "Delivery Address" },
    { id: "ckDistrict", label: "District" },
];

function clearFieldError(el) {
    if (!el) return;
    el.classList.remove("field-error");
    const wrap = el.closest(".ck-field") || el.parentElement;
    wrap?.querySelector(".field-error-msg")?.remove();
}

function clearAllFieldErrors() {
    CHECKOUT_REQUIRED_FIELDS.forEach(f => {
        clearFieldError(document.getElementById(f.id));
    });
}

function showFieldError(el, message) {
    if (!el) return;
    el.classList.add("field-error");

    // avoid duplicate messages if validate runs more than once
    const wrap = el.closest(".ck-field") || el.parentElement;
    wrap?.querySelector(".field-error-msg")?.remove();

    const msgEl = document.createElement("div");
    msgEl.className = "field-error-msg";
    msgEl.textContent = message;
    wrap?.appendChild(msgEl);
}

// Re-validates a single field as the user types/selects, so the red
// highlight clears the moment they fix it (no need to resubmit).
function bindLiveValidationClear() {
    CHECKOUT_REQUIRED_FIELDS.forEach(f => {
        const el = document.getElementById(f.id);
        if (!el) return;
        const evt = (el.tagName === "SELECT") ? "change" : "input";
        el.addEventListener(evt, () => {
            if (el.value && el.value.trim()) {
                clearFieldError(el);
            }
        });
    });
}

/**
 * Validates all required checkout fields.
 * Highlights every missing field, shows an inline message under each one,
 * shows a single summary toast, and scrolls to + focuses the first
 * missing field.
 * Returns true if the form is valid, false otherwise.
 */
function validateCheckoutForm() {
    clearAllFieldErrors();

    const missing = [];

    CHECKOUT_REQUIRED_FIELDS.forEach(f => {
        const el = document.getElementById(f.id);
        if (!el) return;
        const value = (el.value || "").trim();
        if (!value) {
            missing.push(f);
            showFieldError(el, `${f.label} is required`);
        }
    });

    if (missing.length) {
        const first = document.getElementById(missing[0].id);

        if (missing.length === 1) {
            toast(`Please fill in ${missing[0].label}`);
        } else {
            const names = missing.map(f => f.label).join(", ");
            toast(`Please fill in the highlighted fields: ${names}`);
        }

        first?.scrollIntoView({ behavior: "smooth", block: "center" });
        first?.focus();

        return false;
    }

    return true;
}

/* =========================================
   PLACE ORDER (auth or guest)
========================================= */
async function placeOrder() {

    if (!validateCheckoutForm()) {
        return;
    }

    const name = document.getElementById("ckName").value.trim();
    const phone = document.getElementById("ckPhone").value.trim();
    const address = document.getElementById("ckAddress").value.trim();
    const district = document.getElementById("ckDistrict").value;

    try {
        let body;

        if (isLoggedIn()) {
            const selectedCartIds = JSON.parse(localStorage.getItem("checkout_cart_ids")) || [];
            body = { cart_ids: selectedCartIds, name, phone, address, district };
        } else {
            const guestItems = JSON.parse(localStorage.getItem("checkout_guest_items")) || [];
            if (!guestItems.length) {
                toast("No items to checkout");
                return;
            }
            body = { items: guestItems, name, phone, address, district };
        }

        const res = await fetch(`${API_BASE}/api/checkout/place-order/`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.status) {

            GAInitiatePurchaseEvent(
                (checkoutData?.items || []).map(item => ({
                    id: item.product_id,
                    name: item.product,
                    price: item.total / item.quantity,
                    quantity: item.quantity
                })),
                checkoutData?.subtotal || 0,
                data.order_id
            );

            localStorage.removeItem("checkout_cart_ids");
            localStorage.removeItem("checkout_guest_items");

            if (!isLoggedIn()) {
                clearGuestCart();
            } else if (CUSTOMER_PROFILE && (!CUSTOMER_PROFILE.name || CUSTOMER_PROFILE.name === CUSTOMER_PROFILE.phone)) {
                fetch(`${API_BASE}/api/auth/profile/`, {
                    method: "PUT",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ name })
                }).catch(err => console.error("PROFILE NAME SAVE ERROR:", err));
            }

            showOrderSuccess();
            setTimeout(() => {
                window.location.href = isLoggedIn() ? "my-orders.html" : "index.html";
            }, 2500);
        } else {
            // Backend validation error (e.g. out of stock, invalid district) —
            // show it and, if the backend told us which field, highlight it too.
            toast(data.message || "Order failed");

            if (data.field && document.getElementById(data.field)) {
                showFieldError(document.getElementById(data.field), data.message || "Invalid value");
            }
        }

    } catch (err) {
        console.error("ORDER ERROR:", err);
        toast("Something went wrong. Please try again.");
    }
}

/* =========================================
   TOAST
========================================= */
function toast(msg) {

    const c =
        document.getElementById(
            "toast-container"
        );

    if (!c) {
        alert(msg);
        return;
    }

    const el =
        document.createElement("div");

    el.className = "toast";

    el.innerText = msg;

    c.appendChild(el);

    setTimeout(() => {
        el.classList.add("show");
    }, 50);

    setTimeout(() => {

        el.classList.remove("show");

        setTimeout(() => {
            el.remove();
        }, 300);

    }, 2800);
}

/* =========================================
   SUCCESS POP-UP
========================================= */

function showOrderSuccess() {

    const overlay = document.createElement("div");

    overlay.id = "orderSuccessModal";

    overlay.innerHTML = `
        <div class="success-modal">

            <div class="success-icon">
                ✓
            </div>

            <h2>
                Order Placed Successfully
            </h2>

            <p>
                Thank you for your order.
                We have received your order and
                will contact you soon.
            </p>

            <div class="success-order-text">
                Redirecting to My Orders...
            </div>

        </div>
    `;

    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.remove();
    }, 2400);
}

function toggleDeliveryBreakdown() {

    const box =
        document.getElementById(
            "deliveryBreakdown"
        );

    const arrow =
        document.getElementById(
            "deliveryArrow"
        );

    if (!box) return;

    box.classList.toggle("show");

    if (
        box.classList.contains("show")
    ) {

        arrow.innerText = "▲";

    } else {

        arrow.innerText = "▼";
    }
}
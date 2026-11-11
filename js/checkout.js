/* =========================================
   STATE
========================================= */
let checkoutData = null;

let selectedDistrictId = null;

let selectedDeliveryCharge = 0;

let districtsData = [];

let CUSTOMER_PROFILE = null;

let appliedCoupon = null;  

let couponDiscount = 0;

let ckCustomState = {};

(function injectCkCustomStyles() {
    if (document.getElementById("ckCustomStyles")) return;
    const st = document.createElement("style");
    st.id = "ckCustomStyles";
    st.textContent = `
        .ck-custom-box{margin-top:8px;padding:10px 12px;border:1px dashed #C9963A;border-radius:10px;background:#fffaf0;}
        .ck-custom-head{font-size:13px;font-weight:700;color:#8a6d2b;margin-bottom:8px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
        .ck-custom-chip{font-size:11px;font-weight:700;background:#C9963A;color:#fff;padding:1px 8px;border-radius:999px;}
        .ck-cf-field{margin-bottom:8px;}
        .ck-cf-field:last-child{margin-bottom:0;}
        .ck-cf-field label{display:block;font-size:12px;font-weight:600;margin-bottom:3px;color:#333;}
        .ck-cf-field .ck-req{color:#dc2626;}
        .ck-cf-field input,.ck-cf-field select,.ck-cf-field textarea{width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #ccc;border-radius:8px;font-size:14px;font-family:inherit;background:#fff;}
        .ck-cf-field textarea{min-height:70px;resize:vertical;}
        .ck-cf-field input:focus,.ck-cf-field select:focus,.ck-cf-field textarea:focus{outline:none;border-color:#C9963A;}
        .ck-cf-field.error input,.ck-cf-field.error select,.ck-cf-field.error textarea{border-color:#dc2626;background:#fff5f5;}
    `;
    document.head.appendChild(st);
})();

function ckLineKey(item) {
    return item.cart_id != null ? `c${item.cart_id}` : `g${item.line_index}`;
}

function ckNoteMapKey(item) {
    return String(item.cart_id != null ? item.cart_id : item.line_index);
}

function ckCustomItems() {
    return (checkoutData?.items || []).filter(i => i.is_customized && !i.is_gift);
}

function ckCustomBlock(item) {
    if (!item.is_customized || item.is_gift) return "";

    const key = ckLineKey(item);
    const st = ckCustomState[key] || { f: {}, note: "" };
    const fields = Array.isArray(item.customization_fields) ? item.customization_fields : [];
    const extra = Number(item.customization_price || 0);
    const mandatory = item.customization_mode === "mandatory";

    let body;
    if (fields.length) {
        body = fields.map((f, i) => {
            const val = st.f[i] != null ? st.f[i] : "";
            const req = f.required ? ` <span class="ck-req">*</span>` : "";
            const ph = ckEscapeHtml(f.placeholder || "");
            const attrs = `data-ck-line="${key}" data-ck-field="${i}"`;
            let input;
            if (f.type === "textarea") {
                input = `<textarea ${attrs} maxlength="500" placeholder="${ph}">${ckEscapeHtml(val)}</textarea>`;
            } else if (f.type === "select") {
                const opts = (f.options || []).map(o =>
                    `<option value="${ckEscapeHtml(o)}" ${o === val ? "selected" : ""}>${ckEscapeHtml(o)}</option>`).join("");
                input = `<select ${attrs}><option value="">Select...</option>${opts}</select>`;
            } else if (f.type === "number") {
                input = `<input type="number" ${attrs} value="${ckEscapeHtml(val)}" placeholder="${ph}">`;
            } else {
                input = `<input type="text" ${attrs} maxlength="200" value="${ckEscapeHtml(val)}" placeholder="${ph}">`;
            }
            return `<div class="ck-cf-field" data-ck-wrap="${key}-${i}">
                        <label>${ckEscapeHtml(f.label)}${req}</label>${input}
                    </div>`;
        }).join("");
    } else {
        const val = st.note || item.customization_note || "";
        const ph = ckEscapeHtml(item.customization_placeholder || "Write what you want customized...");
        body = `<div class="ck-cf-field" data-ck-wrap="${key}-note">
                    <textarea data-ck-line="${key}" maxlength="1000" placeholder="${ph}">${ckEscapeHtml(val)}</textarea>
                </div>`;
    }

    return `<div class="ck-custom-box" data-ck-box="${key}">
                <div class="ck-custom-head">
                    ✏️ ${mandatory ? "Customization details" : "Customized"} — ${ckEscapeHtml(item.product)}
                    ${extra > 0 ? `<span class="ck-custom-chip">+৳ ${extra} each</span>` : ""}
                </div>
                ${body}
            </div>`;
}

function ckOnCustomInput(e) {
    const el = e.target;
    if (!el || !el.dataset || el.dataset.ckLine === undefined) return;
    const key = el.dataset.ckLine;
    const st = (ckCustomState[key] = ckCustomState[key] || { f: {}, note: "" });
    if (el.dataset.ckField !== undefined) st.f[el.dataset.ckField] = el.value;
    else st.note = el.value;
    if (String(el.value || "").trim()) el.closest(".ck-cf-field")?.classList.remove("error");
}
document.addEventListener("input", ckOnCustomInput);
document.addEventListener("change", ckOnCustomInput);

function ckComposeNote(item) {
    const st = ckCustomState[ckLineKey(item)] || { f: {}, note: "" };
    const fields = Array.isArray(item.customization_fields) ? item.customization_fields : [];
    if (!fields.length) {
        return String(st.note != null && st.note !== "" ? st.note : (item.customization_note || "")).trim().slice(0, 1000);
    }
    const lines = [];
    fields.forEach((f, i) => {
        const v = String(st.f[i] || "").trim();
        if (v) lines.push(`${f.label}: ${v}`);
    });
    return lines.join("\n").slice(0, 1000);
}

function ckCollectCustomNotes() {
    const out = {};
    ckCustomItems().forEach(item => { out[ckNoteMapKey(item)] = ckComposeNote(item); });
    return out;
}

function ckValidateCustomization() {
    for (const item of ckCustomItems()) {
        const key = ckLineKey(item);
        const st = ckCustomState[key] || { f: {}, note: "" };
        const fields = Array.isArray(item.customization_fields) ? item.customization_fields : [];
        let firstBad = null;

        if (fields.length) {
            fields.forEach((f, i) => {
                if (f.required && !String(st.f[i] || "").trim()) {
                    const w = document.querySelector(`[data-ck-wrap="${key}-${i}"]`);
                    w?.classList.add("error");
                    if (!firstBad) firstBad = w;
                }
            });
            if (!firstBad && !ckComposeNote(item)) {
                firstBad = document.querySelector(`[data-ck-wrap="${key}-0"]`);
                firstBad?.classList.add("error");
            }
        } else if (!ckComposeNote(item)) {
            firstBad = document.querySelector(`[data-ck-wrap="${key}-note"]`);
            firstBad?.classList.add("error");
        }

        if (firstBad || (!fields.length && !ckComposeNote(item))) {
            toast(`Please write the customization for ${item.product}`);
            (firstBad || document.querySelector(`[data-ck-box="${key}"]`))?.scrollIntoView({ behavior: "smooth", block: "center" });
            firstBad?.querySelector("input, textarea, select")?.focus();
            return false;
        }
    }
    return true;
}

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

        bindOrderAttemptCapture();
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
            if (phone) {
                phoneField.readOnly = true;
                phoneField.classList.add("field-locked");
            } else {
                phoneField.readOnly = false;
                phoneField.classList.remove("field-locked");
            }
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
            "https://bdapis.com/api/v1.2/districts"
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
            await revalidateAppliedCouponIfAny();

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
            await revalidateAppliedCouponIfAny();

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

        const giftBadge = item.is_gift
            ? `<span style="color:#16a34a;font-size:11px;font-weight:700;background:#dcfce7;padding:1px 7px;border-radius:999px;margin-left:6px;">🎁 GIFT</span>`
            : "";

        container.innerHTML += `
            <div class="ck-product${item.is_gift ? ' ck-product-gift' : ''}">
                <div class="ck-product-info">
                    <div class="ck-product-name">
                        ${item.product}${giftBadge}
                        ${variantText ? `<span style="color:#888;font-size:12px"> (${variantText})</span>` : ""}
                    </div>
                    <div class="ck-product-meta">
                        Qty: ${item.quantity}
                    </div>
                    ${item.is_customized && Number(item.customization_price) > 0 && Number(item.quantity) > 0
                        ? `<div class="ck-product-meta" style="color:#8a6d2b;">Base ৳ ${Math.round(item.total / item.quantity - item.customization_price)} + Customization ৳ ${item.customization_price}${item.quantity > 1 ? " each" : ""}</div>`
                        : ""}
                    ${ckCustomBlock(item)}
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

        const giftBadge = item.is_gift
            ? `<span style="color:#16a34a;font-size:11px;font-weight:700;background:#dcfce7;padding:1px 7px;border-radius:999px;margin-left:6px;">🎁 GIFT</span>`
            : "";

        summaryBox.innerHTML += `
            <div class="sum-row">
                <span>
                    ${item.product}${giftBadge}${variantText ? ` (${variantText})` : ""}
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

    const subtotalAfterDiscount =
        subtotal - couponDiscount;

    const total = 
        subtotalAfterDiscount + shipping;

    const afterDiscountRow = 
        document.getElementById(
            "subtotalAfterDiscountRow"
        );
    const afterDiscountAmount = 
        document.getElementById(
            "ckSubtotalAfterDiscount"
        );

    if (couponDiscount > 0) {
        if (afterDiscountRow) afterDiscountRow.style.display = "flex";
        if (afterDiscountAmount) afterDiscountAmount.innerText = subtotalAfterDiscount;
    } else {
        if (afterDiscountRow) afterDiscountRow.style.display = "none";
    }

    document.getElementById(
        "ckShipping"
    ).innerText = shipping;

    document.getElementById(
        "ckTotal"
    ).innerText = total;
}

/* =========================================
   COUPON
========================================= */

async function revalidateAppliedCouponIfAny() {
    if (!appliedCoupon) return;
    await applyCoupon(appliedCoupon.code, true);
}

function setCouponMessage(message, type) {
    const el = document.getElementById("couponMessage");
    if (!el) return;
    el.textContent = message || "";
    el.className = "coupon-message" + (type ? ` ${type}` : "");
}

function updateCouponUI() {
    const row = document.getElementById("couponDiscountRow");
    const codeEl = document.getElementById("ckCouponCode");
    const amountEl = document.getElementById("ckCouponDiscount");
    const input = document.getElementById("ckCouponInput");
    const btn = document.getElementById("couponApplyBtn");

    if (appliedCoupon) {
        if (row) row.style.display = "flex";
        if (codeEl) codeEl.textContent = appliedCoupon.code;
        if (amountEl) amountEl.innerText = couponDiscount;

        if (input) {
            input.value = appliedCoupon.code;
            input.disabled = true;
        }
        if (btn) {
            btn.textContent = "Remove";
            btn.classList.add("remove");
            btn.setAttribute("onclick", "removeCoupon()");
        }
    } else {
        if (row) row.style.display = "none";
        if (input) input.disabled = false;
        if (btn) {
            btn.textContent = "Apply";
            btn.classList.remove("remove");
            btn.setAttribute("onclick", "applyCoupon()");
        }
    }

    updateTotals();
}


async function applyCoupon(code, silent) {
    const input = document.getElementById("ckCouponInput");
    const btn = document.getElementById("couponApplyBtn");

    const couponCode = (code || input?.value || "").trim();

    if (!couponCode) {
        if (!silent) setCouponMessage("Enter a coupon code", "error");
        return;
    }

    const phone = document.getElementById("ckPhone")?.value.trim();
    if (!phone) {
        if (!silent) {
            setCouponMessage("", "");
            toast("Please enter your phone number first");
        }
        return;
    }

    const items = (checkoutData?.items || [])
        .filter(item => !item.is_gift)
        .map(item => ({
            product_id: item.product_id,
            variant_id: item.variant_id || null,
            quantity: item.quantity
        }));

    if (btn && !silent) btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/site/api/apply-coupon/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                code: couponCode,
                phone,
                items
            })
        });
        const data = await res.json();

        if (data.status) {
            appliedCoupon = { code: data.data.code };
            couponDiscount = Number(data.data.discount_amount || 0);
            setCouponMessage(`Coupon "${data.data.code}" applied`, "success");
        } else {
            appliedCoupon = null;
            couponDiscount = 0;
            setCouponMessage(data.message || "Invalid coupon code", "error");
        }

    } catch (err) {
        console.error("COUPON ERROR:", err);
        appliedCoupon = null;
        couponDiscount = 0;
        if (!silent) setCouponMessage("Failed to apply coupon", "error");
    }

    if (btn) btn.disabled = false;
    updateCouponUI();
}

function removeCoupon() {
    appliedCoupon = null;
    couponDiscount = 0;
    setCouponMessage("", "");

    const input = document.getElementById("ckCouponInput");
    if (input) input.value = "";

    updateCouponUI();
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

    // Saved addresses are only for logged-in accounts. Guests just type the address.
    const savedField = document.getElementById("ckSavedAddressField");
    const addressLabel = document.getElementById("ckAddressFieldLabel");
    if (!isLoggedIn()) {
        window.__SAVED_ADDRESSES__ = [];
        if (savedField) savedField.style.display = "none";
        if (addressLabel) addressLabel.textContent = "Address";
        return;
    }
    if (savedField) savedField.style.display = "";

    let addresses = [];

    const token = localStorage.getItem("access") || localStorage.getItem("token");

    if (token) {
        try {
            const res = await fetch(`${API_BASE}/api/addresses/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status && Array.isArray(data.data)) {
                addresses = data.data;
            }
        } catch (err) {
            console.error("LOAD SAVED ADDRESSES ERROR:", err);
        }
    } else {
        addresses =
            JSON.parse(
                localStorage.getItem(
                    "pw_addresses"
                )
            ) || [];
    }

    window.__SAVED_ADDRESSES__ = addresses;

    select.innerHTML = `
        <option value="">
            Select Saved Address
        </option>
    `;

    addresses.forEach((addr, index) => {

        select.innerHTML += `
            <option value="${index}">
                ${addr.address} — ${addr.district}
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

            const addresses = window.__SAVED_ADDRESSES__ || [];

            const selected =
                addresses[select.value];

            const addressField = document.getElementById("ckAddress");
            const districtSelect = document.getElementById("ckDistrict");
            const nameField = document.getElementById("ckName");
            const phoneField = document.getElementById("ckPhone");

            const addressLabel = document.getElementById("ckAddressFieldLabel");

            if (!selected) {
                if (addressField) {
                    addressField.value = "";
                    addressField.readOnly = false;
                    addressField.placeholder = "Area / Road / House";
                }
                if (districtSelect) {
                    districtSelect.disabled = false;
                    districtSelect.value = "";
                }
                if (addressLabel) addressLabel.textContent = "Or Enter New Address";
                return;
            }

            if (addressLabel) addressLabel.textContent = "Using Saved Address";

            if (nameField && !nameField.readOnly) {
                nameField.value = selected.name || "";
            }

            if (phoneField && !phoneField.readOnly) {
                phoneField.value = selected.phone || "";
            }

            if (addressField) {
                addressField.value = selected.address || "";
                addressField.readOnly = true;
            }

            if (districtSelect) {
                districtSelect.value = selected.district || "";
                districtSelect.disabled = true;
                districtSelect.dispatchEvent(new Event("change"));
            }

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

/* =========================================
   ORDER ATTEMPT (pre-purchase phone capture)
========================================= */
function bindOrderAttemptCapture() {
    const phoneField = document.getElementById("ckPhone");
    if (!phoneField) return;
    phoneField.addEventListener("blur", saveOrderAttemptIfPossible);
}

function ckEscapeHtml(str) {
    return String(str == null ? "" : str)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

async function saveOrderAttemptIfPossible() {
    const phone = document.getElementById("ckPhone")?.value.trim();
    if (!phone || phone.length < 11) return;

    const items = checkoutData?.items || [];
    if (!items.length) return;

    const payload = {
        customer: {
            name: document.getElementById("ckName")?.value.trim() || "",
            phone,
            address: document.getElementById("ckAddress")?.value.trim() || "",
            district: document.getElementById("ckDistrict")?.value || ""
        },
        products: items.map(item => ({
            id: item.product_id,
            variant_id: item.variant_id || null,
            quantity: item.quantity
        })),
        source: "checkout"
    };

    try {
        await fetch(`${API_BASE}/site/api/order-attempt/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.error("ORDER ATTEMPT SAVE ERROR:", err);
    }
}


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

    if (!ckValidateCustomization()) {
        return;
    }

    const placeBtn = document.getElementById("placeOrderBtn");
    if (placeBtn) {
        if (placeBtn.disabled) return;
        placeBtn.disabled = true;
        placeBtn.textContent = "Placing Order...";
    }

    const name = document.getElementById("ckName").value.trim();
    const phone = document.getElementById("ckPhone").value.trim();
    const address = document.getElementById("ckAddress").value.trim();
    const district = document.getElementById("ckDistrict").value;
    const note = (document.getElementById("ckNote")?.value || "").trim();

    try {
        let body;
        const attribution = window.getAttributionData ? window.getAttributionData() : {};
        const couponCode = appliedCoupon ? appliedCoupon.code : null;

        if (isLoggedIn()) {
            const selectedCartIds = JSON.parse(localStorage.getItem("checkout_cart_ids")) || [];
            const guestItemsFallback = JSON.parse(localStorage.getItem("checkout_guest_items")) || [];
            body = { cart_ids: selectedCartIds, items: guestItemsFallback, name, phone, address, district, note, coupon_code: couponCode, customization_notes: ckCollectCustomNotes(), ...attribution };
        } else {
            const guestItems = JSON.parse(localStorage.getItem("checkout_guest_items")) || [];
            if (!guestItems.length) {
                toast("No items to checkout");
                return;
            }
            body = { items: guestItems, name, phone, address, district, note, coupon_code: couponCode, customization_notes: ckCollectCustomNotes(), ...attribution };
        }

        const res = await fetch(`${API_BASE}/api/checkout/place-order/`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (data.status) {
            if (typeof window.trackEvent === "function") {
                window.trackEvent("order_placed", {
                    order_id: data.order_id,
                    total: checkoutData?.subtotal || 0,
                    item_count: (checkoutData?.items || []).length,
                });
            }

            GAInitiatePurchaseEvent(
                (checkoutData?.items || []).map(item => ({
                    id: item.product_id,
                    name: item.product,
                    price: item.total / item.quantity,
                    quantity: item.quantity
                })),
                checkoutData?.subtotal || 0,
                data.order_id,
                { name, phone, address, district }
            );

            localStorage.removeItem("checkout_cart_ids");
            localStorage.removeItem("checkout_guest_items");

            appliedCoupon = null;
            couponDiscount = 0;

            if (!isLoggedIn()) {
                clearGuestCart();
            } else if (CUSTOMER_PROFILE && (!CUSTOMER_PROFILE.name || CUSTOMER_PROFILE.name === CUSTOMER_PROFILE.phone)) {
                fetch(`${API_BASE}/api/auth/profile/`, {
                    method: "PUT",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ name })
                }).catch(err => console.error("PROFILE NAME SAVE ERROR:", err));
            }

            localStorage.removeItem("checkout_cart_ids");
            localStorage.removeItem("checkout_guest_items");
            if (!isLoggedIn()) clearGuestCart();

            showOrderSuccess(data);
        } else {
            if (data.otp_required) {
                showOtpVerifyModal({
                    phone: data.phone || phone,
                    message: data.message,
                    apiBase: API_BASE,
                    orderEndpoint: "/api/checkout/place-order/",
                    orderPayload: body,
                    onSuccess: function (successData) {
                        showOrderSuccess(successData);
                    }
                });
                // if (placeBtn) {
                //     placeBtn.textContent = "Place Order";
                //     placeBtn.disabled = false;
                // }
                return;
            } else {
                toast(data.message || "Order failed");

                if (data.field && document.getElementById(data.field)) {
                    showFieldError(document.getElementById(data.field), data.message || "Invalid value");
                }
                if (placeBtn) {
                    placeBtn.textContent = "Place Order";
                    placeBtn.disabled = false;
                }
            }
        }
    } catch (err) {
        console.error("ORDER ERROR:", err);
        toast("Something went wrong. Please try again.");
        if (placeBtn) {
            placeBtn.textContent = "Place Order";
            placeBtn.disabled = false;
        }
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

function showOrderSuccess(data) {

    localStorage.removeItem("checkout_cart_ids");
    localStorage.removeItem("checkout_guest_items");

    if (!isLoggedIn()) {
        clearGuestCart();
    }

    const redirectUrl = isLoggedIn() ? "/my-orders" : "/";
    const billHtml = (window.OrderBill && OrderBill.html(data && data.bill)) || "";
    const seconds = billHtml ? 15 : 3;

    const overlay = document.createElement("div");

    overlay.id = "orderSuccessModal";

    overlay.innerHTML = `
        <div class="success-modal" style="max-height:92vh;overflow-y:auto;">

            ${billHtml || `
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
            </p>`}

            <div class="success-order-text" style="margin-top:14px;">
                Redirecting in <b id="orderRedirectCountdown">${seconds}</b> seconds...
            </div>

        </div>
    `;

    document.body.appendChild(overlay);

    let left = seconds;
    const countEl = overlay.querySelector("#orderRedirectCountdown");
    const timer = setInterval(() => {
        left -= 1;
        if (countEl) countEl.textContent = Math.max(left, 0);
        if (left <= 0) {
            clearInterval(timer);
            window.location.href = redirectUrl;
        }
    }, 1000);
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
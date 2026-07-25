/* =========================================
   STATE
========================================= */
let checkoutData = null;

let selectedDistrictId = null;

let selectedDeliveryCharge = 0;

let districtsData = [];

/* =========================================
   INIT
========================================= */
window.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadDistricts();

        await loadSavedAddresses();

        await loadCheckoutSummary();

        bindDistrictChange();

        bindAddressSelect();
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

    return {
        "Content-Type": "application/json",

        "Authorization":
        `Bearer ${getToken()}`
    };
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

        } else {
            // GUEST: fetch summary from backend, passing localStorage items + district
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

    const container =
        document.getElementById(
            "checkoutProducts"
        );

    if (!container) return;

    container.innerHTML = "";

    if (!items.length) {

        container.innerHTML = `
            <div class="empty-checkout">
                No checkout items found
            </div>
        `;

        return;
    }

    items.forEach(item => {

        container.innerHTML += `
            <div class="ck-product">
    
                <div class="ck-product-info">
    
                    <div class="ck-product-name">
                        ${item.product}
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
function renderSummary(
    items,
    subtotal
) {

    const summaryBox =
        document.getElementById(
            "checkoutSummaryItems"
        );

    if (!summaryBox) return;

    summaryBox.innerHTML = "";

    let breakdownHtml = "";

    items.forEach(item => {

        summaryBox.innerHTML += `
            <div class="sum-row">

                <span>
                    ${item.product}
                    × ${item.quantity}
                </span>

                <span>
                    ৳ ${item.total}
                </span>

            </div>
        `;

        if (
            Number(item.delivery_charge || 0) > 0
        ) {

            breakdownHtml += `
                <div class="delivery-item">

                    <span
                        class="delivery-item-name">
                        ${item.product}
                    </span>

                    <span
                        class="delivery-item-charge">
                        ৳ ${item.delivery_charge}
                    </span>

                </div>
            `;
        }
    });

    document.getElementById(
        "ckSubtotal"
    ).innerText = subtotal;

    const breakdown =
        document.getElementById(
            "deliveryBreakdown"
        );

    if (breakdown) {

        breakdown.innerHTML =
            breakdownHtml ||
            `
            <div class="delivery-item">
                No delivery charge
            </div>
            `;
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

            document.getElementById(
                "ckName"
            ).value = selected.name || "";

            document.getElementById(
                "ckPhone"
            ).value = selected.phone || "";

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
   PLACE ORDER (auth or guest)
========================================= */
async function placeOrder() {

    const name = document.getElementById("ckName").value.trim();
    const phone = document.getElementById("ckPhone").value.trim();
    const address = document.getElementById("ckAddress").value.trim();
    const district = document.getElementById("ckDistrict").value;

    if (!name) { toast("Enter name"); return; }
    if (!phone) { toast("Enter phone"); return; }
    if (!address) { toast("Enter address"); return; }
    if (!district) { toast("Select district"); return; }

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
            headers: getAuthHeaders(), // sends empty Bearer for guests — backend is AllowAny, fine
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.status) {
            localStorage.removeItem("checkout_cart_ids");
            localStorage.removeItem("checkout_guest_items");

            if (!isLoggedIn()) {
                clearGuestCart(); // from cart.js — guest cart is now placed as an order
            }

            showOrderSuccess();
            setTimeout(() => {
                window.location.href = isLoggedIn() ? "my-orders.html" : "index.html";
            }, 2500);
        } else {
            toast(data.message || "Order failed");
        }

    } catch (err) {
        console.error("ORDER ERROR:", err);
        toast("Something went wrong");
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

    }, 2200);
}

/* =========================================
   SUCESS POP-UP
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
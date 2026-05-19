/* =========================
   CONFIG
========================= */
window.API_BASE

/* =========================
   STATE
========================= */
let checkoutData = null;
let deliveryCharge = 60;

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
    loadCheckoutSummary();
});

/* =========================
   AUTH HEADER
========================= */
function getAuthHeaders() {

    const token =
        localStorage.getItem("access") ||
        localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        "Authorization": `Token ${token}`
    };
}

/* =========================
   LOAD CHECKOUT SUMMARY
========================= */
async function loadCheckoutSummary() {

    try {

        const res = await fetch(
            `${API_BASE}/api/checkout/summary/`,
            {
                headers: getAuthHeaders()
            }
        );

        const data = await res.json();

        console.log("CHECKOUT:", data);

        if (!data.status) {
            toast(data.message || "Failed to load checkout");
            return;
        }

        checkoutData = data.data;

        renderCheckoutProducts(checkoutData.items);

        renderSummary(checkoutData);

    } catch (err) {

        console.error(err);

        toast("Checkout load failed");
    }
}

/* =========================
   RENDER PRODUCTS
========================= */
function renderCheckoutProducts(items) {

    const container =
        document.getElementById("checkoutProducts");

    if (!container) return;

    container.innerHTML = "";

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

                <div class="ck-product-price">
                    ৳ ${item.total}
                </div>

            </div>
        `;
    });
}

/* =========================
   SUMMARY
========================= */
function renderSummary(data) {

    const subtotal =
        parseFloat(data.subtotal);

    const shipping =
        parseFloat(data.delivery_charge);

    const total =
        parseFloat(data.grand_total);

    document.getElementById("ckSubtotal").innerText =
        subtotal;

    document.getElementById("ckShipping").innerText =
        shipping;

    document.getElementById("ckTotal").innerText =
        total;

    const summaryItems =
        document.getElementById("checkoutSummaryItems");

    summaryItems.innerHTML = "";

    data.items.forEach(item => {

        summaryItems.innerHTML += `
            <div class="sum-row">
                <span>
                    ${item.product} × ${item.quantity}
                </span>

                <span>
                    ৳ ${item.total}
                </span>
            </div>
        `;
    });
}

/* =========================
   PLACE ORDER
========================= */
async function placeOrder() {

    const address =
        document.getElementById("ckAddress").value.trim();

    const district =
        document.getElementById("ckDistrict").value;

    const name =
        document.getElementById("ckName").value.trim();

    const phone =
        document.getElementById("ckPhone").value.trim();

    if (!name) {
        toast("Enter your name");
        return;
    }

    if (!phone) {
        toast("Enter phone number");
        return;
    }

    if (!address) {
        toast("Enter address");
        return;
    }

    if (!district) {
        toast("Select district");
        return;
    }

    try {

        const res = await fetch(
            `${API_BASE}/api/checkout/place-order/`,
            {
                method: "POST",

                headers: getAuthHeaders(),

                body: JSON.stringify({
                    address: address,
                    district: district,
                    upazila: ""
                })
            }
        );

        const data = await res.json();

        console.log("ORDER:", data);

        if (data.status) {

            toast("Order placed successfully ✅");

            setTimeout(() => {

                window.location.href =
                    `order-success.html?order_id=${data.order_id}`;

            }, 1200);

        } else {

            toast(data.message || "Order failed");
        }

    } catch (err) {

        console.error(err);

        toast("Order failed");
    }
}

/* =========================
   TOAST
========================= */
function toast(msg) {

    const c =
        document.getElementById("toast-container");

    if (!c) return;

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
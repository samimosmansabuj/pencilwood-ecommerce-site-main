/* =========================
   CONFIG
========================= */
window.API_BASE

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
    loadOrders();
});

/* =========================
   AUTH HEADERS
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
   VIEW ORDER
========================= */
function viewOrder(orderId) {

    window.location.href =
        `order.html?id=${orderId}`;
}

/* =========================
   FILTER ORDERS
========================= */
function filterOrders(status, btn) {

    document
        .querySelectorAll(".of-btn")
        .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    document
        .querySelectorAll(".order-card")
        .forEach(card => {

            if (
                status === "all" ||
                card.dataset.status === status
            ) {

                card.style.display = "block";

            } else {

                card.style.display = "none";
            }
        });
}

/* =========================
   CAPITALIZE
========================= */
function capitalize(str) {

    if (!str) return "";

    return str.charAt(0).toUpperCase() +
        str.slice(1);
}

/* =========================
   LOAD ORDERS
========================= */
async function loadOrders() {

    const ordersList =
        document.getElementById("ordersList");

    if (!ordersList) return;

    ordersList.innerHTML = `
        <p style="text-align:center">
            Loading orders...
        </p>
    `;

    try {

        const res = await fetch(
            `${API_BASE}/api/order/my-orders/`,
            {
                headers: getAuthHeaders()
            }
        );

        const data = await res.json();

        console.log("ORDERS:", data);

        if (!data.status) {

            ordersList.innerHTML = `
                <p style="text-align:center">
                    Failed to load orders
                </p>
            `;

            return;
        }

        const orders = data.data || [];

        if (!orders.length) {

            ordersList.innerHTML = `
                <p style="text-align:center">
                    No orders yet 😢
                </p>
            `;

            return;
        }

        ordersList.innerHTML = "";

        orders.forEach(order => {

            const status =
                (order.status || "pending")
                .toLowerCase();

            ordersList.innerHTML += `
                <div
                    class="order-card"
                    data-status="${status}">

                    <div class="order-top">

                        <div>

                            <div class="order-id">
                                Order #${order.order_id}
                            </div>

                        </div>

                        <div class="order-status ${status}">
                            ${capitalize(status)}
                        </div>

                    </div>

                    <div class="order-bottom">

                        <div class="order-total">
                            Total: ৳ ${order.total}
                        </div>

                        <button
                            class="btn-view"
                            onclick="viewOrder('${order.order_id}')">

                            View Details →

                        </button>

                    </div>

                </div>
            `;
        });

    } catch (err) {

        console.error(err);

        ordersList.innerHTML = `
            <p style="text-align:center">
                Failed to load orders
            </p>
        `;

        toast("Failed to load orders");
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
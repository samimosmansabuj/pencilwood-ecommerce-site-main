/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
    loadOrders();
});

/* =========================
   TOKEN
========================= */
function getToken() {
    return (
        localStorage.getItem("access") ||
        localStorage.getItem("token") ||
        ""
    );
}

/* =========================
   HEADERS
========================= */
function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Token ${getToken()}`
    };
}

/* =========================
   LOAD ORDERS
========================= */
async function loadOrders() {

    const container = document.getElementById("ordersList");

    if (!container) return;

    container.innerHTML = `<p style="text-align:center">Loading orders...</p>`;

    try {

        const res = await fetch(
            `${API_BASE}/api/order/my-orders/`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        const data = await res.json();

        console.log("ORDERS:", data);

        if (!data.status) {
            container.innerHTML = `<p style="text-align:center">Failed to load orders</p>`;
            return;
        }

        const orders = data.data || [];

        if (!orders.length) {
            container.innerHTML = `<p style="text-align:center">No orders yet 😢</p>`;
            return;
        }

        container.innerHTML = "";

        orders.forEach(order => {

            const status = (order.status || "pending").toLowerCase();

            container.innerHTML += `
                <div class="order-card" data-status="${status}">

                    <div class="order-top">
                        <div class="order-id">
                            Order #${order.order_id}
                        </div>

                        <div class="order-status ${status}">
                            ${capitalize(status)}
                        </div>
                    </div>

                    <div class="order-meta">
                        <div>Total: ৳ ${order.total}</div>
                    </div>

                    <div class="order-bottom">
                        <button class="btn-view"
                            onclick="viewOrder('${order.order_id}')">
                            View Details →
                        </button>
                    </div>

                </div>
            `;
        });

    } catch (err) {

        console.error(err);

        container.innerHTML = `<p style="text-align:center">Failed to load orders</p>`;
        toast("Failed to load orders");
    }
}

/* =========================
   FILTER
========================= */
function filterOrders(status, btn) {

    document.querySelectorAll(".of-btn")
        .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    document.querySelectorAll(".order-card")
        .forEach(card => {

            if (status === "all" || card.dataset.status === status) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });
}

/* =========================
   VIEW ORDER
========================= */
function viewOrder(orderId) {
    window.location.href = `order.html?id=${orderId}`;
}

/* =========================
   CAPITALIZE
========================= */
function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/* =========================
   TOAST
========================= */
function toast(msg) {

    const c = document.getElementById("toast-container");

    if (!c) {
        alert(msg);
        return;
    }

    const el = document.createElement("div");
    el.className = "toast";
    el.innerText = msg;

    c.appendChild(el);

    setTimeout(() => el.classList.add("show"), 50);

    setTimeout(() => {
        el.classList.remove("show");
        setTimeout(() => el.remove(), 300);
    }, 2200);
}
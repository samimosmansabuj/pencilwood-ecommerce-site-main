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
        () => {

            selectedDistrictId =
                districtSelect.value;

            updateTotals();
        }
    );
}

/* =========================================
   LOAD CHECKOUT SUMMARY
========================================= */
async function loadCheckoutSummary() {

    try {

        const selectedCartIds =
            JSON.parse(
                localStorage.getItem(
                    "checkout_cart_ids"
                )
            ) || [];

        const params =
            new URLSearchParams();

        selectedCartIds.forEach(id => {
            params.append("cart_ids", id);
        });

        const res = await fetch(
            `${API_BASE}/api/checkout/summary/?${params.toString()}`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        const data =
            await res.json();

        console.log(
            "CHECKOUT:",
            data
        );

        if (!data.status) {

            toast(
                data.message ||
                "Checkout failed"
            );

            return;
        }

        checkoutData = data.data;

        selectedDeliveryCharge =
            Number(
                data.data.delivery_charge || 0
            );

        renderCheckoutProducts(
            data.data.items || []
        );

        renderSummary(
            data.data.items || [],
            data.data.subtotal || 0
        );

    } catch (err) {

        console.error(
            "CHECKOUT ERROR:",
            err
        );

        toast(
            "Failed to load checkout"
        );
    }
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
    });

    document.getElementById(
        "ckSubtotal"
    ).innerText = subtotal;

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

                updateTotals();
        }
    );
}

/* =========================================
   PLACE ORDER
========================================= */
async function placeOrder() {

    const name =
        document.getElementById(
            "ckName"
        ).value.trim();

    const phone =
        document.getElementById(
            "ckPhone"
        ).value.trim();

    const address =
        document.getElementById(
            "ckAddress"
        ).value.trim();

    const district =
        document.getElementById(
            "ckDistrict"
        ).value;

    if (!name) {
        toast("Enter name");
        return;
    }

    if (!phone) {
        toast("Enter phone");
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

        const selectedCartIds =
            JSON.parse(
                localStorage.getItem(
                    "checkout_cart_ids"
                )
            ) || [];

        const res = await fetch(
            `${API_BASE}/api/checkout/place-order/`,
            {
                method: "POST",

                headers: getAuthHeaders(),

                body: JSON.stringify({

                    cart_ids:
                        selectedCartIds,
                
                    name,
                
                    phone,
                
                    address,
                
                    district:
                        district
                })
            }
        );

        const data =
            await res.json();

        console.log(
            "PLACE ORDER:",
            data
        );

        if (data.status) {

            localStorage.removeItem("checkout_cart_ids");
        
            showOrderSuccess();
        
            setTimeout(() => {
        
                window.location.href = "my-orders.html";
        
            }, 2500);
        

        } else {

            toast(
                data.message ||
                "Order failed"
            );
        }

    } catch (err) {

        console.error(
            "ORDER ERROR:",
            err
        );

        toast(
            "Something went wrong"
        );
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

    const div = document.createElement("div");

    div.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #16a34a;
            color: white;
            padding: 14px 20px;
            border-radius: 10px;
            font-weight: 600;
            z-index: 99999;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        ">
            ✅ Order Placed Successfully!
        </div>
    `;

    document.body.appendChild(div);

    setTimeout(() => {
        div.remove();
    }, 2300);
}
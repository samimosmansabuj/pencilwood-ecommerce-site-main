/* =========================
   CONFIG
========================= */
const API_BASE = "http://127.0.0.1:8000";

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {

    loadDistricts();

    loadAddresses();

    const btn =
        document.getElementById("addAddressBtn");

    if (btn) {
        btn.addEventListener("click", addAddress);
    }
});

/* =========================
   DISTRICTS
========================= */
const districts = [
    "Dhaka",
    "Narayanganj",
    "Gazipur",
    "Chattogram",
    "Cumilla",
    "Sylhet",
    "Rajshahi",
    "Khulna",
    "Barishal",
    "Rangpur",
    "Mymensingh"
];

function loadDistricts() {

    const select =
        document.getElementById("deliverydistrict");

    if (!select) return;

    districts.forEach(d => {

        select.innerHTML += `
            <option value="${d}">
                ${d}
            </option>
        `;
    });
}

/* =========================
   LOAD ADDRESSES
========================= */
function loadAddresses() {

    const list =
        document.getElementById("addressList");

    if (!list) return;

    const addresses =
        JSON.parse(localStorage.getItem("pw_addresses")) || [];

    list.innerHTML = "";

    if (!addresses.length) {

        list.innerHTML = `
            <div class="addr-card">
                No address added yet
            </div>
        `;

        return;
    }

    addresses.forEach((addr, index) => {

        list.innerHTML += `
            <div class="addr-card">

                <div class="addr-top">

                    <div>
                        <div class="addr-name">
                            ${addr.name}
                        </div>

                        <div class="addr-phone">
                            ${addr.phone}
                        </div>
                    </div>

                    <button
                        class="addr-delete"
                        onclick="deleteAddress(${index})">
                        Delete
                    </button>

                </div>

                <div class="addr-district">
                    ${addr.district}
                </div>

                <div class="addr-text">
                    ${addr.address}
                </div>

            </div>
        `;
    });
}

/* =========================
   ADD ADDRESS
========================= */
function addAddress() {

    const name =
        document.getElementById("addrName").value.trim();

    const phone =
        document.getElementById("addrPhone").value.trim();

    const district =
        document.getElementById("deliverydistrict").value;

    const address =
        document.getElementById("addrText").value.trim();

    if (!name) {
        toast("Enter full name");
        return;
    }

    if (!phone) {
        toast("Enter phone number");
        return;
    }

    if (!district) {
        toast("Select district");
        return;
    }

    if (!address) {
        toast("Enter address");
        return;
    }

    const addresses =
        JSON.parse(localStorage.getItem("pw_addresses")) || [];

    addresses.push({
        name,
        phone,
        district,
        address
    });

    localStorage.setItem(
        "pw_addresses",
        JSON.stringify(addresses)
    );

    document.getElementById("addrName").value = "";
    document.getElementById("addrPhone").value = "";
    document.getElementById("deliverydistrict").value = "";
    document.getElementById("addrText").value = "";

    loadAddresses();

    toast("Address added ✅");
}

/* =========================
   DELETE ADDRESS
========================= */
function deleteAddress(index) {

    const addresses =
        JSON.parse(localStorage.getItem("pw_addresses")) || [];

    addresses.splice(index, 1);

    localStorage.setItem(
        "pw_addresses",
        JSON.stringify(addresses)
    );

    loadAddresses();

    toast("Address removed");
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
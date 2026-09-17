/* =========================
   CONFIG
========================= */
window.API_BASE;

let CURRENT_ADDRESSES = [];
let EDITING_ADDRESS_ID = null;

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

    const cancelBtn =
        document.getElementById("cancelEditBtn");

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            EDITING_ADDRESS_ID = null;
            clearAddressForm();
            resetAddressFormUI();
        });
    }
});

function getAuthHeaders() {
    const token = localStorage.getItem("access") || localStorage.getItem("token");
    return token
        ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
        : { "Content-Type": "application/json" };
}

/* =========================
   DISTRICTS API
========================= */
async function loadDistricts() {

    const select =
        document.getElementById("deliverydistrict");

    if (!select) return;

    try {

        select.innerHTML = `
            <option value="">
                Select District
            </option>
        `;

        const res = await fetch(
            "https://bdapi.vercel.app/api/v.1/district"
        );

        const data = await res.json();

        if (
            data.status === 200 &&
            data.success &&
            Array.isArray(data.data)
        ) {

            data.data.forEach(district => {

                select.innerHTML += `
                    <option
                        value="${district.name}">
                        ${district.bn_name}
                    </option>
                `;
            });
        }

    } catch (err) {

        console.error(
            "District Load Error:",
            err
        );
    }
}

/* =========================
   LOAD ADDRESSES
========================= */
async function loadAddresses() {

    const list =
        document.getElementById("addressList");

    if (!list) return;

    const token = localStorage.getItem("access") || localStorage.getItem("token");
    let addresses = [];

    if (token) {
        try {
            const res = await fetch(`${API_BASE}/api/addresses/`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (data.status && Array.isArray(data.data)) {
                addresses = data.data;
            }
        } catch (err) {
            console.error("LOAD ADDRESSES ERROR:", err);
        }
    } else {
        addresses =
            JSON.parse(
                localStorage.getItem("pw_addresses")
            ) || [];
    }

    CURRENT_ADDRESSES = addresses;

    const countEl =
        document.getElementById("addressCount");

    if (countEl) {

        countEl.textContent =
            `${addresses.length} Saved Address${addresses.length === 1 ? "" : "es"}`;
    }

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
            <div class="address-card">

                <div class="address-card-info">

                    <div class="addr-name-row">
                        <span class="addr-name">${addr.name || ""}</span>
                        <span class="addr-phone">${addr.phone || ""}</span>
                    </div>

                    <div class="addr-line-row">
                        <span class="addr-text" title="${addr.address || ""}">
                            ${addr.address || ""}
                        </span>
                        <span class="addr-district">${addr.district || ""}</span>
                    </div>

                </div>

                <div class="addr-actions">

                    <button
                        class="icon-btn icon-btn-edit"
                        title="Edit"
                        onclick="editAddress(${index})">

                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>

                    </button>

                    <button
                        class="icon-btn icon-btn-delete"
                        title="Delete"
                        onclick="deleteAddress(${index})">

                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                            <path d="M10 11v6"></path>
                            <path d="M14 11v6"></path>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                        </svg>

                    </button>

                </div>

            </div>
        `;
    });
}

/* =========================
   ADD / UPDATE ADDRESS
========================= */
async function addAddress() {

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

    const token = localStorage.getItem("access") || localStorage.getItem("token");

    if (token) {
        try {
            const isEditing = EDITING_ADDRESS_ID !== null;
            const url = isEditing
                ? `${API_BASE}/api/addresses/${EDITING_ADDRESS_ID}/`
                : `${API_BASE}/api/addresses/`;

            const res = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ name, phone, district, address })
            });

            const data = await res.json();

            if (!data.status) {
                toast(data.message || "Failed to save address");
                return;
            }

            EDITING_ADDRESS_ID = null;
            resetAddressFormUI();
            clearAddressForm();
            await loadAddresses();
            toast(isEditing ? "Address updated ✅" : "Address added ✅");


        } catch (err) {
            console.error("SAVE ADDRESS ERROR:", err);
            toast("Failed to save address");
        }

        return;
    }

    // Guest fallback — localStorage
    const addresses =
        JSON.parse(
            localStorage.getItem("pw_addresses")
        ) || [];

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

    resetAddressFormUI();
    clearAddressForm();
    loadAddresses();
    toast("Address added ✅");
}

function clearAddressForm() {
    document.getElementById("addrName").value = "";
    document.getElementById("addrPhone").value = "";
    document.getElementById("deliverydistrict").value = "";
    document.getElementById("addrText").value = "";
}

function resetAddressFormUI() {
    const titleEl = document.getElementById("addressFormTitle");
    if (titleEl) titleEl.textContent = "Add New Address";

    const cancelBtn = document.getElementById("cancelEditBtn");
    if (cancelBtn) cancelBtn.style.display = "none";
}

/* =========================
   EDIT ADDRESS
========================= */
function editAddress(index) {

    const addr = CURRENT_ADDRESSES[index];

    if (!addr) return;

    document.getElementById("addrName").value =
        addr.name || "";

    document.getElementById("addrPhone").value =
        addr.phone || "";

    document.getElementById("deliverydistrict").value =
        addr.district || "";

    document.getElementById("addrText").value =
        addr.address || "";

    const titleEl = document.getElementById("addressFormTitle");
    if (titleEl) titleEl.textContent = "Edit Address";

    const cancelBtn = document.getElementById("cancelEditBtn");
    if (cancelBtn) cancelBtn.style.display = "block";

    highlightAddressForm();

    const token = localStorage.getItem("access") || localStorage.getItem("token");

    if (token && addr.id) {
        EDITING_ADDRESS_ID = addr.id;
    } else {

        EDITING_ADDRESS_ID = null;
        const addresses =
            JSON.parse(
                localStorage.getItem("pw_addresses")
            ) || [];
        addresses.splice(index, 1);
        localStorage.setItem(
            "pw_addresses",
            JSON.stringify(addresses)
        );
        loadAddresses();
    }

    toast("Address loaded for editing");
}

/* =========================
   DELETE ADDRESS
========================= */
async function deleteAddress(index) {

    const addr = CURRENT_ADDRESSES[index];
    if (!addr) return;

    const token = localStorage.getItem("access") || localStorage.getItem("token");

    if (token && addr.id) {
        try {
            const res = await fetch(`${API_BASE}/api/addresses/${addr.id}/`, {
                method: "DELETE",
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (!data.status) {
                toast(data.message || "Failed to delete address");
                return;
            }
            await loadAddresses();
            toast("Address removed");
        } catch (err) {
            console.error("DELETE ADDRESS ERROR:", err);
            toast("Failed to delete address");
        }
        return;
    }

    const addresses =
        JSON.parse(
            localStorage.getItem("pw_addresses")
        ) || [];

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
        document.getElementById(
            "toast-container"
        );

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

/* =========================
   HIGHLIGHT + SCROLL TO FORM ON EDIT
========================= */
function highlightAddressForm() {

    const formBox =
        document.querySelector(".address-form");

    if (!formBox) return;

    formBox.classList.remove("address-form-highlight");
    void formBox.offsetWidth;
    formBox.classList.add("address-form-highlight");

    setTimeout(() => {
        formBox.classList.remove("address-form-highlight");
    }, 1600);

    formBox.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    const nameField = document.getElementById("addrName");
    if (nameField) {
        setTimeout(() => {
            nameField.focus();
        }, 350);
    }
}
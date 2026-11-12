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
/* ===== OLD (bdapi.vercel.app) - commented out =====
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

===== END OLD ===== */

/* ===== PREVIOUS: bdapis.com API version - commented out =====
const DISTRICT_API_URL = "https://bdapis.com/api/v1.2/districts";
const DISTRICT_CACHE_KEY = "bd_districts_v1_2";

async function _addrFetchDistricts() {
    try {
        const cached = sessionStorage.getItem(DISTRICT_CACHE_KEY);
        if (cached) return JSON.parse(cached);
    } catch (e) {}

    const res = await fetch(DISTRICT_API_URL);
    const json = await res.json();
    const list = (json && json.data) || [];
    if (list.length) {
        try { sessionStorage.setItem(DISTRICT_CACHE_KEY, JSON.stringify(list)); } catch (e) {}
    }
    return list;
}

async function loadDistricts() {
    const select = document.getElementById("deliverydistrict");
    if (!select) return;

    try {
        const list = await _addrFetchDistricts();
        // single innerHTML write = fast
        select.innerHTML =
            '<option value="">Select District</option>' +
            list.map(d => `<option value="${d.district}">${d.districtbn}</option>`).join("");
    } catch (err) {
        console.error("District Load Error:", err);
    }
}
===== END PREVIOUS ===== */

/* ===== NEW: static local districts (no external API) ===== */
var _ADDR_DISTRICTS = [
    {
        "district": "Barguna",
        "districtbn": "বরগুনা",
        "coordinates": "22.0953, 90.1121"
    },
    {
        "district": "Barishal",
        "districtbn": "বরিশাল",
        "coordinates": "22.7022, 90.3696"
    },
    {
        "district": "Bhola",
        "districtbn": "ভোলা",
        "coordinates": "22.1785, 90.7101"
    },
    {
        "district": "Jhalokati",
        "districtbn": "ঝালকাঠী",
        "coordinates": "22.5721, 90.1870"
    },
    {
        "district": "Patuakhali",
        "districtbn": "পটুয়াখালী",
        "coordinates": "22.2249, 90.4548"
    },
    {
        "district": "Pirojpur",
        "districtbn": "পিরোজপুর",
        "coordinates": "22.5791, 89.9759"
    },
    {
        "district": "Bandarban",
        "districtbn": "বান্দরবান",
        "coordinates": "21.8311, 92.3686"
    },
    {
        "district": "Brahmanbaria",
        "districtbn": "ব্রাহ্মণবাড়িয়া",
        "coordinates": "23.9608, 91.1115"
    },
    {
        "district": "Chandpur",
        "districtbn": "চাঁদপুর",
        "coordinates": "23.2513, 90.8518"
    },
    {
        "district": "Chattogram",
        "districtbn": "চট্টগ্রাম",
        "coordinates": "22.5150, 91.7539"
    },
    {
        "district": "Cox's Bazar",
        "districtbn": "কক্স বাজার",
        "coordinates": "21.5641, 92.0282"
    },
    {
        "district": "Cumilla",
        "districtbn": "কুমিল্লা",
        "coordinates": "23.4576, 91.1809"
    },
    {
        "district": "Feni",
        "districtbn": "ফেনী",
        "coordinates": "22.9409, 91.4067"
    },
    {
        "district": "Khagrachari",
        "districtbn": "খাগড়াছড়ি",
        "coordinates": "23.1322, 91.9490"
    },
    {
        "district": "Lakshmipur",
        "districtbn": "লক্ষ্মীপুর",
        "coordinates": "22.9447, 90.8282"
    },
    {
        "district": "Noakhali",
        "districtbn": "নোয়াখালী",
        "coordinates": "22.8724, 91.0973"
    },
    {
        "district": "Rangamati",
        "districtbn": "রাঙ্গামাটি",
        "coordinates": "22.7324, 92.2985"
    },
    {
        "district": "Dhaka",
        "districtbn": "ঢাকা",
        "coordinates": "23.8105, 90.3372"
    },
    {
        "district": "Faridpur",
        "districtbn": "ফরিদপুর",
        "coordinates": "23.5424, 89.6309"
    },
    {
        "district": "Gazipur",
        "districtbn": "গাজীপুর",
        "coordinates": "24.0958, 90.4125"
    },
    {
        "district": "Gopalganj",
        "districtbn": "গোপালগঞ্জ",
        "coordinates": "23.0488, 89.8879"
    },
    {
        "district": "Kishoreganj",
        "districtbn": "কিশোরগঞ্জ",
        "coordinates": "24.4260, 90.9821"
    },
    {
        "district": "Madaripur",
        "districtbn": "মাদারীপুর",
        "coordinates": "23.2393, 90.1870"
    },
    {
        "district": "Manikganj",
        "districtbn": "মানিকগঞ্জ",
        "coordinates": "23.8617, 90.0003"
    },
    {
        "district": "Munshiganj",
        "districtbn": "মুন্সিগঞ্জ",
        "coordinates": "23.4981, 90.4127"
    },
    {
        "district": "Narayanganj",
        "districtbn": "নারায়ণগঞ্জ",
        "coordinates": "23.7147, 90.5636"
    },
    {
        "district": "Narsingdi",
        "districtbn": "নরসিংদী",
        "coordinates": "24.1344, 90.7860"
    },
    {
        "district": "Rajbari",
        "districtbn": "রাজবাড়ী",
        "coordinates": "23.7151, 89.5875"
    },
    {
        "district": "Shariatpur",
        "districtbn": "শরিয়তপুর",
        "coordinates": "23.2423, 90.4348"
    },
    {
        "district": "Tangail",
        "districtbn": "টাঙ্গাইল",
        "coordinates": "24.3917, 89.9948"
    },
    {
        "district": "Bagerhat",
        "districtbn": "বাগেরহাট",
        "coordinates": "22.6602, 89.7895"
    },
    {
        "district": "Chuadanga",
        "districtbn": "চুয়াডাঙ্গা",
        "coordinates": "23.6161, 88.8263"
    },
    {
        "district": "Jashore",
        "districtbn": "যশোর",
        "coordinates": "23.1634, 89.2182"
    },
    {
        "district": "Jhenaidah",
        "districtbn": "ঝিনাইদহ",
        "coordinates": "23.5450, 89.1726"
    },
    {
        "district": "Khulna",
        "districtbn": "খুলনা",
        "coordinates": "22.6738, 89.3967"
    },
    {
        "district": "Kushtia",
        "districtbn": "কুষ্টিয়া",
        "coordinates": "23.8907, 89.1099"
    },
    {
        "district": "Magura",
        "districtbn": "মাগুরা",
        "coordinates": "23.4290, 89.4364"
    },
    {
        "district": "Meherpur",
        "districtbn": "মেহেরপুর",
        "coordinates": "23.8052, 88.6724"
    },
    {
        "district": "Narail",
        "districtbn": "নড়াইল",
        "coordinates": "23.1163, 89.5840"
    },
    {
        "district": "Satkhira",
        "districtbn": "সাতক্ষীরা",
        "coordinates": "22.3155, 89.1115"
    },
    {
        "district": "Jamalpur",
        "districtbn": "জামালপুর",
        "coordinates": "25.0831, 89.7853"
    },
    {
        "district": "Mymensingh",
        "districtbn": "ময়মনসিংহ",
        "coordinates": "24.7539, 90.4073"
    },
    {
        "district": "Netrokona",
        "districtbn": "নেত্রকোনা",
        "coordinates": "24.8103, 90.8656"
    },
    {
        "district": "Sherpur",
        "districtbn": "শেরপুর",
        "coordinates": "25.0746, 90.1495"
    },
    {
        "district": "Bogura",
        "districtbn": "বগুড়া",
        "coordinates": "24.8510, 89.3697"
    },
    {
        "district": "Joypurhat",
        "districtbn": "জয়পুরহাট",
        "coordinates": "25.0947, 89.0945"
    },
    {
        "district": "Naogaon",
        "districtbn": "নওগাঁ",
        "coordinates": "24.9132, 88.7531"
    },
    {
        "district": "Natore",
        "districtbn": "নাটোর",
        "coordinates": "24.4102, 89.0076"
    },
    {
        "district": "Chapai Nawabganj",
        "districtbn": "চাঁপাইনবাবগঞ্জ",
        "coordinates": "24.7413, 88.2912"
    },
    {
        "district": "Pabna",
        "districtbn": "পাবনা",
        "coordinates": "24.1585, 89.4481"
    },
    {
        "district": "Rajshahi",
        "districtbn": "রাজশাহী",
        "coordinates": "24.3733, 88.6049"
    },
    {
        "district": "Sirajganj",
        "districtbn": "সিরাজগঞ্জ",
        "coordinates": "24.3141, 89.5700"
    },
    {
        "district": "Dinajpur",
        "districtbn": "দিনাজপুর",
        "coordinates": "25.6279, 88.6332"
    },
    {
        "district": "Gaibandha",
        "districtbn": "গাইবান্ধা",
        "coordinates": "25.3297, 89.5430"
    },
    {
        "district": "Kurigram",
        "districtbn": "কুড়িগ্রাম",
        "coordinates": "25.8072, 89.6295"
    },
    {
        "district": "Lalmonirhat",
        "districtbn": "লালমনিরহাট",
        "coordinates": "25.9923, 89.2847"
    },
    {
        "district": "Nilphamari",
        "districtbn": "নিলফামারী",
        "coordinates": "25.8483, 88.9414"
    },
    {
        "district": "Panchagarh",
        "districtbn": "পঞ্চগড়",
        "coordinates": "26.2709, 88.5952"
    },
    {
        "district": "Rangpur",
        "districtbn": "রংপুর",
        "coordinates": "25.7468, 89.2508"
    },
    {
        "district": "Thakurgaon",
        "districtbn": "ঠাকুরগাঁও",
        "coordinates": "26.0418, 88.4283"
    },
    {
        "district": "Habiganj",
        "districtbn": "হবিগঞ্জ",
        "coordinates": "24.4771, 91.4507"
    },
    {
        "district": "Moulvibazar",
        "districtbn": "মৌলভীবাজার",
        "coordinates": "24.3095, 91.7315"
    },
    {
        "district": "Sunamganj",
        "districtbn": "সুনামগঞ্জ",
        "coordinates": "25.0715, 91.3992"
    },
    {
        "district": "Sylhet",
        "districtbn": "সিলেট",
        "coordinates": "24.8993, 91.8700"
    }
];

async function loadDistricts() {
    const select = document.getElementById("deliverydistrict");
    if (!select) return;

    select.innerHTML =
        '<option value="">Select District</option>' +
        _ADDR_DISTRICTS.map(d => `<option value="${d.district}">${d.districtbn}</option>`).join("");
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
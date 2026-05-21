/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
    loadProfile();
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
   LOAD PROFILE
   (localStorage + backend ready fallback)
========================= */
async function loadProfile() {

    try {

        // 👉 FUTURE BACKEND HOOK (if you add API later)
        // const res = await fetch(`${API_BASE}/profile/`, {
        //     headers: {
        //         "Authorization": `Token ${getToken()}`
        //     }
        // });

        // const data = await res.json();

        // if (data.status) {
        //     fillProfile(data.data);
        //     return;
        // }

        // fallback localStorage
        const profile =
            JSON.parse(localStorage.getItem("pw_profile")) || {};

        fillProfile(profile);

    } catch (err) {

        console.error("PROFILE LOAD ERROR:", err);

        const profile =
            JSON.parse(localStorage.getItem("pw_profile")) || {};

        fillProfile(profile);
    }
}

/* =========================
   FILL UI
========================= */
function fillProfile(profile) {

    document.getElementById("profileFullName").value =
        profile.full_name || "";

    document.getElementById("profilePhone").value =
        profile.phone || "";

    document.getElementById("profileWhatsapp").value =
        profile.whatsapp || "";

    document.getElementById("profileEmail").value =
        profile.email || "";
}

/* =========================
   SAVE PROFILE
========================= */
function saveProfile() {

    const full_name =
        document.getElementById("profileFullName").value.trim();

    const phone =
        document.getElementById("profilePhone").value.trim();

    const whatsapp =
        document.getElementById("profileWhatsapp").value.trim();

    const email =
        document.getElementById("profileEmail").value.trim();

    if (!full_name) {
        toast("Enter full name");
        return;
    }

    if (!phone) {
        toast("Enter phone number");
        return;
    }

    const profile = {
        full_name,
        phone,
        whatsapp,
        email
    };

    localStorage.setItem(
        "pw_profile",
        JSON.stringify(profile)
    );

    toast("Profile updated ✅");

    // 👉 FUTURE BACKEND SAVE HOOK
    // fetch(`${API_BASE}/profile/update/`, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/json",
    //         "Authorization": `Token ${getToken()}`
    //     },
    //     body: JSON.stringify(profile)
    // });
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
/* =========================
   PHONE LOGIN FLOW STATE
========================= */
let LOGIN_FLOW_PHONE = "";
let LOGIN_FLOW_ACTION = ""; // "login" or "set_password"

/* =========================
   SAVE TOKENS
========================= */
function saveAuthData(data) {
    if (data.access) localStorage.setItem("access", data.access);
    if (data.refresh) localStorage.setItem("refresh", data.refresh);
}

/* =========================
   LOADER
========================= */
function showLoginLoader() {
    document.getElementById("loginLoader")?.style.setProperty("display", "flex");
}

function hideLoginLoader() {
    document.getElementById("loginLoader")?.style.setProperty("display", "none");
}

/* =========================
   STEP 1: SUBMIT PHONE
========================= */
async function submitPhoneStep() {

    const phone = document.getElementById("loginPhone")?.value.trim();

    if (!phone) {
        toast("Enter phone number");
        return;
    }

    showLoginLoader();

    try {
        const response = await fetch(`${API_BASE}/api/auth/phone-check/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone })
        });

        const data = await response.json();

        if (!response.ok || !data.status) {
            toast(data.message || "Something went wrong");
            return;
        }

        LOGIN_FLOW_PHONE = phone;
        LOGIN_FLOW_ACTION = data.action;

        document.getElementById("phoneStep").style.display = "none";
        document.getElementById("passwordStep").style.display = "flex";

        const label = document.getElementById("passwordStepLabel");
        const nameField = document.getElementById("setPasswordNameField");

        if (data.action === "set_password") {
            if (label) label.innerText = "Set a password for your account";
            if (nameField) nameField.style.display = "block";
        } else {
            if (label) label.innerText = "Enter your password";
            if (nameField) nameField.style.display = "none";
        }

        document.getElementById("loginPassword")?.focus();

    } catch (err) {
        console.error("PHONE CHECK ERROR:", err);
        toast("Something went wrong ❌");
    } finally {
        hideLoginLoader();
    }
}

/* =========================
   STEP 2: SUBMIT PASSWORD
========================= */
async function submitPasswordStep() {

    const password = document.getElementById("loginPassword")?.value.trim();

    if (!password) {
        toast("Enter password");
        return;
    }

    if (LOGIN_FLOW_ACTION === "set_password" && password.length < 6) {
        toast("Password must be at least 6 characters");
        return;
    }

    showLoginLoader();

    try {

        let url, payload;

        if (LOGIN_FLOW_ACTION === "set_password") {
            const name = document.getElementById("setPasswordName")?.value.trim() || "";
            url = `${API_BASE}/api/auth/set-password/`;
            payload = { phone: LOGIN_FLOW_PHONE, password, name };
        } else {
            url = `${API_BASE}/api/auth/phone-login/`;
            payload = { phone: LOGIN_FLOW_PHONE, password };
        }

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.status) {
            saveAuthData(data);
            toast(LOGIN_FLOW_ACTION === "set_password" ? "Account ready ✅" : "Welcome back ✅");
            setTimeout(() => {
                window.location.href = "profile.html";
            }, 700);
        } else {
            toast(data.message || "Login failed ❌");
        }

    } catch (err) {
        console.error("PASSWORD STEP ERROR:", err);
        toast("Something went wrong ❌");
    } finally {
        hideLoginLoader();
    }
}

/* =========================
   BACK TO PHONE STEP
========================= */
function backToPhoneStep() {
    document.getElementById("passwordStep").style.display = "none";
    document.getElementById("phoneStep").style.display = "flex";
    LOGIN_FLOW_PHONE = "";
    LOGIN_FLOW_ACTION = "";
    const pwField = document.getElementById("loginPassword");
    if (pwField) pwField.value = "";
    const nameField = document.getElementById("setPasswordName");
    if (nameField) nameField.value = "";
}

/* =========================
   REQUIRE LOGIN
========================= */
function requireLogin() {
    if (!isLoggedIn()) {
        toast("Please login first");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 700);
        return false;
    }
    return true;
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

/* =========================
   LOGIN REQUIRED POPUP
========================= */
function showLoginPopup() {
    const oldPopup = document.getElementById("loginRequiredPopup");
    if (oldPopup) oldPopup.remove();

    const popup = document.createElement("div");
    popup.id = "loginRequiredPopup";
    popup.innerHTML = `
        <div class="login-popup-overlay">
            <div class="login-popup-box">
                <div class="login-popup-icon">🔐</div>
                <h3>Login Required</h3>
                <p>Please login first to use this feature.</p>
                <div class="login-popup-actions">
                    <button class="popup-cancel-btn">Later</button>
                    <button class="popup-login-btn">Login Now</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
    popup.querySelector(".popup-cancel-btn").onclick = () => popup.remove();
    popup.querySelector(".popup-login-btn").onclick = () => {
        window.location.href = "login.html";
    };
}

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {

    const phoneInput = document.getElementById("loginPhone");
    const passwordInput = document.getElementById("loginPassword");

    phoneInput?.addEventListener("keypress", e => {
        if (e.key === "Enter") submitPhoneStep();
    });

    passwordInput?.addEventListener("keypress", e => {
        if (e.key === "Enter") submitPasswordStep();
    });
});
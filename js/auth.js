/* ========Auth js=================
   PHONE LOGIN FLOW STATE
========================= */
let LOGIN_FLOW_PHONE = "";
let LOGIN_FLOW_ACTION = ""; 
let RESET_FLOW_OTP = "";

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
        if (label) {
            label.textContent = LOGIN_FLOW_ACTION === "set_password"
                ? "Set Password"
                : "Enter Password";
        }

        const input = document.getElementById("loginPassword");
        if (input) {
            input.placeholder = LOGIN_FLOW_ACTION === "set_password"
                ? "Set your password"
                : "Enter your password";
        }

        document.getElementById("loginPassword")?.focus();

        const forgotBtn = document.getElementById("forgotPasswordBtn");
        if (forgotBtn) {
            forgotBtn.style.display = LOGIN_FLOW_ACTION === "login" ? "block" : "none";
        }

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
    const submitBtn = document.getElementById("submitPasswordBtn");
    if (submitBtn?.disabled) return;
    if (submitBtn) submitBtn.disabled = true;

    const password = document.getElementById("loginPassword")?.value.trim();

    if (!password) {
        toast("Enter password");
        if (submitBtn) submitBtn.disabled = false;
        return;
    }
    if (LOGIN_FLOW_ACTION === "set_password" && password.length < 6) {
        toast("Password must be at least 6 characters");
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    showLoginLoader();
    try {
        let url, payload;
        if (LOGIN_FLOW_ACTION === "set_password") {
            url = `${API_BASE}/api/auth/set-password/`;
            payload = { phone: LOGIN_FLOW_PHONE, password };
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

            // 🔥 MERGE GUEST CART/WISHLIST
            await mergeGuestDataToAccount(data.access);

            toast(LOGIN_FLOW_ACTION === "set_password" ? "Account ready ✅" : "Welcome back ✅");
            setTimeout(() => { window.location.href = "/profile"; }, 700);
        } else {
            toast(data.message || "Login failed ❌");
        }
    } catch (err) {
        console.error("PASSWORD STEP ERROR:", err);
        toast("Something went wrong ❌");
    } finally {
        hideLoginLoader();
        if (submitBtn) submitBtn.disabled = false;
    }
}

/* =========================
   MERGE GUEST CART/WISHLIST -> ACCOUNT
========================= */
async function mergeGuestDataToAccount(token) {
    const guestCart = typeof getGuestCart === "function" ? getGuestCart() : [];
    const guestWishlist = typeof getGuestWishlist === "function" ? getGuestWishlist() : [];

    if (!guestCart.length && !guestWishlist.length) return;

    try {
        const res = await fetch(`${API_BASE}/cart-wishlist/merge/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                cart: guestCart.map(i => ({
                    product_id: i.product_id,
                    variant_id: i.variant_id,
                    quantity: i.quantity
                })),
                wishlist: guestWishlist.map(i => ({
                    product_id: i.product_id,
                    variant_id: i.variant_id
                }))
            })
        });

        const data = await res.json();
        if (data.status) {
            // merge success -> guest data clear kore dao
            if (typeof clearGuestCart === "function") clearGuestCart();
            if (typeof clearGuestWishlist === "function") clearGuestWishlist();
        }
    } catch (err) {
        console.error("MERGE ERROR:", err);
        // fail hole guest data rekhe dao, next login attempt e abar try hobe
    }
}

/* =========================
   BACK TO PHONE STEP
========================= */
function backToPhoneStep() {
    document.getElementById("passwordStep").style.display = "none";
    document.getElementById("otpStep").style.display = "none";
    document.getElementById("newPasswordStep").style.display = "none";
    document.getElementById("phoneStep").style.display = "flex";
    LOGIN_FLOW_PHONE = "";
    LOGIN_FLOW_ACTION = "";
    RESET_FLOW_OTP = "";
    const pwField = document.getElementById("loginPassword");
    if (pwField) pwField.value = "";
    const nameField = document.getElementById("setPasswordName");
    if (nameField) nameField.value = "";
    const otpField = document.getElementById("resetOtp");
    if (otpField) otpField.value = "";
    const newPwField = document.getElementById("newPassword");
    if (newPwField) newPwField.value = "";
}

/* =========================
   FORGOT PASSWORD: STEP 3a — SEND OTP
========================= */
async function startForgotPassword() {
    if (!LOGIN_FLOW_PHONE) {
        toast("Something went wrong ❌");
        return;
    }

    showLoginLoader();
    try {
        const response = await fetch(`${API_BASE}/api/send-otp/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: LOGIN_FLOW_PHONE })
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            toast(data.message || "Could not send OTP");
            return;
        }

        toast("OTP sent to your phone ✅");
        document.getElementById("passwordStep").style.display = "none";
        document.getElementById("otpStep").style.display = "flex";
        document.getElementById("resetOtp")?.focus();

    } catch (err) {
        console.error("SEND OTP ERROR:", err);
        toast("Something went wrong ❌");
    } finally {
        hideLoginLoader();
    }
}

/* =========================
   FORGOT PASSWORD: RESEND OTP
========================= */
async function resendOtp() {
    await startForgotPassword();
}

/* =========================
   FORGOT PASSWORD: STEP 3b — VERIFY OTP
========================= */
async function submitOtpStep() {
    const submitBtn = document.getElementById("submitOtpBtn");
    if (submitBtn?.disabled) return;
    if (submitBtn) submitBtn.disabled = true;

    const otp = document.getElementById("resetOtp")?.value.trim();

    if (!otp || otp.length !== 6) {
        toast("Enter the 6-digit OTP");
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    showLoginLoader();
    try {
        const response = await fetch(`${API_BASE}/api/verify-otp/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: LOGIN_FLOW_PHONE, otp })
        });
        const data = await response.json();

        if (!response.ok || !data.verified) {
            toast(data.message || "Invalid or expired OTP ❌");
            return;
        }

        RESET_FLOW_OTP = otp;
        document.getElementById("otpStep").style.display = "none";
        document.getElementById("newPasswordStep").style.display = "flex";
        document.getElementById("newPassword")?.focus();

    } catch (err) {
        console.error("VERIFY OTP ERROR:", err);
        toast("Something went wrong ❌");
    } finally {
        hideLoginLoader();
        if (submitBtn) submitBtn.disabled = false;
    }
}

/* =========================
   FORGOT PASSWORD: STEP 3c — SET NEW PASSWORD
========================= */
async function submitResetPasswordStep() {
    const submitBtn = document.getElementById("submitNewPasswordBtn");
    if (submitBtn?.disabled) return;
    if (submitBtn) submitBtn.disabled = true;

    const password = document.getElementById("newPassword")?.value.trim();

    if (!password || password.length < 6) {
        toast("Password must be at least 6 characters");
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    showLoginLoader();
    try {
        const response = await fetch(`${API_BASE}/api/auth/reset-password/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                phone: LOGIN_FLOW_PHONE,
                otp: RESET_FLOW_OTP,
                password
            })
        });
        const data = await response.json();

        if (response.ok && data.status) {
            saveAuthData(data);
            await mergeGuestDataToAccount(data.access);

            toast("Password reset successful ✅");
            setTimeout(() => { window.location.href = "/profile"; }, 700);
        } else {
            toast(data.message || "Could not reset password ❌");
        }
    } catch (err) {
        console.error("RESET PASSWORD ERROR:", err);
        toast("Something went wrong ❌");
    } finally {
        hideLoginLoader();
        if (submitBtn) submitBtn.disabled = false;
    }
}

/* =========================
   REQUIRE LOGIN
========================= */
function requireLogin() {
    if (!isLoggedIn()) {
        toast("Please login first");
        setTimeout(() => {
            window.location.href = "/login";
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
   SHOW / HIDE PASS
========================= */
function togglePasswordVisibility() {
    const input = document.getElementById("loginPassword");
    const eyeOpen = document.getElementById("eyeOpen");
    const eyeClosed = document.getElementById("eyeClosed");
    if (!input) return;

    if (input.type === "password") {
        input.type = "text";
        eyeOpen.style.display = "none";
        eyeClosed.style.display = "block";
    } else {
        input.type = "password";
        eyeOpen.style.display = "block";
        eyeClosed.style.display = "none";
    }
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
        window.location.href = "/login";
    };
}

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {

    const phoneInput = document.getElementById("loginPhone");
    const passwordInput = document.getElementById("loginPassword");
    const otpInput = document.getElementById("resetOtp");
    const newPasswordInput = document.getElementById("newPassword");

    phoneInput?.addEventListener("keypress", e => {
        if (e.key === "Enter") submitPhoneStep();
    });

    passwordInput?.addEventListener("keypress", e => {
        if (e.key === "Enter") submitPasswordStep();
    });

    otpInput?.addEventListener("keypress", e => {
        if (e.key === "Enter") submitOtpStep();
    });

    newPasswordInput?.addEventListener("keypress", e => {
        if (e.key === "Enter") submitResetPasswordStep();
    });
});
function showOtpVerifyModal(options) {

    const {
        phone,
        message,
        apiBase,
        orderEndpoint,
        orderPayload,
        onSuccess
    } = options;

    document.getElementById("otpVerifyOverlay")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "otpVerifyOverlay";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0,0,0,0.6)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "999999";
    overlay.style.padding = "16px";

    const card = document.createElement("div");
    card.style.textAlign = "center";
    card.style.padding = "30px 22px";
    card.style.background = "#fff";
    card.style.borderRadius = "22px";
    card.style.boxShadow = "0 15px 40px rgba(0,0,0,0.15)";
    card.style.maxWidth = "380px";
    card.style.width = "100%";

    card.innerHTML = `
        <div style="font-size:44px;">⚠️</div>

        <h2 style="margin:8px 0;">নাম্বার ভেরিফিকেশন প্রয়োজন</h2>

        <p style="color:#555;font-size:14px;line-height:1.5;">
            ${message || "আপনার একাউন্ট ব্লক করা আছে। অর্ডার করতে হলে আগে OTP ভেরিফাই করুন।"}
        </p>

        <div style="background:#f5f5f5;border-radius:10px;padding:12px;font-weight:700;font-size:16px;color:#333;margin:14px 0 12px;">
            ${phone}
        </div>

        <button id="otpSendBtn" style="width:100%;padding:11px;border:none;border-radius:10px;background:#1c2b39;color:#fff;font-weight:600;cursor:pointer;margin-bottom:12px;">
            OTP পাঠান
        </button>

        <input type="text" id="otpCodeInput" placeholder="৬ ডিজিটের OTP লিখুন" maxlength="6" inputmode="numeric"
            style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #ddd;border-radius:10px;font-size:16px;text-align:center;letter-spacing:4px;display:none;margin-bottom:8px;">

        <div id="otpMsg" style="font-size:12.5px;min-height:16px;margin-bottom:10px;"></div>

        <button id="otpVerifyBtn" style="width:100%;padding:11px;border:none;border-radius:10px;background:#16a34a;color:#fff;font-weight:600;cursor:pointer;display:none;margin-bottom:10px;">
            ভেরিফাই করে অর্ডার করুন
        </button>

        <button id="otpCancelBtn" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:10px;background:#fff;color:#555;cursor:pointer;">
            বাতিল করুন
        </button>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    document.getElementById("otpCancelBtn").addEventListener("click", () => {
        overlay.remove();
    });

    document.getElementById("otpSendBtn").addEventListener("click", async function () {
        const sendBtn = this;
        const msgEl = document.getElementById("otpMsg");
        const codeInput = document.getElementById("otpCodeInput");
        const verifyBtn = document.getElementById("otpVerifyBtn");

        sendBtn.disabled = true;
        sendBtn.innerText = "পাঠানো হচ্ছে...";

        try {
            const res = await fetch(`${apiBase}/api/send-otp/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone })
            });
            const data = await res.json();

            if (data.success) {
                msgEl.textContent = "OTP পাঠানো হয়েছে, আপনার ফোন চেক করুন।";
                msgEl.style.color = "#16a34a";
                codeInput.style.display = "block";
                verifyBtn.style.display = "block";
                sendBtn.innerText = "আবার পাঠান";
                sendBtn.disabled = false;
            } else {
                msgEl.textContent = data.message || "OTP পাঠাতে সমস্যা হয়েছে।";
                msgEl.style.color = "#dc2626";
                sendBtn.innerText = "OTP পাঠান";
                sendBtn.disabled = false;
            }
        } catch (err) {
            msgEl.textContent = "সমস্যা হয়েছে, আবার চেষ্টা করুন।";
            msgEl.style.color = "#dc2626";
            sendBtn.innerText = "OTP পাঠান";
            sendBtn.disabled = false;
        }
    });

    document.getElementById("otpVerifyBtn").addEventListener("click", async function () {
        const verifyBtn = this;
        const msgEl = document.getElementById("otpMsg");
        const codeInput = document.getElementById("otpCodeInput");
        const code = codeInput.value.trim();

        if (!code || code.length < 4) {
            msgEl.textContent = "OTP লিখুন।";
            msgEl.style.color = "#dc2626";
            return;
        }

        verifyBtn.disabled = true;
        verifyBtn.innerText = "ভেরিফাই করা হচ্ছে...";

        const retryBody = { ...orderPayload, otp_code: code };

        const token = (typeof getAccessToken === "function") ? getAccessToken() : (localStorage.getItem("access") || "");
        const headers = { "Content-Type": "application/json", "Accept": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        try {
            const res = await fetch(`${apiBase}${orderEndpoint}`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(retryBody)
            });
            const data = await res.json();

            const ok = data.success !== undefined ? data.success : data.status;

            if (ok) {
                overlay.remove();
                if (typeof onSuccess === "function") {
                    onSuccess(data);
                }
            } else {
                msgEl.textContent = data.message || "OTP সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে।";
                msgEl.style.color = "#dc2626";
                verifyBtn.disabled = false;
                verifyBtn.innerText = "ভেরিফাই করে অর্ডার করুন";
            }
        } catch (err) {
            msgEl.textContent = "সমস্যা হয়েছে, আবার চেষ্টা করুন।";
            msgEl.style.color = "#dc2626";
            verifyBtn.disabled = false;
            verifyBtn.innerText = "ভেরিফাই করে অর্ডার করুন";
        }
    });
}

/* =========================================
   BLOCKED-CUSTOMER MESSAGE POPUP
========================================= */
function showBlockedMessageModal(message) {
    document.getElementById("blockedMsgOverlay")?.remove();

    const text = message || "আপনার অ্যাকাউন্ট ব্লক করা হয়েছে। অনুগ্রহ করে আমাদের সাইটে যোগাযোগ করুন।";
    const waNumber = (window.ENV && window.ENV.WHATSAPP_NUMBER) ? String(window.ENV.WHATSAPP_NUMBER) : "";

    const overlay = document.createElement("div");
    overlay.id = "blockedMsgOverlay";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:999999;padding:16px;";

    const card = document.createElement("div");
    card.style.cssText = "text-align:center;padding:30px 22px;background:#fff;border-radius:22px;box-shadow:0 15px 40px rgba(0,0,0,0.15);max-width:380px;width:100%;";

    card.innerHTML = `
        <div style="width:64px;height:64px;margin:0 auto 12px;border-radius:50%;background:#fee2e2;display:flex;align-items:center;justify-content:center;font-size:32px;">🚫</div>
        <h2 style="margin:6px 0 10px;font-size:20px;color:#1c2b39;">অর্ডার করা সম্ভব হচ্ছে না</h2>
        <p id="blockedMsgText" style="color:#555;font-size:14.5px;line-height:1.6;margin:0 0 20px;"></p>
        ${waNumber ? `<a href="https://wa.me/${waNumber}" target="_blank" rel="noopener"
            style="display:block;width:100%;box-sizing:border-box;padding:11px;border-radius:10px;background:#16a34a;color:#fff;font-weight:600;text-decoration:none;margin-bottom:10px;">
            WhatsApp-এ যোগাযোগ করুন
        </a>` : ""}
        <button id="blockedMsgCloseBtn" type="button"
            style="width:100%;padding:10px;border:1px solid #ddd;border-radius:10px;background:#fff;color:#555;cursor:pointer;">
            ঠিক আছে
        </button>
    `;

    // textContent keeps the server message safe from HTML injection
    card.querySelector("#blockedMsgText").textContent = text;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    card.querySelector("#blockedMsgCloseBtn").addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
}
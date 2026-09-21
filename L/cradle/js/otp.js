function isValidBDPhoneNew(phone) {
    return /^(?:\+88)?01\d{9}$/.test(phone.replace(/\s+/g, ""));
}

// Send OTP
document.getElementById("sendOtpBtn").addEventListener("click", async function () {
    const phone = document.getElementById("phone").value.trim();
    const sendOtpBtn = document.getElementById("sendOtpBtn"); 

    if (!isValidBDPhoneNew(phone)) {
        alert("সঠিক মোবাইল নম্বর দিন");
        return;
    }

    try {
        // Loading state
        sendOtpBtn.innerText = "Sending...";
        sendOtpBtn.disabled = true;

        // ===== REAL MODE: Comment out real API =====
        const res = await fetch(`${ENV.API_BASE_URL}/api/send-otp/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone })
        });
        let data;

        if (!res.ok) {
            try {
                data = await res.json();
            } catch {
                throw new Error(`Server error (${res.status})`);
            }
            throw new Error(data.message || "OTP send failed");
        }
        data = await res.json();

        // ===== TEST MODE: Mock OTP for testing =====
        // const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
        // console.log("Generated OTP (for testing):", mockOtp);
        // const data = { success: true, otp: mockOtp };

        if (data.success) {
            document.getElementById("otpSection").style.display = "block";
            sendOtpBtn.innerText = "Sent ✓";

            // Focus first OTP box
            const firstBox = document.querySelector(".otp-box");
            firstBox.focus();

            document.getElementById("otpMessage").innerText = "OTP পাঠানো হয়েছে";
            document.getElementById("otpMessage").style.color = "green";

            // Store OTP for auto verify testing
            // window.TEST_OTP = data.otp;
            onOtpSent();
        } else {
            throw new Error(data.message || "OTP failed");
        }

    } catch (err) {
        console.error(err);
    
        let message = "OTP পাঠাতে সমস্যা হয়েছে!";
    
        // Network error (highest priority)
        if (err?.message && err.message.includes("Failed to fetch")) {
            message = "ইন্টারনেট সংযোগ সমস্যা হয়েছে!";
        }
    
        // Server error
        else if (err.message && err.message.includes("Server error")) {
            message = "সার্ভার সমস্যা হয়েছে! পরে আবার চেষ্টা করুন।";
        }
    
        // Backend message (MOST IMPORTANT)
        else if (err.message && err.message !== "OTP send failed") {
            message = err.message;
        }
    
        // Unknown বড় error
        else if (err.message && err.message.length > 100) {
            message = "OTP সার্ভিসে সমস্যা হয়েছে!";
        }
    
        alert(message);
    
        sendOtpBtn.innerText = "OTP পাঠান";
        sendOtpBtn.disabled = false;
    }
});

// OTP Box Handling
const otpBoxes = document.querySelectorAll(".otp-box");
const otpAutoInput = document.getElementById("otpAuto");

function focusOtp() {
    otpBoxes[0].focus();
}

function setOtpToBoxes(otp) {
    otp.split("").forEach((digit, i) => {
        if (otpBoxes[i]) otpBoxes[i].value = digit;
    });
}

function setOtpDisabled(state) {
    otpBoxes.forEach(box => {
        box.disabled = state;
    });
}

// ============================
// AUTO OTP DETECT (Web OTP API)
async function startOtpListener() {
    if ('OTPCredential' in window) {
        try {
            const controller = new AbortController();

            const otp = await navigator.credentials.get({
                otp: { transport: ['sms'] },
                signal: controller.signal
            });

            if (otp && otp.code) {
                otpAutoInput.value = otp.code;

                setOtpToBoxes(otp.code);
                verifyOtp(otp.code);
            }

        } catch (err) {
            console.log("Auto OTP failed:", err);
        }
    }
}
// ============================

// ============================
// MANUAL INPUT HANDLING-------
otpBoxes.forEach((box, index) => {
    box.addEventListener("input", () => {
        box.value = box.value.replace(/[^0-9]/g, "");

        if (box.value.length === 1 && index < otpBoxes.length - 1) {
            otpBoxes[index + 1].focus();
        }

        // Auto verify if all boxes filled
        const otp = Array.from(otpBoxes).map(b => b.value).join("");
        if (otp.length === otpBoxes.length) {
            verifyOtp(otp);
        }
    });

    box.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !box.value && index > 0) {
            otpBoxes[index - 1].focus();
        }
    });
});
// ============================


// ============================
// VERIFY FUNCTION-------------
async function verifyOtp(otp) {
    const phone = document.getElementById("phone").value.trim();
    if (!otp || !phone) return;

    const messageEl = document.getElementById("otpMessage");

    // Disable inputs + show processing
    setOtpDisabled(true);
    messageEl.innerText = "Verify Process...";
    messageEl.style.color = "orange";

    try {
        // ===== REAL MODE: Comment out real API Verify =====
        const res = await fetch(`${ENV.API_BASE_URL}/api/verify-otp/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, otp })
        });
        const data = await res.json();

        // ===== TEST MODE: match with mock OTP =====
        // const data = { verified: otp === window.TEST_OTP };

        if (data.verified) {
            document.getElementById("sendOtpBtn").disabled = true;
            document.getElementById("otpSection").style.display = "none";
            document.getElementById("otpVerified").style.display = "block";
            document.getElementById("phone").readOnly = true;
            messageEl.innerText = "OTP Verified!";
            messageEl.style.color = "green";
        } else {
            // Wrong OTP + enable inputs again
            messageEl.innerText = "ভুল OTP";
            messageEl.style.color = "red";

            setOtpDisabled(false);

            // optional: clear all boxes
            otpBoxes.forEach(box => box.value = "");
            otpBoxes[0].focus();
        }
    } catch (err) {
        console.error(err);
        alert("OTP verify করতে সমস্যা হয়েছে!");
        setOtpDisabled(false);
    }
}
// ============================

// ============================
// INIT AFTER OTP SEND--------
function onOtpSent() {
    focusOtp();
    startOtpListener();
}
// ============================


// Reset OTP if phone changes
document.getElementById("phone").addEventListener("input", function () {
    document.getElementById("otpSection").style.display = "none";
    document.getElementById("otpVerified").style.display = "none";
    document.getElementById("otpMessage").innerText = "";
    otpBoxes.forEach(b => b.value = "");

    const sendOtpBtn = document.getElementById("sendOtpBtn");
    sendOtpBtn.innerText = "OTP পাঠান";
    sendOtpBtn.disabled = false;
});


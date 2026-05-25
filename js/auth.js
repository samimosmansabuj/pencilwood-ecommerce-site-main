/* =========================
   AUTH TAB SWITCH
========================= */
function switchAuth(type) {

    const loginForm =
        document.getElementById("loginForm");

    const signupForm =
        document.getElementById("signupForm");

    const tabs =
        document.querySelectorAll(".tab");

    tabs.forEach(tab => {
        tab.classList.remove("on");
    });

    if (type === "login") {

        tabs[0].classList.add("on");

        loginForm.style.display =
            "flex";

        signupForm.style.display =
            "none";

    } else {

        tabs[1].classList.add("on");

        loginForm.style.display =
            "none";

        signupForm.style.display =
            "flex";
    }
}

/* =========================
   SAVE TOKENS
========================= */
function saveAuthData(data) {

    if (data.access) {

        localStorage.setItem(
            "access",
            data.access
        );
    }

    if (data.refresh) {

        localStorage.setItem(
            "refresh",
            data.refresh
        );
    }
}

/* =========================
   SIGNUP
========================= */
async function signupUser() {

    const name =
        document.getElementById("signupName")
        ?.value
        .trim();

    const phone =
        document.getElementById("signupPhone")
        ?.value
        .trim();

    const email =
        document.getElementById("signupEmail")
        ?.value
        .trim();

    const password =
        document.getElementById("signupPassword")
        ?.value
        .trim();

    if (!name) {
        toast("Enter full name");
        return;
    }

    if (!phone) {
        toast("Enter phone number");
        return;
    }

    if (!email) {
        toast("Enter email");
        return;
    }

    if (!password) {
        toast("Enter password");
        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/api/auth/register/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password,
                        username: phone,
                        name,
                        phone,
                        whatsapp: phone
                    })
                }
            );

        const data =
            await response.json();

        console.log(
            "SIGNUP:",
            data
        );

        if (
            response.ok &&
            data.status
        ) {

            saveAuthData(data);

            toast(
                "Account created successfully ✅"
            );

            setTimeout(() => {

                window.location.href =
                    "profile.html";

            }, 1000);

        } else {

            toast(
                data.message ||
                "Signup failed ❌"
            );
        }

    } catch (err) {

        console.error(
            "SIGNUP ERROR:",
            err
        );

        toast(
            "Signup failed ❌"
        );
    }
}

/* =========================
   LOGIN
========================= */
async function loginUser() {

    const email =
        document.getElementById("loginPhone")
        ?.value
        .trim();

    const password =
        document.getElementById("loginPassword")
        ?.value
        .trim();

    if (!email) {
        toast("Enter email");
        return;
    }

    if (!password) {
        toast("Enter password");
        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/api/auth/login/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

        const data =
            await response.json();

        console.log(
            "LOGIN:",
            data
        );

        if (
            response.ok &&
            data.status
        ) {

            saveAuthData(data);

            toast(
                "Login successful ✅"
            );

            setTimeout(() => {

                window.location.href =
                    "profile.html";

            }, 1000);

        } else {

            toast(
                data.message ||
                "Invalid credentials ❌"
            );
        }

    } catch (err) {

        console.error(
            "LOGIN ERROR:",
            err
        );

        toast(
            "Login failed ❌"
        );
    }
}

/* =========================
   REQUIRE LOGIN
========================= */
function requireLogin() {

    if (!isLoggedIn()) {

        toast(
            "Please login first"
        );

        setTimeout(() => {

            window.location.href =
                "login.html";

        }, 700);

        return false;
    }

    return true;
}

/* =========================
   TOAST
========================= */
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

    el.className =
        "toast";

    el.innerText =
        msg;

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

window.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "AUTH READY"
        );
    }
);
/* =========================
   API BASE
========================= */
window.API_BASE = "http://127.0.0.1:8000";

/* =========================
   TOKEN HELPERS
========================= */
function getAccessToken() {
    return localStorage.getItem("access") || "";
}

function getRefreshToken() {
    return localStorage.getItem("refresh") || "";
}

function isLoggedIn() {
    return !!getAccessToken();
}

/* =========================
   AUTH HEADERS
========================= */
function getAuthHeaders() {

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAccessToken()}`
    };
}

/* =========================
   LOGOUT
========================= */
async function logoutUser() {

    try {

        const refresh =
            getRefreshToken();

        if (refresh) {

            await fetch(
                `${API_BASE}/api/auth/logout/`,
                {
                    method: "POST",

                    headers: getAuthHeaders(),

                    body: JSON.stringify({
                        refresh
                    })
                }
            );
        }

    } catch (err) {

        console.error(
            "Logout Error:",
            err
        );
    }

    /* CLEAR STORAGE */
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    window.location.href =
        "login.html";
}
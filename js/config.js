/* ==========Config js===============
   TOKEN HELPERS  */
   function getAccessToken() {
    return localStorage.getItem("access") || "";
}

function getRefreshToken() {
    return localStorage.getItem("refresh") || "";
}

function isLoggedIn() {
    return !!getAccessToken();
}
// =========================v

/* =========================
   AUTH HEADERS */
function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAccessToken()}`
    };
}
// =========================


/* =========================
   LOGOUT */
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
    localStorage.removeItem("pwbd_visitor_id");

    window.location.href = "/login";
}
// =========================

/* =========================
   CAMPAIGN + POPUP API PATHS (the single place to change them; API_BASE comes from env.js)
========================= */
window.CAMPAIGN_API_PATH = "/api/ecom/campaigns/";   // list: GET <path>   detail: GET <path><slug>/   (CAMPAIGN_API_CONTRACT.md)
window.POPUP_API_PATH = "/site/api/popup/";          // GET -> { status, server_now, data } ; data is null when nothing is eligible


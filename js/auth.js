/* =========================
   AUTH TAB SWITCH
========================= */
function switchAuth(type) {

    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('on');
    });

    if (type === 'login') {

        document.querySelectorAll('.tab')[0].classList.add('on');

        loginForm.style.display = 'flex';
        signupForm.style.display = 'none';

    } else {

        document.querySelectorAll('.tab')[1].classList.add('on');

        loginForm.style.display = 'none';
        signupForm.style.display = 'flex';
    }
}

/* =========================
   SIGNUP
========================= */
async function signupUser() {

    const full_name = document.getElementById('signupName')?.value.trim();
    const phone = document.getElementById('signupPhone')?.value.trim();
    const email = document.getElementById('signupEmail')?.value.trim();
    const password = document.getElementById('signupPassword')?.value.trim();

    if (!full_name || !phone || !password) {
        toast('সব required field fill korun');
        return;
    }

    try {

        const response = await fetch(`${API_BASE}/api/auth/register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                full_name,
                phone,
                email,
                password
            })
        });

        const data = await response.json();

        console.log('SIGNUP:', data);

        if (
            response.ok ||
            data.status === true ||
            data.success === true
        ) {

            toast('Account created successfully ✅');

            if (data.token) {
                localStorage.setItem('token', data.token);
            }

            if (data.access) {
                localStorage.setItem('access', data.access);
            }

            if (data.refresh) {
                localStorage.setItem('refresh', data.refresh);
            }

            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1000);

        } else {

            toast(
                data.message ||
                data.error ||
                'Signup failed ❌'
            );
        }

    } catch (err) {

        console.error(err);
        toast('Server error ❌');
    }
}

/* =========================
   LOGIN
========================= */
async function loginUser() {

    const phone = document.getElementById('loginPhone')?.value.trim();
    const password = document.getElementById('loginPassword')?.value.trim();

    if (!phone || !password) {
        toast('Phone & password required');
        return;
    }

    try {

        const response = await fetch(`${API_BASE}/api/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone,
                password
            })
        });

        const data = await response.json();

        console.log('LOGIN:', data);

        if (
            response.ok ||
            data.status === true ||
            data.success === true
        ) {

            toast('Login successful ✅');

            if (data.token) {
                localStorage.setItem('token', data.token);
            }

            if (data.access) {
                localStorage.setItem('access', data.access);
            }

            if (data.refresh) {
                localStorage.setItem('refresh', data.refresh);
            }

            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1000);

        } else {

            toast(
                data.message ||
                data.error ||
                'Invalid credentials ❌'
            );
        }

    } catch (err) {

        console.error(err);
        toast('Login failed ❌');
    }
}

/* =========================
   LOGOUT
========================= */
function logoutUser() {

    localStorage.removeItem('token');
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');

    toast('Logged out');

    setTimeout(() => {
        window.location.href = 'login.html';
    }, 700);
}

/* =========================
   CHECK LOGIN
========================= */
function isLoggedIn() {

    return !!(
        localStorage.getItem('token') ||
        localStorage.getItem('access')
    );
}
/* =========================
   AUTO REDIRECT
========================= */
window.addEventListener('DOMContentLoaded', () => {

    if (
        window.location.pathname.includes('login.html') &&
        isLoggedIn()
    ) {
        console.log('Already logged in');
    }
});

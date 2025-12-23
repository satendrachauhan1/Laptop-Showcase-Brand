// Cart functionality moved to `cart.js` for a cleaner UI logic separation.


// --- Auth Tabs and Forms Logic ---
document.addEventListener("DOMContentLoaded", function() {
    const loginTab = document.getElementById("loginTab");
    const registerTab = document.getElementById("registerTab");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    // Tab switching
    loginTab.addEventListener("click", function() {
        loginTab.classList.add("active");
        registerTab.classList.remove("active");
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
    });

    registerTab.addEventListener("click", function() {
        registerTab.classList.add("active");
        loginTab.classList.remove("active");
        registerForm.classList.remove("hidden");
        loginForm.classList.add("hidden");
    });

    // Real form submission handlers (calls backend)
    const API_BASE = window.API_BASE || 'http://localhost:5000';

    function showFieldError(spanId, msg) {
        const el = document.getElementById(spanId);
        if (el) el.innerText = msg || '';
    }

    function clearAllErrors() {
        ['loginEmailError','loginPasswordError','regNameError','regEmailError','regPasswordError'].forEach(id => showFieldError(id, ''));
    }

    async function submitLogin(e) {
        e.preventDefault();
        clearAllErrors();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        let hasError = false;
        if (!email) { showFieldError('loginEmailError', 'Email is required'); hasError = true; }
        if (!password) { showFieldError('loginPasswordError', 'Password is required'); hasError = true; }
        if (hasError) return;

        const btn = loginForm.querySelector('button[type="submit"]');
        const original = btn.innerText;
        btn.disabled = true; btn.innerText = 'Signing in...';

        try {
            const res = await fetch(API_BASE + '/api/auth/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) {
                // show returned message as general error
                if (res.status === 400) {
                    showFieldError('loginEmailError', data.message || 'Invalid input');
                } else if (res.status === 401) {
                    showFieldError('loginPasswordError', data.message || 'Invalid credentials');
                } else {
                    alert(data.message || 'Login failed');
                }
                return;
            }

            // success: store token and redirect
            if (data.token) {
                localStorage.setItem('authToken', data.token);
            }
            if (data.user) localStorage.setItem('authUser', JSON.stringify(data.user));
            // redirect to main page
            window.location.href = 'code.html';
        } catch (err) {
            console.error(err);
            alert('Unable to reach server');
        } finally {
            btn.disabled = false; btn.innerText = original;
        }
    }

    async function submitRegister(e) {
        e.preventDefault();
        clearAllErrors();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        let hasError = false;
        if (!name) { showFieldError('regNameError', 'Name is required'); hasError = true; }
        if (!email) { showFieldError('regEmailError', 'Email is required'); hasError = true; }
        if (!password || password.length < 6) { showFieldError('regPasswordError', 'Password must be at least 6 characters'); hasError = true; }
        if (hasError) return;

        const btn = registerForm.querySelector('button[type="submit"]');
        const original = btn.innerText;
        btn.disabled = true; btn.innerText = 'Creating...';

        try {
            const res = await fetch(API_BASE + '/api/auth/register', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 409) {
                    showFieldError('regEmailError', data.message || 'User already exists');
                } else {
                    alert(data.message || 'Registration failed');
                }
                return;
            }

            // on success, switch to login tab and prefill email
            alert(data.message || 'You have successfully registered');
            document.getElementById('loginEmail').value = email;
            // switch to login tab and focus password
            registerTab.classList.remove('active');
            loginTab.classList.add('active');
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            // focus password for quick login
            setTimeout(() => {
                const pw = document.getElementById('loginPassword');
                if (pw) pw.focus();
            }, 50);
        } catch (err) {
            console.error(err);
            alert('Unable to reach server');
        } finally {
            btn.disabled = false; btn.innerText = original;
        }
    }

    loginForm.addEventListener('submit', submitLogin);
    registerForm.addEventListener('submit', submitRegister);
});

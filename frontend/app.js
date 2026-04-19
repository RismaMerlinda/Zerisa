const API_URL = 'http://localhost:3000';

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const alertMessage = document.getElementById('alertMessage');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;
        const kebutuhan = document.getElementById('kebutuhan').value;

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password, role, kebutuhan })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Pendaftaran berhasil! Silakan login.');
                window.location.href = 'login.html';
            } else {
                alertMessage.textContent = data.error || 'Gagal mendaftar';
            }
        } catch (error) {
            console.error('Error:', error);
            alertMessage.textContent = 'Terjadi kesalahan pada server. Coba lagi nanti.';
        }
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Simpan user ke localStorage
                localStorage.setItem('zerisa_user', JSON.stringify(data.user));
                
                // Redirect user based on role
                if (data.user.role === 'guru') {
                    window.location.href = 'teacher-dashboard.html';
                } else if (data.user.role === 'orang tua' || data.user.role === 'orang_tua' || data.user.role === 'orangtua') {
                    window.location.href = 'parent-dashboard.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            } else {
                alertMessage.textContent = data.error || 'Email atau password salah';
            }
        } catch (error) {
            console.error('Error:', error);
            alertMessage.textContent = 'Terjadi kesalahan pada server. Coba lagi nanti.';
        }
    });
}

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
    const userDataStr = localStorage.getItem('zerisa_user');
    // Prevent redirect loop
    if (userDataStr && (window.location.pathname.includes('login.html') || window.location.pathname.includes('index.html') || window.location.pathname === '/')) {
        const user = JSON.parse(userDataStr);
        if (user.role === 'guru') {
            window.location.href = 'teacher-dashboard.html';
        } else if (user.role === 'orang tua' || user.role === 'orang_tua' || user.role === 'orangtua') {
            window.location.href = 'parent-dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }
});

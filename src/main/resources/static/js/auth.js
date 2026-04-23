/** * --- WILLOWTON AUTHENTICATION LOGIC --- 
 * Handles login submission and department-based routing.
 **/

// THE FIX: Check if we are actually on the login page before adding the listener
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('loginBtn');
        const errorBox = document.getElementById('login-error');
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
        if (errorBox) errorBox.style.display = 'none';

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const user = await response.json();
                localStorage.setItem("currentUser", JSON.stringify(user));
                
                // Redirect logic based on Role IDs
                switch(user.roleId) {
                    case 1: window.location.href = "admin_dashboard.html"; break;
                    case 2: window.location.href = "procurement_dashboard.html"; break;
                    case 3: window.location.href = "manager_dashboard.html"; break;
                    case 4: window.location.href = "warehouse_dashboard.html"; break;
                    default:
                        alert("Account error. Contact IT Admin.");
                        window.location.href = "login.html";
                        break;
                }
            } else {
                if (errorBox) {
                    errorBox.style.display = 'block';
                    errorBox.innerText = "Invalid credentials.";
                }
                btn.disabled = false;
                btn.innerText = "Access System";
            }
        } catch (err) {
            console.error("Login Error:", err);
            alert("The Willowton Cloud is waking up. Please try again in 60 seconds.");
            btn.disabled = false;
            btn.innerText = "Access System";
        }
    });
}
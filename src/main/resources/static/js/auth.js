/** * --- WILLOWTON AUTHENTICATION LOGIC --- 
 * Handles login submission and department-based routing.
 * Dependency: config.js must be loaded first.
 **/

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('loginBtn');
    const errorBox = document.getElementById('login-error');
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // UI Feedback: Start authentication
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
    errorBox.style.display = 'none';

    try {
        // Now using API_BASE_URL from config.js which includes /api
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const user = await response.json();
            
            // Save the full user object to Session
            localStorage.setItem("currentUser", JSON.stringify(user));
            
            /**
             * REDIRECT LOGIC MAPPED TO DATABASE ROLES:
             * 1 = Admin (Mwape IT Admin)
             * 2 = Procurement Officer (M. Kabamba)
             * 3 = Finance Manager (John Phiri)
             * 4 = Warehouse Supervisor (Sarah Banda)
             */
            switch(user.roleId) {
                case 1:
                    window.location.href = "admin_dashboard.html"; 
                    break;
                case 2:
                    window.location.href = "procurement_dashboard.html";
                    break;
                case 3:
                    window.location.href = "manager_dashboard.html";
                    break;
                case 4:
                    window.location.href = "warehouse_dashboard.html";
                    break;
                default:
                    alert("Account configuration error. Please contact the IT Admin.");
                    window.location.href = "login.html";
                    break;
            }
        
        } else {
            // Likely wrong credentials or user not found
            errorBox.style.display = 'block';
            errorBox.innerText = "Invalid credentials. Please verify your username and password.";
            btn.disabled = false;
            btn.innerText = "Access System";
        }
    } catch (err) {
        console.error("Login Error:", err);
        
        // Handle Render's Free Tier "Cold Start"
        alert("The Willowton Cloud is currently waking up. This usually takes about 60 seconds after a period of inactivity. Please try again shortly.");
        
        btn.disabled = false;
        btn.innerText = "Access System";
    }
});
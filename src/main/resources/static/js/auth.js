document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('loginBtn');
    const errorBox = document.getElementById('login-error');
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    btn.disabled = true;
    btn.innerText = "Authenticating...";
    errorBox.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

     if (response.ok) {
            const user = await response.json();
            
            // Save the full user object (including roleId and fullName)
            localStorage.setItem("currentUser", JSON.stringify(user));
            
            // REDIRECT LOGIC MAPPED TO DATABASE: 1=Admin, 2=Proc, 3=Finance, 4=Whouse
            if (user.roleId === 1) {
                // Admin (Mwape)
                window.location.href = "admin_dashboard.html"; 
            } else if (user.roleId === 2) {
                // Procurement Officer (Kabamba)
                window.location.href = "procurement_dashboard.html";
            } else if (user.roleId === 3) {
                // Finance Manager (John Phiri)
                window.location.href = "manager_dashboard.html";
            } else if (user.roleId === 4) {
                // Warehouse Manager (Sarah Banda)
                window.location.href = "warehouse_dashboard.html";
            } else {
                // Default fallback
                window.location.href = "login.html";
                alert("Account configuration error. Please contact IT.");
            }
        
        } else {
            errorBox.style.display = 'block';
            btn.disabled = false;
            btn.innerText = "Access System";
        }
    } catch (err) {
        console.error("Login Error:", err);
        alert("Server connection failed. Check if Spring Boot is running.");
        btn.disabled = false;
        btn.innerText = "Access System";
    }
});
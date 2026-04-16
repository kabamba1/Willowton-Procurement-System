/** * --- WILLOWTON AUTHENTICATION & SESSION MANAGEMENT --- 
 * Note: config.js must be loaded BEFORE this file in your HTML.
 **/

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    displayUserContext(); 
});

/**
 * 1. SESSION GUARD (RBAC)
 */
function checkSession() {
    const userJson = localStorage.getItem('currentUser');
    const path = window.location.pathname;

    // Lockdown: No session and NOT on login page? Redirect.
    if (!userJson && !path.includes('login.html')) {
        window.location.href = 'login.html';
        return;
    }

    if (userJson) {
        const user = JSON.parse(userJson);
        const rid = user.roleId;

        // Ensure users stay in their authorized dashboard
        if (path.includes('admin_dashboard.html') && rid !== 1) denyAccess(rid);
        if (path.includes('procurement_dashboard.html') && rid !== 2) denyAccess(rid);
        if (path.includes('manager_dashboard.html') && rid !== 3) denyAccess(rid);
        if (path.includes('warehouse_dashboard.html') && rid !== 4) denyAccess(rid);
    }
}

/**
 * 2. REDIRECT LOGIC
 */
function denyAccess(roleId) {
    alert("Access Denied: Unauthorized department access.");
    redirectUserByRole(roleId);
}

function redirectUserByRole(roleId) {
    const routes = {
        1: 'admin_dashboard.html',
        2: 'procurement_dashboard.html',
        3: 'manager_dashboard.html',
        4: 'warehouse_dashboard.html'
    };
    window.location.href = routes[roleId] || 'login.html';
}

/**
 * 3. UI CONTEXT (Header display)
 */
function displayUserContext() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) return;

    const user = JSON.parse(userJson);
    const nameDisplay = document.getElementById('user-display-name');
    const roleDisplay = document.getElementById('user-role-label');

    if (nameDisplay) {
        nameDisplay.innerHTML = `<i class="fas fa-user-shield"></i> ${user.fullName}`;
    }

    if (roleDisplay) {
        const roles = {
            1: 'System Admin',
            2: 'Procurement Officer',
            3: 'Finance Manager',
            4: 'Warehouse Supervisor'
        };
        roleDisplay.innerText = roles[user.roleId] || 'Staff Member';
    }
}

// Global Logout
function logout() {
    if (confirm("Log out of Willowton PMS?")) {
        localStorage.clear();
        window.location.href = 'login.html';
    }
}
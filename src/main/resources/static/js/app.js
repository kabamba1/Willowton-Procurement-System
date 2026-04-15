/** --- WILLOWTON AUTHENTICATION & SESSION MANAGEMENT --- **/

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    displayUserContext(); 
});

function checkSession() {
    const userJson = localStorage.getItem('currentUser');
    const path = window.location.pathname;

    // 1. Lockdown: If no session and NOT on login page -> Send to Login
    if (!userJson && !path.includes('login.html')) {
        window.location.href = 'login.html';
        return;
    }

    if (userJson) {
        const user = JSON.parse(userJson);
        
        // 2. Role-Based Access Control (RBAC)
        if (path.includes('manager_dashboard.html') && user.roleId !== 3) {
            denyAccess(user.roleId);
        }

        if (path.includes('procurement_dashboard.html') && user.roleId !== 2) {
             denyAccess(user.roleId);
        }

        if (path.includes('admin_dashboard.html') && user.roleId !== 1) {
             denyAccess(user.roleId);
        }

        // 3. Protect Warehouse Page (Role 4)
        if (path.includes('warehouse_dashboard.html') && user.roleId !== 4) {
             denyAccess(user.roleId);
        }
    }
}

function denyAccess(roleId) {
    alert("Access Denied: You do not have permission to view this department.");
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

function displayUserContext() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) return;

    const user = JSON.parse(userJson);
    const nameDisplay = document.getElementById('user-display-name');
    const roleDisplay = document.getElementById('user-role-label');

    // Update Name
    if (nameDisplay) {
        nameDisplay.innerHTML = `<i class="fas fa-user-shield"></i> ${user.fullName}`;
    }

    // Update Role Badge (Mapped to your Database role_name)
    if (roleDisplay) {
        const roles = {
            1: 'System Admin',
            2: 'Procurement Officer',
            3: 'Finance Manager',
            4: 'Warehouse Supervisor'
        };
        roleDisplay.innerText = roles[user.roleId] || 'Staff';
    }
}

// Global Currency Formatter for ZMW
const formatZMW = (amount) => {
    return new Intl.NumberFormat('en-ZM', {
        style: 'currency',
        currency: 'ZMW'
    }).format(amount);
};

function logout() {
    if (confirm("Log out of Willowton PMS?")) {
        localStorage.clear();
        window.location.href = 'login.html';
    }
}
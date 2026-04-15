/**
 * WILLOWTON PMS - WAREHOUSE SUPPLIER VIEW (READ-ONLY)
 */

document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile(); // Sets the Sarah Banda header
    fetchSuppliers();  // Loads the table data
});

/** --- 1. IDENTITY LOGIC --- **/
function loadUserProfile() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) return;

    const user = JSON.parse(userJson);
    const nameDisplay = document.getElementById('user-display-name');
    const roleDisplay = document.getElementById('user-role-label');

    if (nameDisplay && user.fullName) {
        nameDisplay.innerHTML = `<i class="fas fa-user-shield"></i> ${user.fullName}`;
    }

    if (roleDisplay && user.roleId) {
        const roles = { 1: 'System Admin', 4: 'Warehouse Supervisor' };
        roleDisplay.innerText = roles[user.roleId] || 'Warehouse Staff';
    }
}

/** --- 2. DATA LOGIC --- **/
async function fetchSuppliers() {
    const tableBody = document.getElementById('supplier-table-body');
    
    try {
        const res = await fetch(`${API_BASE}/suppliers`);
        if (!res.ok) throw new Error("Connection failed");
        
        const suppliers = await res.json();
        tableBody.innerHTML = ''; // Clear the spinner

        if (suppliers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No active suppliers found.</td></tr>';
            return;
        }

        tableBody.innerHTML = suppliers.map(sup => `
            <tr>
                <td>
                    <div style="font-weight:700; color:var(--primary);">${sup.supplierName}</div>
                    <small style="color:var(--text-muted)">Code: ${sup.supplierCode || 'VND-' + sup.id}</small>
                </td>
                <td><span class="category-pill">${sup.category || 'General'}</span></td>
                <td>${sup.contactPerson}</td>
                <td>
                    <a href="tel:${sup.phone}" style="color: var(--primary); text-decoration: none; font-weight:600;">
                        <i class="fas fa-phone-alt" style="font-size: 0.75rem; color: var(--success);"></i> ${sup.phone}
                    </a>
                </td>
                <td><small style="color: var(--text-muted);">${sup.email}</small></td>
                <td><span class="status-pill status-approved">VERIFIED</span></td>
            </tr>
        `).join('');

    } catch (err) {
        console.error("Supplier Load Error:", err);
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--danger); padding:20px;">
            <i class="fas fa-exclamation-triangle"></i> Error connecting to Supplier Registry.
        </td></tr>`;
    }
}

/** --- 3. SEARCH LOGIC --- **/
function filterSuppliers() {
    const query = document.getElementById('supSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#supplier-table-body tr');
    
    rows.forEach(row => {
        const content = row.innerText.toLowerCase();
        row.style.display = content.includes(query) ? '' : 'none';
    });
}

function logout() {
    if (confirm("Logout from Willowton PMS?")) {
        localStorage.clear();
        window.location.href = 'login.html';
    }
}
/** * --- WILLOWTON WAREHOUSE: SUPPLIER DIRECTORY --- 
 * Read-only access for logistics coordination.
 **/

document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile(); // Now handles both Name and Role
    fetchSuppliers();  
    
    const searchInput = document.getElementById('supSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterSuppliers);
    }
});

/** --- 1. USER IDENTITY & SESSION --- **/
function loadUserProfile() {
    const userJson = localStorage.getItem('currentUser');
    
    // Redirect if session is missing
    if (!userJson) {
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userJson);
    
    // 1. Update Name Display
    const nameDisplay = document.getElementById('user-display-name');
    if (nameDisplay) {
        nameDisplay.innerHTML = `<i class="fas fa-user-circle me-1"></i> ${user.fullName || "Unknown User"}`;
    }

    // 2. Update Role Label (The "Role" placeholder fix)
    const roleDisplay = document.getElementById('user-role-label');
    if (roleDisplay) {
        const roleMap = {
            1: "System Admin",
            2: "Finance Manager",
            3: "Procurement Officer",
            4: "Warehouse Supervisor"
        };
        // Get the role ID from the database record
        const rid = user.roleId || (user.role ? (user.role.roleId || user.role) : null);
        roleDisplay.innerText = roleMap[rid] || "Staff Member";
    }
}

/** --- 2. DATA RENDERING --- **/
async function fetchSuppliers() {
    const tableBody = document.getElementById('supplier-table-body');
    if (!tableBody) return;
    
    try {
        const res = await fetch(`${API_BASE_URL}/suppliers`); 
        if (!res.ok) throw new Error("Registry Unreachable");
        
        const suppliers = await res.json();
        tableBody.innerHTML = ''; 

        if (suppliers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4">No verified suppliers found.</td></tr>';
            return;
        }

        tableBody.innerHTML = suppliers.map(sup => `
            <tr>
                <td>
                    <div class="fw-bold text-primary">${sup.companyName || sup.supplierName}</div>
                    <div class="text-muted" style="font-size: 0.75rem;">TPIN: ${sup.taxId || sup.tpin || 'N/A'}</div>
                </td>
                <td><span class="category-pill">${sup.category || 'General'}</span></td>
                <td>${sup.contactPerson || 'N/A'}</td>
                <td>
                    <a href="tel:${sup.phoneNumber}" class="contact-link" style="text-decoration: none;">
                        <i class="fas fa-phone-alt me-1 text-success"></i> ${sup.phoneNumber || 'N/A'}
                    </a>
                </td>
                <td><small class="text-muted">${sup.contactEmail || sup.email}</small></td>
                <td><span class="status-pill status-active"><i class="fas fa-check-shield me-1"></i> VERIFIED</span></td>
            </tr>
        `).join('');

    } catch (err) {
        console.error("Supplier Load Error:", err);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger p-4">Registry Offline.</td></tr>`;
    }
}

/** --- 3. UTILITIES --- **/
function filterSuppliers() {
    const query = document.getElementById('supSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#supplier-table-body tr');
    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(query) ? '' : 'none';
    });
}
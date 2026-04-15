/** * --- WILLOWTON WAREHOUSE: SUPPLIER DIRECTORY --- 
 * Purpose: Read-only access for logistics and delivery coordination.
 * Features: Click-to-call mobile integration and live registry search.
 **/

const API_BASE = "https://willowton-pms.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile(); 
    fetchSuppliers();  
    
    // Attach Live Filter
    const searchInput = document.getElementById('supSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterSuppliers);
    }
});

/**
 * 1. IDENTITY & ACCESS CONTEXT
 */
function loadUserProfile() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) return;

    try {
        const user = JSON.parse(userJson);
        const nameDisplay = document.getElementById('user-display-name');
        const roleDisplay = document.getElementById('user-role-label');

        if (nameDisplay && user.fullName) {
            nameDisplay.innerHTML = `<i class="fas fa-user-circle"></i> ${user.fullName}`;
        }

        if (roleDisplay) {
            // Standardizing roles across the PMS ecosystem
            const roles = { 
                1: 'System Admin', 
                2: 'Finance Manager',
                3: 'Procurement Officer',
                4: 'Warehouse Supervisor' 
            };
            roleDisplay.innerText = roles[user.roleId] || 'Warehouse Operations';
        }
    } catch (e) {
        console.error("Session sync failed.");
    }
}

/**
 * 2. DATA RETRIEVAL (READ-ONLY)
 */
async function fetchSuppliers() {
    const tableBody = document.getElementById('supplier-table-body');
    if (!tableBody) return;
    
    try {
        const res = await fetch(`${API_BASE}/suppliers`);
        if (!res.ok) throw new Error("Cloud Registry Unreachable");
        
        const suppliers = await res.json();
        tableBody.innerHTML = ''; 

        if (suppliers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4">No verified suppliers found.</td></tr>';
            return;
        }

        tableBody.innerHTML = suppliers.map(sup => {
            const category = sup.category || 'General';
            const catSlug = category.toLowerCase().replace(/\s+/g, '-');
            
            return `
                <tr>
                    <td>
                        <div class="fw-bold text-primary">${sup.companyName}</div>
                        <div class="text-muted" style="font-size: 0.75rem;">TPIN: ${sup.taxId}</div>
                    </td>
                    <td><span class="category-pill cat-${catSlug}">${category}</span></td>
                    <td><span class="text-dark">${sup.contactPerson || 'N/A'}</span></td>
                    <td>
                        <a href="tel:${sup.phoneNumber}" class="contact-link">
                            <i class="fas fa-phone-alt me-1 text-success"></i> ${sup.phoneNumber || 'N/A'}
                        </a>
                    </td>
                    <td><small class="text-muted">${sup.contactEmail}</small></td>
                    <td>
                        <span class="status-pill status-active">
                            <i class="fas fa-check-shield me-1"></i> VERIFIED
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error("Registry Sync Error:", err);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger p-4">
            <i class="fas fa-wifi-slash mb-2 d-block"></i> Willowton Registry Offline.
        </td></tr>`;
    }
}

/**
 * 3. UI UTILITIES
 */
function filterSuppliers() {
    const query = document.getElementById('supSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#supplier-table-body tr');
    
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}

function logout() {
    if (confirm("Terminate session and logout?")) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}
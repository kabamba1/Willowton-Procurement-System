/** * --- WILLOWTON WAREHOUSE: SUPPLIER DIRECTORY --- 
 * Read-only access for logistics coordination.
 **/

document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile(); 
    fetchSuppliers();  
    
    const searchInput = document.getElementById('supSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterSuppliers);
    }
});

function loadUserProfile() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) return;
    const user = JSON.parse(userJson);
    const nameDisplay = document.getElementById('user-display-name');
    if (nameDisplay) nameDisplay.innerHTML = `<i class="fas fa-user-circle"></i> ${user.fullName}`;
}

async function fetchSuppliers() {
    const tableBody = document.getElementById('supplier-table-body');
    if (!tableBody) return;
    
    try {
        const res = await fetch(`${API_BASE_URL}/suppliers`); // Uses config.js
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
                    <div class="fw-bold text-primary">${sup.companyName}</div>
                    <div class="text-muted" style="font-size: 0.75rem;">TPIN: ${sup.taxId || 'N/A'}</div>
                </td>
                <td><span class="category-pill">${sup.category || 'General'}</span></td>
                <td>${sup.contactPerson || 'N/A'}</td>
                <td>
                    <a href="tel:${sup.phoneNumber}" class="contact-link" style="text-decoration: none;">
                        <i class="fas fa-phone-alt me-1 text-success"></i> ${sup.phoneNumber || 'N/A'}
                    </a>
                </td>
                <td><small class="text-muted">${sup.contactEmail}</small></td>
                <td><span class="status-pill status-active"><i class="fas fa-check-shield me-1"></i> VERIFIED</span></td>
            </tr>
        `).join('');

    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger p-4">Registry Offline.</td></tr>`;
    }
}

function filterSuppliers() {
    const query = document.getElementById('supSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#supplier-table-body tr');
    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(query) ? '' : 'none';
    });
}
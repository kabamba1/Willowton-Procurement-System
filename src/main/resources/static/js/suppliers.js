/** * --- WILLOWTON SUPPLIER REGISTRY MODULE --- 
 * Handles vendor onboarding, TPIN validation, and partner profiles.
 * Dependencies: config.js and auth-session.js must be loaded first.
 **/

document.addEventListener('DOMContentLoaded', () => {
    loadSuppliers();
    setupSearch();
    
    const form = document.getElementById('supplierForm');
    if (form) form.addEventListener('submit', handleSupplierSubmit);
});

/**
 * 1. LOAD & RENDER VENDOR GRID
 */
async function loadSuppliers() {
    const tableBody = document.getElementById('supplier-grid-body');
    if (!tableBody) return;

    try {
        const response = await fetch(`${API_BASE_URL}/suppliers`);
        if (!response.ok) throw new Error("Registry fetch failed");
        const suppliers = await response.json();

        // Update Dashboard KPI
        const countEl = document.getElementById('active-suppliers-count');
        if (countEl) countEl.textContent = suppliers.length;

        tableBody.innerHTML = suppliers.map(sup => {
            const categoryText = sup.category || 'General';
            // Create CSS-friendly class name (e.g., "Raw Materials" -> "cat-raw-materials")
            const catClass = `cat-${categoryText.toLowerCase().replace(/\s+/g, '-')}`;
            const statusText = (sup.status || 'ACTIVE').toUpperCase();
            const isActive = statusText === 'ACTIVE' || statusText === 'VERIFIED';

            return `
                <tr>
                    <td>
                        <div class="fw-bold text-primary">${sup.companyName}</div>
                        <div class="small text-muted">${sup.contactEmail}</div>
                    </td>
                    <td>
                        <span class="category-pill ${catClass}">${categoryText}</span>
                    </td>
                    <td><code>${sup.taxId}</code></td>
                    <td>${sup.contactPerson || 'N/A'}</td>
                    <td class="fw-semibold">${sup.phoneNumber || 'N/A'}</td>
                    <td>
                        <span class="status-pill ${isActive ? 'status-active' : 'status-inactive'}">
                            <i class="fas ${isActive ? 'fa-check-circle' : 'fa-times-circle'} me-1"></i> ${statusText}
                        </span>
                    </td>
                    <td class="text-end">
                        <button class="btn-icon" title="View Profile" onclick="viewProfile(${sup.supplierId})">
                            <i class="fas fa-id-card"></i>
                        </button>
                        <button class="btn-icon text-danger ms-2" title="Remove" onclick="deleteSupplier(${sup.supplierId})">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error("Supplier Load Error:", err);
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center p-5 text-danger">Connection to Willowton Cloud Registry failed.</td></tr>';
    }
}

/**
 * 2. VENDOR ONBOARDING (POST)
 */
async function handleSupplierSubmit(e) {
    e.preventDefault();
    
    // TPIN Validation (10 Digits - ZRA Standard)
    const tpinInput = document.getElementById('compTpin');
    const tpinPattern = /^\d{10}$/;
    if (!tpinPattern.test(tpinInput.value.trim())) {
        alert("⚠️ TPIN Validation Error: Zambian Tax IDs must be exactly 10 digits.");
        tpinInput.focus();
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');

    const payload = {
        companyName: document.getElementById('compName').value,
        contactEmail: document.getElementById('compEmail').value,
        taxId: tpinInput.value,
        category: document.getElementById('compCategory').value,
        contactPerson: document.getElementById('compContact').value,
        phoneNumber: document.getElementById('compPhone').value,
        status: 'ACTIVE'
    };

    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
        
        const res = await fetch(`${API_BASE_URL}/suppliers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("✅ Supplier Onboarded successfully!");
            closeSupplierModal();
            loadSuppliers();
            e.target.reset();
        } else {
            alert("❌ Sync failed. This TPIN may already be registered in the system.");
        }
    } catch (err) {
        alert("❌ Network Error: Could not reach Willowton Cloud.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Register & Verify";
    }
}

/**
 * 3. SEARCH & ACTIONS
 */
function setupSearch() {
    const searchInput = document.getElementById('supplierSearch');
    if (!searchInput) return;
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#supplier-grid-body tr');
        rows.forEach(row => {
            row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
        });
    });
}

async function executeDelete() {
    const id = document.getElementById('deleteTargetId').value;
    const btn = document.getElementById('finalDeleteBtn');
    
    try {
        btn.disabled = true;
        btn.innerText = "Deleting...";
        const res = await fetch(`${API_BASE_URL}/suppliers/${id}`, { method: 'DELETE' });
        if (res.ok) {
            closeDeleteModal();
            loadSuppliers();
        } else {
            alert("Restriction: Cannot remove a supplier with active Purchase Orders.");
        }
    } catch (err) {
        alert("Delete failed. Check connection.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Yes, Remove";
    }
}
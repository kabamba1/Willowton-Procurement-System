/**
 * Willowton Procurement Management System
 * Supplier Registry Module - v2.1 (Optimized)
 */

document.addEventListener('DOMContentLoaded', () => {
    loadSuppliers();
    setupSearch();
    
    const form = document.getElementById('supplierForm');
    if (form) form.addEventListener('submit', handleSupplierSubmit);
});

// 1. DATA RENDERING
async function loadSuppliers() {
    const tableBody = document.getElementById('supplier-grid-body');
    if (!tableBody) return;

    try {
        const response = await fetch(`${API_BASE}/suppliers`);
        const suppliers = await response.json();

        // Update KPI
        const countEl = document.getElementById('active-suppliers-count');
        if (countEl) countEl.textContent = suppliers.length;

        tableBody.innerHTML = suppliers.map(sup => {
            // 1. Generate the category class (turns "Raw Materials" into "cat-raw-materials")
            const categoryText = sup.category || 'General';
            const catClass = `cat-${categoryText.toLowerCase().replace(/\s+/g, '-')}`;

            // 2. Check status logic for color
            const statusText = sup.status || 'ACTIVE';
            const isActive = statusText === 'ACTIVE' || statusText === 'VERIFIED';
            const statusIcon = isActive ? 'fa-check-circle' : 'fa-times-circle';

            return `
            <tr>
                <td>
                    <div style="font-weight: 700; color: var(--primary);">${sup.companyName}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${sup.contactEmail}</div>
                </td>
                <td>
                    <span class="category-pill ${catClass}">
                        ${categoryText}
                    </span>
                </td>
                <td><code>${sup.taxId}</code></td>
                <td>${sup.contactPerson || 'N/A'}</td>
                <td style="font-weight: 600;">${sup.phoneNumber || 'N/A'}</td>
                <td>
                    <span class="status-pill ${isActive ? 'status-active' : 'status-inactive'}">
                        <i class="fas ${statusIcon}"></i> ${statusText}
                    </span>
                </td>
                <td style="text-align: right;">
                    <button class="btn-icon" title="View Profile" onclick="viewProfile(${sup.supplierId})">
                        <i class="fas fa-id-card"></i>
                    </button>
                    <button class="btn-icon" style="color:var(--danger); margin-left:10px;" onclick="deleteSupplier(${sup.supplierId})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `}).join('');
    } catch (err) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px;">Connection to Willowton Registry failed.</td></tr>';
    }
}

// 2. SEARCH ENGINE
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

// 3. ONBOARDING (POST) WITH VALIDATION
async function handleSupplierSubmit(e) {
    e.preventDefault();
    
    // TPIN Validation (10 Digits Only)
    const tpinInput = document.getElementById('compTpin');
    const tpinPattern = /^\d{10}$/;
    if (!tpinPattern.test(tpinInput.value.trim())) {
        alert("TPIN Error: Must be exactly 10 numeric digits.");
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
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        const res = await fetch(`${API_BASE}/suppliers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Supplier Onboarded Successfully!");
            closeSupplierModal();
            loadSuppliers();
            e.target.reset();
        } else {
            alert("Submission failed. Check if TPIN already exists.");
        }
    } catch (err) {
        alert("Critical Server Error. Check connection.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Register & Verify";
    }
}

// 4. VIEW PROFILE ACTION
async function viewProfile(id) {
    try {
        const response = await fetch(`${API_BASE}/suppliers/${id}`);
        const sup = await response.json();
        
        document.getElementById('viewCompName').innerText = sup.companyName;
        document.getElementById('viewTaxId').innerText = sup.taxId;
        document.getElementById('viewCategory').innerText = sup.category;
        document.getElementById('viewEmail').innerText = sup.contactEmail;
        document.getElementById('viewPhone').innerText = sup.phoneNumber || "Not Provided";
        
        document.getElementById('viewSupplierModal').style.display = 'flex';
    } catch (err) {
        alert("Profile unreachable.");
    }
}

// 5. DELETE ACTION
async function deleteSupplier(id) {
    try {
        const response = await fetch(`${API_BASE}/suppliers/${id}`);
        const sup = await response.json();
        
        document.getElementById('deleteTargetName').innerText = sup.companyName;
        document.getElementById('deleteTargetId').value = id;
        document.getElementById('deleteConfirmModal').style.display = 'flex';
    } catch (err) {
        alert("Record not found.");
    }
}

async function executeDelete() {
    const id = document.getElementById('deleteTargetId').value;
    const btn = document.getElementById('finalDeleteBtn');
    
    try {
        btn.disabled = true;
        btn.innerText = "Deleting...";
        const res = await fetch(`${API_BASE}/suppliers/${id}`, { method: 'DELETE' });
        if (res.ok) {
            closeDeleteModal();
            loadSuppliers();
        }
    } catch (err) {
        alert("Action restricted. Check for linked Purchase Orders.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Yes, Remove";
    }
}

// MODAL CONTROLS
window.openSupplierModal = () => document.getElementById('supplierModal').style.display = 'flex';
window.closeSupplierModal = () => document.getElementById('supplierModal').style.display = 'none';
window.closeViewModal = () => document.getElementById('viewSupplierModal').style.display = 'none';
window.closeDeleteModal = () => document.getElementById('deleteConfirmModal').style.display = 'none';
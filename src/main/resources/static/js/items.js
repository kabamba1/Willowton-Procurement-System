/**
 * Willowton Procurement Management System - Inventory Logic
 */

let itemToDelete = null; 

document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    setupFilters();
    
    const form = document.getElementById('itemForm');
    if (form) form.addEventListener('submit', handleItemSubmit);

    const confirmBtn = document.getElementById('confirmDeleteBtn');
    if (confirmBtn) confirmBtn.addEventListener('click', executeDeletion);
});

// 1. FETCH & DISPLAY ITEMS
async function loadItems() {
    const tableBody = document.getElementById('items-table-body');
    if (!tableBody) return;

    try {
        const res = await fetch(`${API_BASE}/items`);
        if (!res.ok) throw new Error("Fetch failed");
        
        const items = await res.json();

        tableBody.innerHTML = items.map(item => {
            const isLowStock = item.stockLevel < 10;
            const stockColor = isLowStock ? 'color: var(--danger); font-weight: 800;' : 'color: var(--success);';
            const catClass = `cat-${item.category.toLowerCase().replace(/\s+/g, '-')}`;

            // --- FIXED STATUS LOGIC ---
            // This treats both 'ACTIVE' and 'AVAILABLE' as positive statuses
            const statusText = item.status || 'ACTIVE';
            const isActive = statusText === 'ACTIVE' || statusText === 'AVAILABLE';
            // ---------------------------

            return `
                <tr>
                    <td><code>${item.itemCode}</code></td>
                    <td>${item.description}</td>
                    <td><span class="category-pill ${catClass}">${item.category}</span></td>
                    <td>${item.unitOfMeasure}</td>
                    <td style="font-weight: 600;">K ${parseFloat(item.lastUnitPrice || 0).toLocaleString()}</td>
                    <td style="${stockColor}">${item.stockLevel} <small>${item.unitOfMeasure}</small></td>
                    <td>
                        <span class="status-pill ${isActive ? 'status-active' : 'status-inactive'}">
                            ${statusText}
                        </span>
                    </td>
                    <td style="text-align: right;">
                        <button class="btn-icon" title="Edit SKU" onclick="editItem(${item.itemId})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" title="Delete SKU" style="color:var(--danger); margin-left:8px;" 
                                onclick="openDeleteModal(${item.itemId}, '${item.itemCode}', '${item.description}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:2rem;">Inventory server unreachable. Check Port 8081.</td></tr>';
    }
}

// 2. CREATE OR UPDATE
async function handleItemSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = document.getElementById('submitBtn');
    const editingId = form.dataset.editingId; 
    
    const payload = {
        itemCode: document.getElementById('itemCode').value,
        description: document.getElementById('description').value,
        category: document.getElementById('category').value,
        unitOfMeasure: document.getElementById('unitOfMeasure').value,
        lastUnitPrice: parseFloat(document.getElementById('unitPrice').value),
        stockLevel: parseInt(document.getElementById('stockLevel').value),
        status: 'ACTIVE' // Standardizes all new entries to 'ACTIVE'
    };

    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        const url = editingId ? `${API_BASE}/items/${editingId}` : `${API_BASE}/items`;
        const res = await fetch(url, {
            method: editingId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            closeItemModal();
            loadItems();
            form.reset();
        } else {
            alert("Error saving item. Check SKU uniqueness.");
        }
    } catch (err) {
        alert("Connection error.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Save SKU to Catalog";
    }
}

// 3. EDIT
async function editItem(id) {
    try {
        const res = await fetch(`${API_BASE}/items/${id}`);
        const item = await res.json();

        document.getElementById('itemCode').value = item.itemCode;
        document.getElementById('description').value = item.description;
        document.getElementById('category').value = item.category;
        document.getElementById('unitOfMeasure').value = item.unitOfMeasure;
        document.getElementById('unitPrice').value = item.lastUnitPrice;
        document.getElementById('stockLevel').value = item.stockLevel;

        const form = document.getElementById('itemForm');
        form.dataset.editingId = id;
        
        document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> Update SKU';
        document.getElementById('modalTitle').innerText = "Edit Inventory Item";
        document.getElementById('itemModal').style.display = 'flex';
    } catch (err) {
        alert("Could not retrieve item details.");
    }
}

// 4. CUSTOM DELETE LOGIC
window.openDeleteModal = (id, code, description) => {
    itemToDelete = id;
    const msg = document.getElementById('deleteMessage');
    msg.innerHTML = `Remove <strong>${code}</strong> for <em>${description}</em> from the Willowton Registry?`;
    document.getElementById('deleteModal').style.display = 'flex';
};

window.closeDeleteModal = () => {
    document.getElementById('deleteModal').style.display = 'none';
    itemToDelete = null;
};

async function executeDeletion() {
    if (!itemToDelete) return;

    try {
        const res = await fetch(`${API_BASE}/items/${itemToDelete}`, { method: 'DELETE' });
        if (res.ok) {
            closeDeleteModal();
            loadItems();
        } else {
            alert("Delete failed. Item might be linked to active orders.");
            closeDeleteModal();
        }
    } catch (err) {
        alert("Server error.");
    }
}

// 5. FILTERS
function setupFilters() {
    const search = document.getElementById('itemSearch');
    const filter = document.getElementById('categoryFilter');

    const runFilter = () => {
        const term = search.value.toLowerCase();
        const cat = filter.value;
        const rows = document.querySelectorAll('#items-table-body tr');

        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            const matchesSearch = text.includes(term);
            const matchesCat = cat === 'ALL' || text.includes(cat.toLowerCase());
            row.style.display = (matchesSearch && matchesCat) ? '' : 'none';
        });
    };

    search?.addEventListener('input', runFilter);
    filter?.addEventListener('change', runFilter);
}

// MODAL UI CONTROLS
window.openItemModal = () => {
    const form = document.getElementById('itemForm');
    if (!form.dataset.editingId) {
        form.reset();
        document.getElementById('submitBtn').innerHTML = "Save SKU to Catalog";
        document.getElementById('modalTitle').innerText = "Add New Inventory Item";
    }
    document.getElementById('itemModal').style.display = 'flex';
};

window.closeItemModal = () => {
    const form = document.getElementById('itemForm');
    delete form.dataset.editingId; 
    document.getElementById('itemModal').style.display = 'none';
};
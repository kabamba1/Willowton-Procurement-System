/** * --- WILLOWTON INVENTORY & SKU MANAGEMENT --- 
 * Handles the catalog of items, stock levels, and category filtering.
 * Dependencies: config.js must be loaded first.
 **/

let itemToDelete = null; 

document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    setupFilters();
    
    const form = document.getElementById('itemForm');
    if (form) form.addEventListener('submit', handleItemSubmit);

    const confirmBtn = document.getElementById('confirmDeleteBtn');
    if (confirmBtn) confirmBtn.addEventListener('click', executeDeletion);
});

/**
 * 1. FETCH & DISPLAY ITEMS
 */
async function loadItems() {
    const tableBody = document.getElementById('items-table-body');
    if (!tableBody) return;

    try {
        const res = await fetch(`${API_BASE_URL}/items`);
        if (!res.ok) throw new Error("Fetch failed");
        
        const items = await res.json();

        tableBody.innerHTML = items.map(item => {
            const isLowStock = item.stockLevel < 10;
            const stockColor = isLowStock ? 'color: var(--danger); font-weight: 800;' : 'color: var(--success);';
            const catClass = `cat-${(item.category || 'general').toLowerCase().replace(/\s+/g, '-')}`;
            
            const statusText = (item.status || 'ACTIVE').toUpperCase();
            const isActive = statusText === 'ACTIVE' || statusText === 'AVAILABLE';

            return `
                <tr>
                    <td><code>${item.itemCode}</code></td>
                    <td>${item.description}</td>
                    <td><span class="category-pill ${catClass}">${item.category}</span></td>
                    <td>${item.unitOfMeasure}</td>
                    <td style="font-weight: 600;">${formatZMW(item.lastUnitPrice)}</td>
                    <td style="${stockColor}">${item.stockLevel} <small>${item.unitOfMeasure}</small></td>
                    <td>
                        <span class="status-pill ${isActive ? 'status-active' : 'status-inactive'}">
                            <i class="fas ${isActive ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-1"></i> ${statusText}
                        </span>
                    </td>
                    <td style="text-align: right;">
                        <button class="btn-icon" title="Edit SKU" onclick="editItem(${item.itemId})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon text-danger" title="Delete SKU" style="margin-left:8px;" 
                                onclick="openDeleteModal(${item.itemId}, '${item.itemCode}', '${item.description}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error("Inventory Load Error:", err);
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-5 text-danger">Inventory server unreachable. Ensure the Willowton Cloud API is active.</td></tr>';
    }
}

/**
 * 2. CREATE OR UPDATE (POST/PUT)
 */
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
        status: 'ACTIVE'
    };

    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';

        const url = editingId ? `${API_BASE_URL}/items/${editingId}` : `${API_BASE_URL}/items`;
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
            alert("❌ Save failed. Ensure the SKU code is unique and the server is online.");
        }
    } catch (err) {
        alert("❌ Network Error: Connection to Willowton Cloud failed.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Save SKU to Catalog";
    }
}

/**
 * 3. EDIT RETRIEVAL
 */
async function editItem(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/items/${id}`);
        if (!res.ok) throw new Error();
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
        document.getElementById('modalTitle').innerText = "Edit Inventory SKU";
        document.getElementById('itemModal').style.display = 'flex'; // Centered Flex
    } catch (err) {
        alert("⚠️ Could not retrieve SKU details for editing.");
    }
}

/**
 * 4. DELETION LOGIC
 */
async function executeDeletion() {
    if (!itemToDelete) return;

    try {
        const res = await fetch(`${API_BASE_URL}/items/${itemToDelete}`, { method: 'DELETE' });
        if (res.ok) {
            closeDeleteModal();
            loadItems();
        } else {
            alert("⚠️ Audit Restriction: This item is linked to active Purchase Orders and cannot be removed.");
            closeDeleteModal();
        }
    } catch (err) {
        alert("❌ Error connecting to the delete service.");
    }
}

/**
 * 5. FILTERS & SEARCH
 */
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

/**
 * 6. UI HELPERS (MODALS)
 */
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

window.openDeleteModal = (id, code, description) => {
    itemToDelete = id;
    const msg = document.getElementById('deleteMessage');
    if (msg) {
        msg.innerHTML = `Remove SKU: <strong>${code}</strong><br><small>${description}</small><br><br>This action cannot be undone.`;
    }
    document.getElementById('deleteModal').style.display = 'flex';
};

window.closeDeleteModal = () => {
    document.getElementById('deleteModal').style.display = 'none';
    itemToDelete = null;
};
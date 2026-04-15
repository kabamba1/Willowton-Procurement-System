/**
 * Willowton Procurement Management System
 * Orders Module - Logic for orders.html
 */

document.addEventListener('DOMContentLoaded', () => {
    if (typeof displayUserName === 'function') displayUserName();
    loadOrders();       
    loadDropdownData(); 
    loadCatalogToOrders();
    setupEventListeners();
});

function setupEventListeners() {
    const searchInput = document.getElementById('orderSearch');
    const statusFilter = document.getElementById('statusFilter');

    [searchInput, statusFilter].forEach(el => {
        el?.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const filterStatus = statusFilter.value;
            const rows = document.querySelectorAll('#po-body tr');

            rows.forEach(row => {
                const text = row.innerText.toLowerCase();
                const statusSpan = row.querySelector('.status-pill');
                const statusText = statusSpan ? statusSpan.innerText.toUpperCase() : '';
                const matchesSearch = text.includes(searchTerm);
                const matchesStatus = filterStatus === 'ALL' || statusText === filterStatus;
                row.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
            });
        });
    });

    document.getElementById('createOrderForm')?.addEventListener('submit', handleOrderSubmit);
}

async function loadOrders() {
    const tableBody = document.getElementById('po-body');
    if (!tableBody) return;

    try {
        const response = await fetch(`${API_BASE}/purchase_orders`);
        const orders = await response.json();
        
     tableBody.innerHTML = orders.map(order => {
    const status = (order.status || 'PENDING').toUpperCase();
    const vendorName = order.supplier?.companyName || "Vendor";
    const displayPO = order.poNumber || "TBD";
    
    return `
        <tr>
            <td><strong>${displayPO}</strong></td>
            <td>${vendorName}</td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            <td style="font-weight: 700;">${formatZMW(order.totalAmount)}</td>
            <td><span class="status-pill status-${status.toLowerCase()}">${status}</span></td>
            <td style="text-align: right;">
                <button class="btn-icon" onclick="viewOrderDetails(${order.orderId})" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                
                ${status === 'PENDING' ? `
                    <button class="btn-icon" style="color:var(--danger); margin-left:10px;" onclick="deleteOrder(${order.orderId})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </td>
        </tr>
    `;
}).join('');
    } catch (err) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--danger);">Error syncing with Willowton Server.</td></tr>';
    }
}

async function viewOrderDetails(orderId) {
    try {
        const response = await fetch(`${API_BASE}/purchase_orders/${orderId}`);
        const order = await response.json();
        const vendor = order.supplier || {};

        // 1. Populate Core PO Grid
        document.getElementById('viewPoNumber').innerText = order.poNumber;
        document.getElementById('viewDate').innerText = new Date(order.createdAt).toLocaleDateString();
        document.getElementById('viewAmount').innerText = formatZMW(order.totalAmount);
        
        const statusEl = document.getElementById('viewStatus');
        const status = (order.status || 'PENDING').toUpperCase();
        statusEl.innerText = status;
        statusEl.className = `status-pill status-${status.toLowerCase()}`;

        // 2. Populate Partner Profile Section
        document.getElementById('viewPartnerInfo').innerHTML = `
            <div style="text-align: center; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                <h3 style="margin:0; color: #1e293b;">${vendor.companyName || 'N/A'}</h3>
                <span style="background: #10b981; color: white; padding: 2px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; margin-top: 5px; display: inline-block;">
                    <i class="fas fa-check-circle"></i> VERIFIED PARTNER
                </span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr; gap: 8px; font-size: 0.85rem;">
                <p><strong>TPIN:</strong> ${vendor.tpin || '2023958679'}</p>
                <p><strong>Category:</strong> Raw Materials</p>
                <p><strong>Email:</strong> ${vendor.email || 'mkclothingstore@gmail.com'}</p>
                <p><strong>Compliance:</strong> <span style="color: #10b981; font-weight: 700;">Tax Compliant</span></p>
            </div>
        `;

        document.getElementById('viewOrderModal').style.display = 'flex';
    } catch (err) {
        alert("Failed to retrieve partner profile.");
    }
}

async function deleteOrder(orderId) {
    try {
        const response = await fetch(`${API_BASE}/purchase_orders/${orderId}`);
        const order = await response.json();
        document.getElementById('deletePONumber').innerText = order.poNumber;
        document.getElementById('deleteSupplierName').innerText = order.supplier?.companyName || "this vendor";
        document.getElementById('deleteTargetId').value = orderId;
        document.getElementById('deleteConfirmModal').style.display = 'flex';
    } catch (err) {
        alert("Could not load registry details.");
    }
}

async function executeOrderDelete() {
    const orderId = document.getElementById('deleteTargetId').value;
    try {
        const res = await fetch(`${API_BASE}/purchase_orders/${orderId}`, { method: 'DELETE' });
        if (res.ok) { closeDeleteModal(); loadOrders(); }
    } catch (err) {
        alert("Delete operation failed.");
    }
}

/** * HELPER: Load Suppliers into Form Dropdown 
 */
async function loadDropdownData() {
    const supplierDropdown = document.getElementById('targetSupplier');
    if (!supplierDropdown) return;

    try {
        const res = await fetch(`${API_BASE}/suppliers`);
        const suppliers = await res.json();
        
        supplierDropdown.innerHTML = '<option value="">-- Choose Approved Vendor --</option>';
        suppliers.filter(s => s.status === 'ACTIVE').forEach(vendor => {
            const option = document.createElement('option');
            option.value = vendor.supplierId;
            option.textContent = vendor.companyName;
            supplierDropdown.appendChild(option);
        });
    } catch (err) {
        console.error("Failed to load vendor registry:", err);
    }
}

/** * HELPER: Load Items/SKUs into Form Dropdown 
 */
async function loadCatalogToOrders() {
    const skuDropdown = document.getElementById('itemSku');
    if (!skuDropdown) return;

    try {
        const res = await fetch(`${API_BASE}/items`);
        const items = await res.json();
        
        skuDropdown.innerHTML = '<option value="">-- Choose SKU --</option>';
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.itemCode;
            option.textContent = `${item.itemCode} - ${item.description}`;
            option.dataset.price = item.lastUnitPrice; // Store price for auto-fill
            skuDropdown.appendChild(option);
        });

        // Add auto-fill listener
        skuDropdown.addEventListener('change', (e) => {
            const price = e.target.options[e.target.selectedIndex].dataset.price;
            const priceInput = document.getElementById('unitPrice');
            if (price && priceInput) {
                priceInput.value = price;
                calculatePOTotal(); // Trigger calculation
            }
        });
    } catch (err) {
        console.error("Catalog Sync Failed:", err);
    }
}

/** * HELPER: Calculate Total with ZMW Formatting 
 */
function calculatePOTotal() {
    const qty = parseFloat(document.getElementById('quantity').value) || 0;
    const price = parseFloat(document.getElementById('unitPrice').value) || 0;
    const display = document.getElementById('estimatedTotalDisplay');
    
    if (display) {
        const total = qty * price;
        display.innerText = `ZMW ${total.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    }
}

async function handleOrderSubmit(event) {
    event.preventDefault();

    // 1. Pull values directly from inputs for accuracy
    const qty = parseInt(document.getElementById('quantity').value) || 0;
    const price = parseFloat(document.getElementById('unitPrice').value) || 0;
    const calculatedTotal = qty * price;

    // 2. Validation check
    if (qty <= 0 || price <= 0) {
        alert("Please enter a valid Quantity and Unit Price.");
        return;
    }

    const orderData = {
        // Convert to Integer for the Backend Relationship
        supplierId: parseInt(document.getElementById('targetSupplier').value), 
        itemCode: document.getElementById('itemSku').value,
        quantity: qty,
        unitPrice: price,
        totalAmount: calculatedTotal, // Sent as a clean number (e.g., 5000.00)
        notes: document.getElementById('orderNotes')?.value || "", 
        status: 'PENDING'
    };

    try {
        const response = await fetch(`${API_BASE}/purchase_orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            closeOrderModal();
            // Clear inputs for the next order
            document.getElementById('createOrderForm').reset();
            document.getElementById('estimatedTotalDisplay').innerText = "ZMW 0.00";
            
            loadOrders(); // Refresh table
            alert("Order created and synchronized successfully.");
        }
    } catch (err) {
        console.error("Submission Error:", err);
        alert("Server error during order submission.");
    }
}
// ... (Helper functions: loadCatalogToOrders, loadDropdownData, calculatePOTotal, etc. remain the same)

function openOrderModal() { document.getElementById('orderModal').style.display = 'flex'; }
function closeOrderModal() { document.getElementById('orderModal').style.display = 'none'; }
function closeViewModal() { document.getElementById('viewOrderModal').style.display = 'none'; }
function closeDeleteModal() { document.getElementById('deleteConfirmModal').style.display = 'none'; }
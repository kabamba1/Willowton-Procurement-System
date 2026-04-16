/** * --- WILLOWTON PROCUREMENT ORDERS MODULE --- 
 * Handles the lifecycle of Purchase Orders from creation to registry sync.
 * Dependencies: config.js must be loaded first.
 **/

document.addEventListener('DOMContentLoaded', () => {
    loadOrders();       
    loadDropdownData(); 
    loadCatalogToOrders();
    setupEventListeners();
});

/**
 * 1. SEARCH & FILTERS
 */
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
    
    // Auto-calculate total when quantity or price changes manually
    document.getElementById('quantity')?.addEventListener('input', calculatePOTotal);
    document.getElementById('unitPrice')?.addEventListener('input', calculatePOTotal);
}

/**
 * 2. TABLE RENDERING
 */
async function loadOrders() {
    const tableBody = document.getElementById('po-body');
    if (!tableBody) return;

    try {
        const response = await fetch(`${API_BASE_URL}/purchase_orders`);
        if (!response.ok) throw new Error("Fetch failed");
        const orders = await response.json();
        
        // Show newest first
        tableBody.innerHTML = orders.reverse().map(order => {
            const status = (order.status || 'PENDING').toUpperCase();
            const vendorName = order.supplierName || (order.supplier ? order.supplier.companyName : "Vendor");
            const displayPO = order.poNumber || "TBD";
            
            return `
                <tr>
                    <td><strong>${displayPO}</strong></td>
                    <td>${vendorName}</td>
                    <td>${new Date(order.createdAt).toLocaleDateString('en-GB')}</td>
                    <td class="fw-bold">${formatZMW(order.totalAmount)}</td>
                    <td><span class="status-pill status-${status.toLowerCase()}">${status}</span></td>
                    <td class="text-end">
                        <button class="btn-icon" onclick="viewOrderDetails(${order.orderId})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${status === 'PENDING' ? `
                            <button class="btn-icon text-danger ms-2" onclick="deleteOrder(${order.orderId})" title="Cancel Order">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error("Order Sync Error:", err);
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger p-4">Cloud registry unreachable. Check network.</td></tr>';
    }
}

/**
 * 3. ORDER CREATION
 */
async function handleOrderSubmit(event) {
    event.preventDefault();

    const qty = parseInt(document.getElementById('quantity').value) || 0;
    const price = parseFloat(document.getElementById('unitPrice').value) || 0;
    const calculatedTotal = qty * price;

    if (qty <= 0 || price <= 0) {
        alert("Please enter a valid Quantity and Unit Price.");
        return;
    }

    const orderData = {
        supplierId: parseInt(document.getElementById('targetSupplier').value), 
        itemCode: document.getElementById('itemSku').value,
        quantity: qty,
        unitPrice: price,
        totalAmount: calculatedTotal,
        notes: document.getElementById('orderNotes')?.value || "", 
        status: 'PENDING'
    };

    try {
        const response = await fetch(`${API_BASE_URL}/purchase_orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            closeOrderModal();
            document.getElementById('createOrderForm').reset();
            if (document.getElementById('estimatedTotalDisplay')) {
                document.getElementById('estimatedTotalDisplay').innerText = "ZMW 0.00";
            }
            loadOrders();
            alert("✅ PO created successfully and routed for Finance Approval.");
        } else {
            alert("❌ Submission failed. Ensure all required fields are filled.");
        }
    } catch (err) {
        alert("❌ Server error during submission.");
    }
}

/**
 * 4. DATA SYNC (Dropdowns)
 */
async function loadDropdownData() {
    const supplierDropdown = document.getElementById('targetSupplier');
    if (!supplierDropdown) return;

    try {
        const res = await fetch(`${API_BASE_URL}/suppliers`);
        const suppliers = await res.json();
        
        supplierDropdown.innerHTML = '<option value="">-- Select Approved Supplier --</option>';
        suppliers.filter(s => s.status === 'ACTIVE').forEach(vendor => {
            const option = document.createElement('option');
            option.value = vendor.supplierId;
            option.textContent = vendor.companyName;
            supplierDropdown.appendChild(option);
        });
    } catch (err) {
        console.error("Vendor Load Failed:", err);
    }
}

async function loadCatalogToOrders() {
    const skuDropdown = document.getElementById('itemSku');
    if (!skuDropdown) return;

    try {
        const res = await fetch(`${API_BASE_URL}/items`);
        const items = await res.json();
        
        skuDropdown.innerHTML = '<option value="">-- Choose Item SKU --</option>';
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.itemCode;
            option.textContent = `${item.itemCode} - ${item.description}`;
            option.dataset.price = item.lastUnitPrice;
            skuDropdown.appendChild(option);
        });

        skuDropdown.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const price = selectedOption.dataset.price;
            const priceInput = document.getElementById('unitPrice');
            if (price && priceInput) {
                priceInput.value = price;
                calculatePOTotal();
            }
        });
    } catch (err) {
        console.error("Item Load Failed:", err);
    }
}

function calculatePOTotal() {
    const qty = parseFloat(document.getElementById('quantity').value) || 0;
    const price = parseFloat(document.getElementById('unitPrice').value) || 0;
    const display = document.getElementById('estimatedTotalDisplay');
    
    if (display) {
        display.innerText = formatZMW(qty * price);
    }
}

/**
 * 5. ACTIONS (View & Delete)
 */
async function viewOrderDetails(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/purchase_orders/${id}`);
        if (!res.ok) throw new Error();
        const order = await res.json();
        
        const container = document.getElementById('viewOrderContent');
        container.innerHTML = `
            <div class="detail-grid">
                <div class="detail-item"><strong>PO Number:</strong> <span>${order.poNumber || 'TBD'}</span></div>
                <div class="detail-item"><strong>Vendor:</strong> <span>${order.supplierName}</span></div>
                <div class="detail-item"><strong>Item SKU:</strong> <span>${order.itemCode}</span></div>
                <div class="detail-item"><strong>Quantity:</strong> <span>${order.quantity}</span></div>
                <div class="detail-item"><strong>Unit Price:</strong> <span>${formatZMW(order.unitPrice)}</span></div>
                <div class="detail-item"><strong>Total Amount:</strong> <span class="fw-bold text-primary">${formatZMW(order.totalAmount)}</span></div>
            </div>
            <div class="mt-3">
                <strong>Internal Notes:</strong>
                <p class="text-muted p-2 bg-light rounded">${order.notes || 'No notes provided for this order.'}</p>
            </div>
        `;
        
        document.getElementById('viewOrderModal').style.display = 'flex';
    } catch (err) {
        alert("⚠️ Could not retrieve order details.");
    }
}

function closeViewOrderModal() {
    document.getElementById('viewOrderModal').style.display = 'none';
}

function deleteOrder(id) {
    document.getElementById('deletePoId').value = id;
    document.getElementById('deletePoMessage').innerHTML = `Are you sure you want to cancel Purchase Order <strong>#${id}</strong>?<br><small>This action is logged for audit purposes.</small>`;
    document.getElementById('deletePoModal').style.display = 'flex';
}

function closeDeletePoModal() {
    document.getElementById('deletePoModal').style.display = 'none';
}

async function executePoDeletion() {
    const id = document.getElementById('deletePoId').value;
    const btn = document.getElementById('finalDeletePoBtn');
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelling...';
        
        const res = await fetch(`${API_BASE_URL}/purchase_orders/${id}`, { method: 'DELETE' });
        if (res.ok) {
            closeDeletePoModal();
            loadOrders();
        } else {
            alert("⚠️ Restriction: Processed orders cannot be cancelled.");
        }
    } catch (err) {
        alert("❌ Network Error.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Yes, Cancel Order";
    }
}

// Global UI Helpers
window.openOrderModal = () => document.getElementById('orderModal').style.display = 'flex';
window.closeOrderModal = () => document.getElementById('orderModal').style.display = 'none';
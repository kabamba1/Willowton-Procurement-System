/** * --- WILLOWTON PMS - WAREHOUSE MODULE --- 
 * Inventory Management & Goods Receipt
 * Handles stock levels, receiving deliveries, and audit trails.
 **/

const API_BASE_URL = "https://willowton-pms.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    loadUserProfile();
    
    // Initial Data Fetch
    syncWarehouse();           // Current Stock levels
    loadExpectedDeliveries();  // Filtered Approved POs
    loadMovementHistory();     // Audit Trail
});

/** --- 1. ACCESS CONTROL --- **/
function checkSession() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) {
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(userJson);
    const rid = user.roleId || user.role_id;

    // Strict Access: Admin (1) or Warehouse Supervisor (4)
    const allowedRoles = [1, 4];
    if (!allowedRoles.includes(rid)) {
        alert("Access Denied: Warehouse Management clearance required.");
        window.location.href = 'dashboard.html';
    }
}

/** --- 2. STOCK CATALOG & METRICS --- **/
async function syncWarehouse() {
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) return;

    try {
        const res = await fetch(`${API_BASE_URL}/items`);
        if (!res.ok) throw new Error("Registry Unreachable");
        
        const items = await res.json();

        // Metric Calculations for Dashboard Cards
        const lowStockThreshold = 10;
        const lowStockItems = items.filter(i => (i.stockLevel || 0) <= lowStockThreshold).length;
        const totalValue = items.reduce((acc, i) => acc + ((i.lastUnitPrice || 0) * (i.stockLevel || 0)), 0);

        updateElement('total-sku-count', items.length);
        updateElement('low-stock-count', lowStockItems);
        updateElement('stock-valuation', formatZMW(totalValue));

        tableBody.innerHTML = items.map(item => {
            const isLow = (item.stockLevel || 0) <= lowStockThreshold;
            const statusClass = isLow ? 'status-rejected' : 'status-approved';
            
            return `
                <tr>
                    <td>
                        <div class="fw-bold text-primary">${item.description}</div>
                        <small class="text-muted">SKU: ${item.itemCode}</small>
                    </td>
                    <td><span class="category-pill">${item.category || 'General'}</span></td>
                    <td>
                        <span class="fw-bold">${item.stockLevel.toLocaleString()}</span> 
                        <small class="text-muted">${item.unitOfMeasure || 'Units'}</small>
                    </td>
                    <td>${formatZMW(item.lastUnitPrice)}</td>
                    <td><span class="status-pill ${statusClass}">${isLow ? 'REORDER' : 'IN STOCK'}</span></td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger p-4">Registry Offline.</td></tr>`;
    }
}

/** --- 3. GOODS RECEIVING --- **/
async function loadExpectedDeliveries() {
    const deliveryTable = document.getElementById('expected-deliveries-body');
    if(!deliveryTable) return;

    try {
        const res = await fetch(`${API_BASE_URL}/warehouse/deliveries`);
        const orders = await res.json();

        if (orders.length === 0) {
            deliveryTable.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-muted">No pending deliveries.</td></tr>`;
            return;
        }

        deliveryTable.innerHTML = orders.map(order => `
            <tr>
                <td><code class="fw-bold">${order.poNumber}</code></td>
                <td>
                    <strong>${order.itemName}</strong><br>
                    <small class="text-success fw-bold text-uppercase" style="font-size: 0.65rem;">Verified for Receipt</small>
                </td>
                <td class="fw-bold">${order.quantity}</td>
                <td class="small">${order.supplierName}</td>
                <td>
                    <button class="btn btn-sm btn-primary px-3" onclick="receiveGoods(${order.id}, ${order.itemId}, ${order.quantity})">
                        <i class="fas fa-truck-loading me-1"></i> Receive
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        deliveryTable.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Registry sync error.</td></tr>`;
    }
}

async function receiveGoods(procurementId, itemId, quantity) {
    if (!confirm(`Confirm physical receipt of ${quantity} units?\n\nThis will Finalize PO #${procurementId} and increase system inventory.`)) return;

    try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const response = await fetch(`${API_BASE_URL}/warehouse/receive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                procurementId: procurementId,
                itemId: itemId,
                receivedQuantity: quantity,
                receivedBy: user.fullName
            })
        });

        if (response.ok) {
            alert("Success: Inventory incremented and PO finalized.");
            syncWarehouse();
            loadExpectedDeliveries();
            loadMovementHistory(); 
        } else {
            alert("Error finalizing receipt. Please check server logs.");
        }
    } catch (err) {
        alert("Connection Failure: Cloud API unreachable.");
    }
}

/** --- 4. AUDIT LOG --- **/
async function loadMovementHistory() {
    const historyTable = document.getElementById('movement-history-body');
    if (!historyTable) return;

    try {
        const res = await fetch(`${API_BASE_URL}/warehouse/movements`); 
        const movements = await res.json();

        historyTable.innerHTML = movements.reverse().slice(0, 10).map(m => `
            <tr>
                <td class="small text-muted">${new Date(m.timestamp).toLocaleString('en-GB')}</td>
                <td><strong>${m.itemDescription || 'Unknown Item'}</strong></td>
                <td>
                    <span class="status-pill ${m.movementType === 'IN' ? 'status-approved' : 'status-rejected'}">
                        ${m.movementType}
                    </span>
                </td>
                <td class="fw-bold">${m.quantity}</td>
                <td><code>${m.referenceNumber || 'N/A'}</code></td>
                <td class="small"><i class="fas fa-user-check me-1"></i> ${m.handledBy}</td>
            </tr>
        `).join('');

    } catch (err) {
        console.error("Audit log error:", err);
    }
}

/** --- HELPERS --- **/
function updateElement(id, val) {
    const el = document.getElementById(id);
    if(el) el.innerText = val;
}

function formatZMW(amt) {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amt);
}
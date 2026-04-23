/** * --- WILLOWTON PMS - WAREHOUSE MODULE --- 
 * Inventory Management & Goods Receipt
 **/

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    syncWarehouse();           
    loadExpectedDeliveries();  
    loadMovementHistory();     
});

/** --- 1. ACCESS CONTROL & SESSION --- **/
function checkSession() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) {
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userJson);
    
    // 1. Set the Full Name
    const nameDisplay = document.getElementById('user-display-name');
    if (nameDisplay) nameDisplay.innerText = user.fullName || "Enock Silavwe";

    // 2. Set the Role Label (Advanced Mapping)
    const roleDisplay = document.getElementById('user-role-label');
    if (roleDisplay) {
        let roleTitle = "User";

        if (user.role && user.role.roleName) {
            // Case A: Role is a nested object from Spring Boot
            roleTitle = user.role.roleName;
        } else {
            // Case B: Role is just an ID number (Mapping manual check)
            const rid = user.roleId || (user.role ? user.role : null);
            const roleMap = {
                1: "System Admin",
                2: "Finance Manager",
                3: "Procurement Officer",
                4: "Warehouse Supervisor"
            };
            roleTitle = roleMap[rid] || "Warehouse Supervisor";
        }
        
        roleDisplay.innerText = roleTitle;
    }

    // 3. Access Control (Admin or Supervisor)
    const accessId = user.roleId || (user.role && user.role.roleId ? user.role.roleId : user.role);
    if (![1, 4].includes(Number(accessId))) {
        alert("Access Denied: Warehouse Supervisor clearance required.");
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

        const lowStockThreshold = 10;
        const lowStockItems = items.filter(i => (i.stockLevel || 0) <= lowStockThreshold).length;
        const totalValue = items.reduce((acc, i) => acc + ((i.unitPrice || 0) * (i.stockLevel || 0)), 0);

        updateElement('total-sku-count', items.length);
        updateElement('low-stock-count', lowStockItems);
        updateElement('stock-valuation', formatZMW(totalValue)); // Uses config.js

        tableBody.innerHTML = items.map(item => {
            const isLow = (item.stockLevel || 0) <= lowStockThreshold;
            const statusClass = isLow ? 'status-rejected' : 'status-approved';
            
            return `
                <tr>
                    <td>
                        <div class="fw-bold text-primary">${item.itemDescription || 'Unnamed Item'}</div>
                        <small class="text-muted">ID: # ${item.itemId}</small>
                    </td>
                    <td><span class="category-pill">${item.category || 'General'}</span></td>
                    <td><span class="fw-bold">${(item.stockLevel || 0).toLocaleString()}</span></td>
                    <td>${formatZMW(item.unitPrice || 0)}</td>
                    <td><span class="status-pill ${statusClass}">${isLow ? 'REORDER' : 'IN STOCK'}</span></td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error("Sync Error:", err);
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger p-4">Warehouse Database Offline.</td></tr>`;
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
                <td><code class="fw-bold">${order.poNumber || 'PO-NEW'}</code></td>
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
        deliveryTable.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Delivery Registry sync error.</td></tr>`;
    }
}

async function receiveGoods(procurementId, itemId, quantity) {
    if (!confirm(`Confirm physical receipt of ${quantity} units?`)) return;

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
            alert("Success: Inventory incremented.");
            syncWarehouse();
            loadExpectedDeliveries();
            loadMovementHistory(); 
        } else {
            alert("Error finalizing receipt.");
        }
    } catch (err) {
        alert("Connection Failure.");
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
                <td><strong>${m.itemDescription || 'Inventory Update'}</strong></td>
                <td>
                    <span class="status-pill ${m.movementType === 'IN' ? 'status-approved' : 'status-rejected'}">
                        ${m.movementType}
                    </span>
                </td>
                <td class="fw-bold">${m.quantity}</td>
                <td><code>${m.referenceNumber || 'REF-LOG'}</code></td>
                <td class="small">${m.handledBy}</td>
            </tr>
        `).join('');
    } catch (err) { console.error("Audit log error:", err); }
}

function updateElement(id, val) {
    const el = document.getElementById(id);
    if(el) el.innerText = val;
}
/** --- 5. SESSION TERMINATION --- **/
function logout() {
    // Prevent default anchor behavior if called from an <a> tag
    if (event) event.preventDefault();

    if (confirm("Log out of Willowton PMS?")) {
        console.log("Willowton PMS: Clearing session...");
        
        // Clear all data
        localStorage.clear();
        
        // Redirect
        window.location.href = 'index.html';
    }
}
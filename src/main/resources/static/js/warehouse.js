/**
 * WILLOWTON PMS - WAREHOUSE MODULE
 * Focus: Stock Inventory & User Session
 */

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    loadUserProfile();
    
    // Load the three main data components
    syncWarehouse();           // The Stock Catalog
    loadExpectedDeliveries();  // The "Approved" orders from Finance
    loadMovementHistory();     // <-- ADD THIS LINE HERE!
});

/** --- SECTION 1: USER SESSION & ACCESS CONTROL --- **/

function checkSession() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) {
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userJson);
    const path = window.location.pathname;

    // RBAC: Only allow Warehouse Supervisor (4) or Admin (1)
    const allowedRoles = [1, 4];
    if (!allowedRoles.includes(user.roleId) && path.includes('warehouse_dashboard.html')) {
        alert("Access Denied: This area is restricted to Warehouse personnel.");
        // Redirect non-warehouse staff to their respective homes
        redirectUserByRole(user.roleId);
    }
}

function loadUserProfile() {
    const userJson = localStorage.getItem('currentUser');
    
    // 1. DEBUG: Right-click your page -> Inspect -> Console. 
    // Check if the output shows "roleId" or "role_id".
    console.log("Logged in User Object:", JSON.parse(userJson));

    if (!userJson) return;

    const user = JSON.parse(userJson);
    const nameDisplay = document.getElementById('user-display-name');
    const roleDisplay = document.getElementById('user-role-label');

    // 2. Map Name (Try both camelCase and snake_case to be safe)
    const displayName = user.fullName || user.full_name || "User";
    if (nameDisplay) {
        nameDisplay.innerHTML = `<i class="fas fa-user-circle"></i> ${displayName}`;
    }

    // 3. Map Role (Matching the IDs in your Redirect Logic)
    if (roleDisplay) {
        const roles = {
            1: 'System Admin',
            2: 'Procurement Officer',
            3: 'Finance Manager',
            4: 'Warehouse Supervisor'
        };

        // Try both camelCase and snake_case for the ID
        const rid = user.roleId || user.role_id;
        
        if (rid && roles[rid]) {
            roleDisplay.innerText = roles[rid];
        } else {
            roleDisplay.innerText = "Warehouse Staff"; 
        }
    }
}

/** --- SECTION 2: INVENTORY LOGIC --- **/

async function syncWarehouse() {
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) return;

    try {
        const res = await fetch(`${API_BASE}/items`);
        if (!res.ok) throw new Error("Connection to database failed");
        
        const items = await res.json();

        // 1. Calculate Professional Metrics
        const totalItems = items.length;
        const lowStockItems = items.filter(item => (item.stockLevel || 0) <= 10).length;
        const totalValue = items.reduce((acc, item) => acc + ((item.lastUnitPrice || 0) * (item.stockLevel || 0)), 0);

        // 2. Update Metric Cards
        document.getElementById('total-sku-count').innerText = totalItems;
        document.getElementById('low-stock-count').innerText = lowStockItems;
        document.getElementById('stock-valuation').innerText = formatZMW(totalValue);

        // 3. Clear Spinner and Render
        tableBody.innerHTML = '';

        if (items.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px;">No inventory data available.</td></tr>`;
            return;
        }

tableBody.innerHTML = items.map(item => {
    const isLow = (item.stockLevel || 0) <= 10;
    
    // Status Logic: If stock is <= 10, force 'LOW STOCK' appearance
    const statusClass = isLow ? 'status-rejected' : 'status-approved';
    const statusText = isLow ? 'LOW STOCK' : (item.status || 'ACTIVE');

    return `
        <tr>
            <td>
                <div style="font-weight:700; color:var(--primary);">${item.description}</div>
                <small style="color:var(--text-muted)">Code: ${item.itemCode}</small>
            </td>
            <td><span class="category-pill">${item.category}</span></td>
            <td>
                <strong>${item.stockLevel.toLocaleString()}</strong> 
                <small style="color:var(--text-muted); font-weight:600;">${item.unitOfMeasure || ''}</small>
            </td>
            <td>${formatZMW(item.lastUnitPrice)}</td>
            <td><span class="status-pill ${statusClass}">${statusText}</span></td>
        </tr>
    `;
}).join('');

    } catch (err) {
        console.error("Sync Error:", err);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--danger); padding:20px;">
            <i class="fas fa-exclamation-circle"></i> Error: Could not connect to the database.
        </td></tr>`;
    }
}

/**
 * 1. Fetch orders approved by Finance
 */
async function loadExpectedDeliveries() {
    const deliveryTable = document.getElementById('expected-deliveries-body');
    
    try {
        // Point to the new professional Warehouse endpoint we built in the Controller
        const res = await fetch(`${API_BASE}/warehouse/deliveries`);
        
        if (!res.ok) throw new Error("Failed to fetch from warehouse API");
        
        const orders = await res.json();

        // Debug: See what exactly is coming back from Java
        console.log("Warehouse Orders:", orders);

        if (orders.length === 0) {
            deliveryTable.innerHTML = `<tr><td colspan="5" style="text-align:center;">No incoming deliveries scheduled.</td></tr>`;
            return;
        }

        deliveryTable.innerHTML = orders.map(order => `
            <tr>
                <td><code style="font-weight:700;">${order.poNumber}</code></td>
                <td>
                    <strong>${order.itemName}</strong><br>
                    <small>${order.status || 'APPROVED'}</small>
                </td>
                <td>${order.quantity} ${order.unit || ''}</td>
                <td>${order.supplierName}</td>
                <td>
                    <button class="btn-primary" onclick="receiveGoods(${order.id}, ${order.itemId}, ${order.quantity})">
                        <i class="fas fa-check-circle"></i> Mark as Received
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        console.error("Delivery Load Error:", err);
        deliveryTable.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Error connecting to warehouse system.</td></tr>`;
    }
}

/**
 * 2. Process Goods Receipt
 * This function triggers the inventory update and changes the PO status.
 */
async function receiveGoods(procurementId, itemId, quantity) {
    const confirmation = confirm(`Are you sure you want to receive ${quantity} units? This will update the official Stock Inventory.`);
    
    if (!confirmation) return;

    try {
        // We send a POST to a specialized "receive" endpoint
        // This handles: Status Change, Inventory Increment, and Movement Log
        const response = await fetch(`${API_BASE}/warehouse/receive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                procurementId: procurementId,
                itemId: itemId,
                receivedQuantity: quantity,
                receivedBy: JSON.parse(localStorage.getItem('currentUser')).fullName
            })
        });

        if (response.ok) {
            alert("Inventory Updated Successfully! Stock levels have been adjusted.");
            
            // Refresh both tables to show the new stock levels and remove the delivery from the list
            loadExpectedDeliveries();
            syncWarehouse();
            loadMovementHistory(); 
        } else {
            const error = await response.json();
            alert("Error: " + (error.message || "Could not process receipt."));
        }
    } catch (err) {
        console.error("Receipt Error:", err);
        alert("Server connection lost. Please check if the backend is running.");
    }
}

async function loadMovementHistory() {
    const historyTable = document.getElementById('movement-history-body');
    if (!historyTable) return;

    try {
        // 1. Fetch from the correct Warehouse endpoint
        const res = await fetch(`${API_BASE}/warehouse/movements`); 
        
        if (!res.ok) {
            console.error("Server Status:", res.status);
            throw new Error("Movement API not found");
        }
        
        const movements = await res.json();
        console.log("Movements from DB:", movements); 

        // 2. Handle empty state
        if (!movements || movements.length === 0) {
            historyTable.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">No movement history found.</td></tr>`;
            return;
        }

        // 3. Render the rows correctly inside the function
      historyTable.innerHTML = movements.map(m => `
    <tr>
        <td>${new Date(m.timestamp).toLocaleString('en-GB')}</td>
        <td>
            <strong>${m.item_description}</strong><br>
            <small class="text-muted">ID: ${m.item_id}</small>
        </td>
        <td>
            <span class="status-pill ${m.movement_type === 'IN' ? 'status-approved' : 'status-rejected'}">
                ${m.movement_type}
            </span>
        </td>
        <td><strong>${m.quantity}</strong></td>
        <td><code>${m.reference_number || 'N/A'}</code></td>
        <td><i class="fas fa-user-check"></i> ${m.handled_by}</td>
    </tr>
`).join('');

    } catch (err) {
        console.error("Audit Log Error:", err);
        historyTable.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red; padding:20px;">
            <i class="fas fa-exclamation-triangle"></i> Error loading audit log.
        </td></tr>`;
    }
}

/** --- SECTION 3: UTILITIES --- **/

function filterInventory() {
    const query = document.getElementById('inventorySearch').value.toLowerCase();
    const rows = document.querySelectorAll('#inventory-table-body tr');
    
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}

function formatZMW(amount) {
    return new Intl.NumberFormat('en-ZM', {
        style: 'currency',
        currency: 'ZMW'
    }).format(amount);
}

function redirectUserByRole(roleId) {
    if (roleId === 1) window.location.href = 'admin_dashboard.html';
    else if (roleId === 2) window.location.href = 'procurement_dashboard.html';
    else if (roleId === 3) window.location.href = 'manager_dashboard.html';
    else window.location.href = 'login.html';
}

function logout() {
    if (confirm("Log out of Willowton PMS?")) {
        localStorage.clear();
        window.location.href = 'login.html';
    }
}
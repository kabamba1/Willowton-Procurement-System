document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user && user.fullName) {
        document.getElementById('user-display-name').textContent = user.fullName;
    }

    fetchDashboardStats();
    fetchRecentOrders();
});

async function fetchDashboardStats() {
    try {
        const response = await fetch(`${API_BASE}/purchase_orders/stats`);
        if (!response.ok) throw new Error("Stats fetch failed");
        
        const stats = await response.json();
        console.log("Stats received:", stats);

        // 1. Update "My Active Requests"
        const activeReq = document.getElementById('active-req-count');
        if (activeReq) {
            activeReq.textContent = stats.activeRequests || 0;
        }

        // 2. Update "Completed (30 Days)"
        const completed = document.getElementById('completed-count');
        if (completed) {
            completed.textContent = stats.completedCount || 0;
        }

    } catch (err) {
        console.error("Failed to load Willowton stats:", err);
    }
}

async function fetchRecentOrders() {
    const tableBody = document.getElementById('recent-orders-table');
    try {
        // FIX: Change '/orders/recent' to '/purchase_orders/recent'
        const response = await fetch(`${API_BASE}/purchase_orders/recent`);
        if (!response.ok) throw new Error("Orders fetch failed");
        
        const orders = await response.json();

        if (orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No recent orders found.</td></tr>';
            return;
        }

        tableBody.innerHTML = ''; 

        // Inside fetchRecentOrders loop
orders.forEach(order => {
    const status = order.status || 'Pending';
    const notes = order.notes || ''; // This is where we saved the reason
    
    let statusDisplay = status;
    
    // If rejected, make the status clickable or add the reason next to it
    if (status === 'REJECTED') {
        statusDisplay = `<span title="Reason: ${notes}" style="cursor:help; text-decoration:underline dot;">REJECTED</span>`;
    }

    const row = `
        <tr>
            <td><strong>${order.poNumber || 'TBD'}</strong></td>
            <td>${order.supplierName}</td>
            <td>${formatZMW(order.totalAmount)}</td>
            <td><span class="status-badge status-${status.toLowerCase()}">${statusDisplay}</span></td>
        </tr>
    `;
    tableBody.insertAdjacentHTML('beforeend', row);
});

        orders.forEach(order => {
            // Using the DTO field names: poNumber, supplierName, totalAmount, status
            const poNum = order.poNumber || 'N/A';
            const sName = order.supplierName || 'Unknown';
            const amount = order.totalAmount || 0;
            const status = order.status || 'Pending';
            
            const statusClass = status.toLowerCase().replace(/\s+/g, '-');

            const row = `
                <tr>
                    <td><strong>${poNum}</strong></td>
                    <td>${sName}</td>
                    <td>${formatZMW(amount)}</td>
                    <td><span class="status-badge status-${statusClass}">${status}</span></td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    } catch (err) {
        console.error("Fetch Error:", err);
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Error connecting to server.</td></tr>';
    }
}
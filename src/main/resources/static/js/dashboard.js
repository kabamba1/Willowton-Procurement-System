/** * --- WILLOWTON PROCUREMENT DASHBOARD --- 
 * Handles real-time stats and recent order tracking for Procurement Officers.
 * Dependency: config.js and auth-session.js must be loaded first.
 **/

document.addEventListener('DOMContentLoaded', () => {
    // 1. Context and stats are handled by auth-session.js
    // but we trigger the specific data syncs here.
    fetchDashboardStats();
    fetchRecentOrders();
});

/**
 * 1. FETCH DASHBOARD STATS
 * Updates the summary cards (Active Requests, Completed 30 Days).
 */
async function fetchDashboardStats() {
    try {
        // Pointing to: https://willowton-pms.onrender.com/api/purchase_orders/stats
        const response = await fetch(`${API_BASE_URL}/purchase_orders/stats`);
        if (!response.ok) throw new Error("Stats sync failed");
        
        const stats = await response.json();

        const activeReq = document.getElementById('active-req-count');
        const completed = document.getElementById('completed-count');

        if (activeReq) activeReq.textContent = stats.activeRequests || 0;
        if (completed) completed.textContent = stats.completedCount || 0;

    } catch (err) {
        console.error("Dashboard Stats Error:", err);
    }
}

/**
 * 2. FETCH RECENT ORDERS
 * Populates the main dashboard table with the latest PO activity.
 */
async function fetchRecentOrders() {
    const tableBody = document.getElementById('recent-orders-table');
    if (!tableBody) return;

    try {
        const response = await fetch(`${API_BASE_URL}/purchase_orders/recent`);
        if (!response.ok) throw new Error("Orders fetch failed");
        
        const orders = await response.json();

        if (orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No recent orders recorded.</td></tr>';
            return;
        }

        tableBody.innerHTML = ''; // Clear loading state

        orders.forEach(order => {
            const status = order.status || 'PENDING';
            const notes = order.notes || 'No reason provided'; 
            const amount = order.totalAmount || 0;
            const poNum = order.poNumber || 'TBD';
            const sName = order.supplierName || 'Unknown Supplier';

            // Visual Logic for Status Display
            let statusDisplay = status.toUpperCase();
            if (status.toUpperCase() === 'REJECTED') {
                statusDisplay = `<span title="Reason: ${notes}" style="cursor:help; text-decoration:underline dotted;">REJECTED <i class="fas fa-info-circle"></i></span>`;
            }

            const statusClass = status.toLowerCase().replace(/\s+/g, '-');

            // formatZMW is provided by auth-session.js
            const row = `
                <tr>
                    <td><strong>${poNum}</strong></td>
                    <td>${sName}</td>
                    <td>${typeof formatZMW === 'function' ? formatZMW(amount) : 'K' + amount}</td>
                    <td><span class="status-badge status-${statusClass}">${statusDisplay}</span></td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

    } catch (err) {
        console.error("Orders Table Error:", err);
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Lost connection to Willowton Cloud.</td></tr>';
    }
}
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    loadPendingOrders();
});

// Alias for the HTML button
function loadApprovals() {
    loadPendingOrders();
}

function logout() {
    if (confirm("Are you sure you want to log out of the Willowton Finance Portal?")) {
        // Clear session data
        localStorage.removeItem('currentUser');
        // If you saved anything else like 'token', clear it too
        // localStorage.clear(); // Use this to wipe everything at once
        
        // Redirect to login
        window.location.href = 'login.html';
    }
}

async function loadDashboardStats() {
    try {
        const res = await fetch(`${API_BASE}/purchase_orders`);
        const allOrders = await res.json();
        
        const pendingOrders = allOrders.filter(o => o.status === 'PENDING');
        const pendingValue = pendingOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
        
        // This pulls the dynamic limit we set in the Budget Room
        const monthlyLimit = parseFloat(localStorage.getItem('last_active_limit')) || 500000;
        const totalSpent = allOrders.filter(o => o.status === 'APPROVED' || o.status === 'RECEIVED')
                                    .reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
        const budgetPercent = Math.min(((totalSpent / monthlyLimit) * 100), 100).toFixed(0);

        document.getElementById('pending-count').textContent = pendingOrders.length;
        document.getElementById('pending-value').textContent = formatZMW(pendingValue);
        
        // Target the 42% card
        const budgetEl = document.getElementById('budget-percent');
        if (budgetEl) {
            budgetEl.textContent = `${budgetPercent}%`;
            // Visual warning if high
            budgetEl.style.color = budgetPercent > 90 ? 'var(--danger)' : 'var(--primary)';
        }

    } catch (err) {
        console.error("Stats Error:", err);
    }
}

// 3. Fetch Table Rows
async function loadPendingOrders() {
    const tableBody = document.getElementById('approval-table');
    
    try {
        const res = await fetch(`${API_BASE}/purchase_orders`);
        const orders = await res.json();
        
        // Ensure we only show PENDING items
        const pending = orders.filter(o => o.status && o.status.toUpperCase() === 'PENDING');

        if (pending.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">No pending authorizations found.</td></tr>';
            return;
        }

tableBody.innerHTML = pending.map(order => {
    const categoryText = order.category || 'Operations';
    const catClass = `cat-${categoryText.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Safety check for status case
    const currentStatus = (order.status || 'PENDING').toUpperCase();

    return `
        <tr>
            <td><strong>${order.poNumber || 'TBD'}</strong></td>
            <td>
                <div style="font-weight: 600;">${order.creator?.fullName || 'M. Kabamba'}</div>
                <small style="color: var(--text-muted);">Procurement Dept</small>
            </td>
            <td>
                <span class="category-pill ${catClass}">${categoryText}</span>
                <div style="font-size: 0.8rem; margin-top: 4px;">${order.supplier?.companyName || 'General Vendor'}</div>
            </td>
            <td style="font-weight: 700; color: var(--primary);">${formatZMW(order.totalAmount)}</td>
            <td style="text-align: center;">
                <button onclick="updateOrderStatus(${order.orderId}, 'APPROVED')" class="btn-approve" title="Approve">
                    <i class="fas fa-check"></i>
                </button>
                <button onclick="updateOrderStatus(${order.orderId}, 'REJECTED')" class="btn-reject" style="margin-left:8px;" title="Reject">
                    <i class="fas fa-times"></i>
            </td>
        </tr>
    `;
}).join('');
    } catch (err) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Connection to Willowton Server Failed.</td></tr>';
    }
}

// 4. Handle Approval/Rejection
async function updateOrderStatus(id, newStatus) {
    if (newStatus === 'REJECTED') {
        // Open modal instead of instant update
        document.getElementById('rejectOrderId').value = id;
        document.getElementById('rejectionModal').style.display = 'flex';
        return;
    }

    // Direct Approval logic
    if (!confirm(`Authorize this expenditure?`)) return;
    executeStatusUpdate(id, 'APPROVED', 'Authorized');
}

// 2. Submit Rejection with Notes
async function submitRejection() {
    const id = document.getElementById('rejectOrderId').value;
    const reason = document.getElementById('rejectionReason').value;

    if (!reason.trim()) {
        alert("Please provide a reason for rejection.");
        return;
    }

    executeStatusUpdate(id, 'REJECTED', reason);
}

// 3. Central Update Execution
async function executeStatusUpdate(id, status, notes) {
    try {
        const res = await fetch(`${API_BASE}/purchase_orders/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                status: status,
                managerNotes: notes // This sends the reason to the DB
            })
        });

        if (res.ok) {
            alert(`Order status updated: ${status}`);
            location.reload();
        }
    } catch (err) {
        alert("Server communication error.");
    }
}

// Modal Controls
window.closeRejectionModal = () => {
    document.getElementById('rejectionModal').style.display = 'none';
    document.getElementById('rejectionReason').value = '';
};
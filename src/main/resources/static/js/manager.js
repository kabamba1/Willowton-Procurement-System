/** * --- WILLOWTON FINANCE AUTHORIZATION LOGIC --- 
 * Handles budget tracking and the Approval/Rejection workflow.
 * Dependencies: config.js and auth-session.js must be loaded first.
 **/

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    loadPendingOrders();
});

// Refresh alias for the UI button
function loadApprovals() {
    loadPendingOrders();
    loadDashboardStats();
}

/**
 * 1. DASHBOARD ANALYTICS
 * Updates Pending Value and Budget Utilization percentage.
 */
async function loadDashboardStats() {
    try {
        // Points to: https://willowton-pms.onrender.com/api/purchase_orders
        const res = await fetch(`${API_BASE_URL}/purchase_orders`);
        if (!res.ok) throw new Error("Stats sync failed");
        
        const allOrders = await res.json();
        const now = new Date();
        
        // Calculate Pending Queue (Items needing John Phiri's attention)
        const pendingOrders = allOrders.filter(o => o.status === 'PENDING');
        const pendingValue = pendingOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
        
        // Budget Utilization Logic
        const monthlyLimit = parseFloat(localStorage.getItem('last_active_limit')) || 500000;
        
        // Only sum orders from the CURRENT month for the % utilization card
        const currentMonthSpent = allOrders.filter(o => {
            const d = new Date(o.createdAt);
            return (o.status === 'APPROVED' || o.status === 'RECEIVED') &&
                   d.getMonth() === now.getMonth() &&
                   d.getFullYear() === now.getFullYear();
        }).reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
        
        const budgetPercent = Math.min(((currentMonthSpent / monthlyLimit) * 100), 100).toFixed(0);

        // UI Mapping
        const countEl = document.getElementById('pending-count');
        const valueEl = document.getElementById('pending-value');
        const budgetEl = document.getElementById('budget-percent');

        if (countEl) countEl.textContent = pendingOrders.length;
        if (valueEl) valueEl.textContent = formatZMW(pendingValue); // formatZMW from auth-session.js
        
        if (budgetEl) {
            budgetEl.textContent = `${budgetPercent}%`;
            budgetEl.className = budgetPercent > 90 ? 'text-danger fw-bold' : 'text-primary';
        }

    } catch (err) {
        console.error("Finance Analytics Error:", err);
    }
}

/**
 * 2. LOAD PENDING QUEUE
 */
async function loadPendingOrders() {
    const tableBody = document.getElementById('approval-table');
    if (!tableBody) return;
    
    try {
        const res = await fetch(`${API_BASE_URL}/purchase_orders`);
        const orders = await res.json();
        
        const pending = orders.filter(o => o.status && o.status.toUpperCase() === 'PENDING');

        if (pending.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-4">No pending authorizations in the queue.</td></tr>';
            return;
        }

        tableBody.innerHTML = pending.map(order => {
            const categoryText = order.category || 'Operations';
            const catClass = `cat-${categoryText.toLowerCase().replace(/\s+/g, '-')}`;
            
            return `
                <tr>
                    <td><strong>${order.poNumber || 'TBD'}</strong></td>
                    <td>
                        <div class="fw-bold">${order.creatorName || order.creator?.fullName || 'Procurement Officer'}</div>
                        <small class="text-muted">Willowton Procurement</small>
                    </td>
                    <td>
                        <span class="category-pill ${catClass}">${categoryText}</span>
                        <div class="small mt-1">${order.supplierName || 'Unknown Vendor'}</div>
                    </td>
                    <td class="fw-bold text-primary">${formatZMW(order.totalAmount)}</td>
                    <td class="text-center">
                        <button onclick="updateOrderStatus(${order.orderId}, 'APPROVED')" class="btn-approve" title="Approve Expenditure">
                            <i class="fas fa-check"></i>
                        </button>
                        <button onclick="updateOrderStatus(${order.orderId}, 'REJECTED')" class="btn-reject ms-2" title="Reject with Reason">
                            <i class="fas fa-times"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error("Queue Load Error:", err);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Lost connection to Finance Registry.</td></tr>';
    }
}

/**
 * 3. APPROVAL/REJECTION WORKFLOW
 */
async function updateOrderStatus(id, newStatus) {
    if (newStatus === 'REJECTED') {
        const modalIdInput = document.getElementById('rejectOrderId');
        if (modalIdInput) modalIdInput.value = id;
        document.getElementById('rejectionModal').style.display = 'flex';
        return;
    }

    if (!confirm(`Authorize this K${id} expenditure?`)) return;
    executeStatusUpdate(id, 'APPROVED', 'Authorized for procurement.');
}

async function submitRejection() {
    const id = document.getElementById('rejectOrderId').value;
    const reason = document.getElementById('rejectionReason').value;

    if (!reason.trim()) {
        alert("A rejection reason is required for the audit trail.");
        return;
    }

    executeStatusUpdate(id, 'REJECTED', reason);
}

/**
 * 4. API EXECUTION
 */
async function executeStatusUpdate(id, status, notes) {
    try {
        const res = await fetch(`${API_BASE_URL}/purchase_orders/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                status: status,
                managerNotes: notes 
            })
        });

        if (res.ok) {
            alert(`Order successfully ${status.toLowerCase()}.`);
            location.reload();
        } else {
            alert("Authorization failed. Ensure server is reachable.");
        }
    } catch (err) {
        alert("Network failure: Willowton Cloud could not be updated.");
    }
}

// Global UI Controls
window.closeRejectionModal = () => {
    document.getElementById('rejectionModal').style.display = 'none';
    const reasonInput = document.getElementById('rejectionReason');
    if (reasonInput) reasonInput.value = '';
};
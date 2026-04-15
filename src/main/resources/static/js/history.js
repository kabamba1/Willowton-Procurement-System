/** * --- WILLOWTON PROCUREMENT AUDIT TRAIL --- 
 * Handles historical records and manager decision tracking.
 * Dependencies: config.js and auth-session.js must be loaded first.
 **/

document.addEventListener('DOMContentLoaded', () => {
    loadAuditTrail();
    setupAuditSearch();
});

/**
 * 1. CORE AUDIT LOGIC
 */
async function loadAuditTrail() {
    const tableBody = document.getElementById('audit-table-body');
    if (!tableBody) return; 
    
    try {
        // Fetching all orders from: https://willowton-pms.onrender.com/api/purchase_orders
        const res = await fetch(`${API_BASE_URL}/purchase_orders`);
        if (!res.ok) throw new Error("Cloud data sync failed");
        
        const orders = await res.json();
        
        // Audit Trail focuses on history. We exclude PENDING to show only finalized decisions.
        const history = orders.filter(o => o.status && o.status !== 'PENDING');

        if (history.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No historical records found in Willowton Cloud.</td></tr>';
            return;
        }

        // Show newest records first (Chronological Audit)
        tableBody.innerHTML = history.reverse().map(order => {
            const status = order.status || 'UNKNOWN';
            const isApproved = status === 'APPROVED' || status === 'RECEIVED';
            
            // UI Class mapping based on your CSS variables
            const statusClass = isApproved ? 'status-approved' : 'status-rejected';
            const statusIcon = isApproved ? 'fa-check-circle' : 'fa-times-circle';
            
            // Use updatedAt (decision time) or fall back to createdAt
            const dateSource = order.updatedAt || order.createdAt;
            const decisionDate = new Date(dateSource).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric'
            });

            // Map data keys (Handling both potential DB structures)
            const supplier = order.supplierName || (order.supplier?.companyName) || 'N/A';
            const notes = order.notes || order.managerNotes || '--';

            return `
                <tr>
                    <td><small class="fw-bold text-muted">${decisionDate}</small></td>
                    <td><strong>${order.poNumber || 'TBD'}</strong></td>
                    <td>${supplier}</td>
                    <td class="fw-bold">${formatZMW(order.totalAmount)}</td>
                    <td>
                        <span class="status-pill ${statusClass}">
                            <i class="fas ${statusIcon}"></i> ${status}
                        </span>
                    </td>
                    <td class="text-muted small italic">
                        "${notes}"
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error("Audit Sync Error:", err);
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Connection to Willowton Cloud failed. Check your network.</td></tr>';
    }
}

/**
 * 2. LIVE SEARCH / FILTERING
 */
function setupAuditSearch() {
    const searchInput = document.getElementById('auditSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#audit-table-body tr');
        
        rows.forEach(row => {
            // Evaluates visibility based on the search term matching any column in the row
            row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
        });
    });
}
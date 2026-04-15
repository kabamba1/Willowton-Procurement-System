const API_BASE = "http://localhost:8081/api";

const formatZMW = (amount) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
};

document.addEventListener('DOMContentLoaded', () => {
    loadAuditTrail();
    setupAuditSearch();
});

async function loadAuditTrail() {
    const tableBody = document.getElementById('audit-table-body');
    
    try {
        const res = await fetch(`${API_BASE}/purchase_orders`);
        const orders = await res.json();
        
        // Filter out PENDING items - we only want the "History"
        const history = orders.filter(o => o.status !== 'PENDING');

        if (history.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No historical records found.</td></tr>';
            return;
        }

        tableBody.innerHTML = history.reverse().map(order => {
            const isApproved = order.status === 'APPROVED' || order.status === 'RECEIVED';
            const statusClass = isApproved ? 'status-approved' : 'status-rejected';
            const statusIcon = isApproved ? 'fa-check-circle' : 'fa-times-circle';
            
            // Format the date (assuming updatedAt exists in your DB)
            const decisionDate = new Date(order.updatedAt || order.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric'
            });

            return `
                <tr>
                    <td><small style="font-weight:600; color:var(--text-muted);">${decisionDate}</small></td>
                    <td><strong>${order.poNumber}</strong></td>
                    <td>${order.supplier?.companyName || 'N/A'}</td>
                    <td style="font-weight:700;">${formatZMW(order.totalAmount)}</td>
                    <td>
                        <span class="status-pill ${statusClass}">
                            <i class="fas ${statusIcon}"></i> ${order.status}
                        </span>
                    </td>
                    <td style="font-style: italic; color: var(--text-muted); font-size: 0.85rem;">
                        ${order.managerNotes || '--'}
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Failed to load audit data.</td></tr>';
    }
}

function setupAuditSearch() {
    document.getElementById('auditSearch').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#audit-table-body tr');
        rows.forEach(row => {
            row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
        });
    });
}
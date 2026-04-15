/** * --- WILLOWTON WAREHOUSE AUDIT & MOVEMENT LOGIC --- 
 * Provides a read-only historical ledger of physical stock changes.
 * Dependencies: config.js and auth-session.js must be loaded first.
 **/

document.addEventListener('DOMContentLoaded', () => {
    // Shared display logic from auth-session.js
    if (typeof displayUserName === 'function') displayUserName();
    
    loadMovementHistory(); 
});

/**
 * 1. FETCH & RENDER MOVEMENT LEDGER
 * Aggregates all stock "IN" (Receiving) and "OUT" (Dispatch/Usage) events.
 */
async function loadMovementHistory() {
    const historyTable = document.getElementById('movements-table-body');
    if (!historyTable) return;

    try {
        // Pointing to the specific warehouse movement endpoint
        const res = await fetch(`${API_BASE_URL}/warehouse/movements`); 
        if (!res.ok) throw new Error("Registry Sync Failed");
        
        const movements = await res.json();

        if (!movements || movements.length === 0) {
            historyTable.innerHTML = `<tr><td colspan="6" class="text-center p-4">No movement history found in the Willowton registry.</td></tr>`;
            return;
        }

        // Show latest movements at the top (Audit Trail Standard)
        historyTable.innerHTML = movements.reverse().map(m => {
            // Flexible mapping for robust DB integration
            const displayItem = m.item_description || m.itemDescription || m.itemName || "Unknown SKU";
            const displayType = (m.movement_type || m.movementType || m.type || "IN").toUpperCase();
            const displayQty  = m.quantity || 0;
            const displayRef  = m.reference_number || m.referenceNumber || m.reference || "N/A";
            const displayUser = m.handled_by || m.handledBy || m.userName || "System Admin";
            const displayDate = m.timestamp ? new Date(m.timestamp).toLocaleString('en-GB') : "Recently";

            // Logic to color-code the movement direction
            const typeClass = displayType === 'IN' ? 'status-active' : 'status-inactive';
            const iconClass = displayType === 'IN' ? 'fa-arrow-down-long text-success' : 'fa-arrow-up-long text-danger';

            return `
                <tr>
                    <td class="small text-muted">${displayDate}</td>
                    <td><strong>${displayItem}</strong></td>
                    <td>
                        <span class="status-pill ${typeClass}">
                            <i class="fa-solid ${iconClass} me-1"></i> ${displayType}
                        </span>
                    </td>
                    <td class="fw-bold">${displayQty}</td>
                    <td><code class="text-primary">${displayRef}</code></td>
                    <td>
                        <div class="d-flex align-items-center">
                            <i class="fas fa-user-check me-2 opacity-50"></i>
                            <span class="small">${displayUser}</span>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error("Audit Log Sync Error:", err);
        historyTable.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger p-4">
                    <i class="fas fa-link-slash mb-2 d-block"></i>
                    Cloud Registry Offline. Verify Willowton Render instance status.
                </td>
            </tr>`;
    }
}

/**
 * 2. SECURITY & SESSION MANAGEMENT
 */
function logout() {
    if (confirm("Confirm sign-out from Willowton Warehouse Portal?")) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}
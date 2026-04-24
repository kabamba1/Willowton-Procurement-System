/** * --- WILLOWTON WAREHOUSE AUDIT & MOVEMENT LOGIC --- 
 * Provides a read-only historical ledger of physical stock changes.
 **/

document.addEventListener('DOMContentLoaded', () => {
    // 1. Run the session check first to fill the header
    checkSession();
    
    // 2. Load the data
    loadMovementHistory(); 
});

/**
 * 1. SECURITY & SESSION MANAGEMENT
 * Pulls the real name and role from the database via localStorage
 */
function checkSession() {
    const userJson = localStorage.getItem('currentUser');
    
    if (!userJson) {
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userJson);
    
    // Set the User Name (No longer hardcoded)
    const nameDisplay = document.getElementById('user-display-name');
    if (nameDisplay) {
        nameDisplay.innerText = user.fullName || "Unknown User";
    }

    // Set the Role Label dynamically
    const roleDisplay = document.getElementById('user-role-label');
    if (roleDisplay) {
        const roleMap = {
            1: "System Admin",
            2: "Finance Manager",
            3: "Procurement Officer",
            4: "Warehouse Supervisor"
        };
        
        const rid = user.roleId || (user.role ? user.role.roleId : null);
        roleDisplay.innerText = roleMap[rid] || "Staff Member";
    }
}

/**
 * 2. FETCH & RENDER MOVEMENT LEDGER
 */
async function loadMovementHistory() {
    const historyTable = document.getElementById('movements-table-body');
    if (!historyTable) return;

    try {
        const res = await fetch(`${API_BASE_URL}/warehouse/movements`); 
        if (!res.ok) throw new Error("Registry Sync Failed");
        
        const movements = await res.json();

        if (!movements || movements.length === 0) {
            historyTable.innerHTML = `<tr><td colspan="6" class="text-center p-4">No movement history found.</td></tr>`;
            return;
        }

        historyTable.innerHTML = movements.reverse().map(m => {
            const displayItem = m.description || m.itemDescription || "Unknown SKU";
            const displayType = (m.movementType || "IN").toUpperCase();
            const displayQty  = m.quantity || 0;
            const displayRef  = m.referenceNumber || "N/A";
            const displayUser = m.handledBy || "System";
            const displayDate = m.timestamp ? new Date(m.timestamp).toLocaleString('en-GB') : "Recently";

            const typeClass = displayType === 'IN' ? 'status-approved' : 'status-rejected';
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
        console.error("Audit Log Error:", err);
        historyTable.innerHTML = `<tr><td colspan="6" class="text-center text-danger p-4">Registry Offline.</td></tr>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    loadMovementHistory(); // Use a consistent function name
});

async function loadMovementHistory() {
    // 1. Match the ID in your HTML exactly!
    const historyTable = document.getElementById('movements-table-body');
    if (!historyTable) return;

    try {
        const res = await fetch(`${API_BASE}/warehouse/movements`); 
        if (!res.ok) throw new Error("API Error");
        
        const movements = await res.json();
        console.log("Verified Data from DB:", movements);

        if (!movements || movements.length === 0) {
            historyTable.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">No movement history found.</td></tr>`;
            return;
        }

        historyTable.innerHTML = movements.map(m => {
            // Flexible mapping for snake_case vs camelCase
            const displayItem = m.item_description || m.itemDescription || m.itemName || "Unknown Item";
            const displayType = m.movement_type || m.movementType || m.type || "IN";
            const displayQty  = m.quantity || 0;
            const displayRef  = m.reference_number || m.referenceNumber || m.reference || "N/A";
            const displayUser = m.handled_by || m.handledBy || m.userName || "System";
            const displayDate = m.timestamp ? new Date(m.timestamp).toLocaleString('en-GB') : "Recently";

            return `
                <tr>
                    <td>${displayDate}</td>
                    <td><strong>${displayItem}</strong></td>
                    <td>
                        <span class="status-pill ${displayType === 'IN' ? 'status-approved' : 'status-rejected'}">
                            ${displayType}
                        </span>
                    </td>
                    <td><strong>${displayQty}</strong></td>
                    <td><code>${displayRef}</code></td>
                    <td><i class="fas fa-user-check"></i> ${displayUser}</td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error("Audit Log Error:", err);
        historyTable.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red; padding:20px;">
            <i class="fas fa-exclamation-triangle"></i> Error connecting to database.
        </td></tr>`;
    }
}

function loadUserProfile() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;
    document.getElementById('user-display-name').innerText = user.fullName || user.full_name;
    document.getElementById('user-role-label').innerText = "Warehouse Supervisor";
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}
/** * --- WILLOWTON BUDGET & FISCAL MANAGEMENT --- 
 * Handles monthly limits, spending calculations, and fiscal archiving.
 * Note: config.js and auth-session.js must be loaded before this script.
 **/

/**
 * 1. INITIALIZATION
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeBudget();
});

async function initializeBudget() {
    const period = getPeriodKey();
    const storageKey = `willowton_budget_${period}`;
    
    // Get the limit for THIS month specifically
    let currentLimit = localStorage.getItem(storageKey);
    
    // Auto-rollover: If no limit exists for this month, inherit last month's
    if (!currentLimit) {
        currentLimit = localStorage.getItem('last_active_limit') || 500000;
        localStorage.setItem(storageKey, currentLimit);
    }

    // Set the input field value for the manager
    const inputEl = document.getElementById('monthlyLimitInput');
    if (inputEl) inputEl.value = currentLimit;

    try {
        // Points to: https://willowton-pms.onrender.com/api/purchase_orders
        const res = await fetch(`${API_BASE_URL}/purchase_orders`);
        if (!res.ok) throw new Error("Financial data sync failed");
        
        const orders = await res.json();
        
        // Calculate Total Spent for the CURRENT calendar month (April 2026)
        const now = new Date();
        const spentThisMonth = orders.filter(o => {
            const orderDate = new Date(o.createdAt);
            // Only count Approved or Received orders towards the budget
            return (o.status === 'APPROVED' || o.status === 'RECEIVED') &&
                   orderDate.getMonth() === now.getMonth() &&
                   orderDate.getFullYear() === now.getFullYear();
        }).reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

        // Update Dashboard Stats
        const budgetEl = document.getElementById('budget-total');
        if (budgetEl) {
            budgetEl.textContent = formatZMW(spentThisMonth);
        }

        updateBudgetUI(spentThisMonth, parseFloat(currentLimit));
        generateFiscalArchive(orders);

    } catch (err) {
        console.error("Budget Sync Error:", err);
        const archiveBody = document.getElementById('fiscalArchiveBody');
        if (archiveBody) {
            archiveBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Cloud Financial Registry Offline.</td></tr>';
        }
    }
}

/**
 * 2. FISCAL ARCHIVE GENERATOR
 * Builds the historical view of spending vs. limits
 */
function generateFiscalArchive(orders) {
    const archiveBody = document.getElementById('fiscalArchiveBody');
    if (!archiveBody) return;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    let html = '';
    // Start tracking from January 2026
    let loopYear = 2026;
    let loopMonth = 0;

    while (loopYear < currentYear || (loopYear === currentYear && loopMonth <= currentMonth)) {
        const periodKey = `${String(loopMonth + 1).padStart(2, '0')}_${loopYear}`;
        const limit = parseFloat(localStorage.getItem(`willowton_budget_${periodKey}`)) || 500000;
        
        const monthSpent = orders.filter(o => {
            const d = new Date(o.createdAt);
            return (o.status === 'APPROVED' || o.status === 'RECEIVED') && 
                   d.getMonth() === loopMonth && 
                   d.getFullYear() === loopYear;
        }).reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

        const variance = limit - monthSpent;
        const isCurrent = (loopMonth === currentMonth && loopYear === currentYear);
        
        html = `
            <tr ${isCurrent ? 'class="table-active font-weight-bold"' : ''}>
                <td>${months[loopMonth]} ${loopYear}</td>
                <td>${formatZMW(limit)}</td>
                <td>${formatZMW(monthSpent)}</td>
                <td style="color: ${variance < 0 ? 'var(--danger)' : 'var(--success)'}">
                    ${variance < 0 ? '-' : '+'} ${formatZMW(Math.abs(variance))}
                </td>
                <td>
                    <span class="status-pill ${isCurrent ? 'status-pending' : 'status-approved'}">
                        ${isCurrent ? 'ACTIVE' : 'CLOSED'}
                    </span>
                </td>
            </tr>
        ` + html;

        loopMonth++;
        if (loopMonth > 11) {
            loopMonth = 0;
            loopYear++;
        }
    }
    archiveBody.innerHTML = html;
}

/**
 * 3. DATA ACTIONS
 */
function saveBudget() {
    const newLimit = document.getElementById('monthlyLimitInput').value;
    const period = getPeriodKey();
    
    if (!newLimit || newLimit <= 0) {
        alert("Please enter a valid fiscal limit.");
        return;
    }

    if (confirm(`Authorize budget of ${formatZMW(newLimit)} for ${period}?`)) {
        localStorage.setItem(`willowton_budget_${period}`, newLimit);
        localStorage.setItem('last_active_limit', newLimit); 
        alert("Fiscal limit updated.");
        location.reload();
    }
}

// Utility: Returns "04_2026"
function getPeriodKey() {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, '0')}_${d.getFullYear()}`;
}
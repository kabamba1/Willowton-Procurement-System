/** * --- WILLOWTON BUDGET & FISCAL MANAGEMENT --- 
 * Handles monthly limits, spending calculations, and fiscal archiving.
 **/

document.addEventListener('DOMContentLoaded', () => {
    initializeBudget();
});

/**
 * 1. INITIALIZATION & DATA FETCHING
 */
async function initializeBudget() {
    const period = getPeriodKey();
    const storageKey = `willowton_budget_${period}`;
    
    // Get/Set Monthly Limit
    let currentLimit = localStorage.getItem(storageKey);
    if (!currentLimit) {
        currentLimit = localStorage.getItem('last_active_limit') || 500000;
        localStorage.setItem(storageKey, currentLimit);
    }

    const inputEl = document.getElementById('monthlyLimitInput');
    if (inputEl) inputEl.value = currentLimit;

    try {
        const res = await fetch(`${API_BASE_URL}/purchase_orders`);
        if (!res.ok) throw new Error("Financial data sync failed");
        
        const orders = await res.json();
        const now = new Date();

        // Calculate Spending for April 2026
        const spentThisMonth = orders.filter(o => {
            const orderDate = new Date(o.createdAt);
            return (o.status === 'APPROVED' || o.status === 'RECEIVED') &&
                   orderDate.getMonth() === now.getMonth() &&
                   orderDate.getFullYear() === now.getFullYear();
        }).reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

        // Update the Dashboard
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
 * 2. UI RENDERING (Matches your HTML IDs)
 */
function updateBudgetUI(totalUsed, budgetLimit) {
    const percentage = budgetLimit > 0 ? (totalUsed / budgetLimit) * 100 : 0;
    const remaining = budgetLimit - totalUsed;

    const remainingEl = document.getElementById('remainingValue'); 
    if (remainingEl) {
        remainingEl.innerText = formatZMW(remaining);
        remainingEl.style.color = remaining < 0 ? 'var(--danger)' : 'var(--success)';
    }

    const spentEl = document.getElementById('spentLabel');
    if (spentEl) spentEl.innerText = `Spent: ${formatZMW(totalUsed)}`;

    const limitEl = document.getElementById('limitLabel');
    if (limitEl) limitEl.innerText = `Limit: ${formatZMW(budgetLimit)}`;

    const progressBar = document.getElementById('budgetProgressBar');
    if (progressBar) {
        progressBar.style.width = `${Math.min(percentage, 100)}%`;
        progressBar.style.backgroundColor = percentage > 90 ? '#e11d48' : '#0ea5e9';
    }
}

/**
 * 3. FISCAL ARCHIVE & ACTIONS
 */
function generateFiscalArchive(orders) {
    const archiveBody = document.getElementById('fiscalArchiveBody');
    if (!archiveBody) return;

    const now = new Date();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    let html = '';
    for (let m = 0; m <= now.getMonth(); m++) {
        const periodKey = `${String(m + 1).padStart(2, '0')}_2026`;
        const limit = parseFloat(localStorage.getItem(`willowton_budget_${periodKey}`)) || 500000;
        
        const monthSpent = orders.filter(o => {
            const d = new Date(o.createdAt);
            return (o.status === 'APPROVED' || o.status === 'RECEIVED') && 
                   d.getMonth() === m && d.getFullYear() === 2026;
        }).reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

        const variance = limit - monthSpent;
        const isCurrent = (m === now.getMonth());

        html = `
            <tr ${isCurrent ? 'style="background: rgba(14, 165, 233, 0.1); font-weight: bold;"' : ''}>
                <td>${months[m]} 2026</td>
                <td>${formatZMW(limit)}</td>
                <td>${formatZMW(monthSpent)}</td>
                <td style="color: ${variance < 0 ? 'var(--danger)' : 'var(--success)'}">
                    ${variance < 0 ? '-' : '+'} ${formatZMW(Math.abs(variance))}
                </td>
                <td><span class="status-pill ${isCurrent ? 'status-pending' : 'status-approved'}">${isCurrent ? 'ACTIVE' : 'CLOSED'}</span></td>
            </tr>
        ` + html;
    }
    archiveBody.innerHTML = html;
}

function saveBudget() {
    const newLimit = document.getElementById('monthlyLimitInput').value;
    const period = getPeriodKey();
    if (!newLimit || newLimit <= 0) return alert("Enter a valid limit.");

    if (confirm(`Authorize budget of ${formatZMW(newLimit)}?`)) {
        localStorage.setItem(`willowton_budget_${period}`, newLimit);
        localStorage.setItem('last_active_limit', newLimit); 
        location.reload();
    }
}

function getPeriodKey() {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, '0')}_${d.getFullYear()}`;
}
const API_BASE = "http://localhost:8081/api";

/**
 * 1. UTILS & HELPERS
 */
const formatZMW = (amount) => {
    return new Intl.NumberFormat('en-ZM', { 
        style: 'currency', 
        currency: 'ZMW' 
    }).format(amount || 0);
};

// Returns format: "04_2026" for April 2026
const getPeriodKey = () => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, '0')}_${d.getFullYear()}`;
};

/**
 * 2. INITIALIZATION
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeBudget();
});

async function initializeBudget() {
    const period = getPeriodKey();
    const storageKey = `willowton_budget_${period}`;
    
    // Get the limit for THIS month specifically
    let currentLimit = localStorage.getItem(storageKey);
    // Change line 32 to this:
const budgetEl = document.getElementById('budget-total');
if (budgetEl) {
    budgetEl.textContent = formatZMW(totalSpent);
}
    
    // Auto-rollover logic: If no limit exists for this month, inherit last month's
    if (!currentLimit) {
        currentLimit = localStorage.getItem('last_active_limit') || 500000;
        localStorage.setItem(storageKey, currentLimit);
    }

    // Set the input field value for the manager
    const inputEl = document.getElementById('monthlyLimitInput');
    if (inputEl) inputEl.value = currentLimit;

    try {
        const res = await fetch(`${API_BASE}/purchase_orders`);
        const orders = await res.json();
        
        // Calculate Total Spent for the CURRENT calendar month only
        const now = new Date();
        const spentThisMonth = orders.filter(o => {
            const orderDate = new Date(o.createdAt);
            return (o.status === 'APPROVED' || o.status === 'RECEIVED') &&
                   orderDate.getMonth() === now.getMonth() &&
                   orderDate.getFullYear() === now.getFullYear();
        }).reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

        // Update top-level UI cards
        updateBudgetUI(spentThisMonth, parseFloat(currentLimit));

        // Generate the historical archive table
        generateFiscalArchive(orders);

    } catch (err) {
        console.error("Financial Sync Error:", err);
        const archiveBody = document.getElementById('fiscalArchiveBody');
        if (archiveBody) archiveBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Failed to sync with server.</td></tr>';
    }
}

/**
 * 3. UI RENDERING
 */
function updateBudgetUI(spent, limit) {
    const remaining = limit - spent;
    const percent = Math.min((spent / limit) * 100, 100).toFixed(1);

    const remainingEl = document.getElementById('remainingValue');
    const progressBar = document.getElementById('budgetProgressBar');

    if (remainingEl) {
        remainingEl.textContent = formatZMW(remaining);
        remainingEl.style.color = remaining < 0 ? 'var(--danger)' : 'var(--success)';
        
        // Handle Over-Budget visual state
        if (remaining < 0) {
            remainingEl.innerHTML = `<span style="color: var(--danger);">OVER BUDGET: ${formatZMW(Math.abs(remaining))}</span>`;
            remainingEl.closest('.card').style.borderColor = 'var(--danger)';
        } else {
            remainingEl.closest('.card').style.borderColor = 'var(--border)';
        }
    }

    if (progressBar) {
        progressBar.style.width = `${percent}%`;
        progressBar.style.background = percent > 90 ? 'var(--danger)' : 'var(--accent)';
    }
    
    // Update labels
    const spentLabel = document.getElementById('spentLabel');
    const limitLabel = document.getElementById('limitLabel');
    if (spentLabel) spentLabel.textContent = `Spent: ${formatZMW(spent)}`;
    if (limitLabel) limitLabel.textContent = `Limit: ${formatZMW(limit)}`;
}

/**
 * 4. FISCAL ARCHIVE GENERATOR (Dynamic Table)
 */
async function generateFiscalArchive(orders) {
    const archiveBody = document.getElementById('fiscalArchiveBody');
    if (!archiveBody) return;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Define when your system started (e.g., January 2026)
    const startMonth = 0; 
    const startYear = 2026;

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    let html = '';

    // 2. Infinite Loop: Start from system launch until the current day
    let loopYear = startYear;
    let loopMonth = startMonth;

    while (loopYear < currentYear || (loopYear === currentYear && loopMonth <= currentMonth)) {
        const periodKey = `${String(loopMonth + 1).padStart(2, '0')}_${loopYear}`;
        
        // Pull the limit for that specific month/year combo
        const limit = parseFloat(localStorage.getItem(`willowton_budget_${periodKey}`)) || 500000;
        
        // Calculate spend for that specific month/year combo
        const monthSpent = orders.filter(o => {
            const d = new Date(o.createdAt);
            return (o.status === 'APPROVED' || o.status === 'RECEIVED') && 
                   d.getMonth() === loopMonth && 
                   d.getFullYear() === loopYear;
        }).reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

        const variance = limit - monthSpent;
        const isCurrent = (loopMonth === currentMonth && loopYear === currentYear);
        
        html = `
            <tr ${isCurrent ? 'style="background: #f0f7ff; font-weight: 600;"' : ''}>
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
        ` + html; // We add the new row to the TOP so the newest months appear first

        // Increment Month/Year
        loopMonth++;
        if (loopMonth > 11) {
            loopMonth = 0;
            loopYear++;
        }
    }

    archiveBody.innerHTML = html;
}
/**
 * 5. DATA ACTIONS
 */
function saveBudget() {
    const newLimit = document.getElementById('monthlyLimitInput').value;
    const period = getPeriodKey();
    
    if (!newLimit || newLimit <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    if (confirm(`Authorize K ${newLimit} for the fiscal period ${period}?`)) {
        // Update both the specific month and the template for the future
        localStorage.setItem(`willowton_budget_${period}`, newLimit);
        localStorage.setItem('last_active_limit', newLimit); 
        
        alert("Fiscal period updated successfully.");
        location.reload();
    }
}
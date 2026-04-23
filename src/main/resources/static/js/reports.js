/** * --- WILLOWTON EXECUTIVE FINANCIAL REPORTING --- 
 * Handles tax calculations (Zambia VAT 16%) and category-wise spend analysis.
 * Dependencies: config.js and auth-session.js must be loaded first.
 **/

const ZAMBIA_VAT_RATE = 0.16;

document.addEventListener('DOMContentLoaded', () => {
    generateFinancialReport();
});

/**
 * 1. CORE DATA AGGREGATION
 */
async function generateFinancialReport() {
    try {
        const response = await fetch(`${API_BASE_URL}/purchase_orders`);
        if (!response.ok) throw new Error("Cloud registry unreachable");
        
        const orders = await response.json();

        // Calculate Executive Stats
        const totalGross = orders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
        
        /**
         * VAT Calculation Logic:
         * Assuming totalAmount is Gross (Inclusive of VAT)
         * Net = Gross / (1 + VAT_RATE)
         */
        const netAmount = totalGross / (1 + ZAMBIA_VAT_RATE);
        const vatAmount = totalGross - netAmount;

        const paid = orders.filter(o => o.status === 'APPROVED' || o.status === 'RECEIVED')
                           .reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
        
        const pending = orders.filter(o => o.status === 'PENDING')
                               .reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

        const rejected = orders.filter(o => o.status === 'REJECTED')
                                .reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

        // Update UI Cards
        const committedEl = document.getElementById('total-committed');
        if (committedEl) {
            committedEl.innerHTML = `
                <div class="h2 fw-bold mb-0">${formatZMW(totalGross)}</div>
                <div class="mt-2 pt-2 border-top small">
                    <div class="text-muted">Net Base: ${formatZMW(netAmount)}</div>
                    <div class="text-primary fw-bold">VAT (16%): ${formatZMW(vatAmount)}</div>
                </div>
            `;
        }

        updateValue('total-paid', formatZMW(paid));
        updateValue('total-pending', formatZMW(pending));
        updateValue('total-saved', formatZMW(rejected));

        // 2. CATEGORY ANALYSIS
        const categories = {};
        orders.forEach(order => {
            const cat = order.category || 'General Operations';
            if (!categories[cat]) categories[cat] = { count: 0, total: 0 };
            categories[cat].count++;
            categories[cat].total += (parseFloat(order.totalAmount) || 0);
        });

        renderCategoryTable(categories, totalGross);

    } catch (err) {
        console.error("Report Generation Error:", err);
        const tbody = document.getElementById('category-report-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4">Failed to generate cloud report.</td></tr>';
    }
}

/**
 * 3. TABLE RENDERING
 */
function renderCategoryTable(categories, grandTotal) {
    const tbody = document.getElementById('category-report-body');
    if (!tbody) return;

    const catKeys = Object.keys(categories);
    
    tbody.innerHTML = catKeys.map(name => {
        const data = categories[name];
        const percentage = grandTotal > 0 ? ((data.total / grandTotal) * 100).toFixed(1) : 0;
        
        return `
    <tr class="align-middle">
        <td class="ps-4">
            <span class="fw-bold text-dark">${name}</span>
        </td>
        <td class="text-muted">${data.count} Orders</td>
        <td>
            <div class="row align-items-center g-0">
                <div class="col">
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar bg-primary" role="progressbar" style="width: ${percentage}%"></div>
                    </div>
                </div>
                <div class="col-auto ps-3">
                    <span class="small fw-bold text-primary">${percentage}%</span>
                </div>
            </div>
        </td>
        <td class="text-end pe-4">
            <span class="fw-bold">${formatZMW(data.total)}</span>
        </td>
    </tr>
`;
    }).join('');

}

function updateValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}
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
    
    if (catKeys.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No financial data available for the selected period.</td></tr>';
        return;
    }

    tbody.innerHTML = catKeys.map(name => {
        const data = categories[name];
        const percentage = grandTotal > 0 ? ((data.total / grandTotal) * 100).toFixed(1) : 0;
        
        return `
            <tr>
                <td><strong>${name}</strong></td>
                <td>${data.count} Orders</td>
                <td class="w-25">
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar bg-accent" role="progressbar" style="width: ${percentage}%"></div>
                    </div>
                    <small class="text-muted d-block mt-1">${percentage}% of total spend</small>
                </td>
                <td class="text-end fw-bold">${formatZMW(data.total)}</td>
            </tr>
        `;
    }).join('');
}

function updateValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}
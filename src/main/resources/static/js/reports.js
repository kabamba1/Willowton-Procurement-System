document.addEventListener('DOMContentLoaded', () => {
    generateFinancialReport();
});

const ZAMBIA_VAT_RATE = 0.16;

async function generateFinancialReport() {
    try {
        const response = await fetch(`${API_BASE}/purchase_orders`);
        const orders = await response.json();

        // 1. CALCULATE EXECUTIVE STATS
        const totalGross = orders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
        const vatAmount = totalGross * ZAMBIA_VAT_RATE;
        const netAmount = totalGross - vatAmount;

        const paid = orders.filter(o => o.status === 'APPROVED' || o.status === 'RECEIVED')
                           .reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
        
        const pending = orders.filter(o => o.status === 'PENDING')
                              .reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

        const rejected = orders.filter(o => o.status === 'REJECTED')
                               .reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

        // 2. UPDATE UI CARDS
        // Total Committed Card with Tax Breakdown
        document.getElementById('total-committed').innerHTML = `
            <div style="font-size: 1.8rem; font-weight: 800;">${formatZMW(totalGross)}</div>
            <div style="margin-top: 5px; padding-top: 5px; border-top: 1px solid #eee; font-size: 0.8rem;">
                <span style="color: var(--text-muted);">Net: ${formatZMW(netAmount)}</span><br>
                <span style="color: var(--accent); font-weight: 600;">VAT (16%): ${formatZMW(vatAmount)}</span>
            </div>
        `;

        document.getElementById('total-paid').innerText = formatZMW(paid);
        document.getElementById('total-pending').innerText = formatZMW(pending);
        document.getElementById('total-saved').innerText = formatZMW(rejected);

        // 3. RENDER CATEGORY TABLE
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
    }
}

function renderCategoryTable(categories, grandTotal) {
    const tbody = document.getElementById('category-report-body');
    tbody.innerHTML = Object.keys(categories).map(name => {
        const data = categories[name];
        const percentage = ((data.total / grandTotal) * 100).toFixed(1);
        
        return `
            <tr>
                <td><strong>${name}</strong></td>
                <td>${data.count} Orders</td>
                <td>
                    <div style="width: 100%; background: #eee; border-radius: 10px; height: 8px;">
                        <div style="width: ${percentage}%; background: var(--accent); height: 100%; border-radius: 10px;"></div>
                    </div>
                    <small>${percentage}% of total spend</small>
                </td>
                <td style="text-align: right; font-weight: 700;">${formatZMW(data.total)}</td>
            </tr>
        `;
    }).join('');
}
/** * --- WILLOWTON PROCUREMENT OPERATIONS LOGIC --- 
 * Handles Dashboard Sync and Order Submission with dynamic SKU pricing.
 * Dependencies: config.js and auth-session.js must be loaded first.
 **/

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Data Sync from Cloud
    syncDashboard();

    // 2. Load Registry Data into Form
    loadSuppliers();
    loadSKUs();

    // 3. Event Listeners for Live Costing
    const qtyInput = document.getElementById('quantity');
    const priceInput = document.getElementById('unitPrice');
    const skuDropdown = document.getElementById('itemSku');

    if (qtyInput && priceInput) {
        [qtyInput, priceInput].forEach(el => {
            el.addEventListener('input', calculateTotal);
        });
    }

    // Auto-fill price when SKU is selected from catalog
    if (skuDropdown) {
        skuDropdown.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const price = selectedOption.dataset.price;
            if (price && priceInput) {
                priceInput.value = price;
                calculateTotal();
            }
        });
    }
});

/**
 * 1. SUBMISSION LOGIC
 * Routes new POs to the Willowton Registry for Finance review.
 */
async function submitOrder() {
    const totalDisplay = document.getElementById('estimatedTotalDisplay');
    // Sanitize: "ZMW 1,200.00" -> 1200.00
    const rawTotal = totalDisplay ? totalDisplay.innerText.replace(/[^0-9.]/g, '') : "0";

    const orderData = {
        supplierId: parseInt(document.getElementById('targetSupplier').value),
        itemCode: document.getElementById('itemSku').value,
        quantity: parseInt(document.getElementById('quantity').value) || 0,
        unitPrice: parseFloat(document.getElementById('unitPrice').value) || 0,
        totalAmount: parseFloat(rawTotal),
        notes: document.getElementById('orderNotes')?.value || "", 
        status: 'PENDING',
        // Retrieves the logged-in user ID (e.g., Kabamba)
        creatorId: JSON.parse(localStorage.getItem('currentUser'))?.id || 1
    };

    // Validation Guard
    if (!orderData.supplierId || !orderData.itemCode || orderData.quantity <= 0) {
        alert("⚠️ Please select a Supplier, an Item, and a valid Quantity.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/purchase_orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (res.ok) {
            alert(`✅ Order for ${orderData.itemCode} submitted to Willowton Cloud!`);
            location.reload(); 
        } else {
            const error = await res.json();
            alert("Submission failed: " + (error.message || "Invalid Data"));
        }
    } catch (err) {
        alert("❌ Network Error: Could not reach Willowton Cloud.");
    }
}

/**
 * 2. DASHBOARD SYNC
 * Updates the summary cards and the live progress tracker.
 */
async function syncDashboard() {
    const tableBody = document.getElementById('procurement-tracker-table');
    try {
        const res = await fetch(`${API_BASE_URL}/purchase_orders`);
        const orders = await res.json();

        // Update Summary Stats
        updateElement('active-req-count', orders.filter(o => o.status === 'PENDING').length);
        updateElement('pending-finance-count', orders.filter(o => o.status === 'AWAITING_FINANCE').length);
        updateElement('completed-count', orders.filter(o => o.status === 'APPROVED' || o.status === 'RECEIVED').length);

        if (tableBody) {
            // Show only the 5 most recent activities
            tableBody.innerHTML = orders.slice(-5).reverse().map(order => {
                const status = (order.status || 'PENDING').toUpperCase();
                
                // Progress Bar Logic
                let progress = '25%';
                if (status === 'AWAITING_FINANCE') progress = '60%';
                if (status === 'APPROVED') progress = '85%';
                if (status === 'RECEIVED') progress = '100%';
                if (status === 'REJECTED') progress = '0%';

                const vendor = order.supplierName || order.supplier?.companyName || 'Vendor';

                return `
                    <tr>
                        <td><strong>${order.poNumber || 'TBD'}</strong></td>
                        <td>${vendor}</td>
                        <td class="fw-bold">${formatZMW(order.totalAmount)}</td>
                        <td><span class="status-pill status-${status.toLowerCase()}">${status}</span></td>
                        <td>
                            <div class="progress-track" style="width:100%; background:#f1f5f9; height:8px; border-radius:10px; overflow:hidden;">
                                <div class="progress-bar" style="width:${progress}; background:var(--primary); height:100%; transition: width 0.3s ease;"></div>
                            </div>
                        </td>
                    </tr>`;
            }).join('');
        }
    } catch (err) {
        console.error("Sync Error:", err);
    }
}

/**
 * 3. REGISTRY LOADERS
 */
function calculateTotal() {
    const qty = parseFloat(document.getElementById('quantity').value) || 0;
    const price = parseFloat(document.getElementById('unitPrice').value) || 0;
    const display = document.getElementById('estimatedTotalDisplay');
    if (display) display.textContent = formatZMW(qty * price);
}

async function loadSuppliers() {
    const dropdown = document.getElementById('targetSupplier');
    if (!dropdown) return;
    try {
        const res = await fetch(`${API_BASE_URL}/suppliers`);
        const data = await res.json();
        dropdown.innerHTML = '<option value="">-- Choose Approved Vendor --</option>' + 
            data.filter(s => s.status === 'ACTIVE').map(s => `<option value="${s.supplierId}">${s.companyName}</option>`).join('');
    } catch (e) { console.error("Supplier Registry Error", e); }
}

async function loadSKUs() {
    const dropdown = document.getElementById('itemSku');
    if (!dropdown) return;
    try {
        const res = await fetch(`${API_BASE_URL}/items`);
        const data = await res.json();
        dropdown.innerHTML = '<option value="">-- Choose SKU --</option>' + 
            data.map(i => `<option value="${i.itemCode}" data-price="${i.lastUnitPrice}">${i.itemCode} - ${i.description}</option>`).join('');
    } catch (e) { console.error("SKU Registry Error", e); }
}

function updateElement(id, val) {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
}
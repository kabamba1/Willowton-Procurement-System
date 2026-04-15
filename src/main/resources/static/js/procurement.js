/**
 * Willowton PMS - Procurement Operations Logic
 * Integrated Dashboard Sync and Order Submission with Notes
 */

// API_BASE is inherited from config.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Dashboard Sync
    syncDashboard();

    // 2. Load Dropdowns
    loadSuppliers();
    loadSKUs();

    // 3. Form Listeners
    const qtyInput = document.getElementById('quantity');
    const priceInput = document.getElementById('unitPrice');
    const skuDropdown = document.getElementById('itemSku');

    if (qtyInput && priceInput) {
        [qtyInput, priceInput].forEach(el => {
            el.addEventListener('input', calculateTotal);
        });
    }

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

/** --- SUBMISSION LOGIC --- **/

async function submitOrder() {
    const totalDisplay = document.getElementById('estimatedTotalDisplay');
    const rawTotal = totalDisplay ? totalDisplay.innerText.replace(/[^0-9.]/g, '') : "0";

    const orderData = {
        supplierId: document.getElementById('targetSupplier').value,
        itemCode: document.getElementById('itemSku').value,
        quantity: parseInt(document.getElementById('quantity').value) || 0,
        unitPrice: parseFloat(document.getElementById('unitPrice').value) || 0,
        totalAmount: parseFloat(rawTotal),
        notes: document.getElementById('orderNotes')?.value || "", // Captures the Notes field
        status: 'PENDING',
        creatorId: JSON.parse(localStorage.getItem('currentUser'))?.id || 1
    };

    if (!orderData.supplierId || !orderData.itemCode || orderData.quantity <= 0) {
        alert("⚠️ Please select a Supplier, an Item, and a valid Quantity.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/purchase_orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (res.ok) {
            alert(`✅ Order for ${orderData.itemCode} submitted successfully!`);
            location.reload(); 
        } else {
            const error = await res.json();
            alert("Submission failed: " + (error.message || "Unknown Error"));
        }
    } catch (err) {
        alert("❌ Server Error: Ensure your API is running.");
    }
}

/** --- DASHBOARD LOGIC --- **/

async function syncDashboard() {
    const tableBody = document.getElementById('procurement-tracker-table');
    try {
        const res = await fetch(`${API_BASE}/purchase_orders`);
        const orders = await res.json();

        updateElement('active-req-count', orders.filter(o => o.status === 'PENDING').length);
        updateElement('pending-finance-count', orders.filter(o => o.status === 'AWAITING_FINANCE').length);
        updateElement('completed-count', orders.filter(o => o.status === 'APPROVED').length);

        if (tableBody) {
            tableBody.innerHTML = orders.slice(0, 5).map(order => {
                const status = (order.status || 'PENDING').toUpperCase();
                return `
                    <tr>
                        <td><strong>${order.poNumber || 'TBD'}</strong></td>
                        <td>${order.supplier?.companyName || 'Vendor'}</td>
                        <td>K ${parseFloat(order.totalAmount).toLocaleString()}</td>
                        <td><span class="status-pill status-${status.toLowerCase()}">${status}</span></td>
                        <td>
                            <div style="width:100%; background:#eee; height:6px; border-radius:10px;">
                                <div style="width:${status === 'APPROVED' ? '100%' : '40%'}; background:var(--primary); height:100%; border-radius:10px;"></div>
                            </div>
                        </td>
                    </tr>`;
            }).join('');
        }
    } catch (err) {
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Sync Error.</td></tr>`;
    }
}

/** --- HELPERS --- **/

function calculateTotal() {
    const qty = parseFloat(document.getElementById('quantity').value) || 0;
    const price = parseFloat(document.getElementById('unitPrice').value) || 0;
    const display = document.getElementById('estimatedTotalDisplay');
    if (display) {
        display.textContent = `ZMW ${(qty * price).toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    }
}

async function loadSuppliers() {
    const dropdown = document.getElementById('targetSupplier');
    if (!dropdown) return;
    const res = await fetch(`${API_BASE}/suppliers`);
    const data = await res.json();
    dropdown.innerHTML = '<option value="">-- Choose Approved Vendor --</option>' + 
        data.filter(s => s.status === 'ACTIVE').map(s => `<option value="${s.supplierId}">${s.companyName}</option>`).join('');
}

async function loadSKUs() {
    const dropdown = document.getElementById('itemSku');
    if (!dropdown) return;
    const res = await fetch(`${API_BASE}/items`);
    const data = await res.json();
    dropdown.innerHTML = '<option value="">-- Choose SKU --</option>' + 
        data.map(i => `<option value="${i.itemCode}" data-price="${i.lastUnitPrice}">${i.itemCode} - ${i.description}</option>`).join('');
}

function updateElement(id, val) {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
}
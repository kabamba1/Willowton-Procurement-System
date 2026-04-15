/** * --- WILLOWTON PROCUREMENT MANAGEMENT SYSTEM --- 
 * Corporate Access Control & User Provisioning (RBAC)
 * Handles account creation, metadata mapping, and permissions.
 **/

const API_BASE_URL = "https://willowton-pms.onrender.com";

// Global Cache for Mapping IDs to Human-Readable Names
let roleMap = {};
let deptMap = {};

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Sync Corporate Metadata (Required for rendering IDs to Names)
    await loadRolesAndDepts();
    
    // 2. Load User Directory
    loadUserTable();
    
    // 3. Search/Filter Logic
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#user-table-body tr');
            rows.forEach(row => {
                row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
            });
        });
    }

    // 4. Form Logic for New Accounts
    const userForm = document.getElementById('createUserForm');
    if (userForm) userForm.addEventListener('submit', handleUserSubmit);
});

/**
 * 1. METADATA SYNC
 * Populates dropdowns and local maps from the Cloud Registry.
 */
async function loadRolesAndDepts() {
    try {
        const [rolesRes, deptsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/roles`),
            fetch(`${API_BASE_URL}/departments`)
        ]);

        const roles = await rolesRes.json();
        const depts = await deptsRes.json();

        const roleSelect = document.getElementById('roleSelect');
        const deptSelect = document.getElementById('deptSelect');

        // Clear existing options
        if (roleSelect) roleSelect.innerHTML = '<option value="">-- Assign Corporate Role --</option>';
        if (deptSelect) deptSelect.innerHTML = '<option value="">-- Select Department --</option>';

        roles.forEach(r => {
            roleMap[r.roleId] = r.roleName; 
            if (roleSelect) roleSelect.add(new Option(r.roleName, r.roleId));
        });

        depts.forEach(d => {
            deptMap[d.deptId] = d.deptName;
            if (deptSelect) deptSelect.add(new Option(d.deptName, d.deptId));
        });
        
    } catch (err) { 
        console.error("Willowton Personnel Error: Metadata sync failed.", err); 
    }
}

/**
 * 2. RENDER PERSONNEL DIRECTORY
 */
async function loadUserTable() {
    const tableBody = document.getElementById('user-table-body');
    if (!tableBody) return;

    try {
        const response = await fetch(`${API_BASE_URL}/users`);
        const users = await response.json();
        
        if (users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4">No authorized personnel found.</td></tr>';
            return;
        }

        tableBody.innerHTML = users.map(user => {
            const roleName = roleMap[user.roleId] || "Guest";
            const deptName = deptMap[user.deptId] || "General Operations";

            return `
                <tr>
                    <td><strong>${user.fullName}</strong></td>
                    <td><code>${user.username}</code></td>
                    <td>
                        <span class="badge bg-light text-primary border px-2 py-1">
                            ${roleName.toUpperCase()}
                        </span>
                    </td>
                    <td class="small">${deptName}</td>
                    <td><span class="status-pill status-active text-success small fw-bold">VERIFIED</span></td>
                    <td class="text-end">
                        <button class="btn-icon" title="Modify Access" onclick="editUser(${user.userId})">
                            <i class="fas fa-user-shield"></i>
                        </button>
                        <button class="btn-icon text-danger ms-2" title="Deactivate" onclick="deleteUser(${user.userId})">
                            <i class="fas fa-user-slash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger p-4">Personnel Registry Offline.</td></tr>';
    }
}

/**
 * 3. PROVISIONING (CREATE/UPDATE)
 */
async function handleUserSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editUserId').value;
    const isEdit = id !== "";
    const btn = document.getElementById('submitBtn');

    const payload = {
        fullName: document.getElementById('newFullName').value,
        username: document.getElementById('newUsername').value,
        password: document.getElementById('newPassword').value, // In production, hash this!
        roleId: parseInt(document.getElementById('roleSelect').value),
        deptId: parseInt(document.getElementById('deptSelect').value)
    };

    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        const url = isEdit ? `${API_BASE_URL}/users/${id}` : `${API_BASE_URL}/users/register`;
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert(isEdit ? "System Access Modified" : "Corporate Account Provisioned");
            closeUserModal();
            loadUserTable();
        } else {
            alert("Error: Username might be taken or fields are invalid.");
        }
    } catch (err) {
        alert("Network Error: Could not connect to Willowton Cloud.");
    } finally {
        btn.disabled = false;
        btn.textContent = isEdit ? "Update Credentials" : "Provision Account";
    }
}

/**
 * 4. ACCESS MANAGEMENT HELPERS
 */
async function deleteUser(id) {
    if (confirm("Deactivate this account? This will immediately revoke all system permissions for this staff member.")) {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });
            if (res.ok) loadUserTable();
        } catch (err) { alert("Network Error."); }
    }
}

function openUserModal() { document.getElementById('userModal').style.display = 'flex'; }
function closeUserModal() { 
    document.getElementById('userModal').style.display = 'none'; 
    document.getElementById('createUserForm').reset();
    document.getElementById('editUserId').value = "";
}
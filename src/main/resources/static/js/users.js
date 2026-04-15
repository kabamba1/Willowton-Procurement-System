/**
 * Kasonge Secondary - User & Access Control Module
 * Current Port: 8081
 */

const API_BASE = "http://localhost:8081/api";

// Global Cache for Mapping IDs to Names in the Table
let roleMap = {};
let deptMap = {};

document.addEventListener('DOMContentLoaded', async () => {
    // 1. First, load metadata (Roles/Depts) so the table can map IDs to names
    await loadRolesAndDepts();
    
    // 2. Load the user directory
    loadUserTable();
    
    // 3. Initialize Search Filter
    document.getElementById('userSearch').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('#user-table-body tr').forEach(row => {
            row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
        });
    });

    // 4. Handle Form Submissions (Create and Update)
    document.getElementById('createUserForm').addEventListener('submit', handleUserSubmit);
});

/**
 * FETCH METADATA
 * Populates dropdowns and the global maps for the table view
 */
async function loadRolesAndDepts() {
    try {
        const [rolesRes, deptsRes] = await Promise.all([
            fetch(`${API_BASE}/roles`),
            fetch(`${API_BASE}/departments`)
        ]);

        const roles = await rolesRes.json();
        const depts = await deptsRes.json();

        const roleSelect = document.getElementById('roleSelect');
        const deptSelect = document.getElementById('deptSelect');

        roleSelect.innerHTML = '<option value="">-- Assign Role --</option>';
        deptSelect.innerHTML = '<option value="">-- Select Dept --</option>';

        // Sync with database data
        roles.forEach(r => {
            roleMap[r.roleId] = r.roleName; // Store for table lookup
            roleSelect.add(new Option(r.roleName, r.roleId));
        });

        depts.forEach(d => {
            deptMap[d.deptId] = d.deptName; // Store for table lookup
            deptSelect.add(new Option(d.deptName, d.deptId));
        });
        
        console.log("Metadata synced successfully.");
    } catch (err) { 
        console.error("Critical: Could not load Roles/Departments. Check backend.", err); 
    }
}

/**
 * TABLE MANAGEMENT
 * Renders the personnel directory
 */
async function loadUserTable() {
    const tableBody = document.getElementById('user-table-body');

    try {
        const response = await fetch(`${API_BASE}/users`);
        const users = await response.json();
        
        if (users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No personnel found.</td></tr>';
            return;
        }

        tableBody.innerHTML = users.map(user => `
            <tr>
                <td><strong>${user.fullName}</strong></td>
                <td><code>${user.username}</code></td>
                <td>
                    <span class="badge" style="background: #eef2ff; color: var(--primary); padding:4px 8px; border-radius:4px; font-size:0.8rem; text-transform: capitalize;">
                        ${roleMap[user.roleId] || user.roleId}
                    </span>
                </td>
                <td>${deptMap[user.deptId] || 'General Staff'}</td>
                <td><span class="status-pill status-approved">ACTIVE</span></td>
                <td style="text-align: right;">
                    <button class="btn-icon" title="Edit Access" onclick="editUser(${user.userId})">
                        <i class="fas fa-user-edit"></i>
                    </button>
                    <button class="btn-icon" title="Revoke Access" style="color:var(--danger); margin-left:10px;" onclick="deleteUser(${user.userId})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red; padding:20px;">Connection Error: Check port 8081.</td></tr>';
    }
}

/**
 * CREATE & UPDATE LOGIC
 */
async function handleUserSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editUserId').value;
    const isEdit = id !== "";
    const btn = document.getElementById('submitBtn');

    // Build Payload matching UserRegistrationDTO
    const payload = {
        fullName: document.getElementById('newFullName').value,
        username: document.getElementById('newUsername').value,
        password: document.getElementById('newPassword').value,
        role: { roleId: parseInt(document.getElementById('roleSelect').value) },
        department: { deptId: parseInt(document.getElementById('deptSelect').value) }
    };

    try {
        btn.disabled = true;
        btn.innerHTML = isEdit ? '<i class="fas fa-spinner fa-spin"></i> Updating...' : '<i class="fas fa-spinner fa-spin"></i> Provisioning...';

        const url = isEdit ? `${API_BASE}/users/${id}` : `${API_BASE}/users/register`;
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert(isEdit ? "User updated successfully!" : "User account provisioned!");
            closeUserModal();
            loadUserTable();
        } else {
            const errorMsg = await res.text();
            alert("Action failed: " + errorMsg);
        }
    } catch (err) {
        alert("Server communication error.");
    } finally {
        btn.disabled = false;
        btn.textContent = isEdit ? "Update Account" : "Create Account";
    }
}

/**
 * EDIT & DELETE HELPERS
 */
async function editUser(id) {
    try {
        const res = await fetch(`${API_BASE}/users/${id}`);
        const user = await res.json();

        // Populate Modal Fields
        document.getElementById('editUserId').value = user.userId;
        document.getElementById('newFullName').value = user.fullName;
        document.getElementById('newUsername').value = user.username;
        document.getElementById('roleSelect').value = user.roleId;
        document.getElementById('deptSelect').value = user.deptId;
        
        // UI Customization for Edit
        document.getElementById('modalTitle').innerHTML = '<i class="fas fa-user-edit"></i> Edit User Access';
        document.getElementById('passwordLabel').innerText = "New Password (Optional)";
        document.getElementById('newPassword').required = false;
        document.getElementById('submitBtn').textContent = "Update Account";
        
        openUserModal();
    } catch (err) {
        alert("Failed to retrieve user data.");
    }
}

async function deleteUser(id) {
    if (confirm("Are you sure you want to permanently revoke access for this user?")) {
        try {
            const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
            if (res.ok) loadUserTable();
            else alert("Delete failed.");
        } catch (err) {
            alert("Could not connect to server.");
        }
    }
}

/**
 * UI CONTROLS
 */
function resetForm() {
    document.getElementById('editUserId').value = "";
    document.getElementById('createUserForm').reset();
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-shield-alt"></i> New User Provisioning';
    document.getElementById('passwordLabel').innerText = "Initial Password";
    document.getElementById('newPassword').required = true;
    document.getElementById('submitBtn').textContent = "Create Account";
}

function openUserModal() { document.getElementById('userModal').style.display = 'flex'; }

function closeUserModal() { 
    document.getElementById('userModal').style.display = 'none'; 
    resetForm(); 
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}
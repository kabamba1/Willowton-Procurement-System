// Willowton Registry Cache
let roleMap = {};
let deptMap = {};

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Willowton Registry: Initializing...");
    await loadRolesAndDepts();
    loadUserTable();
    
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

    const userForm = document.getElementById('createUserForm');
    if (userForm) userForm.addEventListener('submit', handleUserSubmit);
});

async function loadRolesAndDepts() {
    console.log("Willowton Registry: Fetching metadata from", API_BASE_URL);
    try {
        const [rolesRes, deptsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/roles`),
            fetch(`${API_BASE_URL}/departments`)
        ]);

        if (!rolesRes.ok || !deptsRes.ok) throw new Error("Cloud registry returned an error.");

        const roles = await rolesRes.json();
        const depts = await deptsRes.json();

        console.log("Roles received:", roles);
        console.log("Departments received:", depts);

        const roleSelect = document.getElementById('roleSelect');
        const deptSelect = document.getElementById('deptSelect');

        if (roleSelect) {
            roleSelect.innerHTML = '<option value="">-- Assign Corporate Role --</option>';
            roles.forEach(r => {
                roleMap[r.roleId] = r.roleName; 
                roleSelect.add(new Option(r.roleName, r.roleId));
            });
        }

        if (deptSelect) {
            deptSelect.innerHTML = '<option value="">-- Select Department --</option>';
            depts.forEach(d => {
                deptMap[d.deptId] = d.deptName;
                deptSelect.add(new Option(d.deptName, d.deptId));
            });
        }
        
        console.log("Metadata Sync: Complete.");
    } catch (err) { 
        console.error("Willowton Personnel Error: Metadata sync failed.", err); 
    }
}

async function loadUserTable() {
    const tableBody = document.getElementById('user-table-body');
    if (!tableBody) return;
    try {
        const response = await fetch(`${API_BASE_URL}/users`);
        const users = await response.json();
        if (users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4">No personnel found.</td></tr>';
            return;
        }
        tableBody.innerHTML = users.map(user => `
            <tr>
                <td><strong>${user.fullName}</strong></td>
                <td><code>${user.username}</code></td>
                <td><span class="badge bg-light text-primary border">${(user.role ? user.role.roleName : "Guest").toUpperCase()}</span></td>
                <td>${user.department ? user.department.deptName : "Operations"}</td>
                <td><span class="status-pill status-active text-success small fw-bold">VERIFIED</span></td>
                <td class="text-end">
                    <button class="btn-icon" onclick="editUser(${user.userId})"><i class="fas fa-user-shield"></i></button>
                    <button class="btn-icon text-danger ms-2" onclick="deleteUser(${user.userId})"><i class="fas fa-user-slash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (err) { tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Registry Offline.</td></tr>'; }
}

async function handleUserSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editUserId').value;
    const isEdit = id !== "";
    
    // Payload wrapped in objects to match Spring Boot/JPA Entity expectations
    const payload = {
        fullName: document.getElementById('newFullName').value,
        username: document.getElementById('newUsername').value,
        password: document.getElementById('newPassword').value,
        role: { roleId: parseInt(document.getElementById('roleSelect').value) },
        department: { deptId: parseInt(document.getElementById('deptSelect').value) }
    };
    
    try {
        const url = isEdit ? `${API_BASE_URL}/users/${id}` : `${API_BASE_URL}/users/register`;
        const res = await fetch(url, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) { 
            alert("Success: Personnel record updated."); 
            closeUserModal(); 
            loadUserTable(); 
        } else {
            console.error("Server Error: 500 or validation failure");
            alert("Server Error: Please check database constraints.");
        }
    } catch (err) { 
        alert("Network Error"); 
    }
}

// ACCESS HELPERS
function openUserModal() { document.getElementById('userModal').style.display = 'flex'; }
function closeUserModal() { 
    document.getElementById('userModal').style.display = 'none'; 
    document.getElementById('createUserForm').reset();
    document.getElementById('editUserId').value = "";
    document.getElementById('submitBtn').textContent = "Create Account";
}

async function editUser(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/users/${id}`);
        const user = await res.json();
        
        document.getElementById('editUserId').value = user.userId;
        document.getElementById('newFullName').value = user.fullName;
        document.getElementById('newUsername').value = user.username;
        
        // Handling nested objects for the edit modal
        if (user.role) document.getElementById('roleSelect').value = user.role.roleId;
        if (user.department) document.getElementById('deptSelect').value = user.department.deptId;
        
        document.getElementById('submitBtn').textContent = "Update Credentials";
        openUserModal();
    } catch (err) { alert("Fetch failed"); }
}

async function deleteUser(id) {
    if (confirm("Deactivate account?")) {
        await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });
        loadUserTable();
    }
}

// EXPOSE TO GLOBAL SCOPE
window.editUser = editUser;
window.deleteUser = deleteUser;
window.openUserModal = openUserModal;
window.closeUserModal = closeUserModal;
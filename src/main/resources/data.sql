-- Seed Roles
INSERT INTO roles (role_id, role_name) VALUES (1, 'Admin');
INSERT INTO roles (role_id, role_name) VALUES (2, 'Procurement Officer');
INSERT INTO roles (role_id, role_name) VALUES (3, 'Finance Manager');
INSERT INTO roles (role_id, role_name) VALUES (4, 'Warehouse Supervisor');

-- Seed Departments (Added Warehouse to match your supervisor role)
INSERT INTO departments (dept_id, dept_name) VALUES (1, 'IT Support');
INSERT INTO departments (dept_id, dept_name) VALUES (2, 'Logistics');
INSERT INTO departments (dept_id, dept_name) VALUES (3, 'Accounting');
INSERT INTO departments (dept_id, dept_name) VALUES (4, 'Warehouse Operations');
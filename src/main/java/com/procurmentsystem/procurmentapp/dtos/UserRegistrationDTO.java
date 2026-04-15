package com.procurmentsystem.procurmentapp.dtos;

/**
 * Data Transfer Object for User Provisioning.
 * Matches the structure sent by the Willowton Admin Dashboard.
 */
public class UserRegistrationDTO {
    private String fullName;
    private String username;
    private String password;
    private RoleDTO role;
    private DeptDTO department;

    // Default Constructor for Jackson JSON parsing
    public UserRegistrationDTO() {}

    /**
     * Nested DTO to capture role identity from the frontend dropdown.
     */
    public static class RoleDTO {
        private Long roleId;
        
        public RoleDTO() {}
        public Long getRoleId() { return roleId; }
        public void setRoleId(Long roleId) { this.roleId = roleId; }
    }

    /**
     * Nested DTO to capture department identity from the frontend dropdown.
     */
    public static class DeptDTO {
        private Long deptId;
        
        public DeptDTO() {}
        public Long getDeptId() { return deptId; }
        public void setDeptId(Long deptId) { this.deptId = deptId; }
    }

    // Main Getters and Setters
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public RoleDTO getRole() { return role; }
    public void setRole(RoleDTO role) { this.role = role; }

    public DeptDTO getDepartment() { return department; }
    public void setDepartment(DeptDTO department) { this.department = department; }
}
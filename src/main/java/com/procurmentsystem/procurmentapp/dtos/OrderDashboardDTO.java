package com.procurmentsystem.procurmentapp.dtos;

import java.sql.Timestamp;

public class OrderDashboardDTO {
    private String poNumber;
    private String supplierName;
    private Double totalAmount;
    private String status;
    private Timestamp createdAt;

    public OrderDashboardDTO(String poNumber, String supplierName, Double totalAmount, String status, Timestamp createdAt) {
        this.poNumber = poNumber != null ? poNumber : "TBD";
        this.supplierName = supplierName != null ? supplierName : "Vendor";
        this.totalAmount = totalAmount;
        this.status = status;
        this.createdAt = createdAt;
    }

    public OrderDashboardDTO() {}

    // Getters and Setters
    public String getPoNumber() { return poNumber; }
    public void setPoNumber(String poNumber) { this.poNumber = poNumber; }
    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}
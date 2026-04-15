package com.procurmentsystem.procurmentapp.dtos;

import java.sql.Timestamp;

public class WarehouseDeliveryDTO {
    private Long id;              
    private Long itemId;          
    private String itemName;      
    private String poNumber;      
    private Double quantity;      
    private String unit;          
    private String supplierName;  
    private String status;        
    private Timestamp approvedAt; 

    public WarehouseDeliveryDTO(Integer id, Integer itemId, String itemName, String poNumber, 
                                Integer quantity, String unit, String supplierName, 
                                String status, Timestamp approvedAt) {
        // Safe null-checking for Integer to Long/Double conversion
        this.id = (id != null) ? id.longValue() : null;
        this.itemId = (itemId != null) ? itemId.longValue() : null;
        this.itemName = itemName;
        this.poNumber = (poNumber != null) ? poNumber : (id != null ? "PO-" + id : "N/A");
        this.quantity = (quantity != null) ? quantity.doubleValue() : 0.0;
        this.unit = (unit != null) ? unit : "Units";
        this.supplierName = (supplierName != null) ? supplierName : "Generic Vendor";
        this.status = status;
        this.approvedAt = approvedAt;
    }

    public WarehouseDeliveryDTO() {}

    // Getters and Setters... (Your existing ones are correct)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getPoNumber() { return poNumber; }
    public void setPoNumber(String poNumber) { this.poNumber = poNumber; }
    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Timestamp getApprovedAt() { return approvedAt; }
    public void setApprovedAt(Timestamp approvedAt) { this.approvedAt = approvedAt; }
}
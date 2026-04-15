package com.procurmentsystem.procurmentapp.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "items")
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_id")
    private Integer itemId;

    @Column(name = "item_code", unique = true)
    private String itemCode;

    private String description;
    private String category;

    @Column(name = "unit_of_measure")
    private String unitOfMeasure;

    @Column(name = "last_unit_price")
    @JsonProperty("lastUnitPrice") // This ensures JS 'lastUnitPrice' maps here
    private Double lastUnitPrice; // Rename the variable to match for clarity

    @Column(name = "stock_level")
    @JsonProperty("stockLevel")
    private Integer stockLevel;

    @PrePersist
protected void onCreate() {
    if (this.status == null) this.status = "ACTIVE";
    // If you want to handle the createdAt manually:
    // this.createdAt = LocalDateTime.now(); 
}

    private String status;


    public Integer getStockLevel() { 
    return stockLevel; 
}

public void setStockLevel(Integer stockLevel) { 
    this.stockLevel = stockLevel; 
}
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public Item() {}

    // Getters and Setters
    public Integer getItemId() { return itemId; }
    public void setItemId(Integer itemId) { this.itemId = itemId; }

    public String getItemCode() { return itemCode; }
    public void setItemCode(String itemCode) { this.itemCode = itemCode; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getUnitOfMeasure() { return unitOfMeasure; }
    public void setUnitOfMeasure(String unitOfMeasure) { this.unitOfMeasure = unitOfMeasure; }

   public Double getLastUnitPrice() { return lastUnitPrice; }
    public void setLastUnitPrice(Double lastUnitPrice) { this.lastUnitPrice = lastUnitPrice; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    
}
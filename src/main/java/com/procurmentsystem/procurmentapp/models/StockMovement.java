package com.procurmentsystem.procurmentapp.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_movements")
public class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "movement_id")
    private Long movementId;

    @Column(name = "item_id", nullable = false)
    private Integer itemId;

    @Column(name = "item_description")
    private String itemDescription;

    @Column(name = "movement_type")
    private String movementType; // "IN" for receipts, "OUT" for issues to production

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "reference_number")
    private String referenceNumber; // e.g., "PO-1024" or "REQ-500"

    @Column(name = "handled_by")
    private String handledBy; // Name of the staff (e.g., Sarah Banda)

    @Column(name = "timestamp", updatable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        this.timestamp = LocalDateTime.now();
    }

    public StockMovement() {}

    // Convenience Constructor for the WarehouseService
    public StockMovement(Integer itemId, String itemDescription, String type, 
                         Integer quantity, String reference, String handledBy) {
        this.itemId = itemId;
        this.itemDescription = itemDescription;
        this.movementType = type;
        this.quantity = quantity;
        this.referenceNumber = reference;
        this.handledBy = handledBy;
    }

    // --- GETTERS AND SETTERS ---
    public Long getMovementId() { return movementId; }
    public void setMovementId(Long movementId) { this.movementId = movementId; }

    public Integer getItemId() { return itemId; }
    public void setItemId(Integer itemId) { this.itemId = itemId; }

    public String getItemDescription() { return itemDescription; }
    public void setItemDescription(String itemDescription) { this.itemDescription = itemDescription; }

    public String getMovementType() { return movementType; }
    public void setMovementType(String movementType) { this.movementType = movementType; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }

    public String getHandledBy() { return handledBy; }
    public void setHandledBy(String handledBy) { this.handledBy = handledBy; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
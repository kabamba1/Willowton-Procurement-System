package com.procurmentsystem.procurmentapp.models;

import jakarta.persistence.*;

@Entity
@Table(name = "PO_Items")
public class POItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "po_item_id")
    private Integer lineId;

    @ManyToOne
    @JoinColumn(name = "po_id")
    private PurchaseOrder purchaseOrder;

    @ManyToOne
    @JoinColumn(name = "item_id")
    private Item item;

    private Integer quantity;

    @Column(name = "unit_price")
    private Double unitPrice;

    // Standard field for the database
    private Double subtotal;

    // GETTERS AND SETTERS
    public Integer getLineId() { return lineId; }
    public void setLineId(Integer lineId) { this.lineId = lineId; }

    public PurchaseOrder getPurchaseOrder() { return purchaseOrder; }
    public void setPurchaseOrder(PurchaseOrder purchaseOrder) { this.purchaseOrder = purchaseOrder; }

    public Item getItem() { return item; }
    public void setItem(Item item) { this.item = item; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }

    // Logic to calculate subtotal before saving or when retrieving
    public Double getSubtotal() {
        if (quantity != null && unitPrice != null) {
            return quantity * unitPrice;
        }
        return 0.0;
    }

    public void setSubtotal(Double subtotal) {
        this.subtotal = subtotal;
    }
}
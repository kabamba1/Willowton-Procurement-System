package com.procurmentsystem.procurmentapp.services;

import com.procurmentsystem.procurmentapp.models.*;
import com.procurmentsystem.procurmentapp.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WarehouseService {

    @Autowired 
    private PurchaseOrderRepository poRepo;

    @Autowired 
    private ItemRepository itemRepo;

    @Autowired 
    private MovementRepository movementRepo; // THIS was missing!

    /**
     * Unified Handshake Logic:
     * Updates the Order, adjusts Stock, and logs the Movement.
     */
    @Transactional
    public void receiveGoods(Integer orderId, Integer itemId, Integer qty, String staffName) {
        
        // 1. Update Purchase Order status
        PurchaseOrder po = poRepo.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Purchase Order not found"));
        po.setStatus("RECEIVED");
        poRepo.save(po);

        // 2. Update Item Stock Level
        Item item = itemRepo.findById(itemId)
            .orElseThrow(() -> new RuntimeException("Item not found"));
        
        int currentStock = (item.getStockLevel() != null) ? item.getStockLevel() : 0;
        item.setStockLevel(currentStock + qty);
        itemRepo.save(item);
        
        // 3. LOG THE MOVEMENT (The Audit Trail)
        StockMovement movement = new StockMovement(
            itemId,
            item.getDescription(),
            "IN",
            qty,
            po.getPoNumber(),
            staffName
        );
        
        movementRepo.save(movement);
    }
}
package com.procurmentsystem.procurmentapp.controllers;

import com.procurmentsystem.procurmentapp.dtos.WarehouseDeliveryDTO;
import com.procurmentsystem.procurmentapp.models.StockMovement;
import com.procurmentsystem.procurmentapp.services.WarehouseService;
import com.procurmentsystem.procurmentapp.repositories.MovementRepository;
import com.procurmentsystem.procurmentapp.repositories.PurchaseOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/warehouse")
@CrossOrigin(origins = "*") // Allow your frontend to connect
public class WarehouseController {

    @Autowired private PurchaseOrderRepository poRepo;
    @Autowired private WarehouseService warehouseService;
    @Autowired 
private MovementRepository movementRepo;

// GET: The full audit log for the Stock Movements page
@GetMapping("/movements")
public List<StockMovement> getMovementHistory() {
    return movementRepo.findAllByOrderByTimestampDesc();
}

    // Sarah's dashboard calls this to see what's coming
    @GetMapping("/deliveries")
    public List<WarehouseDeliveryDTO> getExpectedDeliveries() {
        // Change findApprovedDeliveries() to findApprovedDeliveriesForWarehouse()
        return poRepo.findApprovedDeliveriesForWarehouse(); 
    }

    // Sarah's dashboard calls this when she clicks "Mark as Received"
   @PostMapping("/receive")
    public ResponseEntity<?> processReceipt(@RequestBody Map<String, Object> payload) {
        Integer poId = (Integer) payload.get("procurementId");
        Integer itemId = (Integer) payload.get("itemId");
        Integer qty = (Integer) payload.get("receivedQuantity");
        String staffName = (String) payload.get("receivedBy"); // Get the name from the JS payload

        // Pass the staffName to the service
        warehouseService.receiveGoods(poId, itemId, qty, staffName); 
        
        return ResponseEntity.ok().body(Map.of("message", "Stock updated successfully"));
    }
}
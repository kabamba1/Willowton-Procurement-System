package com.procurmentsystem.procurmentapp.controllers;

import com.procurmentsystem.procurmentapp.models.PurchaseOrder;
import com.procurmentsystem.procurmentapp.dtos.OrderDashboardDTO;
import com.procurmentsystem.procurmentapp.repositories.PurchaseOrderRepository;
import com.procurmentsystem.procurmentapp.repositories.SupplierRepository;
import com.procurmentsystem.procurmentapp.repositories.ItemRepository; // 1. ADD THIS IMPORT
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.util.*;

@RestController
@RequestMapping("/api/purchase_orders")
@CrossOrigin(origins = "*") 
public class PurchaseOrderController {

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private ItemRepository itemRepository; // 2. ADD THIS INJECTION LINE

    @GetMapping
    public List<PurchaseOrder> getAllOrders() {
        return purchaseOrderRepository.findAll();
    }

    @GetMapping("/recent")
    public List<OrderDashboardDTO> getRecentOrders() {
        return purchaseOrderRepository.findRecentOrdersForDashboard();
    }

@GetMapping("/stats")
public ResponseEntity<Map<String, Object>> getOrderStats() {
    List<PurchaseOrder> allOrders = purchaseOrderRepository.findAll();
    
    // 1. Calculate the counts
    long pending = allOrders.stream()
            .filter(o -> "PENDING".equalsIgnoreCase(o.getStatus()))
            .count();
            
    long approved = allOrders.stream()
            .filter(o -> "APPROVED".equalsIgnoreCase(o.getStatus()))
            .count();
            
    double totalSpend = allOrders.stream()
            .mapToDouble(PurchaseOrder::getTotalAmount)
            .sum();

    // 2. Map them to the keys your JavaScript expects
    Map<String, Object> stats = new HashMap<>();
    stats.put("pendingCount", pending);               // Links to 'Awaiting Finance'
    stats.put("completedCount", approved);            // Links to 'Completed'
    stats.put("activeRequests", pending + approved);  // Links to 'My Active Requests'
    stats.put("totalSpend", totalSpend);
    stats.put("activeSuppliers", 2); 
    
    return ResponseEntity.ok(stats);
}

    @PostMapping
    public PurchaseOrder createOrder(@RequestBody Map<String, Object> payload) {
        PurchaseOrder order = new PurchaseOrder();
        
        order.setQuantity((Integer) payload.get("quantity"));
        order.setTotalAmount(Double.parseDouble(payload.get("totalAmount").toString()));
        order.setNotes((String) payload.get("notes"));
        order.setStatus("PENDING");

        // LINK THE SUPPLIER
        if (payload.get("supplierId") != null) {
            Integer sId = Integer.parseInt(payload.get("supplierId").toString());
            supplierRepository.findById(sId).ifPresent(order::setSupplier);
        }

        // LINK THE ITEM
        if (payload.get("itemCode") != null) {
            String code = (String) payload.get("itemCode");
            // This now works because itemRepository is declared above
            itemRepository.findByItemCode(code).ifPresent(order::setItem);
        }
        
        return purchaseOrderRepository.save(order);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<PurchaseOrder> updateStatus(@PathVariable Integer id, @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");

        return purchaseOrderRepository.findById(id).map(order -> {
            order.setStatus(newStatus);
            if ("APPROVED".equalsIgnoreCase(newStatus)) {
                order.setApprovedAt(new Timestamp(System.currentTimeMillis()));
                if (order.getPoNumber() == null || order.getPoNumber().isEmpty()) {
                    String year = String.valueOf(java.time.Year.now().getValue());
                    String uniquePo = String.format("PO-%s-%04d", year, id);
                    order.setPoNumber(uniquePo);
                }
            }
            return ResponseEntity.ok(purchaseOrderRepository.save(order));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrder> getOrderById(@PathVariable Integer id) {
        return purchaseOrderRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Integer id) {
        return purchaseOrderRepository.findById(id).map(order -> {
            purchaseOrderRepository.delete(order);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
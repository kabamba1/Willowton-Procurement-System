package com.procurmentsystem.procurmentapp.controllers;

import com.procurmentsystem.procurmentapp.models.PurchaseOrder;
import com.procurmentsystem.procurmentapp.dtos.OrderDashboardDTO;
import com.procurmentsystem.procurmentapp.repositories.PurchaseOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private PurchaseOrderRepository orderRepository;

    // 1. DTO Endpoint for the Table List
    @GetMapping("/recent")
    public List<OrderDashboardDTO> getRecentOrders() {
        return orderRepository.findRecentOrdersForDashboard();
    }

    // 2. Full Object Endpoint for the "Review Modal"
    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrder> getOrderById(@PathVariable Integer id) {
        return orderRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public List<PurchaseOrder> getAllOrders() {
        return orderRepository.findAll();
    }

    @PostMapping
    public PurchaseOrder createOrder(@RequestBody PurchaseOrder order) {
        return orderRepository.save(order);
    }

    // 3. Update Endpoint for Authorize/Reject buttons
    @PutMapping("/{id}")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Integer id, @RequestBody Map<String, Object> updates) {
        return orderRepository.findById(id).map(order -> {
            order.setStatus(updates.get("status").toString());
            order.setApprovedAt(new java.sql.Timestamp(System.currentTimeMillis()));
            orderRepository.save(order);
            return ResponseEntity.ok(order);
        }).orElse(ResponseEntity.notFound().build());
    }
}
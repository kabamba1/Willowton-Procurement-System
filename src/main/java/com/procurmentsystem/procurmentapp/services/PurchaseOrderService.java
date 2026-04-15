package com.procurmentsystem.procurmentapp.services;

import com.procurmentsystem.procurmentapp.models.PurchaseOrder;
import com.procurmentsystem.procurmentapp.repositories.PurchaseOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.sql.Timestamp;
import java.util.List;

@Service
public class PurchaseOrderService {
    @Autowired
    private PurchaseOrderRepository poRepository;

    // ADD THIS: Fetch all orders for the table
    public List<PurchaseOrder> getAllOrders() {
        return poRepository.findAll();
    }

    // ADD THIS: Save new orders from the form
    public PurchaseOrder saveOrder(PurchaseOrder po) {
        if (po.getStatus() == null) po.setStatus("Pending");
        return poRepository.save(po);
    }

    public PurchaseOrder submitOrder(Integer orderId) {
        PurchaseOrder po = poRepository.findById(orderId).orElseThrow();
        po.setStatus("Submitted");
        po.setSubmittedAt(new Timestamp(System.currentTimeMillis()));
        return poRepository.save(po);
    }

    public PurchaseOrder approveOrder(Integer orderId) {
    PurchaseOrder po = poRepository.findById(orderId)
        .orElseThrow(() -> new RuntimeException("Order not found"));

    po.setStatus("Approved");
    po.setApprovedAt(new Timestamp(System.currentTimeMillis()));

    // GENERATE UNIQUE PO NUMBER
    // %04d means a 4-digit number padded with zeros (e.g., 0001, 0042)
    String year = String.valueOf(java.time.Year.now().getValue());
    String uniquePo = "PO-" + year + "-" + String.format("%04d", orderId);
    
    po.setPoNumber(uniquePo);

    return poRepository.save(po);
}
}
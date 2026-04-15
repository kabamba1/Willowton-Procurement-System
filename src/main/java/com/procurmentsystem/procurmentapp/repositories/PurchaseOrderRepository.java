package com.procurmentsystem.procurmentapp.repositories;

import com.procurmentsystem.procurmentapp.models.PurchaseOrder;
import com.procurmentsystem.procurmentapp.dtos.OrderDashboardDTO;
import com.procurmentsystem.procurmentapp.dtos.WarehouseDeliveryDTO; // Import the new DTO
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Integer> {

    // 1. Existing: For Procurement Officer Dashboard
    @Query("SELECT new com.procurmentsystem.procurmentapp.dtos.OrderDashboardDTO(" +
           "o.poNumber, s.companyName, o.totalAmount, o.status, o.createdAt) " +
           "FROM PurchaseOrder o " +
           "LEFT JOIN o.supplier s " + 
           "ORDER BY o.createdAt DESC")
    List<OrderDashboardDTO> findRecentOrdersForDashboard();

    // 2. Existing: For Finance Manager Queue
    @Query("SELECT new com.procurmentsystem.procurmentapp.dtos.OrderDashboardDTO(" +
           "o.poNumber, s.companyName, o.totalAmount, o.status, o.createdAt) " +
           "FROM PurchaseOrder o " +
           "JOIN o.supplier s " +
           "WHERE UPPER(o.status) = 'PENDING' " +
           "ORDER BY o.createdAt DESC")
    List<OrderDashboardDTO> findPendingOrdersForManager();

    // 3. NEW: For Warehouse "Expected Deliveries"
    // This allows Sarah to see APPROVED goods that need to be physically received
@Query("SELECT new com.procurmentsystem.procurmentapp.dtos.WarehouseDeliveryDTO(" +
       "o.orderId, i.itemId, i.description, o.poNumber, " +
       "o.quantity, i.unitOfMeasure, s.companyName, " + 
       "o.status, o.approvedAt) " +
       "FROM PurchaseOrder o " +
       "JOIN o.item i " +
       "JOIN o.supplier s " +
       "WHERE o.status = 'APPROVED' OR o.status = 'approved' " + // Check for both
       "ORDER BY o.approvedAt ASC")
List<WarehouseDeliveryDTO> findApprovedDeliveriesForWarehouse();
}
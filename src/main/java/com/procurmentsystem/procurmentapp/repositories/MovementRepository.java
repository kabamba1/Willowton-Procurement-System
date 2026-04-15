package com.procurmentsystem.procurmentapp.repositories;

import com.procurmentsystem.procurmentapp.models.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MovementRepository extends JpaRepository<StockMovement, Long> {
    
    // Fetch all movements, newest first
    List<StockMovement> findAllByOrderByTimestampDesc();
}
package com.procurmentsystem.procurmentapp.repositories;

import com.procurmentsystem.procurmentapp.models.POItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface POItemRepository extends JpaRepository<POItem, Integer> {
}
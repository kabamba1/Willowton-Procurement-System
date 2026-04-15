package com.procurmentsystem.procurmentapp.repositories;

import com.procurmentsystem.procurmentapp.models.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Integer> {
}
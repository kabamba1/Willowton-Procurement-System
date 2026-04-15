package com.procurmentsystem.procurmentapp.repositories;

import com.procurmentsystem.procurmentapp.models.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemRepository extends JpaRepository<Item, Integer> {
    java.util.Optional<Item> findByItemCode(String itemCode);
}
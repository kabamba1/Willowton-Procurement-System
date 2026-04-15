package com.procurmentsystem.procurmentapp.controllers;

import com.procurmentsystem.procurmentapp.models.Item;
import com.procurmentsystem.procurmentapp.repositories.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/items")
@CrossOrigin(origins = "*") // Allows your frontend on 5500/Live Server to talk to 8081
public class ItemController {

    @Autowired
    private ItemRepository itemRepository;

    // 1. Fetch all items
    @GetMapping
    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    // 2. Fetch a SINGLE item (Required for the Edit Modal)
    @GetMapping("/{id}")
    public ResponseEntity<Item> getItemById(@PathVariable Integer id) {
        return itemRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 3. Register a new SKU/Item
    @PostMapping
    public Item addItem(@RequestBody Item item) {
        return itemRepository.save(item);
    }

    // 4. Update an existing SKU (Required for the Save button when editing)
    @PutMapping("/{id}")
    public ResponseEntity<Item> updateItem(@PathVariable Integer id, @RequestBody Item itemDetails) {
        return itemRepository.findById(id).map(item -> {
            item.setItemCode(itemDetails.getItemCode());
            item.setDescription(itemDetails.getDescription());
            item.setCategory(itemDetails.getCategory());
            item.setUnitOfMeasure(itemDetails.getUnitOfMeasure());
            item.setLastUnitPrice(itemDetails.getLastUnitPrice());
            item.setStockLevel(itemDetails.getStockLevel());
            item.setStatus(itemDetails.getStatus());
            
            Item updatedItem = itemRepository.save(item);
            return ResponseEntity.ok(updatedItem);
        }).orElse(ResponseEntity.notFound().build());
    }

    // 5. Delete an item
    @DeleteMapping("/{id}")
    public void deleteItem(@PathVariable Integer id) {
        itemRepository.deleteById(id);
    }
}
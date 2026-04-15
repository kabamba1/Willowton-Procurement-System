package com.procurmentsystem.procurmentapp.controllers;

import com.procurmentsystem.procurmentapp.models.Supplier;
import com.procurmentsystem.procurmentapp.repositories.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@CrossOrigin(origins = "*")
public class SupplierController {

    @Autowired
    private SupplierRepository supplierRepository;

    @GetMapping
    public List<Supplier> getSuppliers() {
        return supplierRepository.findAll();
    }

    // Changed Long to Integer to match your Repository
    @GetMapping("/{id}")
    public Supplier getSupplier(@PathVariable Integer id) {
        return supplierRepository.findById(id).orElse(null);
    }

    @PostMapping
    public Supplier createSupplier(@RequestBody Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    // Changed Long to Integer to match your Repository
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSupplier(@PathVariable Integer id) {
        if (supplierRepository.existsById(id)) {
            supplierRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
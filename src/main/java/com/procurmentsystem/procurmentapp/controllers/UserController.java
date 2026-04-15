package com.procurmentsystem.procurmentapp.controllers;

import com.procurmentsystem.procurmentapp.dtos.UserRegistrationDTO;
import com.procurmentsystem.procurmentapp.models.User;
import com.procurmentsystem.procurmentapp.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<User> getAllUsers() { return userRepository.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Integer id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody UserRegistrationDTO dto) {
        if (userRepository.existsByUsername(dto.getUsername())) {
            return ResponseEntity.badRequest().body("Username taken");
        }
        return saveOrUpdateUser(new User(), dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Integer id, @RequestBody UserRegistrationDTO dto) {
        return userRepository.findById(id)
                .map(user -> saveOrUpdateUser(user, dto))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    private ResponseEntity<?> saveOrUpdateUser(User user, UserRegistrationDTO dto) {
        user.setFullName(dto.getFullName());
        user.setUsername(dto.getUsername());
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            user.setPassword(dto.getPassword());
        }
        user.setRoleId(dto.getRole().getRoleId().intValue());
        user.setDeptId(dto.getDepartment().getDeptId().intValue());
        userRepository.save(user);
        return ResponseEntity.ok("Success");
    }
}

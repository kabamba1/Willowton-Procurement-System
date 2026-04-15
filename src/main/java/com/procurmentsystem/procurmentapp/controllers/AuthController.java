package com.procurmentsystem.procurmentapp.controllers;

import com.procurmentsystem.procurmentapp.models.User;
import com.procurmentsystem.procurmentapp.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Allows your frontend to talk to this API
public class AuthController {

    @Autowired
    private UserRepository userRepository;

   @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        // DEBUG 1: This shows what you typed into the login box on the website
        System.out.println("FRONTEND SENT -> User: [" + username + "] | Pass: [" + password + "]");

        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // DEBUG 2: This shows exactly what is inside your MySQL table for this user
            System.out.println("DATABASE HAS -> User: [" + user.getUsername() + "] | Pass: [" + user.getPassword() + "]");
            
            if (user.getPassword().equals(password)) {
                System.out.println("SUCCESS: Match found for " + username);
                return ResponseEntity.ok(user);
            } else {
                System.out.println("FAIL: Password mismatch for " + username);
            }
        } else {
            System.out.println("FAIL: Username [" + username + "] not found in database.");
        }

        return ResponseEntity.status(401).body("Invalid username or password");
    }
}
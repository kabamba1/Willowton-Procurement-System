package com.procurmentsystem.procurmentapp.repositories;

import com.procurmentsystem.procurmentapp.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    // Custom query to find user by username
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
}
package com.procurmentsystem.procurmentapp.config; 

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Unlocks POST requests for auth.js
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll() // Open the door for login
                .anyRequest().permitAll() // Allow everything else for testing
            );
        return http.build();
    }

   @Bean
@SuppressWarnings("deprecation")
public PasswordEncoder passwordEncoder() {
    return NoOpPasswordEncoder.getInstance(); 
}
}
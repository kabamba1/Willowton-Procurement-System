package com.procurmentsystem.procurmentapp;

import com.procurmentsystem.procurmentapp.models.User;
import com.procurmentsystem.procurmentapp.repositories.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
public class ProcurmentappApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProcurmentappApplication.class, args);
    }

    // --- NEW: CLOUD SECURITY (CORS) ---
    // This allows your XAMPP frontend to talk to your Render backend
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // Allow all API endpoints
                        .allowedOrigins("*") // Allow any origin (XAMPP, Phone, etc.)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
            }
        };
    }

    // --- YOUR EXISTING MIGRATION LOGIC ---
    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository) {
        return args -> {
            if (userRepository.count() == 0) { 
                User admin = new User();
                admin.setUsername("admin_mwape");
                admin.setPassword("admin123");
                admin.setFullName("Mwape IT Admin");
                admin.setRoleId(1);
                admin.setDeptId(1);
                userRepository.save(admin);

                User proc = new User();
                proc.setUsername("m_kabamba");
                proc.setPassword("proc123");
                proc.setFullName("M. Kabamba");
                proc.setRoleId(2);
                proc.setDeptId(2);
                userRepository.save(proc);

                User finance = new User();
                finance.setUsername("finance_boss");
                finance.setPassword("mgr123");
                finance.setFullName("John Phiri");
                finance.setRoleId(3);
                finance.setDeptId(3);
                userRepository.save(finance);

                System.out.println("----------------------------------------------");
                System.out.println(">>> SUCCESS: Willowton Team Migrated to Cloud! <<<");
                System.out.println("----------------------------------------------");
            } else {
                System.out.println("Cloud database already has data. Ready for login.");
            }
        };
    }
}
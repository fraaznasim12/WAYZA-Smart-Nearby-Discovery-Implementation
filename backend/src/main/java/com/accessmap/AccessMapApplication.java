package com.accessmap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * AccessMap Application Entry Point.
 *
 * <p>This is the root Spring Boot application class. The {@code @SpringBootApplication}
 * annotation enables:
 * <ul>
 *   <li>{@code @Configuration} — registers this class as a Spring configuration source.</li>
 *   <li>{@code @EnableAutoConfiguration} — activates Spring Boot's auto-configuration mechanism.</li>
 *   <li>{@code @ComponentScan} — scans all classes under {@code com.accessmap} for beans.</li>
 * </ul>
 */
@SpringBootApplication
public class AccessMapApplication {

    public static void main(String[] args) {
        SpringApplication.run(AccessMapApplication.class, args);
    }
}


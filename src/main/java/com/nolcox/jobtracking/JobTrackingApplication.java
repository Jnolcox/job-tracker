package com.nolcox.jobtracking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories
public class JobTrackingApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(JobTrackingApplication.class, args);
    }
}

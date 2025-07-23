package com.nolcox.jobtracking.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.math.BigDecimal;

@Configuration
public class DatabaseConfig {
    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        
        // Configure BigDecimal to serialize with 2 decimal places
        SimpleModule bigDecimalModule = new SimpleModule();
        bigDecimalModule.addSerializer(BigDecimal.class, new com.fasterxml.jackson.databind.JsonSerializer<BigDecimal>() {
            @Override
            public void serialize(BigDecimal value, com.fasterxml.jackson.core.JsonGenerator gen, 
                                com.fasterxml.jackson.databind.SerializerProvider serializers) 
                    throws java.io.IOException {
                if (value == null) {
                    gen.writeNull();
                } else {
                    gen.writeNumber(value.setScale(2, java.math.RoundingMode.HALF_UP));
                }
            }
        });
        objectMapper.registerModule(bigDecimalModule);
        
        return objectMapper;
    }
}

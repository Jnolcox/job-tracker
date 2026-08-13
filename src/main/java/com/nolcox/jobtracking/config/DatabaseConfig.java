package com.nolcox.jobtracking.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Jackson customizations applied on top of Spring Boot's auto-configured mapper.
 *
 * <p>This deliberately customizes the builder rather than declaring a
 * {@code @Primary ObjectMapper} bean. Replacing the mapper outright made Spring Boot's
 * Jackson auto-configuration back off, which silently disabled every
 * {@code spring.jackson.*} property in {@code application.yml}: dates serialized as
 * epoch-second decimals despite {@code write-dates-as-timestamps: false}, and unknown
 * request properties were rejected despite the configuration saying otherwise.</p>
 */
@Configuration
public class DatabaseConfig {

    /**
     * Number of decimal places every {@link BigDecimal} is serialized with.
     */
    private static final int MONETARY_SCALE = 2;

    /**
     * Serializes monetary values with a fixed scale so that clients receive a consistent
     * shape rather than whatever precision the database happened to return.
     *
     * @return a customizer registering the {@link BigDecimal} serializer
     */
    @Bean
    public Jackson2ObjectMapperBuilderCustomizer monetaryScaleCustomizer() {
        return builder -> builder.serializerByType(BigDecimal.class, new JsonSerializer<BigDecimal>() {
            @Override
            public void serialize(BigDecimal value, JsonGenerator gen, SerializerProvider serializers)
                    throws IOException {
                if (value == null) {
                    gen.writeNull();
                } else {
                    gen.writeNumber(value.setScale(MONETARY_SCALE, RoundingMode.HALF_UP));
                }
            }
        });
    }
}

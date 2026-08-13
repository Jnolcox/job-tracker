package com.nolcox.jobtracking.config;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.info.BuildProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class OpenApiConfig {

    /**
     * Version reported when build information is unavailable, which happens when the
     * application runs from classes rather than from a packaged jar.
     */
    private static final String UNKNOWN_VERSION = "unknown";

    private final ObjectProvider<BuildProperties> buildProperties;

    public OpenApiConfig(ObjectProvider<BuildProperties> buildProperties) {
        this.buildProperties = buildProperties;
    }

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Job Tracking API")
                        .version(resolveVersion())
                        .description("REST API for Job Application Tracking System")
                        .contact(new Contact()
                                .name("John Nolcox")
                                .email("jnolcox0429@gmail.com"))
                        .license(new License()
                                .name("MIT")
                                .url("https://github.com/Jnolcox/job-tracker/blob/develop/LICENSE")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth",
                                new SecurityScheme()
                                        .name("bearerAuth")
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")));
    }

    /**
     * Reports the version Maven built, so the published specification cannot drift from
     * the artifact the way a hardcoded literal did.
     *
     * @return the build version, or {@code unknown} when build information is absent
     */
    private String resolveVersion() {
        BuildProperties properties = buildProperties.getIfAvailable();
        return properties != null ? properties.getVersion() : UNKNOWN_VERSION;
    }
}

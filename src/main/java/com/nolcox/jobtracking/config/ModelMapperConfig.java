package com.nolcox.jobtracking.config;

import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ModelMapperConfig {

    /**
     * The general-purpose mapper. Null source values are skipped, so a mapping never
     * clears a field the source did not carry.
     */
    @Bean
    public ModelMapper modelMapper() {
        return configure(new ModelMapper(), true);
    }

    private ModelMapper configure(ModelMapper modelMapper, boolean skipNull) {
        modelMapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.STRICT)
                .setFieldMatchingEnabled(true)
                .setSkipNullEnabled(skipNull)
                .setFieldAccessLevel(org.modelmapper.config.Configuration.AccessLevel.PRIVATE);
        return modelMapper;
    }
}

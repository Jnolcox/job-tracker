package com.nolcox.jobtracking.application.service.impl;

import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.stereotype.Component;

import com.nolcox.jobtracking.application.dto.request.JobApplicationUpdateRequest;
import com.nolcox.jobtracking.domain.entity.JobApplication;

/**
 * Applies a full-replacement update onto an existing application.
 *
 * <p>This owns its own {@link ModelMapper} rather than injecting a second one of the same
 * type. Two same-typed beans would have to be told apart with {@code @Qualifier}, which
 * Lombok only copies onto a generated constructor when {@code lombok.config} says so, and
 * that file is easy to leave out of a build context. A distinct type cannot be injected by
 * accident.</p>
 *
 * <p>Unlike the general-purpose mapper, this one applies null source values instead of
 * skipping them, which is what allows {@code PUT} to clear an optional field.</p>
 */
@Component
public class JobApplicationUpdateMapper {

    private final ModelMapper mapper;

    public JobApplicationUpdateMapper() {
        this.mapper = new ModelMapper();
        this.mapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.STRICT)
                .setFieldMatchingEnabled(true)
                .setSkipNullEnabled(false)
                .setFieldAccessLevel(org.modelmapper.config.Configuration.AccessLevel.PRIVATE);
    }

    /**
     * Copies every field of the request onto the entity, including the null ones.
     *
     * <p>Fields that must survive a null, such as {@code appliedDate} and
     * {@code statusChangedAt}, are restored by the caller after this returns.</p>
     *
     * @param request the replacement values
     * @param target the entity to update in place
     */
    public void applyTo(JobApplicationUpdateRequest request, JobApplication target) {
        mapper.map(request, target);
    }
}

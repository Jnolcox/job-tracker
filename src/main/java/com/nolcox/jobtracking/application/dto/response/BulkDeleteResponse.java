package com.nolcox.jobtracking.application.dto.response;

/**
 * Response DTO for bulk delete endpoints.
 *
 * <p>Reports how many applications a bulk delete operation removed, along with
 * a human-readable message the frontend can surface directly to the user.</p>
 *
 * @param deletedCount the number of job applications that were deleted
 * @param message a human-readable summary of the operation
 */
public record BulkDeleteResponse(
        int deletedCount,
        String message
) {}

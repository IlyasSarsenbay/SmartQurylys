package com.smartqurylys.backend.dto.project.participant;

import lombok.Builder;
import lombok.Data;


@Data
@Builder
public class UpdateParticipantRequest {
    private String role;
    private Boolean canUploadDocuments;
    private Boolean canSendNotifications;
}

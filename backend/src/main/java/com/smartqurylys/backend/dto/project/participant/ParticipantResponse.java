package com.smartqurylys.backend.dto.project.participant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantResponse {
    private Long id;
    private String fullName;
    private String role;
    private boolean canUploadDocuments;
    private boolean canSendNotifications;
}

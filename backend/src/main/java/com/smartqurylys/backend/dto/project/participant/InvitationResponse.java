package com.smartqurylys.backend.dto.project.participant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class InvitationResponse {
    private Long id;
    private String projectName;
    private String userFullName;
    private String role;
    private boolean canUploadDocuments;
    private boolean canSendNotifications;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}

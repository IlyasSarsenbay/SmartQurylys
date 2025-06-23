package com.smartqurylys.backend.dto.project.participant;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateInvitationRequest {

    @NotBlank(message = "Требуется ИИН/БИН")
    private String iinBin;

    @NotBlank(message = "Требуется роль")
    private String role;

    private boolean canUploadDocuments;

    private boolean canSendNotifications;
}
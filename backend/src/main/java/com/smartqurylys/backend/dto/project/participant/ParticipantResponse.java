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
    private String iinBin;
    private String role;
    private String organization;
    private String phone;
    private String email;
    private boolean canUploadDocuments;
    private boolean canSendNotifications;
    private boolean owner;
}

package com.smartqurylys.backend.dto.project.document;

import com.smartqurylys.backend.shared.enums.DocumentStatus;
import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
public class DocumentRequest {

    private Long projectId;

    private String name;

    private Date uploadDate;

    private DocumentStatus status;

    private List<Long> fileIds;

    private List<Long> haveToSignParticipantIds;

    private List<Long> signedParticipantIds;
}
package com.smartqurylys.backend.dto.project.document;

import com.smartqurylys.backend.dto.project.FileResponse;
import com.smartqurylys.backend.dto.project.participant.ParticipantResponse;
import com.smartqurylys.backend.entity.User;
import com.smartqurylys.backend.shared.enums.DocumentStatus;
import lombok.Builder;
import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
@Builder
public class DocumentDetailsResponse {

    private Long id;

    private Long projectId;

    private String name;

    private Date uploadDate;

    private String uploaderEmail;

    private String uploaderName;

    private DocumentStatus status;

    private List<FileResponse> files;

    private List<ParticipantResponse> haveToSign;

    private List<ParticipantResponse> signed;

    // TODO: in progress
    // private List<CommentResponse> comments; 
}
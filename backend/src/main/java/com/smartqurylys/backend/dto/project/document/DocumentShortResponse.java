package com.smartqurylys.backend.dto.project.document;

import com.smartqurylys.backend.shared.enums.DocumentStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DocumentShortResponse {
    private Integer id;
    private String name;
    private DocumentStatus status;
    private Date uploadDate;
    private String uploaderEmail;
    private String uploaderName;
}
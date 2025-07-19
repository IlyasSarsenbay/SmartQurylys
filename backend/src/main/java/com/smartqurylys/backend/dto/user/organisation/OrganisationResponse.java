package com.smartqurylys.backend.dto.user.organisation;

import com.smartqurylys.backend.dto.user.UserResponse;
import com.smartqurylys.backend.shared.enums.OrganistaionType;
import com.smartqurylys.backend.shared.enums.Specialization;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;


@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class OrganisationResponse extends UserResponse {

    private String judAddress;
    private String organization;
    private String position;
    private OrganistaionType type;
    private String field;
    private Specialization specialization;
    private Long yearsOfExperience;

}

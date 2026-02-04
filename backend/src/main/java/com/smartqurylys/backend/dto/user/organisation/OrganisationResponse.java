package com.smartqurylys.backend.dto.user.organisation;

import com.smartqurylys.backend.dto.project.LicenseResponse;
import com.smartqurylys.backend.dto.user.UserResponse;
import com.smartqurylys.backend.shared.enums.OrganisationStatus;
import com.smartqurylys.backend.shared.enums.OrganistaionType;
import com.smartqurylys.backend.shared.enums.Specialization;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

// Объект передачи данных для ответа с информацией об организации, наследует от UserResponse.
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class OrganisationResponse extends UserResponse {

    private String judAddress; // Юридический адрес организации.
    private String position; // Должность пользователя в организации.
    private OrganistaionType type; // Тип организации.
    private String field; // Область деятельности организации.
    private List<String> specialization; // Список специализаций организации.
    private Long yearsOfExperience; // Опыт работы организации в годах.
    private List<LicenseResponse> licenses; // Список лицензий организации.
    private OrganisationStatus status; // Статус доступности организации.
}

package com.smartqurylys.backend.dto.user.organisation;

import com.smartqurylys.backend.shared.enums.OrganistaionType;
import com.smartqurylys.backend.shared.enums.Specialization;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;


@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class OrganisationUpdateRequest {
    // Поля от User
    private String fullName;
    @Email(message = "Некорректный формат почты")
    private String email;
    @Size(min = 8, message = "Пароль должен стоять как минимум из 8 символов")
    private String phone;
    @Pattern(regexp = "\\d{12}", message = "ИИН/БИН должен состоять из 12 цифр")
    private String iinBin;
    private Long cityId;

    // Поля от Organisation
    private String judAddress;
    private String organization;
    private String position;
    private OrganistaionType type;
    private String field;
    private Specialization specialization;
    private Long yearsOfExperience;
}

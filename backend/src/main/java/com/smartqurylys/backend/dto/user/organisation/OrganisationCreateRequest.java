package com.smartqurylys.backend.dto.user.organisation;


import com.smartqurylys.backend.shared.enums.OrganistaionType;
import com.smartqurylys.backend.shared.enums.Specialization;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class OrganisationCreateRequest {
    // Поля от User
    @NotBlank(message = "Требуется имя")
    private String fullName;

    @NotBlank(message = "Требуется почта")
    @Email(message = "Некорректный формат почты")
    private String email;

    @NotBlank(message = "Требуется пароль")
    @Size(min = 8, message = "Пароль должен стоять как минимум из 8 символов")
    private String password;

    @NotBlank(message = "Требуется номер телефона")
    private String phone;

    @NotBlank(message = "Требуется ИИН/БИН")
    @Pattern(regexp = "\\d{12}", message = "ИИН/БИН должен состоять из 12 цифр")
    private String iinBin;

    @NotNull(message = "Требуется ID города")
    private Long cityId;

    // Поля от Organisation
    @NotBlank(message = "Требуется юридический адрес")
    private String judAddress;

    @NotBlank(message = "Требуется название организации")
    private String organization;

    @NotBlank(message = "Требуется должность")
    private String position;

    @NotNull(message = "Требуется тип организации")
    private OrganistaionType type;

    @NotBlank(message = "Требуется область деятельности")
    private String field;

    @NotNull(message = "Требуется специализация")
    private Specialization specialization;

    @NotNull(message = "Требуется опыт работы")
    private Long yearsOfExperience;
}


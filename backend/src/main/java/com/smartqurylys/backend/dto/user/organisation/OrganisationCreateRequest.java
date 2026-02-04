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

import java.util.List;

// Объект передачи данных для запроса на создание новой организации, включая данные пользователя-администратора.
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class OrganisationCreateRequest {
    // Поля пользователя (администратора организации)
    @NotBlank(message = "Требуется имя")
    private String fullName; // Полное имя пользователя.

    @NotBlank(message = "Требуется почта")
    @Email(message = "Некорректный формат почты")
    private String email; // Электронная почта пользователя.

    @NotBlank(message = "Требуется пароль")
    @Size(min = 8, message = "Пароль должен стоять как минимум из 8 символов")
    private String password; // Пароль пользователя.

    @NotBlank(message = "Требуется номер телефона")
    private String phone; // Номер телефона пользователя.

    @NotBlank(message = "Требуется ИИН/БИН")
    @Pattern(regexp = "\\d{12}", message = "ИИН/БИН должен состоять из 12 цифр")
    private String iinBin; // ИИН/БИН пользователя.

    @NotNull(message = "Требуется ID города")
    private Long cityId; // Идентификатор города пользователя.

    // Поля организации
    @NotBlank(message = "Требуется юридический адрес")
    private String judAddress; // Юридический адрес организации.

    @NotBlank(message = "Требуется название организации")
    private String organization; // Название организации.

    @NotBlank(message = "Требуется должность")
    private String position; // Должность пользователя в организации.

    @NotNull(message = "Требуется тип организации")
    private OrganistaionType type; // Тип организации.

    @NotBlank(message = "Требуется область деятельности")
    private String field; // Область деятельности организации.

    @NotNull(message = "Требуется специализация")
    private List<String> specialization; // Список специализаций организации.

    @NotNull(message = "Требуется опыт работы")
    private Long yearsOfExperience; // Опыт работы организации в годах.
}


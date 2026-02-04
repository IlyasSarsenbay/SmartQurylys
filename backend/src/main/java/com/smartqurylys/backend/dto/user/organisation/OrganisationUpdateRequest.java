package com.smartqurylys.backend.dto.user.organisation;

import com.smartqurylys.backend.shared.enums.OrganisationStatus;
import com.smartqurylys.backend.shared.enums.OrganistaionType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

// Объект передачи данных для запроса на обновление информации об организации.
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class OrganisationUpdateRequest {
    // Поля пользователя (администратора организации)
    private String fullName; // Новое полное имя пользователя.
    @Email(message = "Некорректный формат почты")
    private String email; // Новый адрес электронной почты.
    @Size(min = 8, message = "Пароль должен стоять как минимум из 8 символов")
    private String phone; // Новый номер телефона.
    @Pattern(regexp = "\\d{12}", message = "ИИН/БИН должен состоять из 12 цифр")
    private String iinBin; // Новый ИИН/БИН.
    private Long cityId; // Новый ID города.

    // Поля организации
    private String judAddress; // Новый юридический адрес организации.
    private String organization; // Новое название организации.
    private String position; // Новая должность пользователя в организации.
    private OrganistaionType type; // Новый тип организации.
    private String field; // Новая область деятельности организации.
    private List<String> specialization; // Обновленный список специализаций организации.
    private Long yearsOfExperience; // Обновленный опыт работы организации в годах.
    private OrganisationStatus status; // Обновленный статус доступности.
}

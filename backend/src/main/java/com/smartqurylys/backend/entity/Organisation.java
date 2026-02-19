package com.smartqurylys.backend.entity;

import com.smartqurylys.backend.shared.enums.OrganisationStatus;
import com.smartqurylys.backend.shared.enums.OrganistaionType;
import com.smartqurylys.backend.shared.enums.Specialization;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;
import java.util.Set;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

// Сущность для представления организации, наследует от User.
@Entity
@Table(name = "organisations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@PrimaryKeyJoinColumn(name = "id")
public class Organisation extends User{

    private String judAddress; // Юридический адрес организации.

    private String position; // Должность пользователя в организации.

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "organisation_id")
    private List<File> files; // Прикрепленные файлы организации.

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private OrganistaionType type; // Тип организации.

    private String field; // Область деятельности организации.

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "organisation_specializations",
            joinColumns = @JoinColumn(name = "organisation_id"))
    @Column(name = "specialization")
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private Set<Specialization> specialization; // Список специализаций организации.

    private Long yearsOfExperience; // Опыт работы организации в годах.

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "organisation_id")
    private List<License> licenses; // Лицензии организации.

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Builder.Default
    private OrganisationStatus status = OrganisationStatus.AVAILABLE; // Статус доступности организации.
}
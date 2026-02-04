package com.smartqurylys.backend.entity;

import com.smartqurylys.backend.shared.enums.OrganisationStatus;
import com.smartqurylys.backend.shared.enums.OrganistaionType;
import com.smartqurylys.backend.shared.enums.Specialization;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;
import java.util.Set;

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
    private OrganistaionType type; // Тип организации.

    private String field; // Область деятельности организации.

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "organisation_specializations",
            joinColumns = @JoinColumn(name = "organisation_id"))
    @Column(name = "specialization")
    @Enumerated(EnumType.STRING)
    private Set<Specialization> specialization; // Список специализаций организации.

    private Long yearsOfExperience; // Опыт работы организации в годах.

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "organisation_id")
    private List<License> licenses; // Лицензии организации.

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private OrganisationStatus status = OrganisationStatus.AVAILABLE; // Статус доступности организации.
}
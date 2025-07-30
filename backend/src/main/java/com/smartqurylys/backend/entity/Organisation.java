package com.smartqurylys.backend.entity;

import com.smartqurylys.backend.shared.enums.OrganistaionType;
import com.smartqurylys.backend.shared.enums.Specialization;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;
import java.util.Set;

@Entity
@Table(name = "organisations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@PrimaryKeyJoinColumn(name = "id")
public class Organisation extends User{

    private String judAddress;

    private String organization;

    private String position;

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "organisation_id")
    private List<File> files;

    @Enumerated(EnumType.STRING)
    private OrganistaionType type;

    private String field;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "organisation_specializations",
            joinColumns = @JoinColumn(name = "organisation_id"))
    @Column(name = "specialization")
    @Enumerated(EnumType.STRING)
    private Set<Specialization> specialization;

    private Long yearsOfExperience;

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "organisation_id")
    private List<License> licenses;
}
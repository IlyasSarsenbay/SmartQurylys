package com.smartqurylys.backend.entity;

import com.smartqurylys.backend.shared.enums.ProjectStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String description;

    private String type;

    private LocalDate startDate;

    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    private ProjectStatus status;

    @ManyToOne
    @JoinColumn(name = "city_id")
    private City city;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Participant> participants;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ParticipantInvitation> invitations;
//
//    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL)
//    private List<Document> documents;
//
      @OneToMany(cascade = CascadeType.ALL)
      @JoinColumn(name = "project_id")
      private List<File> files;

      @ManyToOne
      @JoinColumn(name = "user_id")
      private User owner;

      @OneToOne(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
      private Schedule schedule;
}


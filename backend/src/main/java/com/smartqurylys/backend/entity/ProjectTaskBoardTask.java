package com.smartqurylys.backend.entity;

import com.smartqurylys.backend.shared.enums.ProjectTaskBoardPriority;
import com.smartqurylys.backend.shared.enums.ProjectTaskBoardCompletionStatus;
import com.smartqurylys.backend.shared.enums.ProjectTaskBoardStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "project_task_board_tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTaskBoardTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stage_id", nullable = false)
    private ProjectTaskBoardStage stage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_task_id")
    private ProjectTaskBoardTask parentTask;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private ProjectTaskBoardStatus status;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private ProjectTaskBoardPriority priority;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_participant_id")
    private Participant assigneeParticipant;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "completion_status", nullable = false)
    private ProjectTaskBoardCompletionStatus completionStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "completion_requested_by_participant_id")
    private Participant completionRequestedByParticipant;

    @Column(name = "completion_requested_at")
    private LocalDateTime completionRequestedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "completion_reviewed_by_user_id")
    private User completionReviewedByUser;

    @Column(name = "completion_reviewed_at")
    private LocalDateTime completionReviewedAt;

    @Column(name = "completion_review_reason", columnDefinition = "text")
    private String completionReviewReason;

    @Column(nullable = false)
    private Integer position;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "parentTask", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProjectTaskBoardTask> subtasks = new ArrayList<>();

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProjectTaskComment> comments = new ArrayList<>();
}

package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.ProjectTaskBoardTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProjectTaskBoardTaskRepository extends JpaRepository<ProjectTaskBoardTask, Long> {

    @Query("""
            select distinct t
            from ProjectTaskBoardTask t
            left join fetch t.stage
            left join fetch t.parentTask
            left join fetch t.assigneeParticipant ap
            left join fetch ap.user
            left join fetch t.createdBy
            where t.project.id = :projectId
            order by t.position asc, t.id asc
            """)
    List<ProjectTaskBoardTask> findBoardTasksByProjectId(@Param("projectId") Long projectId);

    Optional<ProjectTaskBoardTask> findByIdAndProjectId(Long id, Long projectId);

    List<ProjectTaskBoardTask> findByIdInAndProjectId(Collection<Long> ids, Long projectId);

    long countByStageIdAndParentTaskIsNull(Long stageId);

    long countByParentTaskId(Long parentTaskId);
}

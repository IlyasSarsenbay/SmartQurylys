package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.ProjectTaskBoardStage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectTaskBoardStageRepository extends JpaRepository<ProjectTaskBoardStage, Long> {
    List<ProjectTaskBoardStage> findByProjectIdOrderByPositionAscIdAsc(Long projectId);

    Optional<ProjectTaskBoardStage> findByIdAndProjectId(Long id, Long projectId);
}

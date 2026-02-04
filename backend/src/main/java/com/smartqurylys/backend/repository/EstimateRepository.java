package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.Estimate;
import com.smartqurylys.backend.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Репозиторий для работы с сущностями Estimate.
public interface EstimateRepository extends JpaRepository<Estimate, Long> {
    // Находит смету по связанному проекту.
    Optional<Estimate> findByProject(Project project);
}
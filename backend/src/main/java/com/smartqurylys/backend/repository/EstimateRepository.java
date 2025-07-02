package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.Estimate;
import com.smartqurylys.backend.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EstimateRepository extends JpaRepository<Estimate, Long> {
    Optional<Estimate> findByProject(Project project);
}
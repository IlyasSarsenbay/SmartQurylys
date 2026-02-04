package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.Requirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// Репозиторий для работы с сущностями Requirement.
@Repository
public interface RequirementRepository extends JpaRepository<Requirement, Long> {
}
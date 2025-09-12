package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByOwnerId(Long ownerId);

    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.participants WHERE p.id = :id")
    Optional<Project> findByIdWithParticipants(@Param("id") Long id);
}
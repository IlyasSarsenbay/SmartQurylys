package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

// Репозиторий для работы с сущностями Project.
public interface ProjectRepository extends JpaRepository<Project, Long> {
    // Находит все проекты, принадлежащие указанному владельцу.
    List<Project> findByOwner(com.smartqurylys.backend.entity.User owner);

    // Находит проект по ID, включая его участников, для избежания N+1 запросов.
    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.participants WHERE p.id = :id")
    Optional<Project> findByIdWithParticipants(@Param("id") Long id);
}
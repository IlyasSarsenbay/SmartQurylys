package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.Project;
import com.smartqurylys.backend.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Репозиторий для работы с сущностями Schedule.
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    // Находит график работ по связанному проекту.
    Optional<Schedule> findByProject(Project project);
}
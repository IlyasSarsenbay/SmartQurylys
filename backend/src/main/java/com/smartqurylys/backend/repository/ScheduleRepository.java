package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.Project;
import com.smartqurylys.backend.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    Optional<Schedule> findByProject(Project project);
}
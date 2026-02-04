package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.Schedule;
import com.smartqurylys.backend.entity.Stage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// Репозиторий для работы с сущностями Stage.
public interface StageRepository extends JpaRepository<Stage, Long> {
    // Находит все этапы, относящиеся к заданному графику работ.
    List<Stage> findBySchedule(Schedule schedule);
}
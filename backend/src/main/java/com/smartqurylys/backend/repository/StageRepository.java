package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.Schedule;
import com.smartqurylys.backend.entity.Stage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StageRepository extends JpaRepository<Stage, Long> {
    List<Stage> findBySchedule(Schedule schedule);
}
package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

// Репозиторий для работы с сущностями ActivityLog.
@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    // Находит все записи активности для заданного проекта, отсортированные по времени в убывающем порядке.
    List<ActivityLog> findByProjectIdOrderByTimestampDesc(Long projectId);

    void deleteByActor(com.smartqurylys.backend.entity.User actor);
}
package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.Stage;
import com.smartqurylys.backend.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    // Получить все задачи по этапу
    List<Task> findByStage(Stage stage);

    // Проверка существования задачи по ID (используется в deleteTask)
    boolean existsById(Long id);

    // Поиск задачи по ID (используется во всех методах)
    Optional<Task> findById(Long id);
}

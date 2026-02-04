package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.Participant;
import com.smartqurylys.backend.entity.Stage;
import com.smartqurylys.backend.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

// Репозиторий для работы с сущностями Task.
public interface TaskRepository extends JpaRepository<Task, Long> {

    // Находит все задачи, принадлежащие определенному этапу.
    List<Task> findByStage(Stage stage);

    // Проверяет существование задачи по её ID.
    boolean existsById(Long id);

    // Находит все задачи, за которые ответственен данный участник.
    @Query("SELECT t FROM Task t JOIN t.responsiblePersons p WHERE p = :participant")
    List<Task> findByResponsiblePersonsContains(@Param("participant") Participant participant);

    // Находит задачу по ID, включая её зависимости, для избежания N+1 запросов.
    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.dependsOn WHERE t.id = :taskId")
    Optional<Task> findByIdWithDependencies(@Param("taskId") Long taskId);

    // Находит все задачи, которые зависят от указанной задачи.
    @Query("SELECT t FROM Task t JOIN t.dependsOn d WHERE d.id = :taskId")
    List<Task> findTasksThatDependOn(@Param("taskId") Long taskId);

    // Удаляет связь зависимости между двумя задачами.
    @Modifying
    @Query(value = "DELETE FROM task_dependencies WHERE task_id = :taskId AND depends_on_task_id = :dependencyTaskId",
            nativeQuery = true)
    int removeDependencyRelation(@Param("taskId") Long taskId,
                                 @Param("dependencyTaskId") Long dependencyTaskId);

    // Находит все задачи, относящиеся к заданному этапу, с полной информацией об ответственных лицах.
    @Query("SELECT t FROM Task t " +
            "LEFT JOIN FETCH t.responsiblePersons rp " +
            "LEFT JOIN FETCH rp.user " +
            "WHERE t.stage = :stage")
    List<Task> findByStageWithFullDetails(@Param("stage") Stage stage);
}

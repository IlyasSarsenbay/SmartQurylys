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

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByStage(Stage stage);

    boolean existsById(Long id);


    @Query("SELECT t FROM Task t JOIN t.responsiblePersons p WHERE p = :participant")
    List<Task> findByResponsiblePersonsContains(@Param("participant") Participant participant);


    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.dependsOn WHERE t.id = :taskId")
    Optional<Task> findByIdWithDependencies(@Param("taskId") Long taskId);

    @Query("SELECT t FROM Task t JOIN t.dependsOn d WHERE d.id = :taskId")
    List<Task> findTasksThatDependOn(@Param("taskId") Long taskId);

    @Modifying
    @Query(value = "DELETE FROM task_dependencies WHERE task_id = :taskId AND depends_on_id = :dependencyTaskId",
            nativeQuery = true)
    int removeDependencyRelation(@Param("taskId") Long taskId,
                                 @Param("dependencyTaskId") Long dependencyTaskId);

    @Query("SELECT t FROM Task t " +
            "LEFT JOIN FETCH t.responsiblePersons rp " +
            "LEFT JOIN FETCH rp.user " +
            "WHERE t.stage = :stage")
    List<Task> findByStageWithFullDetails(@Param("stage") Stage stage);
}

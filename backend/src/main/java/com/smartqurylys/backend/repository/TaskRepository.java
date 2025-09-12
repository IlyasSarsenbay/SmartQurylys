package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.Participant;
import com.smartqurylys.backend.entity.Stage;
import com.smartqurylys.backend.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByStage(Stage stage);

    boolean existsById(Long id);


    @Query("SELECT t FROM Task t JOIN t.responsiblePersons p WHERE p = :participant")
    List<Task> findByResponsiblePersonsContains(@Param("participant") Participant participant);


    @Query("SELECT t FROM Task t " +
            "LEFT JOIN FETCH t.responsiblePersons rp " +
            "LEFT JOIN FETCH rp.user " + // Явно загружаем сущность User
            "WHERE t.id = :id")
    Optional<Task> findByIdWithFullDetails(@Param("id") Long id);

    @Query("SELECT t FROM Task t " +
            "LEFT JOIN FETCH t.responsiblePersons rp " +
            "LEFT JOIN FETCH rp.user " +
            "WHERE t.stage = :stage")
    List<Task> findByStageWithFullDetails(@Param("stage") Stage stage);
}

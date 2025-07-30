package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.Participant;
import com.smartqurylys.backend.entity.Stage;
import com.smartqurylys.backend.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByStage(Stage stage);

    boolean existsById(Long id);


    @Query("SELECT t FROM Task t JOIN t.responsiblePersons p WHERE p = :participant")
    List<Task> findByResponsiblePersonsContains(@Param("participant") Participant participant);
}

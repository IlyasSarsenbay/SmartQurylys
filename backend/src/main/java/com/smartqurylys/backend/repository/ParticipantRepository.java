package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.Participant;
import com.smartqurylys.backend.entity.Project;
import com.smartqurylys.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

// Репозиторий для работы с сущностями Participant.
public interface ParticipantRepository extends JpaRepository<Participant, Long> {
    // Находит всех участников для заданного проекта.
    List<Participant> findByProject(Project project);

    // Находит всех участников для заданного пользователя.
    List<Participant> findByUser(User user);

    // Проверяет существование участника в проекте по проекту и пользователю.
    boolean existsByProjectAndUser(Project project, User user);

    @Query("""
                select p
                from Participant p
                where p.project.id = :projectId
            """)
    List<Participant> findParticipantsByProjectId(Long projectId);

    void deleteByUser(User user);
}

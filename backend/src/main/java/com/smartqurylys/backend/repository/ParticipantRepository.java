package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.Participant;
import com.smartqurylys.backend.entity.Project;
import com.smartqurylys.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ParticipantRepository extends JpaRepository<Participant, Long> {
    List<Participant> findByProject(Project project);

    List<Participant> findByUser(User user);

    boolean existsByProjectAndUser(Project project, User user);

    Optional<Participant> findByProjectAndUser(Project project, User user);

    @Query("""
                select p
                from Participant p
                where p.project.id = :projectId
            """)
    List<Participant> findParticipantsByProjectId(Long projectId);

    void deleteByUser(User user);
}

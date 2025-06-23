package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.ParticipantInvitation;
import com.smartqurylys.backend.entity.Project;
import com.smartqurylys.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ParticipantInvitationRepository extends JpaRepository<ParticipantInvitation, Long> {

    Optional<ParticipantInvitation> findByIdAndUser(Long id, User user);

    Optional<ParticipantInvitation> findByProjectAndUser(Project project, User user);
}

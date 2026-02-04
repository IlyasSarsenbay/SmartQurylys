package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.ParticipantInvitation;
import com.smartqurylys.backend.entity.Project;
import com.smartqurylys.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Репозиторий для работы с сущностями ParticipantInvitation.
public interface ParticipantInvitationRepository extends JpaRepository<ParticipantInvitation, Long> {

    // Находит приглашение по его ID и пользователю, которому оно адресовано.
    Optional<ParticipantInvitation> findByIdAndUser(Long id, User user);

    // Находит приглашение по проекту и пользователю.
    Optional<ParticipantInvitation> findByProjectAndUser(Project project, User user);

    void deleteByUser(User user);
    void deleteBySender(User user);
}

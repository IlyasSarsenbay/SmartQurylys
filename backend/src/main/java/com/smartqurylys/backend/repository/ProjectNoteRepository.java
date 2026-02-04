package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.ProjectNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

// Репозиторий для работы с сущностями ProjectNote.
@Repository
public interface ProjectNoteRepository extends JpaRepository<ProjectNote, Long> {

    // Находит все заметки для указанного проекта, отсортированные по дате создания (новые первыми).
    List<ProjectNote> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    // Находит все заметки для указанного проекта и автора, отсортированные по дате создания.
    List<ProjectNote> findByProjectIdAndAuthorIdOrderByCreatedAtDesc(Long projectId, Long authorId);

    List<ProjectNote> findByAuthorId(Long authorId);
    void deleteByAuthorId(Long authorId);
}

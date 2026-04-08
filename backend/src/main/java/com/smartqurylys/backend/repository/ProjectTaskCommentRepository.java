package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.ProjectTaskComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectTaskCommentRepository extends JpaRepository<ProjectTaskComment, Long> {

    @Query("""
            select c
            from ProjectTaskComment c
            left join fetch c.author
            where c.task.id = :taskId
            order by c.createdAt asc, c.id asc
            """)
    List<ProjectTaskComment> findByTaskIdOrderByCreatedAtAsc(@Param("taskId") Long taskId);

    @Query("""
            select c.task.id, count(c.id)
            from ProjectTaskComment c
            where c.task.project.id = :projectId
            group by c.task.id
            """)
    List<Object[]> countCommentsByProjectId(@Param("projectId") Long projectId);
}

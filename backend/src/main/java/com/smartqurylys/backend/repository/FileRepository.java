package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.File;
import org.springframework.data.jpa.repository.JpaRepository;

// Репозиторий для работы с сущностями File.
public interface FileRepository extends JpaRepository<File, Long> {
    java.util.List<com.smartqurylys.backend.entity.File> findByUser(com.smartqurylys.backend.entity.User user);
}


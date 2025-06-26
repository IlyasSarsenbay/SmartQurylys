package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.File;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FileRepository extends JpaRepository<File, Long> {
}


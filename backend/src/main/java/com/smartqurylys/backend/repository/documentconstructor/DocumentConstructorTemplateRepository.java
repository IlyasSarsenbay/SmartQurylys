package com.smartqurylys.backend.repository.documentconstructor;

import com.smartqurylys.backend.entity.DocumentConstructorTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentConstructorTemplateRepository extends JpaRepository<DocumentConstructorTemplate, Long> {
    List<DocumentConstructorTemplate> findByActiveTrueOrderByCategoryAscNameAsc();
}

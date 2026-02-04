package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.Organisation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// Репозиторий для работы с сущностями Organisation.
@Repository
public interface OrganisationRepository extends JpaRepository<Organisation, Long> {
}
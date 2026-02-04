package com.smartqurylys.backend.repository;

import com.smartqurylys.backend.entity.City;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Репозиторий для работы с сущностями City.
public interface CityRepository extends JpaRepository<City, Long> {
    // Находит город по его названию.
    Optional<City> findByName(String name);
}

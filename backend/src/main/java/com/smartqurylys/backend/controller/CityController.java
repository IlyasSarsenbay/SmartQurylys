package com.smartqurylys.backend.controller;

import com.smartqurylys.backend.entity.City;
import com.smartqurylys.backend.repository.CityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cities")
@RequiredArgsConstructor
public class CityController {

    private final CityRepository cityRepository;

    @GetMapping
    public ResponseEntity<List<City>> getAllCities() {
        List<City> cities = cityRepository.findAll();
        return ResponseEntity.ok(cities);
    }
}

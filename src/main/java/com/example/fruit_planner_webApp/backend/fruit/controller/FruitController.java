package com.example.fruit_planner_webApp.backend.fruit.controller;

import com.example.fruit_planner_webApp.backend.fruit.dto.FruitRequest;
import com.example.fruit_planner_webApp.backend.fruit.dto.FruitResponse;
import com.example.fruit_planner_webApp.backend.fruit.service.FruitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping(value = "/fruits")
@RequiredArgsConstructor
public class FruitController {

    private final FruitService fruitService;


    @PostMapping
    public ResponseEntity<FruitResponse> create(@Valid @RequestBody FruitRequest request,
                                                UriComponentsBuilder uriBuilder) {

        FruitResponse created = fruitService.createFruit(request);

        URI location = uriBuilder
                .path("/fruits/{id}")
                .buildAndExpand(created.getId())
                .toUri();

        return ResponseEntity.created(location).body(created);
    }


    @GetMapping
    public ResponseEntity<List<FruitResponse>> getAll() {
        List<FruitResponse> fruits = fruitService.getAllFruits();
        return ResponseEntity.ok(fruits);
    }


    @GetMapping("/{id}")
    public ResponseEntity<FruitResponse> getById(@PathVariable Long id) {
        FruitResponse fruit = fruitService.getFruitById(id);
        return ResponseEntity.ok(fruit);
    }


    @PutMapping("/{id}")
    public ResponseEntity<FruitResponse> update(@PathVariable Long id,
                                                   @Valid @RequestBody FruitRequest request) {
        FruitResponse updated = fruitService.updateFruit(id, request);
        return ResponseEntity.ok(updated);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        fruitService.deleteFruit(id);
        return ResponseEntity.noContent().build();
    }

}

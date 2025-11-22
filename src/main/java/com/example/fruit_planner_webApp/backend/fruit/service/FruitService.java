package com.example.fruit_planner_webApp.backend.fruit.service;

import com.example.fruit_planner_webApp.backend.fruit.dto.FruitRequest;
import com.example.fruit_planner_webApp.backend.fruit.dto.FruitResponse;
import com.example.fruit_planner_webApp.backend.fruit.exception.FruitNotFoundException;
import com.example.fruit_planner_webApp.backend.fruit.repository.FruitRepository;
import com.example.fruit_planner_webApp.backend.fruit.model.Fruit;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FruitService {

    private final FruitRepository fruitRepository;


    @Transactional
    public FruitResponse createFruit(FruitRequest dto) {

        Fruit toSave = Fruit.builder()
                .name(dto.getName())
                .weightInKilos(dto.getWeightInKilos())
                .seasonStart(dto.getSeasonStart())
                .seasonEnd(dto.getSeasonEnd())
                .pricePerKg(dto.getPricePerKg())
                .description(dto.getDescription())
                .build();

        Fruit saved = fruitRepository.save(toSave);

        return toResponse(saved);
    }


    @Transactional(readOnly = true)
    public List<FruitResponse> getAllFruits() {
        return fruitRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }


    @Transactional(readOnly = true)
    public FruitResponse getFruitById(Long id) {
        Fruit fruit = fruitRepository.findById(id)
                .orElseThrow(() -> new FruitNotFoundException(id));
        return toResponse(fruit);
    }


    @Transactional
    public FruitResponse updateFruit(Long id, FruitRequest dto) {
        Fruit existing = fruitRepository.findById(id)
                .orElseThrow(() -> new FruitNotFoundException(id));

        existing.setName(dto.getName());
        existing.setWeightInKilos(dto.getWeightInKilos());

        Fruit updated = fruitRepository.save(existing);
        return toResponse(updated);
    }


    @Transactional
    public void deleteFruit(Long id) {
        if (!fruitRepository.existsById(id)) {
            throw new FruitNotFoundException(id);
        }
        fruitRepository.deleteById(id);
    }

    private FruitResponse toResponse(Fruit fruit) {
        return FruitResponse.builder()
                .id(fruit.getId())
                .name(fruit.getName())
                .weightInKilos(fruit.getWeightInKilos())
                .seasonStart(fruit.getSeasonStart())
                .seasonEnd(fruit.getSeasonEnd())
                .pricePerKg(fruit.getPricePerKg())
                .description(fruit.getDescription())
                .build();
    }


}

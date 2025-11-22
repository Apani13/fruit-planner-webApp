package com.example.fruit_planner_webApp.backend.fruit.repository;

import com.example.fruit_planner_webApp.backend.fruit.model.Fruit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FruitRepository extends JpaRepository<Fruit, Long> {
}

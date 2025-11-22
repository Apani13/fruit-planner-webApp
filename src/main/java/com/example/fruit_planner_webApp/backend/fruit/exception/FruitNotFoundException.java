package com.example.fruit_planner_webApp.backend.fruit.exception;

public class FruitNotFoundException extends RuntimeException {
    public FruitNotFoundException(Long id) {
        super("Fruit with id " + id + " not found");
    }

    public FruitNotFoundException(String message) {
        super(message);
    }
}

package com.example.fruit_planner_webApp.backend.fruit.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FruitRequest {
    @NotBlank(message = "Name is required and cannot be blank")
    private String name;

    @Positive(message = "Weight must be a positive number")
    private int weightInKilos;


    @Min(value = 1, message = "seasonStart must be between 1 and 12")
    @Max(value = 12, message = "seasonStart must be between 1 and 12")
    private Integer seasonStart;

    @Min(value = 1, message = "seasonEnd must be between 1 and 12")
    @Max(value = 12, message = "seasonEnd must be between 1 and 12")
    private Integer seasonEnd;

    @PositiveOrZero(message = "pricePerKg must be zero or positive")
    private Double pricePerKg;

    private String description;



}

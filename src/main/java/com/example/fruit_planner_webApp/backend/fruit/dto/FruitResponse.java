package com.example.fruit_planner_webApp.backend.fruit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FruitResponse {

    private Long id;
    private String name;
    private int weightInKilos;
    private Integer seasonStart;
    private Integer seasonEnd;
    private Double pricePerKg;
    private String description;

}

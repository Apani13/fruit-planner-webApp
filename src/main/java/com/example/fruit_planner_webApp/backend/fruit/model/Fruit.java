package com.example.fruit_planner_webApp.backend.fruit.model;

import jakarta.persistence.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "fruit")
public class Fruit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private int weightInKilos;
    private Integer seasonStart;
    private Integer seasonEnd;
    private Double pricePerKg;
    private String description;


}

package com.accessmap.dto;

import jakarta.validation.constraints.NotBlank;

public record AdminPlaceUpdateRequest(
    @NotBlank(message = "Place name is required")
    String name,

    String description,

    @NotBlank(message = "Category is required")
    String category,

    @NotBlank(message = "Address is required")
    String address,

    String city,
    String state,
    String postalCode,
    String phone,
    String website,
    String reason
) {}


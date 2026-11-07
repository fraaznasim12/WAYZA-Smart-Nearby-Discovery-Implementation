package com.accessmap.controller;

import com.accessmap.dto.ApiResponse;
import com.accessmap.dto.PlaceOwnershipDto;
import com.accessmap.entity.User;
import com.accessmap.repository.PlaceOwnershipRepository;
import com.accessmap.service.AccessibilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/business")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('BUSINESS', 'BUSINESS_OWNER', 'ADMIN')")
public class BusinessController {

    private final AccessibilityService accessibilityService;
    private final PlaceOwnershipRepository placeOwnershipRepository;

    /**
     * Submits a claim of ownership for a business venue.
     */
    @PostMapping("/places/{id}/claim")
    public ResponseEntity<ApiResponse<PlaceOwnershipDto>> claimPlace(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser
    ) {
        PlaceOwnershipDto claim = accessibilityService.claimPlaceOwnership(id, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(claim));
    }

    /**
     * Lists all ownership claims for the logged-in business user.
     */
    @GetMapping("/claims")
    public ResponseEntity<ApiResponse<List<PlaceOwnershipDto>>> getMyClaims(
            @AuthenticationPrincipal User currentUser
    ) {
        List<PlaceOwnershipDto> claims = placeOwnershipRepository.findAllByUserId(currentUser.getId()).stream()
                .map(accessibilityService::toOwnershipDto)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(claims));
    }
}


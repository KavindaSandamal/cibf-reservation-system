package com.cibf.reservation.controller;

import com.cibf.reservation.dto.*;
import com.cibf.reservation.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Reservations", description = "Reservation management APIs")
@SecurityRequirement(name = "bearer-jwt")
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping("/hold")
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(summary = "Hold stalls temporarily", description = "Hold 1-3 stalls for 5 minutes")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Stalls held successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request or stall limit exceeded"),
        @ApiResponse(responseCode = "409", description = "Stall not available")
    })
    public ResponseEntity<HoldStallResponse> holdStalls(
            @Valid @RequestBody HoldStallRequest request) {
        log.info("Hold stalls request received for user: {}", request.getUserId());
        HoldStallResponse response = reservationService.holdStalls(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/confirm")
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(summary = "Confirm reservation", description = "Confirm reservation with hold token")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Reservation confirmed successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid or expired hold token"),
        @ApiResponse(responseCode = "404", description = "Hold token not found")
    })
    public ResponseEntity<List<ReservationResponse>> confirmReservation(
            @Valid @RequestBody ConfirmReservationRequest request) {
        log.info("Confirm reservation request for user: {}", request.getUserId());
        List<ReservationResponse> responses = reservationService.confirmReservation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VENDOR', 'EMPLOYEE')")
    @Operation(summary = "Get reservation by ID", description = "Retrieve reservation details")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Reservation found"),
        @ApiResponse(responseCode = "404", description = "Reservation not found")
    })
    public ResponseEntity<ReservationResponse> getReservationById(
            @Parameter(description = "Reservation ID") @PathVariable Long id) {
        log.info("Get reservation by ID: {}", id);
        ReservationResponse response = reservationService.getReservationById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('VENDOR', 'EMPLOYEE')")
    @Operation(summary = "Get user reservations", description = "Get all reservations for a user")
    @ApiResponse(responseCode = "200", description = "Reservations retrieved successfully")
    public ResponseEntity<List<ReservationResponse>> getReservationsByUserId(
            @Parameter(description = "User ID") @PathVariable Long userId) {
        log.info("Get reservations for user: {}", userId);
        List<ReservationResponse> responses = reservationService.getReservationsByUserId(userId);
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(summary = "Update reservation", description = "Update reservation details")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Reservation updated"),
        @ApiResponse(responseCode = "404", description = "Reservation not found")
    })
    public ResponseEntity<ReservationResponse> updateReservation(
            @Parameter(description = "Reservation ID") @PathVariable Long id,
            @Valid @RequestBody UpdateReservationRequest request) {
        log.info("Update reservation: {}", id);
        ReservationResponse response = reservationService.updateReservation(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(summary = "Cancel reservation", description = "Cancel an existing reservation")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Reservation cancelled"),
        @ApiResponse(responseCode = "404", description = "Reservation not found")
    })
    public ResponseEntity<Void> cancelReservation(
            @Parameter(description = "Reservation ID") @PathVariable Long id,
            @RequestParam Long userId) {
        log.info("Cancel reservation: {} by user: {}", id, userId);
        reservationService.cancelReservation(id, userId);
        return ResponseEntity.noContent().build();
    }
}

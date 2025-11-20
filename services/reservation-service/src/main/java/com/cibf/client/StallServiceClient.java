package com.cibf.client;

import com.cibf.dto.StallResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class StallServiceClient {

    private final RestTemplate restTemplate;

    @Value("${stall.service.url:http://stall-service:8082}")
    private String stallServiceUrl;

    /**
     * Get stalls by IDs with JWT authentication
     */
    public List<StallResponse> getStallsByIds(List<Long> stallIds) {
        if (stallIds == null || stallIds.isEmpty()) {
            return Collections.emptyList();
        }

        try {
            // Convert IDs to comma-separated string
            String ids = stallIds.stream()
                    .map(Object::toString)
                    .collect(Collectors.joining(","));

            String url = stallServiceUrl + "/api/stalls/by-ids?ids=" + ids;

            log.debug("Fetching stalls from: {}", url);

            // Create headers with JWT token
            HttpHeaders headers = createAuthHeaders();
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<List<StallResponse>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<List<StallResponse>>() {
                    });

            List<StallResponse> stalls = response.getBody();
            log.debug("Successfully fetched {} stalls", stalls != null ? stalls.size() : 0);

            return stalls != null ? stalls : Collections.emptyList();

        } catch (RestClientException e) {
            log.error("Failed to fetch stalls by IDs: {}", stallIds, e);
            throw new RuntimeException("Failed to fetch stall information", e);
        }
    }

    /**
     * Hold stalls
     */
    public void holdStalls(List<Long> stallIds, String holdToken) {
        try {
            log.info("Marking stalls as held: {} with token: {}", stallIds, holdToken);

            String url = stallServiceUrl + "/api/stalls/hold";

            HttpHeaders headers = createAuthHeaders();

            // Create request body if needed
            // Map<String, Object> requestBody = new HashMap<>();
            // requestBody.put("stallIds", stallIds);
            // requestBody.put("holdToken", holdToken);

            // HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody,
            // headers);
            // restTemplate.exchange(url, HttpMethod.POST, entity, Void.class);

        } catch (Exception e) {
            log.error("Failed to hold stalls: {}", stallIds, e);
            throw new RuntimeException("Failed to hold stalls", e);
        }
    }

    /**
     * Confirm stalls
     */
    public void confirmStalls(List<Long> stallIds, Long reservationId) {
        try {
            log.info("Confirming stalls: {} for reservation: {}", stallIds, reservationId);

            String url = stallServiceUrl + "/api/stalls/confirm";

            HttpHeaders headers = createAuthHeaders();

            // Implementation when endpoint is ready

        } catch (Exception e) {
            log.error("Failed to confirm stalls: {}", stallIds, e);
            throw new RuntimeException("Failed to confirm stalls", e);
        }
    }

    /**
     * Update stall status
     */
    public void updateStallStatus(Long stallId, String status) {
        try {
            log.info("Updating stall {} status to: {}", stallId, status);

            String url = stallServiceUrl + "/api/stalls/" + stallId + "/status?status=" + status;

            HttpHeaders headers = createAuthHeaders();
            HttpEntity<String> entity = new HttpEntity<>(headers);

            restTemplate.exchange(url, HttpMethod.PATCH, entity, Void.class);

            log.debug("Successfully updated stall {} status to {}", stallId, status);

        } catch (Exception e) {
            log.error("Failed to update stall {} status to {}", stallId, status, e);
            // Don't throw - this is a non-critical operation
        }
    }

    /**
     * Get stalls by reservation ID
     */
    public List<StallResponse> getStallsByReservationId(Long reservationId) {
        try {
            log.info("Fetching stalls for reservation: {}", reservationId);

            String url = stallServiceUrl + "/api/stalls/reservation/" + reservationId;

            HttpHeaders headers = createAuthHeaders();
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<List<StallResponse>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<List<StallResponse>>() {
                    });

            List<StallResponse> stalls = response.getBody();
            return stalls != null ? stalls : Collections.emptyList();

        } catch (Exception e) {
            log.error("Failed to fetch stalls for reservation: {}", reservationId, e);
            return Collections.emptyList();
        }
    }

    /**
     * Create HTTP headers with JWT token from SecurityContext
     */
    private HttpHeaders createAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Get JWT token from SecurityContext
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getCredentials() != null) {
            String token = authentication.getCredentials().toString();
            headers.set("Authorization", "Bearer " + token);
            log.debug("Added JWT token to inter-service request");
        } else {
            log.warn("No JWT token found in SecurityContext for inter-service call");
        }

        return headers;
    }
}
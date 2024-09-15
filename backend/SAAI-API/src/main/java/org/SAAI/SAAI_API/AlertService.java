package org.SAAI.SAAI_API;

import org.springframework.beans.factory.annotation.Autowired; // Import Autowired
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.stream.Collectors;

import java.util.*;
import java.util.Map;

@Service
public class AlertService {

    @Value("${alert.service.url}")
    private String alertUrl;
    @Value("${external.api.url}") // Add this to your application.properties
    private String externalApiUrl;

    @Autowired
    private TokenService tokenService;

    public String sendAlert(Map<String, Object> alertRequest) {
        String token = tokenService.getToken();

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(alertRequest, headers);

        ResponseEntity<Map> response = restTemplate.exchange(alertUrl, HttpMethod.POST, entity, Map.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Failed to send alert");
        }

        Map<String, Object> responseBody = response.getBody();
        if (responseBody == null || !responseBody.containsKey("uuid")) {
            throw new RuntimeException("Invalid response from alert service");
        }

        return responseBody.get("uuid").toString();
    }

    public Map<String, Object> getAlertById(String alertId) {
        String token = tokenService.getToken();

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        String url = externalApiUrl + "/alerts/" + alertId;

        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Failed to fetch alert with ID: " + alertId);
        }

        Map<String, Object> responseBody = response.getBody();
        if (responseBody == null) {
            throw new RuntimeException("Invalid response from alert service");
        }

        return responseBody;
    }

    public List<String> getAcceptedUserNames(String alertId) {
        Map<String, Object> alertDetails = getAlertById(alertId);

        List<Map<String, Object>> alertedUsers = (List<Map<String, Object>>) alertDetails.get("alerted_users");
        if (alertedUsers == null) {
            return Collections.singletonList("none");
        }

        List<String> acceptedUserNames = alertedUsers.stream()
                .filter(userMap -> "ACCEPTED".equals(userMap.get("response_state")))
                .map(userMap -> (Map<String, Object>) userMap.get("user"))
                .map(user -> (String) user.get("username"))
                .collect(Collectors.toList());

        return acceptedUserNames.isEmpty() ? Collections.singletonList("none") : acceptedUserNames;
    }
}

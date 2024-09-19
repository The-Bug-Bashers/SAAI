package org.SAAI.SAAI_API;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.core.ParameterizedTypeReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Value("${users.service.password}")
    private String userServicePassword;

    @Autowired
    private InfoScreenService infoScreenService;

    @Autowired
    private TokenService tokenService;

    // Scheduled cron job - runs at 7 AM every day
    @Scheduled(cron = "0 0 7 * * ?")
    public void notifyDutyUsers() {
        logger.info("Starting notification process for duty users...");

        List<Map<String, Object>> events = (List<Map<String, Object>>) infoScreenService.getInfoScreenEvents().get("events");

        List<String> responsibleUsers = extractDutyUsers(events);
        List<Map<String, String>> users = fetchUsers();

        for (String responsibleUser : responsibleUsers) {
            for (Map<String, String> user : users) {
                if (user.get("username").equals(responsibleUser)) {
                    sendMessage(user.get("telephoneNumber"), user.get("username"));
                    break;
                }
            }
        }

        logger.info("Notification process completed.");
    }

    // Extract users on duty from today's events
    private List<String> extractDutyUsers(List<Map<String, Object>> events) {
        return events.stream()
                .flatMap(event -> ((List<String>) event.get("responsible_users")).stream())
                .toList();
    }

    // Fetch users from the /users endpoint
    private List<Map<String, String>> fetchUsers() {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        Map<String, String> body = new HashMap<>();
        body.put("password", userServicePassword);
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<List<Map<String, String>>> response = restTemplate.exchange(
                "https://saai.wayshare.de:9090/api/users",
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<List<Map<String, String>>>() {});

        return response.getBody();
    }

    // Send notification message to the user
    private void sendMessage(String telephoneNumber, String username) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        Map<String, String> body = new HashMap<>();
        body.put("telephoneNumber", telephoneNumber);
        body.put("message", "Hello " + username + ", you are going to be on duty today. Make sure you carry a device with the paramedic alarm app.");
        body.put("password", userServicePassword);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                "https://saai.wayshare.de:9090/api/signalmessage",
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<Map<String, Object>>() {});

        logger.info("Message sent to {}: {}", telephoneNumber, response.getBody().get("message"));
    }
}

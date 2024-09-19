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
import java.util.ArrayList;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Value("${users.service.password}")
    private String userServicePassword;

    @Autowired
    private InfoScreenService infoScreenService;

    @Autowired
    private TokenService tokenService;

    // Scheduled cron job - runs every day at 7 AM
    @Scheduled(cron = "0 0 7 * * ?")
    public void notifyDutyUsers() {
        logger.info("Starting notification process for duty users...");

        List<Map<String, Object>> events = (List<Map<String, Object>>) infoScreenService.getInfoScreenEvents().get("events");
        Map<String, List<String>> userDuties = groupUserDuties(events);
        List<Map<String, String>> users = fetchUsers();

        for (Map<String, String> user : users) {
            String username = user.get("username");
            if (userDuties.containsKey(username)) {
                List<String> dutyTimes = userDuties.get(username);
                sendMessage(user.get("telephoneNumber"), username, dutyTimes);
            }
        }

        logger.info("Notification process completed.");
    }

    // Group the events by user and accumulate their duty times
    private Map<String, List<String>> groupUserDuties(List<Map<String, Object>> events) {
        Map<String, List<String>> userDuties = new HashMap<>();

        for (Map<String, Object> event : events) {
            List<String> responsibleUsers = (List<String>) event.get("responsible_users");
            String startTime = (String) event.get("start_time");
            String endTime = (String) event.get("end_time");

            // Prepare the duty time string
            String dutyTime = "from " + startTime + " to " + endTime;

            for (String user : responsibleUsers) {
                userDuties.putIfAbsent(user, new ArrayList<>());
                userDuties.get(user).add(dutyTime);
            }
        }

        return userDuties;
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

    // Send a single consolidated message with all duty times for the user
    private void sendMessage(String telephoneNumber, String username, List<String> dutyTimes) {
        StringBuilder messageBuilder = new StringBuilder();
        messageBuilder.append("Hello ").append(username).append(", you are going to be on duty today during the following times:\n");

        // Append all the duty times
        for (String dutyTime : dutyTimes) {
            messageBuilder.append(dutyTime).append("\n");
        }

        // Build the message body
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        Map<String, String> body = new HashMap<>();
        body.put("telephoneNumber", telephoneNumber);
        body.put("message", messageBuilder.toString());
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

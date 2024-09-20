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
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;

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

        sendLiveTickerMessage(userDuties);
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
            String dutyTime = startTime + " - " + endTime;

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

        if (dutyTimes.size() == 1) {
            // Single event
            messageBuilder.append("Hallo ").append(username).append(", du hast heute dienst von ")
                    .append(dutyTimes.get(0).replace(" - ", " bis ")).append(".\nBitte vergiss nicht zu diesen zeiten ein gerät mit der Sani-App bei dir zu haben.\n\nWenn du heute zu den zeiten wo du dienst hast nicht in der Schule bist, oder aus anderen gründen keine zeit für alarme hast, klicke bitte auf den folgenden link:\nLink:(not implemented jet)\n\nViel glück bei deinen heutigen Einsetzten!");
        } else {
            // Multiple events
            messageBuilder.append("Hallo ").append(username).append(", du hast heute dienst zwischen den folgenden zeiten:\n");
            for (String dutyTime : dutyTimes) {
                messageBuilder.append(dutyTime).append("\n");
            }
            messageBuilder.append("\nBitte vergiss nicht zu diesen zeiten ein gerät mit der Sani-App bei dir zu haben.\n\nWenn du heute zu den zeiten wo du dienst hast nicht in der Schule bist, oder aus anderen gründen keine zeit für alarme hast, klicke bitte auf den folgenden link:\nLink:(not implemented jet)\n\nViel glück bei deinen heutigen Einsetzten!");
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


    private void sendLiveTickerMessage(Map<String, List<String>> userDuties) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        StringBuilder timetableEvents = new StringBuilder();

        // Construct the message from user duties
        for (Map.Entry<String, List<String>> entry : userDuties.entrySet()) {
            String user = entry.getKey();
            List<String> duties = entry.getValue();
            timetableEvents.append(user).append(": ").append(String.join(", ", duties)).append("; ");
        }

        // Construct the message for the URL parameter
        String message = "Users were notified about today's timetable events: " + timetableEvents.toString();

        // Manually encode the message and replace spaces with underscores
        String urlEncodedMessage = "";
        try {
            urlEncodedMessage = URLEncoder.encode(message, "UTF-8")
                    .replace("%3A", ":")   // Decode colons for readability
                    .replace("%3B", ";")   // Decode semicolons for readability
                    .replace("%2C", ",")   // Decode commas for readability
                    .replace("+", "_");    // Replace spaces with underscores
        } catch (UnsupportedEncodingException e) {
            logger.error("Error encoding URL: ", e);
            return;  // Exit method if encoding fails
        }

        // Build the full GET URL with the encoded message as a parameter
        String url = "https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=" + urlEncodedMessage;

        // Execute the GET request
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<Map<String, Object>>() {}
        );

        logger.info("Live ticker message sent: {}", response.getBody().get("message"));
    }

}

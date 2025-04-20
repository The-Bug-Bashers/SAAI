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
import java.text.SimpleDateFormat;
import java.util.*;

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
    @Scheduled(cron = "0 59 5 * * *", zone = "Europe/Berlin")
    public void notifyDutyUsers() {
        logger.info("Starting notification process for duty users...");

        List<Map<String, Object>> events = (List<Map<String, Object>>) infoScreenService.getInfoScreenEvents().get("events");
        Map<String, List<String>> userDuties = groupUserDuties(events);
        List<Map<String, String>> users = fetchUsers();

        for (Map<String, String> user : users) {
            String username = user.get("username");
            if (userDuties.containsKey(username)) {
                List<String> dutyTimes = userDuties.get(username);
                int verificationNumber = calculateVerificationNumber(username);
                sendMessage(user.get("telephoneNumber"), username, dutyTimes, verificationNumber);
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

    // Calculate the verification number for a given username
    private int calculateVerificationNumber(String username) {
        Calendar calendar = Calendar.getInstance();
        int day = calendar.get(Calendar.DAY_OF_MONTH);
        int month = calendar.get(Calendar.MONTH) + 1;
        return (username.length() * 3975) + (day * 100 + month);
    }

    // URL encode the username to replace spaces with '+'
    private String encodeUsername(String username) {
        try {
            return URLEncoder.encode(username, "UTF-8").replace("+", "%20").replace("%20", "+");
        } catch (UnsupportedEncodingException e) {
            logger.error("Error encoding username: {}", username, e);
            return username;
        }
    }

    // Send a single consolidated message with all duty times for the user, including the link with verification number
    private void sendMessage(String telephoneNumber, String username, List<String> dutyTimes, int verificationNumber) {
        String encodedUsername = encodeUsername(username);
        String link = "https://saai.wayshare.de/day-off?username=" + encodedUsername + "&verificationNumber=" + verificationNumber;

        StringBuilder messageBuilder = new StringBuilder();

        if (dutyTimes.size() == 1) {
            // Single event
            messageBuilder.append("Hallo ").append(username)
                    .append(", du hast heute Dienst von ")
                    .append(dutyTimes.get(0).replace(" - ", " bis "))
                    .append("Uhr.\nBitte vergiss nicht, zu diesen Zeiten ein Gerät mit der SaniAlarm-App bei dir zu tragen.\n\n")
                    .append("Wenn du heute zu den Zeiten, zu denen du Dienst hast, nicht in der Schule bist, oder aus anderen Gründen keine Zeit für Alarme hast, klicke bitte auf den folgenden Link:\n")
                    .append(link).append("\n\nViel Glück bei deinen heutigen Einsätzen!");
        } else {
            // Multiple events
            messageBuilder.append("Hallo ").append(username)
                    .append(", du hast heute zwischen den folgenden Zeiten Dienst:\n");
            for (String dutyTime : dutyTimes) {
                messageBuilder.append(dutyTime).append("\n");
            }
            messageBuilder.append("\nBitte vergiss nicht, zu diesen Zeiten ein Gerät mit der SaniAlarm-App bei dir zu tragen.\n\n")
                    .append("Wenn du heute zu den Zeiten, zu denen du Dienst hast, nicht in der Schule bist, oder aus anderen Gründen keine Zeit für Alarme hast, klicke bitte auf den folgenden Link:\n")
                    .append(link).append("\n\nViel Glück bei deinen heutigen Einsätzen!");
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

        // Construct the message with improved formatting
        timetableEvents.append("Users were notified about today's timetable events:\n"); // One line break after header

        for (Map.Entry<String, List<String>> entry : userDuties.entrySet()) {
            String user = entry.getKey();
            List<String> duties = entry.getValue();

            timetableEvents.append("\n").append(user).append(":\n"); // Two line breaks before username, one after
            for (String duty : duties) {
                timetableEvents.append(duty).append("\n"); // Each duty on a new line
            }
        }

        // Construct the message for the URL parameter
        String message = timetableEvents.toString();

        // Manually encode the message for the URL
        String urlEncodedMessage = "";
        try {
            urlEncodedMessage = URLEncoder.encode(message, "UTF-8")
                    .replace("%3A", ":")   // Decode colons for readability
                    .replace("%0A", "\n")  // Decode newlines for readability
                    .replace("%2C", ",")   // Decode commas for readability
                    .replace("+", "_")     // Replace spaces with underscores
                    .replace("%27", "'")
                    .replace("%C3%A4", "ä");
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

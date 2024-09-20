package org.SAAI.SAAI_API;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.ParameterizedTypeReference;

import java.text.SimpleDateFormat;
import java.util.*;

@RestController
public class DayOffController {

    @Autowired
    private InfoScreenService infoScreenService;

    @Autowired
    private TokenService tokenService;

    @PostMapping("/dayOff")
    public ResponseEntity<String> dayOffRequest(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String verificationNumberStr = body.get("verificationNumber");

        if (username == null || verificationNumberStr == null) {
            return new ResponseEntity<>("Error: Missing username or verificationNumber", HttpStatus.BAD_REQUEST);
        }

        // Verify the verificationNumber
        int verificationNumber;
        try {
            verificationNumber = Integer.parseInt(verificationNumberStr);
        } catch (NumberFormatException e) {
            return new ResponseEntity<>("Error: Invalid verificationNumber", HttpStatus.BAD_REQUEST);
        }

        // Calculate today's day and month as string
        Calendar calendar = Calendar.getInstance();
        int day = calendar.get(Calendar.DAY_OF_MONTH);
        int month = calendar.get(Calendar.MONTH) + 1;
        int correctVerificationNumber = (username.length() * 3975) + (day * 100 + month);

        if (verificationNumber != correctVerificationNumber) {
            return new ResponseEntity<>("Error: Incorrect verificationNumber", HttpStatus.FORBIDDEN);
        }

        // Fetch today's active timetable events from InfoScreen
        Map<String, Object> infoScreenData = infoScreenService.getInfoScreenEvents();
        List<Map<String, Object>> events = (List<Map<String, Object>>) infoScreenData.get("events");

        if (events == null || events.isEmpty()) {
            return new ResponseEntity<>("Error: No active events found for today", HttpStatus.NOT_FOUND);
        }

        // Filter events by username
        List<Map<String, Object>> userEvents = new ArrayList<>();
        for (Map<String, Object> event : events) {
            List<Map<String, Object>> responsibleUsers = (List<Map<String, Object>>) event.get("responsible_users");
            if (responsibleUsers.stream().anyMatch(user -> user.get("username").equals(username))) {
                userEvents.add(event);
            }
        }

        if (userEvents.isEmpty()) {
            return new ResponseEntity<>("Error: No events found for the user", HttpStatus.NOT_FOUND);
        }

        // For each event, get details and modify
        RestTemplate restTemplate = new RestTemplate();
        String token = tokenService.getToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        for (Map<String, Object> event : userEvents) {
            String eventUUID = (String) event.get("uuid");
            String getEventUrl = "https://sanialarm.de/api/v2/timetable_events/" + eventUUID;

            // Fetch event details with explicit ParameterizedTypeReference
            HttpEntity<String> getEntity = new HttpEntity<>(headers);
            ResponseEntity<Map<String, Object>> eventResponse = restTemplate.exchange(
                    getEventUrl,
                    HttpMethod.GET,
                    getEntity,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (!eventResponse.getStatusCode().is2xxSuccessful()) {
                return new ResponseEntity<>("Error: Failed to fetch event details", HttpStatus.INTERNAL_SERVER_ERROR);
            }

            Map<String, Object> eventData = eventResponse.getBody();

            // Prepare updated event body
            Map<String, Object> updateBody = new HashMap<>();
            updateBody.put("update_option", "THIS_EVENT");

            String currentDate = new SimpleDateFormat("yyyy-MM-dd").format(new Date());
            updateBody.put("event_date", currentDate);
            updateBody.put("start_datetime", eventData.get("start_datetime"));
            updateBody.put("end_datetime", eventData.get("end_datetime"));
            updateBody.put("timetable_metadata", eventData.get("event_metadata"));

            List<Map<String, Object>> responsibleUsers = (List<Map<String, Object>>) eventData.get("responsible_users");
            List<String> updatedResponsibleUsers = new ArrayList<>();

            // Keep all users except the one requesting day off
            for (Map<String, Object> user : responsibleUsers) {
                String userUUID = (String) user.get("uuid");
                if (!userUUID.equals(username)) {
                    updatedResponsibleUsers.add(userUUID);
                }
            }

            updateBody.put("responsible_users", updatedResponsibleUsers);

            // Send PUT request to update timetable event
            HttpEntity<Map<String, Object>> putEntity = new HttpEntity<>(updateBody, headers);
            String putEventUrl = "https://sanialarm.de/api/v2/timetable_events/" + eventUUID;

            ResponseEntity<String> putResponse = restTemplate.exchange(putEventUrl, HttpMethod.PUT, putEntity, String.class);

            if (!putResponse.getStatusCode().is2xxSuccessful()) {
                return new ResponseEntity<>("Error: Failed to update timetable event", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        return new ResponseEntity<>("Success: Day off approved and timetable updated", HttpStatus.OK);
    }
}

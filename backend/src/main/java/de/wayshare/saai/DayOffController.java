package de.wayshare.saai;

import de.wayshare.saai.SaniAlarmApi.SaniAlarmApiTokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.text.SimpleDateFormat;
import java.util.*;

@CrossOrigin(origins = "*")
@RestController
public class DayOffController {

    private static final Logger logger = LoggerFactory.getLogger(DayOffController.class);

    @Autowired
    private InfoScreenService infoScreenService;

    @Autowired
    private SaniAlarmApiTokenService saniAlarmApiTokenService;

    @PostMapping("/api/dayOff")
    public ResponseEntity<String> dayOffRequest(@RequestBody Map<String, String> body) {
        logger.info("Received day off request: {}", body);

        String username = body.get("username");
        String verificationNumberStr = body.get("verificationNumber");

        if (username == null || verificationNumberStr == null) {
            logger.warn("Missing username or verification number");
            return new ResponseEntity<>("Error: Missing username or verification number", HttpStatus.BAD_REQUEST);
        }

        // Verify the verificationNumber
        int verificationNumber;
        try {
            verificationNumber = Integer.parseInt(verificationNumberStr);
        } catch (NumberFormatException e) {
            logger.error("Invalid verification number format: {}", verificationNumberStr);
            return new ResponseEntity<>("Error: Invalid verification number format", HttpStatus.BAD_REQUEST);
        }

        // Calculate today's day and month as string
        Calendar calendar = Calendar.getInstance();
        int day = calendar.get(Calendar.DAY_OF_MONTH);
        int month = calendar.get(Calendar.MONTH) + 1;
        int correctVerificationNumber = (username.length() * 3975) + (day * 100 + month);

        logger.info("Calculated correct verification number: {} for username: {}", correctVerificationNumber, username);

        if (verificationNumber != correctVerificationNumber) {
            logger.warn("Incorrect verification number provided for username: {}. Correct number: {}", username, correctVerificationNumber);
            return new ResponseEntity<>("Error: Incorrect verification number", HttpStatus.FORBIDDEN);
        }

        // Fetch today's active timetable events from InfoScreen
        Map<String, Object> infoScreenData;
        try {
            infoScreenData = infoScreenService.getInfoScreenEvents();
        } catch (Exception e) {
            logger.error("Failed to retrieve InfoScreen events", e);
            return new ResponseEntity<>("Error: Failed to retrieve InfoScreen events", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        List<Map<String, Object>> events = (List<Map<String, Object>>) infoScreenData.get("events");

        if (events == null || events.isEmpty()) {
            logger.warn("No active events found for today");
            return new ResponseEntity<>("Error: No active events found for today", HttpStatus.NOT_FOUND);
        }

        logger.info("Found {} events for today", events.size());

        // Filter events by username
        List<Map<String, Object>> userEvents = new ArrayList<>();
        for (Map<String, Object> event : events) {
            List<Object> responsibleUsers = (List<Object>) event.get("responsible_users");
            if (responsibleUsers != null) {
                for (Object userObj : responsibleUsers) {
                    if (userObj instanceof Map) {
                        Map<String, Object> user = (Map<String, Object>) userObj;
                        String foundUsername = (String) user.get("username");
                        if (foundUsername != null && foundUsername.equals(username)) {
                            userEvents.add(event);
                            logger.info("User {} is found in event with UUID: {}", username, event.get("uuid"));
                        }
                    } else if (userObj instanceof String) {
                        String foundUsername = (String) userObj;
                        if (foundUsername.equals(username)) {
                            userEvents.add(event);
                            logger.info("User {} is found in event with UUID: {}", username, event.get("uuid"));
                        }
                    } else {
                        logger.error("Expected a Map or String, but got: {}", userObj.getClass().getName());
                    }
                }
            } else {
                logger.warn("No responsible_users found in event UUID: {}", event.get("uuid"));
            }
        }

        if (userEvents.isEmpty()) {
            logger.warn("Verification successful, but no events found for the user: {}", username);
            return new ResponseEntity<>("Error: Verification successful, but no events found for the user", HttpStatus.NOT_FOUND);
        }

        // For each event, get details and modify
        RestTemplate restTemplate = new RestTemplate();
        String token = saniAlarmApiTokenService.getToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        for (Map<String, Object> event : userEvents) {
            String eventUUID = (String) event.get("uuid");
            String getEventUrl = "https://sanialarm.de/api/v2/timetable_events/" + eventUUID;

            logger.info("Fetching details for event UUID: {}", eventUUID);

            // Fetch event details
            HttpEntity<String> getEntity = new HttpEntity<>(headers);
            ResponseEntity<Map<String, Object>> eventResponse;
            try {
                eventResponse = restTemplate.exchange(
                        getEventUrl,
                        HttpMethod.GET,
                        getEntity,
                        new ParameterizedTypeReference<Map<String, Object>>() {}
                );
            } catch (Exception e) {
                logger.error("Failed to fetch event details for UUID: {}", eventUUID, e);
                return new ResponseEntity<>("Error: Failed to fetch event details", HttpStatus.INTERNAL_SERVER_ERROR);
            }

            if (!eventResponse.getStatusCode().is2xxSuccessful()) {
                logger.error("Non-successful response for fetching event details, status: {}", eventResponse.getStatusCode());
                continue;
            }

            Map<String, Object> eventData = eventResponse.getBody();
            logger.info("Successfully fetched event details for UUID: {}", eventUUID);

            // Prepare updated event body
            Map<String, Object> updateBody = new HashMap<>();
            String currentDate = new SimpleDateFormat("yyyy-MM-dd").format(new Date());
            updateBody.put("event_date", currentDate);
            updateBody.put("start_datetime", eventData.get("start_datetime"));
            updateBody.put("end_datetime", eventData.get("end_datetime"));

            // Set metadata as empty and update_option as ALL_EVENTS
            updateBody.put("timetable_metadata", Collections.emptyList());
            updateBody.put("update_option", "ALL_EVENTS");
            logger.info("Setting update_option to ALL_EVENTS");

            // Log the updated metadata
            logger.info("Updated timetable_metadata: {}", updateBody.get("timetable_metadata"));

            // Fetch UUID of the user making the day off request
            String requestingUserUUID = null;
            for (Map<String, Object> user : (List<Map<String, Object>>) eventData.get("responsible_users")) {
                String foundUsername = (String) user.get("username");
                if (foundUsername != null && foundUsername.equals(username)) {
                    requestingUserUUID = (String) user.get("uuid");
                    break;
                }
            }

            if (requestingUserUUID == null) {
                logger.warn("No matching UUID found for the user: {}", username);
                return new ResponseEntity<>("Error: No matching UUID found for the user", HttpStatus.BAD_REQUEST);
            }

            // Update responsible_users list by removing the requesting user UUID
            List<Map<String, Object>> responsibleUsers = (List<Map<String, Object>>) eventData.get("responsible_users");
            List<String> updatedResponsibleUsers = new ArrayList<>();

            for (Map<String, Object> user : responsibleUsers) {
                String userUUID = (String) user.get("uuid");
                if (!userUUID.equals(requestingUserUUID)) {
                    updatedResponsibleUsers.add(userUUID);
                } else {
                    logger.info("Removing user {} (UUID: {}) from event UUID: {}", username, userUUID, eventUUID);
                }
            }

            updateBody.put("responsible_users", updatedResponsibleUsers);

            // Send PUT request to update timetable event
            HttpEntity<Map<String, Object>> putEntity = new HttpEntity<>(updateBody, headers);
            String putEventUrl = "https://sanialarm.de/api/v2/timetable_events/" + eventUUID;

            logger.info("Sending PUT request to update event UUID: {}", eventUUID);
            logger.info("PUT Request URI: {}", putEventUrl);
            logger.info("PUT Request Body: {}", updateBody);

            // Send PUT request to update timetable event
            ResponseEntity<String> putResponse;
            try {
                putResponse = restTemplate.exchange(putEventUrl, HttpMethod.PUT, putEntity, String.class);
            } catch (Exception e) {
                logger.error("Failed to update timetable event for UUID: {}", eventUUID, e);
                continue;
            }

            // Log the full response from the API
            logger.info("PUT Response Status: {}", putResponse.getStatusCode());
            logger.info("PUT Response Body: {}", putResponse.getBody());
        }


        logger.info("Day off request for user {} completed successfully", username);
        return new ResponseEntity<>("Success: Day off approved and timetable updated", HttpStatus.OK);
    }
}

package de.wayshare.saai;

import de.wayshare.saai.sanialarmapi.SaniAlarmApiTokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.text.SimpleDateFormat;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
public class DeleteAllTimetablesController {

    private static final Logger logger = LoggerFactory.getLogger(DeleteAllTimetablesController.class);

    @Value("${users.service.password}")
    private String servicePassword;

    @Autowired
    private SaniAlarmApiTokenService saniAlarmApiTokenService;

    @DeleteMapping("/api/deleteAllTimetables")
    public ResponseEntity<String> deleteAllTimetables(@RequestBody Map<String, String> body) {
        logger.info("Received delete request for all timetables: {}", body);

        String providedPassword = body.get("password");

        // Check if the password is correct
        if (providedPassword == null || !providedPassword.equals(servicePassword)) {
            logger.warn("Invalid or missing password in delete request.");
            return new ResponseEntity<>("Error: Invalid or missing password", HttpStatus.FORBIDDEN);
        }

        // Get token
        String token = saniAlarmApiTokenService.getToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        String timetablesUrl = "https://sanialarm.de/api/v2/timetable_events/";

        RestTemplate restTemplate = new RestTemplate();

        // Fetch all timetable events
        HttpEntity<String> getEntity = new HttpEntity<>(headers);
        ResponseEntity<List<Map<String, Object>>> timetablesResponse;

        try {
            timetablesResponse = restTemplate.exchange(
                    timetablesUrl,
                    HttpMethod.GET,
                    getEntity,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {
                    }
            );
        } catch (Exception e) {
            logger.error("Failed to retrieve timetable events", e);
            return new ResponseEntity<>("Error: Failed to retrieve timetable events", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        if (!timetablesResponse.getStatusCode().is2xxSuccessful()) {
            logger.error("Non-successful response from timetables API: {}", timetablesResponse.getStatusCode());
            return new ResponseEntity<>("Error: Failed to fetch timetable events", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        List<Map<String, Object>> timetables = timetablesResponse.getBody();
        if (timetables == null || timetables.isEmpty()) {
            logger.warn("No timetables found to delete.");
            return new ResponseEntity<>("No timetables found", HttpStatus.NOT_FOUND);
        }

        // Loop through all timetables and delete them
        for (Map<String, Object> timetable : timetables) {
            String uuid = (String) timetable.get("uuid");
            String startDatetime = (String) timetable.get("start_datetime");

            if (uuid == null || startDatetime == null) {
                logger.warn("Skipping invalid timetable event with missing UUID or start_datetime.");
                continue;
            }

            // Correct date parsing format
            String eventDate;
            try {
                SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssX"); // Corrected format
                SimpleDateFormat outputFormat = new SimpleDateFormat("yyyy-MM-dd");
                eventDate = outputFormat.format(inputFormat.parse(startDatetime));
            } catch (Exception e) {
                logger.error("Failed to parse start_datetime: {}", startDatetime, e);
                continue;
            }

            // Create delete request body
            Map<String, String> deleteBody = new HashMap<>();
            deleteBody.put("delete_option", "ALL_EVENTS");
            deleteBody.put("event_date", eventDate);

            // Send DELETE request
            String deleteUrl = "https://sanialarm.de/api/v2/timetable_events/" + uuid;
            HttpEntity<Map<String, String>> deleteEntity = new HttpEntity<>(deleteBody, headers);

            logger.info("Sending DELETE request for event UUID: {} with event_date: {}", uuid, eventDate);
            ResponseEntity<String> deleteResponse;
            try {
                deleteResponse = restTemplate.exchange(deleteUrl, HttpMethod.DELETE, deleteEntity, String.class);
            } catch (Exception e) {
                logger.error("Failed to delete event UUID: {}", uuid, e);
                continue; // Continue deleting other timetables
            }

            // Log the response from the DELETE request
            logger.info("DELETE Response for UUID {}: Status: {}, Body: {}", uuid, deleteResponse.getStatusCode(), deleteResponse.getBody());
        }

        return new ResponseEntity<>("All timetables processed", HttpStatus.OK);
    }
}

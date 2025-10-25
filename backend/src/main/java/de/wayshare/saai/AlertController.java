package de.wayshare.saai;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.List;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
public class AlertController {

    @Autowired
    private AlertService alertService;

    @GetMapping("/api/alerts/active")
    public ResponseEntity<List<Map<String, Object>>> getActiveAlerts() {
        List<Map<String, Object>> activeAlerts = alertService.getActiveAlerts();
        return new ResponseEntity<>(activeAlerts, HttpStatus.OK);
    }

    @Operation(summary = "Sending alerts to paramedics wich are in the currently active timetable")
    @PostMapping("/api/alerts")
    public ResponseEntity<Map<String, String>> sendAlert(@RequestBody Map<String, String> request) {
        if (!request.containsKey("room") || !request.containsKey("description")) {
            throw new InvalidInputException("Invalid input: 'room' and 'description' are required.");
        }

        String room = request.get("room");
        String description = request.get("description");

        Map<String, Object> alertRequest = new HashMap<>();
        alertRequest.put("room", room);
        alertRequest.put("description", description);
        alertRequest.put("recipient", "TIMETABLE");
        alertRequest.put("urgent", false);
        alertRequest.put("single_users", new ArrayList<>());
        alertRequest.put("force_alert", false);

        String alertId = alertService.sendAlert(alertRequest);

        Map<String, String> response = new HashMap<>();
        response.put("status", "Alert sent successfully");
        response.put("alert_id", alertId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/api/alerts/accepted-users/{alert_id}")
    public ResponseEntity<List<String>> getAcceptedUsers(@PathVariable("alert_id") String alertId) {
        List<String> acceptedUserNames = alertService.getAcceptedUserNames(alertId);
        return new ResponseEntity<>(acceptedUserNames, HttpStatus.OK);
    }

    @PostMapping("/api/alerts/single")
    public ResponseEntity<Map<String, String>> sendSingleAlert(@RequestBody Map<String, Object> request) {
        if (!request.containsKey("room") || !request.containsKey("description") || !request.containsKey("users")) {
            throw new InvalidInputException("Invalid input: 'room', 'description', and 'users' are required.");
        }

        String room = (String) request.get("room");
        String description = (String) request.get("description");
        List<String> users = (List<String>) request.get("users"); // assuming this is an array of UUIDs

        // Create the alert request for the external API
        Map<String, Object> alertRequest = new HashMap<>();
        alertRequest.put("room", room);
        alertRequest.put("description", description);
        alertRequest.put("recipient", "SINGLE");
        alertRequest.put("urgent", false);
        alertRequest.put("single_users", users);  // populate with UUIDs from the request
        alertRequest.put("force_alert", false);

        // Call the service to send the alert
        String alertId = alertService.sendAlert(alertRequest);

        // Prepare the response
        Map<String, String> response = new HashMap<>();
        response.put("status", "Single alert sent successfully");
        response.put("alert_id", alertId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}

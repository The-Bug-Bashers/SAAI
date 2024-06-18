package org.SAAI.SAAI_API;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.ArrayList; // Import ArrayList
import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*")

@RestController
public class AlertController {

    @Autowired
    private AlertService alertService;

    @PostMapping("/alerts")
    public ResponseEntity<Map<String, String>> sendAlert(@RequestBody Map<String, String> request) {
        if (!request.containsKey("room") || !request.containsKey("description")) {
            throw new InvalidInputException("Invalid input: 'room' and 'description' are required.");
        }

        String room = request.get("room");
        String description = request.get("description");

        Map<String, Object> alertRequest = new HashMap<>();
        alertRequest.put("room", room);
        alertRequest.put("description", description);
        alertRequest.put("recipient", "EVERYONE");
        alertRequest.put("urgent", false);
        alertRequest.put("single_users", new ArrayList<>());
        alertRequest.put("force_alert", false);

        alertService.sendAlert(alertRequest);

        Map<String, String> response = new HashMap<>();
        response.put("status", "Alert sent successfully");
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
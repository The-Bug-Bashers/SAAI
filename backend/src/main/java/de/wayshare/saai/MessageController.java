package de.wayshare.saai;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
public class MessageController {

    @Autowired
    private MessageService messageService;

    // GET endpoint to fetch the message content and stage (No password required)
    @GetMapping("/api/message")
    public ResponseEntity<Map<String, Object>> getMessage() {
        Message message = messageService.getMessage();
        Map<String, Object> response = new HashMap<>();
        response.put("content", message.getContent());
        response.put("stage", message.getStage());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    // PUT endpoint to update the message content and stage (Password required)
    @PutMapping("/api/message")
    public ResponseEntity<Map<String, String>> updateMessage(@RequestBody Map<String, Object> requestBody) {
        String password = (String) requestBody.get("password");
        String content = (String) requestBody.get("content");
        Integer stage = (Integer) requestBody.get("stage");

        try {
            // Attempt to update the message
            messageService.updateMessage(content, stage, password);

            // Success response
            Map<String, String> response = new HashMap<>();
            response.put("message", "Message updated successfully");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (ResponseStatusException e) {
            // Handle the exception manually
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getReason());

            // Manually return the specific status based on the exception type
            HttpStatus status = HttpStatus.BAD_REQUEST; // Default to 400
            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                status = HttpStatus.UNAUTHORIZED;
            }

            return new ResponseEntity<>(errorResponse, status);
        } catch (Exception e) {
            // Handle other exceptions
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "An unexpected error occurred");
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}

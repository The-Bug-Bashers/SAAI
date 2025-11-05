package de.wayshare.saai;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
public class SignalMessageController {

    @Value("${users.service.password}")
    private String expectedPassword;

    @Value("${signal-cli.address.token}")
    private String addressToken;

    @Autowired
    private ShellCommandService shellCommandService;

    // Modified GET endpoint for liveticker
    @GetMapping("/api/signalmessage/liveticker")
    public ResponseEntity<Map<String, String>> sendSignalMessageToGroup(@RequestParam String message, @RequestParam(required = false) String password) {
        Map<String, String> response = new HashMap<>();

        // Validate password if provided
        if (password != null && !password.isEmpty()) {
            if (!expectedPassword.equals(password)) {
                response.put("error", "Incorrect password");
                return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
            }
        }

        // Replace underscores with spaces in the message
        String formattedMessage = message.replace('_', ' ');

        // Run signal-cli commands asynchronously for group message
        try {
            // Pass isGroup as true since this is for a group message
            shellCommandService.executeSignalCliSend(formattedMessage, addressToken, true);
            response.put("message", "Signal message sent successfully");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            response.put("error", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Existing POST endpoint remains unchanged
    @PostMapping("/api/signalmessage")
    public ResponseEntity<Map<String, String>> sendSignalMessageToPhoneNumber(@RequestBody Map<String, String> body) {
        Map<String, String> response = new HashMap<>();

        String telephoneNumber = body.get("telephoneNumber");
        String message = body.get("message");
        String password = body.get("password");

        // Validate password
        if (password == null || password.isEmpty()) {
            response.put("error", "Password not provided");
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }

        if (!expectedPassword.equals(password)) {
            response.put("error", "Incorrect password");
            return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
        }

        // Validate telephone number and message
        if (telephoneNumber == null || telephoneNumber.isEmpty()) {
            response.put("error", "Telephone number not provided");
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }

        if (message == null || message.isEmpty()) {
            response.put("error", "Message not provided");
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }

        // Replace underscores with spaces in the message
        String formattedMessage = message.replace('_', ' ');

        // Run signal-cli commands asynchronously for phone number
        try {
            shellCommandService.executeSignalCliSend(formattedMessage, telephoneNumber, false);
            response.put("message", "Signal message sent successfully");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            response.put("error", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

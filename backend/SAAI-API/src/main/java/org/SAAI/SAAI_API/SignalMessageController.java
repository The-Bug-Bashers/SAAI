// SignalMessageController.java
package org.SAAI.SAAI_API;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class SignalMessageController {

    @Value("${users.service.password}")
    private String expectedPassword;

    @Value("${signal-cli.address.token}")
    private String addressToken;

    @Autowired
    private ShellCommandService shellCommandService;

    @GetMapping("/api/signalmessage/liveticker")
    public ResponseEntity<Map<String, String>> sendSignalMessage(@RequestParam String message, @RequestParam String password) {
        Map<String, String> response = new HashMap<>();

        // Validate password
        if (password == null || password.isEmpty()) {
            response.put("error", "Password not provided");
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }

        if (!expectedPassword.equals(password)) {
            response.put("error", "Incorrect password");
            return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
        }

        // Run signal-cli commands asynchronously
        try {
            shellCommandService.executeSignalCliReceiveAndSend(message, addressToken);
            response.put("message", "Signal message sent successfully");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            response.put("error", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

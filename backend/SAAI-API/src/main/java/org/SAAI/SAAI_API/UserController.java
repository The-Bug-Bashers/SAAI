package org.SAAI.SAAI_API;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

@CrossOrigin(origins = "*")
@RestController
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/api/users")
    public ResponseEntity<Map<String, Object>> getUsers(@RequestBody Map<String, String> requestBody) {
        String password = requestBody.get("password");

        try {
            userService.updateUserData(password);
            Map<String, String> usersWithExperience = userService.getUserExperiences();
            Map<String, String> usersWithTelephoneNumbers = userService.getUserTelephoneNumbers();

            // Combine experience and telephone number into one response
            Map<String, Object> combinedResponse = new HashMap<>();
            combinedResponse.put("experience", usersWithExperience);
            combinedResponse.put("telephoneNumber", usersWithTelephoneNumbers);

            return new ResponseEntity<>(combinedResponse, HttpStatus.OK);
        } catch (Exception e) {
            // Ensure that the error response conforms to Map<String, Object>
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
        }
    }

    // Endpoint to update user experience
    @PutMapping("/api/users/{username}/experience")
    public ResponseEntity<Map<String, String>> updateUserExperience(@PathVariable String username, @RequestBody Map<String, String> requestBody) {
        String password = requestBody.get("password");
        String newExperience = requestBody.get("experience");

        try {
            userService.updateUserExperience(username, newExperience, password);
            Map<String, String> successResponse = new HashMap<>();
            successResponse.put("message", "User experience updated successfully");
            return new ResponseEntity<>(successResponse, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
        }
    }
}

// UserController.java
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
    public ResponseEntity<Map<String, String>> getUsers(@RequestBody Map<String, String> requestBody) {
        String password = requestBody.get("password");

        try {
            userService.updateUserData(password);
            Map<String, String> usersWithExperience = userService.getUserExperiences();
            return new ResponseEntity<>(usersWithExperience, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
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

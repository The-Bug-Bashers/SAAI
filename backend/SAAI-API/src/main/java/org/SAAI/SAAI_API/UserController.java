package org.SAAI.SAAI_API;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

@CrossOrigin(origins = "*")
@RestController
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/api/users")
    public ResponseEntity<List<Map<String, Object>>> getUsers(@RequestBody Map<String, String> requestBody) {
        String password = requestBody.get("password");

        try {
            userService.updateUserData(password);
            Map<String, String> usersWithExperience = userService.getUserExperiences();
            Map<String, String> usersWithTelephoneNumbers = userService.getUserTelephoneNumbers();

            // Create a list to hold user data (username, experience, telephoneNumber)
            List<Map<String, Object>> userDataList = new ArrayList<>();

            // Loop through users and create a structure for each user
            for (String username : usersWithExperience.keySet()) {
                Map<String, Object> userData = new HashMap<>();
                userData.put("username", username);
                userData.put("experience", usersWithExperience.get(username));
                userData.put("telephoneNumber", usersWithTelephoneNumbers.get(username));
                userDataList.add(userData);
            }

            return new ResponseEntity<>(userDataList, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            List<Map<String, Object>> errorList = new ArrayList<>();
            errorList.add(errorResponse);
            return new ResponseEntity<>(errorList, HttpStatus.UNAUTHORIZED);
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

    @PutMapping("/api/users/{username}/telephoneNumber")
    public ResponseEntity<Map<String, String>> updateUserTelephoneNumber(@PathVariable String username, @RequestBody Map<String, String> requestBody) {
        String password = requestBody.get("password");
        String newTelephoneNumber = requestBody.get("telephoneNumber");

        try {
            userService.updateUserTelephoneNumber(username, newTelephoneNumber, password);
            Map<String, String> successResponse = new HashMap<>();
            successResponse.put("message", "User telephone number updated successfully");
            return new ResponseEntity<>(successResponse, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
        }
    }

}

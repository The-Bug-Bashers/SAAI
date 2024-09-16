package org.SAAI.SAAI_API;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.Map;
import java.util.HashMap;

@CrossOrigin(origins = "*")
@RestController
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/api/users")
    public ResponseEntity<Map<String, String>> getUsers(@RequestBody Map<String, String> requestBody) {
        // Extract the password from the request body
        String password = requestBody.get("password");

        // Call the service to update the user data with the provided password
        try {
            userService.updateUserData(password); // Update the user data from the external API
            Map<String, String> usersWithExperience = userService.getUserExperiences();
            return new ResponseEntity<>(usersWithExperience, HttpStatus.OK);
        } catch (Exception e) {
            // Return an error response in case of any exceptions (such as invalid password)
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
        }
    }
}

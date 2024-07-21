package org.SAAI.SAAI_API;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")

@RestController
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/api/users")
    public ResponseEntity<Map<String, String>> getUsers() {
        userService.updateUserData(); // Update the user data from the external API
        Map<String, String> usersWithExperience = userService.getUserExperiences();
        return new ResponseEntity<>(usersWithExperience, HttpStatus.OK);
    }
}

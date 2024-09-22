package org.SAAI.SAAI_API;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Value("${users.service.url}")
    private String usersServiceUrl;

    @Value("${users.service.password}")
    private String expectedPassword;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public void updateUserExperience(String username, String newExperience, String password) {
        // Validate password
        if (password == null || password.isEmpty()) {
            logger.error("Password not provided");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password not provided");
        }

        if (!expectedPassword.equals(password)) {
            logger.error("Incorrect password");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect password");
        }

        // Find the user by username
        User user = userRepository.findById(username).orElseThrow(() -> new RuntimeException("User not found"));

        // Update the user's experience
        user.setExperience(newExperience);

        // Save the updated user to the database
        userRepository.save(user);

        logger.info("User experience updated successfully for user: {}", username);
    }

    @Transactional
    public void updateUserTelephoneNumber(String username, String newTelephoneNumber, String password) {
        if (password == null || password.isEmpty()) {
            logger.error("Password not provided");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password not provided");
        }

        if (!expectedPassword.equals(password)) {
            logger.error("Incorrect password");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect password");
        }

        User user = userRepository.findById(username).orElseThrow(() -> new RuntimeException("User not found"));

        logger.info("Current telephone number for user {}: {}", username, user.getTelephoneNumber());

        if (!newTelephoneNumber.equals(user.getTelephoneNumber())) {
            logger.info("Updating telephone number for user {} to {}", username, newTelephoneNumber);
            user.setTelephoneNumber(newTelephoneNumber);
            userRepository.save(user);

            // Fetch the updated user to verify the change
            User updatedUser = userRepository.findById(username).orElseThrow(() -> new RuntimeException("User not found after update"));
            logger.info("Updated telephone number in DB for user {}: {}", username, updatedUser.getTelephoneNumber());

            logger.info("User telephone number updated successfully for user: {}", username);
        } else {
            logger.info("Telephone number for user {} is already up to date.", username);
        }
    }



    @Transactional
    public List<Map<String, Object>> updateUserData(String password) {
        // Validate password
        if (password == null || password.isEmpty()) {
            logger.error("Password not provided");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password not provided");
        }

        if (!expectedPassword.equals(password)) {
            logger.error("Incorrect password");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect password");
        }

        String token = tokenService.getToken();
        logger.info("Token obtained: {}", token);

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        // Fetch data from external API
        ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(usersServiceUrl, HttpMethod.GET, entity, new ParameterizedTypeReference<List<Map<String, Object>>>() {});
        logger.info("Response status code: {}", response.getStatusCode());

        if (!response.getStatusCode().is2xxSuccessful()) {
            logger.error("Failed to retrieve users");
            throw new RuntimeException("Failed to retrieve users");
        }

        List<Map<String, Object>> users = response.getBody();

        // This still updates the local DB
        updateUserDatabase(users);

        // Return the fetched users (including UUIDs) to the controller
        return users;
    }


    @Transactional
    public void updateUserDatabase(List<Map<String, Object>> users) {
        Set<String> apiUsernames = users.stream()
                .map(user -> (String) user.get("username"))
                .collect(Collectors.toSet());

        List<User> existingUsers = userRepository.findAll();
        Set<String> existingUsernames = existingUsers.stream()
                .map(User::getUsername)
                .collect(Collectors.toSet());

        // Delete users not in API response
        for (String username : existingUsernames) {
            if (!apiUsernames.contains(username)) {
                userRepository.deleteById(username);
                logger.info("Deleted user: {}", username);
            }
        }

        // Add new users and update existing ones
        for (Map<String, Object> user : users) {
            String username = (String) user.get("username");
            String telephoneNumber = (String) user.get("telephoneNumber");
            String uuid = (String) user.get("uuid"); // Fetch uuid from the external API response

            User dbUser = userRepository.findById(username).orElse(new User());
            dbUser.setUsername(username);

            // Only update telephone number if it's provided by the API
            if (telephoneNumber != null) {
                dbUser.setTelephoneNumber(telephoneNumber);
            }

            if (dbUser.getExperience() == null) {
                dbUser.setExperience("new");
            }

            userRepository.save(dbUser);
            logger.info("Added/Updated user: {}", username);

            // Update the user's UUID in the response (but not in the DB)
            user.put("uuid", uuid); // Store the uuid in the user map for the response
        }
    }


    public Map<String, String> getUserExperiences() {
        List<User> users = userRepository.findAll();
        return users.stream()
                .collect(Collectors.toMap(User::getUsername, User::getExperience));
    }

    public Map<String, String> getUserTelephoneNumbers() {
        List<User> users = userRepository.findAll();
        return users.stream()
                .collect(Collectors.toMap(User::getUsername, User::getTelephoneNumber));
    }
}

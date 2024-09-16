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
    public void updateUserData(String password) {
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

        ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(usersServiceUrl, HttpMethod.POST, entity, new ParameterizedTypeReference<List<Map<String, Object>>>() {});
        logger.info("Response status code: {}", response.getStatusCode());

        if (!response.getStatusCode().is2xxSuccessful()) {
            logger.error("Failed to retrieve users");
            throw new RuntimeException("Failed to retrieve users");
        }

        List<Map<String, Object>> users = response.getBody();
        updateUserDatabase(users);
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
            User dbUser = userRepository.findById(username).orElse(new User());
            dbUser.setUsername(username);
            if (dbUser.getExperience() == null) {
                dbUser.setExperience("new");
            }
            userRepository.save(dbUser);
            logger.info("Added/Updated user: {}", username);
        }
    }

    public Map<String, String> getUserExperiences() {
        List<User> users = userRepository.findAll();
        return users.stream()
                .collect(Collectors.toMap(User::getUsername, User::getExperience));
    }
}

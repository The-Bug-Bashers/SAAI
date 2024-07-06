package org.SAAI.SAAI_API;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.transaction.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Value("${users.service.url}")
    private String usersServiceUrl;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public List<Map<String, Object>> getUserData() {
        String token = tokenService.getToken();
        logger.info("Token obtained: {}", token);

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(usersServiceUrl, HttpMethod.GET, entity, new ParameterizedTypeReference<List<Map<String, Object>>>() {});
        logger.info("Response status code: {}", response.getStatusCode());

        if (!response.getStatusCode().is2xxSuccessful()) {
            logger.error("Failed to retrieve users");
            throw new RuntimeException("Failed to retrieve users");
        }

        List<Map<String, Object>> users = response.getBody();
        updateUserDatabase(users);
        return users;
    }

    @Transactional
    public void updateUserDatabase(List<Map<String, Object>> users) {
        Set<String> apiUsernames = users.stream()
                .map(user -> (String) user.get("username"))
                .collect(Collectors.toSet());

        List<User> existingUsers = userRepository.findAll();

        // Delete users not in the API response
        for (User existingUser : existingUsers) {
            if (!apiUsernames.contains(existingUser.getUsername())) {
                userRepository.delete(existingUser);
                logger.info("Deleted user: {}", existingUser.getUsername());
            }
        }

        // Add new users from the API response
        for (Map<String, Object> user : users) {
            String username = (String) user.get("username");
            if (!userRepository.existsById(username)) {
                User newUser = new User();
                newUser.setUsername(username);
                userRepository.save(newUser);
                logger.info("Added new user: {}", username);
            }
        }
    }

    public List<Map<String, Object>> getUsersWithExperience(List<Map<String, Object>> users) {
        List<User> userList = userRepository.findAll();
        for (Map<String, Object> user : users) {
            String username = (String) user.get("username");
            User dbUser = userList.stream()
                    .filter(u -> u.getUsername().equals(username))
                    .findFirst()
                    .orElse(null);
            if (dbUser != null) {
                user.put("experience", dbUser.getExperience());
            }
        }
        return users;
    }
}

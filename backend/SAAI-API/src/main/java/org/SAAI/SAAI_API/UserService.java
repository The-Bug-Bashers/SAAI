package org.SAAI.SAAI_API;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Value("${users.service.url}")
    private String usersServiceUrl;

    @Autowired
    private TokenService tokenService;

    private final Map<String, User> userDatabase = new ConcurrentHashMap<>();

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

        List<String> existingUsernames = new ArrayList<>(userDatabase.keySet());

        for (String username : existingUsernames) {
            if (!apiUsernames.contains(username)) {
                userDatabase.remove(username);
                logger.info("Deleted user: {}", username);
            }
        }

        for (Map<String, Object> user : users) {
            String username = (String) user.get("username");
            if (!userDatabase.containsKey(username)) {
                User newUser = new User();
                newUser.setUsername(username);
                userDatabase.put(username, newUser);
                logger.info("Added new user: {}", username);
            }
        }
    }

    public List<Map<String, Object>> getUsersWithExperience(List<Map<String, Object>> users) {
        for (Map<String, Object> user : users) {
            String username = (String) user.get("username");
            User dbUser = userDatabase.get(username);
            if (dbUser != null) {
                user.put("experience", dbUser.getExperience());
            }
        }
        return users;
    }
}

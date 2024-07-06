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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Value("${users.service.url}")
    private String usersServiceUrl;

    @Autowired
    private TokenService tokenService;

    public List<String> getUserNames() {
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

        return extractUserNames(response.getBody());
    }

    private List<String> extractUserNames(List<Map<String, Object>> users) {
        List<String> userNames = new ArrayList<>();
        for (Map<String, Object> user : users) {
            userNames.add((String) user.get("username"));
        }
        logger.info("Extracted usernames: {}", userNames);
        return userNames;
    }
}

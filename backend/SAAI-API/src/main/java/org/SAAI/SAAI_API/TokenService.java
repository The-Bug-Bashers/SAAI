package org.SAAI.SAAI_API;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class TokenService {

    @Value("${token.service.username}")
    private String username;

    @Value("${token.service.password}")
    private String password;

    @Value("${token.service.url}")
    private String tokenUrl;

    public String getToken() {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        Map<String, String> tokenRequest = new HashMap<>();
        tokenRequest.put("username", username);
        tokenRequest.put("password", password);
        tokenRequest.put("grant_type", "password");

        // Converting the map to URL encoded string
        StringBuilder requestBody = new StringBuilder();
        tokenRequest.forEach((key, value) -> {
            if (requestBody.length() > 0) {
                requestBody.append("&");
            }
            requestBody.append(key).append("=").append(value);
        });

        HttpEntity<String> entity = new HttpEntity<>(requestBody.toString(), headers);

        ResponseEntity<Map> response = restTemplate.exchange(tokenUrl, HttpMethod.POST, entity, Map.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Failed to retrieve token");
        }

        Map<String, Object> responseBody = response.getBody();
        if (responseBody != null && responseBody.containsKey("access_token")) {
            return (String) responseBody.get("access_token");
        } else {
            throw new RuntimeException("Token response does not contain access_token");
        }
    }
}
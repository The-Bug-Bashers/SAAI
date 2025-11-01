package de.wayshare.saai.SaniAlarmApi;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
public class SaniAlarmApiTokenService {

    private final String username;
    private final String password;
    private final String endpoint;
    private final String baseUrl;
    private final RestTemplate template;

    private static final Logger logger = LoggerFactory.getLogger(SaniAlarmApiTokenService.class);

    record TokenResponse(int expires_in, String access_token) {
    }

    public SaniAlarmApiTokenService(
            @Value("${sanialarm.user.name}") String username,
            @Value("${sanialarm.user.password}") String password,
            @Value("${sanialarm.endpoint.token}") String endpoint,
            @Value("${sanialarm.endpoint.base}") String baseUrl,
            RestTemplate template) {
        this.username = username;
        this.password = password;
        this.endpoint = endpoint;
        this.baseUrl = baseUrl;
        this.template = template;
    }

    public String getToken() {
        ResponseEntity<TokenResponse> response = sendNewTokenRequest();
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Failed to retrieve token: " + response.getStatusCode());
        }
        TokenResponse responseBody = response.getBody();
        if (responseBody == null || responseBody.access_token == null || responseBody.access_token.isEmpty() || responseBody.expires_in() <= 0) {
            throw new RuntimeException("Failed to retrieve token: Token response is invalid: " + responseBody);
        }

        logger.info("Token successfully retrieved. Expires in: {} seconds.", responseBody.expires_in());
        logger.debug("Access token: {} Expires in {} seconds.", responseBody.access_token, responseBody.expires_in());
        return responseBody.access_token;
    }

    private ResponseEntity<TokenResponse> sendNewTokenRequest() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("username", username);
        body.add("password", password);
        body.add("grant_type", "password");

        HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);

        return template.exchange(
                baseUrl + endpoint,
                HttpMethod.POST,
                requestEntity,
                TokenResponse.class
        );
    }
}
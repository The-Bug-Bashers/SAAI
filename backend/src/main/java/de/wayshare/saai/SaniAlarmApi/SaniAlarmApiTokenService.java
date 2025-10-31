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

    private static final Logger logger = LoggerFactory.getLogger(SaniAlarmApiTokenService.class);

    private final RestTemplate template = new RestTemplate();

    private record TokenResponse(int expires_in, String access_token) {
    }

    public SaniAlarmApiTokenService(@Value("${sanialarm.user.name}") String username, @Value("${sanialarm.user.password}") String password, @Value("${sanialarm.endpoint.token}") String endpoint, @Value("${sanialarm.endpoint.base}") String baseUrl) {
        this.username = username;
        this.password = password;
        this.endpoint = endpoint;
        this.baseUrl = baseUrl;
    }

    public String getToken() {
        ResponseEntity<TokenResponse> response = sendNewTokenRequest();

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Failed to retrieve token: " + response.getStatusCode());
        }
        TokenResponse body = response.getBody();
        if (body == null || body.access_token == null || body.expires_in() <= 0) {
            throw new RuntimeException("Failed to retrieve token: Token response is invalid: " + body);
        }

        logger.info("Token successfully retrieved. Expires in: {} seconds.", body.expires_in());
        return body.access_token;
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
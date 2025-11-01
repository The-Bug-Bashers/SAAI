package de.wayshare.saai.sanialarmapi;

import de.wayshare.saai.sanialarmapi.config.SaniAlarmApiConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
public class SaniAlarmApiTokenService {

    private static final Logger logger = LoggerFactory.getLogger(SaniAlarmApiTokenService.class);
    private final SaniAlarmApiConfig config;
    private final RestTemplate template;

    public SaniAlarmApiTokenService(
            SaniAlarmApiConfig config,
            RestTemplate template) {
        this.config = config;
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
        body.add("username", config.user().name());
        body.add("password", config.user().password());
        body.add("grant_type", "password");

        return template.exchange(config.tokenEndpoint(), HttpMethod.POST, new HttpEntity<>(body, headers), TokenResponse.class
        );
    }

    record TokenResponse(int expires_in, String access_token) {
    }
}
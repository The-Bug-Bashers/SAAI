package de.wayshare.saai.sanialarmapi;

import de.wayshare.saai.sanialarmapi.config.SaniAlarmApiConfig;
import de.wayshare.saai.sanialarmapi.exception.TokenRetrievalException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

@Service
public class SaniAlarmApiTokenService {

    private static final Logger logger = LoggerFactory.getLogger(SaniAlarmApiTokenService.class);

    private final SaniAlarmApiConfig config;
    private final RestTemplate template;

    private volatile String cachedToken;
    private volatile Instant tokenExpiry;

    public SaniAlarmApiTokenService(
            SaniAlarmApiConfig config,
            RestTemplate template) {
        this.config = config;
        this.template = template;
    }

    public String getToken() {
        if (isTokenValid()) {
            logger.debug("Using cached Token: {} Expires in {} seconds.", cachedToken, Instant.now().until(tokenExpiry, ChronoUnit.SECONDS));
            return cachedToken;
        }

        ResponseEntity<TokenResponse> response = sendNewTokenRequest();
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new TokenRetrievalException("Response status: " + response.getStatusCode() + " Body: " + response.getBody());
        }

        TokenResponse responseBody = response.getBody();
        if (responseBody == null || responseBody.access_token() == null || responseBody.access_token().isEmpty() || responseBody.expires_in() <= 0) {
            throw new TokenRetrievalException("Response is invalid: " + responseBody);
        }

        cachedToken = responseBody.access_token();
        tokenExpiry = Instant.now().plusSeconds(responseBody.expires_in() - config.tokenExpiryBufferSeconds());
        if (Instant.now().isAfter(tokenExpiry)) {
            throw new TokenRetrievalException("Calculated token expiry is already past directly after retrieval");
        }

        logger.info("Token successfully retrieved. Expires in: {} seconds.", Instant.now().until(tokenExpiry, ChronoUnit.SECONDS));
        logger.debug("Using new Token: {} Expires in {} seconds.", cachedToken, Instant.now().until(tokenExpiry, ChronoUnit.SECONDS));
        return cachedToken;
    }

    private boolean isTokenValid() {
        return cachedToken != null && tokenExpiry != null && Instant.now().isBefore(tokenExpiry);
    }

    private ResponseEntity<TokenResponse> sendNewTokenRequest() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("username", config.user().name());
        body.add("password", config.user().password());
        body.add("grant_type", "password");

        try {
            return template.exchange(config.tokenEndpoint(), HttpMethod.POST, new HttpEntity<>(body, headers), TokenResponse.class
            );
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            throw new TokenRetrievalException("Response status: " + e.getStatusCode() + " Body: " + e.getResponseBodyAsString(), e);
        } catch (RestClientException e) {
            throw new TokenRetrievalException("Network error: " + e.getMessage(), e);
        }
    }

    record TokenResponse(int expires_in, String access_token) {
        public TokenResponse {
            Objects.requireNonNull(access_token);
        }
    }
}

package de.wayshare.saai.sanialarmapi;

import de.wayshare.saai.sanialarmapi.config.SaniAlarmApiConfig;
import de.wayshare.saai.sanialarmapi.exception.TokenRetrievalException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SaniAlarmApiTokenServiceTest {

    @Mock
    private RestTemplate template;

    private SaniAlarmApiTokenService tokenService;

    static Stream<HttpStatus> successStatuses() {
        return Stream.of(HttpStatus.values()).filter(HttpStatus::is2xxSuccessful);
    }

    static Stream<HttpStatus> clientErrorStatuses() {
        return Stream.of(HttpStatus.values()).filter(HttpStatus::is4xxClientError);
    }

    static Stream<HttpStatus> serverErrorStatuses() {
        return Stream.of(HttpStatus.values()).filter(HttpStatus::is5xxServerError);
    }

    static Stream<HttpStatus> non2xxStatuses() {
        return Stream.of(HttpStatus.values()).filter(status -> !status.is2xxSuccessful());
    }

    @BeforeEach
    void setUp() {
        tokenService = new SaniAlarmApiTokenService(new SaniAlarmApiConfig(
                new SaniAlarmApiConfig.ApiUser("test-user", "test-secret"),
                new SaniAlarmApiConfig.ApiEndpoint("/tokenEndpoint", "http://test-base-url"),
                30
        ), template);

        try {
            var cachedTokenField = SaniAlarmApiTokenService.class.getDeclaredField("cachedToken");
            var expiryField = SaniAlarmApiTokenService.class.getDeclaredField("tokenExpiry");
            cachedTokenField.setAccessible(true);
            expiryField.setAccessible(true);
            cachedTokenField.set(tokenService, null);
            expiryField.set(tokenService, null);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private void mockExchange(ResponseEntity<SaniAlarmApiTokenService.TokenResponse> response) {
        when(template.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(SaniAlarmApiTokenService.TokenResponse.class)
        )).thenReturn(response);
    }

    @ParameterizedTest
    @MethodSource("de.wayshare.saai.util.TestValues#stringTestValues")
    void returnsCorrectTokenWhenResponseIsValid(String token) {
        mockExchange(new ResponseEntity<>(new SaniAlarmApiTokenService.TokenResponse(25199, token), HttpStatus.OK));
        assertEquals(token, tokenService.getToken(), "Should have returned tokenEndpoint " + token);
    }

    @Test
    void throwsExceptionWhenResponseHasEmptyToken() {
        mockExchange(new ResponseEntity<>(new SaniAlarmApiTokenService.TokenResponse(3600, ""), HttpStatus.OK));
        assertThrows(TokenRetrievalException.class, () -> tokenService.getToken(), "Should have thrown exception on missing tokenEndpoint");
    }

    @Test
    void throwsExceptionWhenResponseIsMissingToken() {
        assertThrows(NullPointerException.class, () -> new ResponseEntity<>(
                new SaniAlarmApiTokenService.TokenResponse(3600, null), HttpStatus.OK
        ), "Should have thrown exception on missing tokenEndpoint");
    }

    @ParameterizedTest
    @ValueSource(ints = {50, 249, 3600, 25199, Integer.MAX_VALUE})
    void acceptsDifferentValidExpiryTimes(int expiryTime) {
        mockExchange(new ResponseEntity<>(new SaniAlarmApiTokenService.TokenResponse(expiryTime, "123!-aBc"), HttpStatus.OK));
        assertEquals("123!-aBc", tokenService.getToken(), "Should have returned tokenEndpoint on expiry time " + expiryTime);

    }

    @ParameterizedTest
    @ValueSource(ints = {-1, -35, -21300, 0, Integer.MIN_VALUE})
    void throwsExceptionWhenTokenHasInvalidExpiryTime(int expiryTime) {
        mockExchange(new ResponseEntity<>(new SaniAlarmApiTokenService.TokenResponse(expiryTime, "123!-aBc"), HttpStatus.OK));
        assertThrows(TokenRetrievalException.class, () -> tokenService.getToken(), "Should have thrown exception on invalid expiry time " + expiryTime);
    }

    @Test
    void throwsExceptionWhenCalculatedExpiryAlreadyPast() {
        SaniAlarmApiConfig config = new SaniAlarmApiConfig(
                new SaniAlarmApiConfig.ApiUser("user", "pass"),
                new SaniAlarmApiConfig.ApiEndpoint("/tokenEndpoint", "http://url"),
                9999
        );
        SaniAlarmApiTokenService service = new SaniAlarmApiTokenService(config, template);

        mockExchange(new ResponseEntity<>(new SaniAlarmApiTokenService.TokenResponse(1, "soon-expiring-token"), HttpStatus.OK));

        assertThrows(TokenRetrievalException.class, service::getToken, "Should have thrown exception on bigger buffer then valid time.");
    }

    @ParameterizedTest
    @MethodSource("successStatuses")
    void acceptsAll2xxResponseStatuses(HttpStatus status) {
        mockExchange(new ResponseEntity<>(new SaniAlarmApiTokenService.TokenResponse(3600, "123!-aBc"), status));
        assertEquals("123!-aBc", tokenService.getToken(), "Should have returned tokenEndpoint on response status " + status);
    }

    @ParameterizedTest
    @MethodSource("non2xxStatuses")
    void throwsExceptionOnNon2xxStatus(HttpStatus status) {
        mockExchange(new ResponseEntity<>(new SaniAlarmApiTokenService.TokenResponse(3600, "tokenEndpoint"), status));
        assertThrows(TokenRetrievalException.class, () -> tokenService.getToken(), "Should have thrown exception on response status " + status);
    }

    @ParameterizedTest
    @MethodSource("clientErrorStatuses")
    void throwsExceptionOnHttpClientErrorException(HttpStatus status) {
        when(template.exchange(anyString(), any(), any(), eq(SaniAlarmApiTokenService.TokenResponse.class)))
                .thenThrow(new HttpClientErrorException(status, "Error", "body".getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8));

        assertThrows(TokenRetrievalException.class, () -> tokenService.getToken(), "Should have thrown exception on response status " + status);
    }

    @ParameterizedTest
    @MethodSource("serverErrorStatuses")
    void throwsExceptionOnHttpServerErrorException(HttpStatus status) {
        when(template.exchange(anyString(), any(), any(), eq(SaniAlarmApiTokenService.TokenResponse.class)))
                .thenThrow(new HttpServerErrorException(status, "Error", "body".getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8));

        assertThrows(TokenRetrievalException.class, () -> tokenService.getToken(), "Should have thrown exception on response status " + status);
    }

    @Test
    void throwsExceptionOnGenericRestClientException() {
        when(template.exchange(anyString(), any(), any(), eq(SaniAlarmApiTokenService.TokenResponse.class)))
                .thenThrow(new RestClientException("connection timed out"));

        assertThrows(TokenRetrievalException.class, () -> tokenService.getToken());
    }

    @Test
    void reusesCachedTokenWhenStillValid() {
        mockExchange(new ResponseEntity<>(new SaniAlarmApiTokenService.TokenResponse(3600, "token"), HttpStatus.OK));

        String first = tokenService.getToken();
        String second = tokenService.getToken();

        assertEquals(first, second, "Should return same token from cache");
        verify(template, times(1)).exchange(anyString(), any(), any(), eq(SaniAlarmApiTokenService.TokenResponse.class));
    }

    @Test
    void requestsNewTokenWhenPreviousTokenExpired() throws NoSuchFieldException, IllegalAccessException {
        String newToken = "new-token";

        mockExchange(new ResponseEntity<>(new SaniAlarmApiTokenService.TokenResponse(50, "expired-token"), HttpStatus.OK));
        tokenService.getToken();

        var expiryField = SaniAlarmApiTokenService.class.getDeclaredField("tokenExpiry");
        expiryField.setAccessible(true);
        expiryField.set(tokenService, Instant.now().minusSeconds(60));

        mockExchange(new ResponseEntity<>(new SaniAlarmApiTokenService.TokenResponse(3600, newToken), HttpStatus.OK));
        String tokenAfterExpiry = tokenService.getToken();

        assertEquals(newToken, tokenAfterExpiry, "Should have retrieved new token after expiry");
        verify(template, times(2)).exchange(anyString(), any(), any(), eq(SaniAlarmApiTokenService.TokenResponse.class));
    }

    @ParameterizedTest
    @ValueSource(ints = {5, 30, 100, 5000, Integer.MAX_VALUE - 5})
    void tokenExpiryRespectsBufferSeconds(int bufferSeconds) throws NoSuchFieldException, IllegalAccessException {
        int expiresIn = Integer.MAX_VALUE;
        SaniAlarmApiConfig configSpy = new SaniAlarmApiConfig(
                new SaniAlarmApiConfig.ApiUser("test-user", "test-secret"),
                new SaniAlarmApiConfig.ApiEndpoint("/tokenEndpoint", "http://test-base-url"),
                bufferSeconds
        );
        SaniAlarmApiTokenService serviceWithBuffer = new SaniAlarmApiTokenService(configSpy, template);

        mockExchange(new ResponseEntity<>(new SaniAlarmApiTokenService.TokenResponse(expiresIn, "buffered-token"), HttpStatus.OK));

        serviceWithBuffer.getToken();

        var expiryField = SaniAlarmApiTokenService.class.getDeclaredField("tokenExpiry");
        expiryField.setAccessible(true);
        Instant expiry = (Instant) expiryField.get(serviceWithBuffer);

        long remainingSeconds = Instant.now().until(expiry, ChronoUnit.SECONDS);

        assertEquals(expiresIn - bufferSeconds, remainingSeconds, 3, "Token expiry should be reduced by buffer seconds");
    }
}

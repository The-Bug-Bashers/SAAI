package de.wayshare.saai.SaniAlarmApi;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.util.AssertionErrors.assertEquals;

@ExtendWith(MockitoExtension.class)
class SaniAlarmApiTokenServiceTest {

    @Mock
    private RestTemplate template;

    private SaniAlarmApiTokenService tokenService;

    @BeforeEach
    void setUp() {
        tokenService = new SaniAlarmApiTokenService(
                "test-user",
                "test-secret",
                "/token",
                "http://test-base-url",
                template
        );

    }

    private void mockExchange(ResponseEntity<SaniAlarmApiTokenService.TokenResponse> response) {
        when(template.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(SaniAlarmApiTokenService.TokenResponse.class)
        )).thenReturn(response);
    }

    @Test
    void returnsCorrectTokenWhenResponseIsValid() {
        for (String expectedToken : new String[]{"Pg4TyDVSlR0PMBQIz7teJEfQSAFO6lNG", "25YVaYhBqbdLaGmBfZs0PShnYWAHSYdZ", "CwUsDhjvTrot0zPhrGvAljJT2hQUnu97", "123!-aBc"}) {
            mockExchange(new ResponseEntity<>(new SaniAlarmApiTokenService.TokenResponse(25199, expectedToken), HttpStatus.OK));
            assertEquals("Should have returned token " + expectedToken, expectedToken, tokenService.getToken());
        }
    }

    @Test
    void throwsExceptionWhenResponseStatusIsNot2xx() {
        for (HttpStatus status : new HttpStatus[]{HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST, HttpStatus.INTERNAL_SERVER_ERROR}) {
            mockExchange(new ResponseEntity<>(status));
            assertThrows(RuntimeException.class, () -> tokenService.getToken(), "Should have thrown exception on response status " + status);
        }
    }

    @Test
    void throwsExceptionWhenResponseIsMissingToken() {
        mockExchange(new ResponseEntity<>(new SaniAlarmApiTokenService.TokenResponse(3600, null), HttpStatus.OK));
        assertThrows(RuntimeException.class, () -> tokenService.getToken(), "Should have thrown exception on response status " + HttpStatus.OK);
    }

    @Test
    void throwsExceptionWhenTokenHasInvalidExpiryTime() {
        for (int expiryTime : new int[]{0, -1, -25199}) {
            mockExchange(new ResponseEntity<>(new SaniAlarmApiTokenService.TokenResponse(expiryTime, "123!-aBc"), HttpStatus.OK));
            assertThrows(RuntimeException.class, () -> tokenService.getToken(), "Should have thrown exception on invalid expiry time " + expiryTime);
        }
    }
}

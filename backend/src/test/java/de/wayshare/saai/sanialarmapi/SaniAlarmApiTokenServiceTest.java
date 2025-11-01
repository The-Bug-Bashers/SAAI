package de.wayshare.saai.sanialarmapi;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.util.AssertionErrors.assertEquals;

@ExtendWith(MockitoExtension.class)
class SaniAlarmApiTokenServiceTest {

    @Mock
    private RestTemplate template;

    private SaniAlarmApiTokenService tokenService;

    static Stream<HttpStatus> successStatuses() {
        return Stream.of(HttpStatus.values()).filter(HttpStatus::is2xxSuccessful);
    }

    static Stream<HttpStatus> non2xxStatuses() {
        return Stream.of(HttpStatus.values()).filter(status -> !status.is2xxSuccessful());
    }

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

    @ParameterizedTest
    @ValueSource(strings = {"ß3409823ß409", "hlKHirgeshtoiuuUUpoZiJhOIUtOIUHLKJhLKjhLkITZ", "§$=)(/§?%=)(§?=/$§=)§$(", "kei7FtPZr86nXreJc6TIyuyExOTn7dmk", "9ATDyXemSPodBHRNh4Cjrna.-VyjNPSM"})
    void returnsCorrectTokenWhenResponseIsValid(String token) {
        mockExchange(new ResponseEntity<>(new SaniAlarmApiTokenService.TokenResponse(25199, token), HttpStatus.OK));
        assertEquals("Should have returned token " + token, token, tokenService.getToken());
    }

    @ParameterizedTest
    @NullAndEmptySource
    void throwsExceptionWhenResponseIsMissingToken(String token) {
        mockExchange(new ResponseEntity<>(new SaniAlarmApiTokenService.TokenResponse(3600, token), HttpStatus.OK));
        assertThrows(RuntimeException.class, () -> tokenService.getToken(), "Should have thrown exception on missing token");
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3600, 25199, Integer.MAX_VALUE})
    void acceptsDifferentValidExpiryTimes(int expiryTime) {
        mockExchange(new ResponseEntity<>(new SaniAlarmApiTokenService.TokenResponse(expiryTime, "123!-aBc"), HttpStatus.OK));
        assertEquals("Should have returned token on expiry time " + expiryTime, "123!-aBc", tokenService.getToken());

    }

    @ParameterizedTest
    @ValueSource(ints = {-1, -35, -21300, 0, Integer.MIN_VALUE})
    void throwsExceptionWhenTokenHasInvalidExpiryTime(int expiryTime) {
        mockExchange(new ResponseEntity<>(new SaniAlarmApiTokenService.TokenResponse(expiryTime, "123!-aBc"), HttpStatus.OK));
        assertThrows(RuntimeException.class, () -> tokenService.getToken(), "Should have thrown exception on invalid expiry time " + expiryTime);
    }

    @ParameterizedTest
    @MethodSource("successStatuses")
    void acceptsAll2xxResponseStatuses(HttpStatus status) {
        mockExchange(new ResponseEntity<>(new SaniAlarmApiTokenService.TokenResponse(3600, "123!-aBc"), status));
        assertEquals("Should have returned token on response status " + status, "123!-aBc", tokenService.getToken());
    }

    @ParameterizedTest
    @MethodSource("non2xxStatuses")
    void throwsExceptionWhenResponseStatusIsNot2xx(HttpStatus status) {
        mockExchange(new ResponseEntity<>(new SaniAlarmApiTokenService.TokenResponse(3600, "token"), status));
        assertThrows(RuntimeException.class, () -> tokenService.getToken(), "Should have thrown exception on response status " + status);
    }

}

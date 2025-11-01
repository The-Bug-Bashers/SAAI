package de.wayshare.saai.sanialarmapi;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EmptySource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class SaniAlarmApiClientTest {

    private final String baseUrl = "https://test-base-url";
    @Mock
    SaniAlarmApiTokenService tokenService;
    @Mock
    RestTemplate template;
    SaniAlarmApiClient client;

    static Stream<HttpMethod> httpMethods() { // HttpMethod is no Enum
        return Stream.of(HttpMethod.values());
    }

    static Stream<MediaType> mediaTypes() { // MediaTypes is no Enum
        return Stream.of(MediaType.class.getFields())
                .filter(f -> f.getType() == MediaType.class)
                .map(f -> {
                    try {
                        return (MediaType) f.get(null);
                    } catch (IllegalAccessException e) {
                        throw new RuntimeException(e);
                    }
                })
                .filter(mediaType -> !MediaType.ALL.equals(mediaType));
    }

    @BeforeEach
    public void setUp() {
        client = new SaniAlarmApiClient(
                tokenService,
                baseUrl,
                template
        );
    }

    private void mockExchange(ResponseEntity<String> response) {
        when(template.exchange(
                anyString(),
                any(HttpMethod.class),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(response);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @MethodSource("de.wayshare.saai.util.TestValues#stringTestValues")
    void usesCorrectEndpoint(String endpoint) {
        SaniAlarmApiRequest<String> request = new SaniAlarmApiRequest<>(
                HttpMethod.GET,
                MediaType.APPLICATION_FORM_URLENCODED,
                endpoint,
                null
        );

        when(tokenService.getToken()).thenReturn("123!-aBc");
        mockExchange(ResponseEntity.ok("ok"));

        ResponseEntity<String> result = client.sendRequest(request, String.class);

        assertEquals("ok", result.getBody(), "should have returned the correct response body");
        verify(template).exchange(
                eq(baseUrl + endpoint),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(String.class)
        );
    }

    @ParameterizedTest
    @MethodSource("httpMethods")
    void usesCorrectHttpMethod(HttpMethod method) {
        SaniAlarmApiRequest<String> request = new SaniAlarmApiRequest<>(
                method,
                MediaType.APPLICATION_FORM_URLENCODED,
                "/endpoint",
                null
        );

        when(tokenService.getToken()).thenReturn("123!-aBc");
        mockExchange(ResponseEntity.ok("ok"));

        ResponseEntity<String> result = client.sendRequest(request, String.class);

        assertEquals("ok", result.getBody(), "should have returned the correct response body");
        verify(template).exchange(
                eq(baseUrl + "/endpoint"),
                eq(method),
                any(HttpEntity.class),
                eq(String.class)
        );
    }

    @Test
    void throwsExcerptionOnInvalidHttpMethod() {
        assertThrows(NullPointerException.class, () -> new SaniAlarmApiRequest<>(
                null,
                MediaType.APPLICATION_FORM_URLENCODED,
                "/endpoint",
                null
        ), "Should have thrown exception on HttpMethod null");
    }

    @ParameterizedTest
    @MethodSource("mediaTypes")
    void usesCorrectMediaType(MediaType type) {
        SaniAlarmApiRequest<String> request = new SaniAlarmApiRequest<>(
                HttpMethod.GET,
                type,
                "/endpoint",
                null
        );

        when(tokenService.getToken()).thenReturn("123!-aBc");
        mockExchange(ResponseEntity.ok("ok"));

        ResponseEntity<String> result = client.sendRequest(request, String.class);

        assertEquals("ok", result.getBody(), "should have returned the correct response body");
        verify(template).exchange(
                eq(baseUrl + "/endpoint"),
                eq(HttpMethod.GET),
                argThat(entity -> type.equals(entity.getHeaders().getContentType())),
                eq(String.class)
        );
    }

    @Test
    void throwsExcerptionOnNullMediaType() {
        assertThrows(NullPointerException.class, () -> new SaniAlarmApiRequest<>(
                HttpMethod.GET,
                null,
                "/endpoint",
                null
        ), "Should have thrown exception on MediaType null");
    }

    @Test
    void throwsExcerptionOnInvalidMediaType() {
        SaniAlarmApiRequest<String> request = new SaniAlarmApiRequest<>(
                HttpMethod.GET,
                MediaType.ALL,
                "/endpoint",
                null
        );

        when(tokenService.getToken()).thenReturn("123!-aBc");

        assertThrows(IllegalArgumentException.class, () -> client.sendRequest(request, String.class), "Should have thrown exception on MediaType ALL (*/*");
    }

    @ParameterizedTest
    @EmptySource
    @MethodSource("de.wayshare.saai.util.TestValues#stringTestValues")
    void sendsCorrectBody(String body) {
        SaniAlarmApiRequest<String> request = new SaniAlarmApiRequest<>(
                HttpMethod.POST,
                MediaType.TEXT_PLAIN,
                "/endpoint",
                body
        );

        when(tokenService.getToken()).thenReturn("123!-aBc");
        mockExchange(ResponseEntity.ok("ok"));

        ResponseEntity<String> result = client.sendRequest(request, String.class);

        assertEquals("ok", result.getBody(), "should have returned the correct response body");
        verify(template).exchange(
                anyString(),
                any(HttpMethod.class),
                argThat(entity -> body.equals(entity.getBody())),
                eq(String.class)
        );
    }

    @ParameterizedTest
    @MethodSource("de.wayshare.saai.util.TestValues#stringTestValues")
    void setsCorrectAuthorizationHeader(String token) {
        SaniAlarmApiRequest<String> request = new SaniAlarmApiRequest<>(
                HttpMethod.GET,
                MediaType.APPLICATION_JSON,
                "/endpoint",
                null
        );

        when(tokenService.getToken()).thenReturn(token);
        mockExchange(ResponseEntity.ok("ok"));

        ResponseEntity<String> result = client.sendRequest(request, String.class);

        assertEquals("ok", result.getBody(), "should have returned the correct response body");
        verify(template).exchange(
                anyString(),
                any(HttpMethod.class),
                argThat(entity -> ("Bearer " + token).equals(entity.getHeaders().getFirst(HttpHeaders.AUTHORIZATION))),
                eq(String.class)
        );
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"test-body", "{\"json\":\"value\"}", "aAbBcC", "2ß3?=()§&$ß2873&\"$12098\"$)=/8"})
    void returnsCorrectResponseBody(String body) {
        SaniAlarmApiRequest<String> request = new SaniAlarmApiRequest<>(
                HttpMethod.GET,
                MediaType.APPLICATION_JSON,
                "/endpoint",
                null
        );

        when(tokenService.getToken()).thenReturn("123!-aBc");
        mockExchange(ResponseEntity.ok(body));

        ResponseEntity<String> result = client.sendRequest(request, String.class);

        assertEquals(body, result.getBody(), "should have returned the correct response body " + body);
    }
}

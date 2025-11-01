package de.wayshare.saai.sanialarmapi.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Objects;

@ConfigurationProperties(prefix = "sanialarm")
public record SaniAlarmApiConfig(ApiUser user, ApiEndpoint endpoint) {
    public SaniAlarmApiConfig {
        Objects.requireNonNull(user, "user is null");
        Objects.requireNonNull(endpoint, "endpoint is null");
    }

    public String tokenEndpoint() {
        return endpoint.baseUrl() + endpoint.token();
    }

    public record ApiUser(String name, String password) {
        public ApiUser {
            Objects.requireNonNull(name, "name is null");
            Objects.requireNonNull(password, "password is null");
        }
    }

    public record ApiEndpoint(String token, String baseUrl) {
        public ApiEndpoint {
            Objects.requireNonNull(token, "token is null");
        }
    }
}

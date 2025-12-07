package de.wayshare.saai.sanialarmapi.config;

import java.util.Objects;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "sanialarm")
public record SaniAlarmApiConfig(ApiUser user, ApiEndpoint endpoint, int tokenExpiryBufferSeconds) {
  public SaniAlarmApiConfig {
    Objects.requireNonNull(user, "user is not allowed to be null");
    Objects.requireNonNull(endpoint, "endpoint is not allowed to be null");
  }

  public String tokenEndpoint() {
    return endpoint.baseUrl() + endpoint.token();
  }

  public record ApiUser(String name, String password) {
    public ApiUser {
      Objects.requireNonNull(name, "name is not allowed to be null");
      Objects.requireNonNull(password, "password is not allowed to be null");
    }
  }

  public record ApiEndpoint(String token, String baseUrl) {
    public ApiEndpoint {
      Objects.requireNonNull(token, "tokenEndpoint is not allowed to be null");
    }
  }
}

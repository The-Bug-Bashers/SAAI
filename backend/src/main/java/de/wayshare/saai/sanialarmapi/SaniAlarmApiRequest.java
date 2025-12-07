package de.wayshare.saai.sanialarmapi;

import java.util.Objects;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;

public record SaniAlarmApiRequest<R>(
    HttpMethod method, MediaType contentType, String endpoint, R body) {
  public SaniAlarmApiRequest {
    Objects.requireNonNull(method, "httpMethod is not allowed to be null");
    Objects.requireNonNull(contentType, "contentType is not allowed to be null");
  }
}

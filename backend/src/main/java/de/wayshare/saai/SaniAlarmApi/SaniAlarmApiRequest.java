package de.wayshare.saai.SaniAlarmApi;

import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;

import java.util.Objects;

public record SaniAlarmApiRequest<R>(HttpMethod method, MediaType contentType, String endpoint, R body) {
    public SaniAlarmApiRequest {
        Objects.requireNonNull(method);
        Objects.requireNonNull(contentType);
    }
}

package de.wayshare.saai.SaniAlarmApi;

import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;

public record SaniAlarmApiRequest(HttpMethod method, MediaType contentType, String endpoint, Object body) {
}

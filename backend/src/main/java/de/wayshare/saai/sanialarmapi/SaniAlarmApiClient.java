package de.wayshare.saai.sanialarmapi;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class SaniAlarmApiClient {

    private final String baseUrl;

    private final SaniAlarmApiTokenService tokenService;
    private final RestTemplate template;

    public SaniAlarmApiClient(
            SaniAlarmApiTokenService tokenService,
            @Value("${sanialarm.endpoint.base-url}") String baseUrl,
            RestTemplate template) {
        this.tokenService = tokenService;
        this.baseUrl = baseUrl;
        this.template = template;
    }

    public <R, T> ResponseEntity<T> sendRequest(SaniAlarmApiRequest<R> request, Class<T> responseType) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(tokenService.getToken());
        headers.setContentType(request.contentType());

        return template.exchange(
                baseUrl + request.endpoint(),
                request.method(),
                new HttpEntity<>(request.body(), headers),
                responseType
        );
    }
}

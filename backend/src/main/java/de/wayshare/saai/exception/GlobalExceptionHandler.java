package de.wayshare.saai.exception;

import de.wayshare.saai.sanialarmapi.exception.TokenRetrievalException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.Instant;


@ControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(TokenRetrievalException.class)
    public ResponseEntity<ExceptionResponse> handleTokenRetrievalException(TokenRetrievalException ex) {
        logger.error("SaniAlarm Token retrieval failed: {}", ex.getMessage(), ex);

        return ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ExceptionResponse(
                        Instant.now(),
                        "SaniAlarm Token retrieval failed",
                        ex.getMessage(),
                        HttpStatus.SERVICE_UNAVAILABLE.value()
                ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ExceptionResponse> handleGenericException(Exception ex) {
        logger.error("Unexpected error occurred: {}", ex.getMessage(), ex);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ExceptionResponse(
                        Instant.now(),
                        "Internal server error",
                        ex.getMessage(),
                        HttpStatus.INTERNAL_SERVER_ERROR.value()
                ));
    }

    public record ExceptionResponse(Instant timestamp, String error, String message, int status) {
    }
}

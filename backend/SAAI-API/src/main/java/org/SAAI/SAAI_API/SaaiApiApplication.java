package org.SAAI.SAAI_API;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.TimeZone;
import jakarta.annotation.PostConstruct;

@SpringBootApplication
public class SaaiApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(SaaiApiApplication.class, args);
	}

	@PostConstruct
	public void init() {
		// Setting Spring Boot TimeZone
		TimeZone.setDefault(TimeZone.getTimeZone("Europe/Berlin"));
	}
}

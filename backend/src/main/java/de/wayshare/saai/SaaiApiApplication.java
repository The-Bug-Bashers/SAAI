package de.wayshare.saai;

import de.wayshare.saai.sanialarmapi.config.SaniAlarmApiConfig;
import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling  // Enable scheduled tasks in the application
@EnableConfigurationProperties(SaniAlarmApiConfig.class)
public class SaaiApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(SaaiApiApplication.class, args);
    }

    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/Berlin"));
    }
}

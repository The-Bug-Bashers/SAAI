package de.wayshare.saai;

import org.springframework.boot.SpringApplication;
import org.testcontainers.utility.TestcontainersConfiguration;

public class TestSaaiApplication {

  public static void main(String[] args) {
    SpringApplication.from(SaaiApiApplication::main)
        .with(TestcontainersConfiguration.class)
        .run(args);
  }
}

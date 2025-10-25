package de.wayshare.saai;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.testcontainers.junit.jupiter.Testcontainers;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;

@Import(TestcontainersConfiguration.class)
@SpringBootTest(webEnvironment = RANDOM_PORT)
@Testcontainers
class MessageControllerEndpointTest {

    // for other levels of Spring Boot RESTful Service tests:
    // https://springframework.guru/testing-spring-boot-restful-services/

    @LocalServerPort
    private Integer port;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
    }

    @Test
    void withEmptyDatabaseNoMessageIsFound() {
        given()
            .contentType(ContentType.JSON)
        .when()
            .get("/api/message")
        .then()
            .statusCode(200)
            .body("stage", is(equalTo(0)))
            .body("content", is(equalTo("No message")));
    }

    @Test
    void aMessageCanBeChanged() {
        given()
            .contentType(ContentType.JSON)
            .body("""
              {
                 "password": "Baum",
                 "content": "Aufgrund von Störungen im Betriebsablauf sind momentan keine Sanitäter verfügbar.",
                 "stage": 3
               }
            """)
        .when()
            .put("/api/message")
        .then()
            .statusCode(200)
            .body("message", is(equalTo("Message updated successfully")));
    }

    @Test
    void aChangedMessageCanBeRead() {
        // change the message
        given()
            .contentType(ContentType.JSON)
            .body("""
              {
                 "password": "Baum",
                 "content": "Aufgrund von Störungen im Betriebsablauf sind momentan keine Sanitäter verfügbar.",
                 "stage": 3
               }
            """)
        .when()
            .put("/api/message")
        .then()
            .statusCode(200);

        given()
            .contentType(ContentType.JSON)
        .when()
            .get("/api/message")
        .then()
            .statusCode(200)
            .body("stage", is(equalTo(3)))
            .body("content", is(equalTo("Aufgrund von Störungen im Betriebsablauf sind momentan keine Sanitäter verfügbar.")));
    }

}

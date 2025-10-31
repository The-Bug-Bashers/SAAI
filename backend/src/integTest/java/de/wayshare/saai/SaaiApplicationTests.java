package de.wayshare.saai;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;

@Import(TestcontainersConfiguration.class)
@SpringBootTest(webEnvironment = RANDOM_PORT)
class SaaiApplicationTests {

  @LocalServerPort
  private Integer port;

  @BeforeEach
  void setUp() {
    RestAssured.port = port;
  }

  @Test
  void contextLoads() {
    // just to be sure that all auto-wiring is successful
  }

  @Test
  void theOpenApiSpecificationIsProvided() {
    var body = given()
        .accept(ContentType.JSON)
    .when()
        .get("/v3/api-docs")
    .then()
        .statusCode(200)
        .body("info.title", is(equalTo("OpenAPI definition")))
        .extract()
        .body()
        .asString();

    // just some spot checks that an endpoint's spec is generated
    assertThat(body, containsString("/api/message"));
    assertThat(body, containsString("/api/users/{username}/experience"));
    assertThat(body, containsString("/api/deleteAllTimetables"));
  }

  @Test
  void theSwaggerUiIsSuccessfullyRendered() {
    var body = given()
        .accept(ContentType.HTML)
    .when()
        .get("/swagger-ui/index.html")
    .then()
        .statusCode(200)
        .extract()
        .body()
        .asString();

    // no real frontend test here, just check rudimentally that a swagger page is there
    assertThat(body, containsString("<title>Swagger UI</title>"));
    assertThat(body, containsString("<div id=\"swagger-ui\"></div>"));
  }
}

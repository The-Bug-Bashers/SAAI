import org.springframework.boot.gradle.tasks.bundling.BootBuildImage

plugins {
  java
  jacoco
  checkstyle
  id("org.springframework.boot") version "3.5.7"
  id("io.spring.dependency-management") version "1.1.7"
  id("com.diffplug.spotless") version "6.25.0"
}

group = "de.wayshare.saai"

version = "0.0.1-SNAPSHOT"

java { toolchain { languageVersion = JavaLanguageVersion.of(21) } }

repositories { mavenCentral() }

spotless {
  java {
    googleJavaFormat("1.33.0")
    target("src/**/*.java")
  }

  kotlin {
    ktfmt().googleStyle()
    target("build.gradle.kts", "settings.gradle.kts", "gradle/**/*.kts")
  }

  format("markdown") {
    target("**/*.md")
    trimTrailingWhitespace()
    indentWithSpaces(4)
    endWithNewline()
  }

  format("misc") {
    target("**/*.md", ".editorconfig", "**/*.yml", "**/*.yaml")
    trimTrailingWhitespace()
    indentWithSpaces(2)
    endWithNewline()
  }
}

checkstyle {
  toolVersion = "12.2.0"
  configFile = file("config/checkstyle/google_checks.xml")
  isIgnoreFailures = true
  maxWarnings = 0

  tasks.withType<Checkstyle>().configureEach { enabled = false }
}

testing {
  suites {
    register<JvmTestSuite>("integTest") {
      dependencies { implementation(sourceSets.main.get().output) }
    }
  }
}

val integTestImplementation: Configuration by
configurations.getting { extendsFrom(configurations.testImplementation.get()) }
val integTestRuntimeOnly: Configuration by
configurations.getting { extendsFrom(configurations.testRuntimeOnly.get()) }

val mockitoAgent = configurations.create("mockitoAgent")

dependencies {
  implementation("org.springframework.boot:spring-boot-starter-data-jpa")
  implementation("org.springframework.boot:spring-boot-starter-web")
  implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.13")

  runtimeOnly("com.mysql:mysql-connector-j")

  developmentOnly("org.springframework.boot:spring-boot-docker-compose")

  testImplementation("org.springframework.boot:spring-boot-starter-test")
  testImplementation("org.hamcrest:hamcrest:3.0")

  testRuntimeOnly("org.junit.platform:junit-platform-launcher")

  integTestImplementation("org.springframework.boot:spring-boot-testcontainers")
  integTestImplementation("org.testcontainers:junit-jupiter")
  integTestImplementation("org.testcontainers:mysql")
  integTestImplementation("io.rest-assured:rest-assured:5.5.6")

  mockitoAgent("org.mockito:mockito-core") { isTransitive = false }
}

val dockerUser = System.getProperty("dockerUser")
val dockerToken = System.getProperty("dockerToken")
val dockerTag = System.getProperty("dockerTag", "latest")

tasks {
  withType<Test> {
    useJUnitPlatform()
    jvmArgs("-javaagent:${mockitoAgent.asPath}")
    finalizedBy(jacocoTestReport)
  }
  jacocoTestReport {
    dependsOn(test)
    reports { xml.required = true }
    executionData(
      fileTree(layout.buildDirectory) {
        includes.addAll(listOf("jacoco/test.exec", "jacoco/integTest.exec"))
      }
    )
  }
  named<BootBuildImage>("bootBuildImage") {
    imageName.set("ghcr.io/the-bug-bashers/saai:$dockerTag")
    docker {
      publishRegistry {
        username.set(dockerUser)
        password.set(dockerToken)
      }
    }
  }
  named("build") { dependsOn("spotlessApply") }
  register<Checkstyle>("checkstyleAll") {
    group = "verification"
    description = "Run Checkstyle on all sources manually"
    source =
      files(
        sourceSets.main.get().allSource,
        sourceSets.test.get().allSource,
        sourceSets.findByName("integTest")?.allSource ?: fileTree("src/integTest").asFileTree
      )
        .asFileTree
    classpath =
      files(
        sourceSets.main.get().compileClasspath,
        sourceSets.test.get().compileClasspath,
        sourceSets.findByName("integTest")?.compileClasspath ?: files()
      )
    reports {
      xml.required.set(true)
      html.required.set(true)
      xml.outputLocation.set(layout.buildDirectory.file("reports/checkstyle/checkstyleAll.xml"))
      html.outputLocation.set(layout.buildDirectory.file("reports/checkstyle/checkstyleAll.html"))
    }
    enabled = true
  }
}

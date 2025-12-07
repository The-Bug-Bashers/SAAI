package de.wayshare.saai;

import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/timetables")
public class TimetableController {

  @Autowired private TimetableService timetableService;

  // Retrieve the password from application.yml
  @Value("${users.service.password}")
  private String adminPassword;

  @PostMapping("/auto-generate")
  public ResponseEntity<String> generateWeeklyTimetables(
      @RequestBody Map<String, String> requestBody) {
    String providedPassword = requestBody.get("password");

    // Compare the provided password with the actual admin password
    if (!adminPassword.equals(providedPassword)) {
      return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);
    }

    try {
      timetableService.generateTimetablesForWeek();
      return new ResponseEntity<>("Timetables generated successfully", HttpStatus.OK);
    } catch (Exception e) {
      return new ResponseEntity<>("Error: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Scheduled task: Runs every Monday at 4:00 AM
  @Scheduled(cron = "0 0 4 * * MON", zone = "Europe/Berlin")
  public void autoGenerateTimetables() {
    try {
      timetableService.generateTimetablesForWeek();
    } catch (Exception e) {
      System.err.println("Error generating timetables: " + e.getMessage());
    }
  }
}

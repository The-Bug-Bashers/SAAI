package de.wayshare.saai;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "*")
@RestController
public class NotificationController {

  @Autowired private NotificationService notificationService;

  // Endpoint to manually trigger the cron job
  @GetMapping("/api/notifyDutyUsers")
  public ResponseEntity<String> notifyDutyUsers() {
    try {
      notificationService.notifyDutyUsers(); // Manually triggering the scheduled job
      return new ResponseEntity<>("Notifications sent successfully", HttpStatus.OK);
    } catch (Exception e) {
      return new ResponseEntity<>(
          "Failed to send notifications: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

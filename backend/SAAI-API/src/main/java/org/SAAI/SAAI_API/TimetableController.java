package org.SAAI.SAAI_API;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/timetables")
public class TimetableController {

    @Autowired
    private TimetableService timetableService;

    @PostMapping("/auto-generate")
    public ResponseEntity<String> generateWeeklyTimetables(@RequestBody Map<String, String> requestBody) {
        String password = requestBody.get("password");
        if (!"AdminPassword".equals(password)) {
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
            // Log error
            System.err.println("Error generating timetables: " + e.getMessage());
        }
    }
}

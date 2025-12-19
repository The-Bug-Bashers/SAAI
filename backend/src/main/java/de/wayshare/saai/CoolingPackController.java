package de.wayshare.saai;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/coolingpacks")
public class CoolingPackController {

  @Autowired private CoolingPackService coolingPackService;

  @Value("${users.service.password}")
  private String usersPassword;

  @Value("${coolingpacks.service.password}")
  private String coolingPacksPassword;

  @PostMapping
  public ResponseEntity<CoolingPack> addCoolingPack(@RequestBody Map<String, Object> requestBody) {
    String name = (String) requestBody.get("name");
    String password = (String) requestBody.get("password");
    Integer maxLendingDuration = (Integer) requestBody.get("maxLendingDuration");

    CoolingPack coolingPack = coolingPackService.addCoolingPack(name, maxLendingDuration, password);
    return new ResponseEntity<>(coolingPack, HttpStatus.CREATED);
  }

  @PutMapping("/{id}")
  public ResponseEntity<CoolingPack> updateCoolingPackStatus(
      @PathVariable Long id, @RequestBody Map<String, Object> requestBody) {
    String password = (String) requestBody.get("password");
    boolean borrowed = (Boolean) requestBody.get("borrowed");
    String givenBy = (String) requestBody.get("givenBy");
    String borrowedBy = (String) requestBody.get("borrowedBy");
    Integer maxLendingDuration = (Integer) requestBody.get("maxLendingDuration"); // Optional field

    CoolingPack updatedCoolingPack =
        coolingPackService.updateCoolingPackStatus(
            id, borrowed, givenBy, borrowedBy, maxLendingDuration, password);
    return new ResponseEntity<>(updatedCoolingPack, HttpStatus.OK);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteCoolingPack(
      @PathVariable Long id, @RequestParam String password) {
    coolingPackService.deleteCoolingPack(id, password);
    return new ResponseEntity<>(HttpStatus.NO_CONTENT);
  }

  @GetMapping
  public ResponseEntity<List<CoolingPack>> getAllCoolingPacks(@RequestParam String password) {
    List<CoolingPack> coolingPacks = coolingPackService.getAllCoolingPacks(password);
    return new ResponseEntity<>(coolingPacks, HttpStatus.OK);
  }

  // Scheduled task: Runs daily at 6:15 AM
  @Scheduled(cron = "0 15 6 * * *", zone = "Europe/Berlin")
  public void checkAndNotifyOverdueItems() {
    coolingPackService.notifyOverdueItems(coolingPacksPassword, usersPassword);
  }

  // Endpoint to manually trigger overdue notification
  @PostMapping("/notify-overdue")
  public ResponseEntity<String> notifyOverdueItems(@RequestBody Map<String, String> requestBody) {
    String password = requestBody.get("password");

    if (!coolingPacksPassword.equals(password)) {
      return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);
    }

    coolingPackService.notifyOverdueItems(coolingPacksPassword, usersPassword);
    return new ResponseEntity<>("Notification process completed.", HttpStatus.OK);
  }
}

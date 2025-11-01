package de.wayshare.saai;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/dutygroups")
public class DutyGroupController {

    @Autowired
    private DutyGroupService dutyGroupService;

    // GET request with password as query parameter
    @GetMapping
    public ResponseEntity<List<DutyGroup>> getAllDutyGroups(@RequestParam("password") String password) {
        return new ResponseEntity<>(dutyGroupService.getAllDutyGroups(password), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DutyGroup> getDutyGroupById(@PathVariable Long id, @RequestParam("password") String password) {
        return new ResponseEntity<>(dutyGroupService.getDutyGroupById(id, password), HttpStatus.OK);
    }

    // POST request with password in the request body
    @PostMapping
    public ResponseEntity<DutyGroup> addDutyGroup(@RequestBody Map<String, Object> requestBody) {
        String password = (String) requestBody.get("password");

        DutyGroup dutyGroup = new DutyGroup();
        dutyGroup.setUserNames((List<String>) requestBody.get("userNames"));
        dutyGroup.setDaysSinceLastDuty((Integer) requestBody.get("daysSinceLastDuty"));
        dutyGroup.setDutyDays((List<String>) requestBody.get("dutyDays"));
        dutyGroup.setDutyStart(LocalTime.parse((String) requestBody.get("dutyStart")));
        dutyGroup.setDutyEnd(LocalTime.parse((String) requestBody.get("dutyEnd")));
        dutyGroup.setFridayDutyEnd(requestBody.get("fridayDutyEnd") != null
                ? LocalTime.parse((String) requestBody.get("fridayDutyEnd"))
                : null);

        DutyGroup createdDutyGroup = dutyGroupService.addDutyGroup(dutyGroup, password);
        return new ResponseEntity<>(createdDutyGroup, HttpStatus.CREATED);
    }

    // PUT request with password in the request body
    @PutMapping("/{id}")
    public ResponseEntity<DutyGroup> updateDutyGroup(@PathVariable Long id, @RequestBody Map<String, Object> requestBody) {
        String password = (String) requestBody.get("password");

        DutyGroup dutyGroup = new DutyGroup();
        dutyGroup.setUserNames((List<String>) requestBody.get("userNames"));
        dutyGroup.setDaysSinceLastDuty((Integer) requestBody.get("daysSinceLastDuty"));
        dutyGroup.setDutyDays((List<String>) requestBody.get("dutyDays"));
        dutyGroup.setDutyStart(LocalTime.parse((String) requestBody.get("dutyStart")));
        dutyGroup.setDutyEnd(LocalTime.parse((String) requestBody.get("dutyEnd")));
        dutyGroup.setFridayDutyEnd(requestBody.get("fridayDutyEnd") != null
                ? LocalTime.parse((String) requestBody.get("fridayDutyEnd"))
                : null);

        DutyGroup updatedDutyGroup = dutyGroupService.updateDutyGroup(id, dutyGroup, password);
        return new ResponseEntity<>(updatedDutyGroup, HttpStatus.OK);
    }


    // DELETE request with password as query parameter
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDutyGroup(@PathVariable Long id, @RequestParam("password") String password) {
        dutyGroupService.deleteDutyGroup(id, password);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}

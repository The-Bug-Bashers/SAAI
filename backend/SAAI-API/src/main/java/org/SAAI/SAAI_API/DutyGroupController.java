package org.SAAI.SAAI_API;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/dutygroups")
public class DutyGroupController {

    @Autowired
    private DutyGroupService dutyGroupService;

    @GetMapping
    public ResponseEntity<List<DutyGroup>> getAllDutyGroups() {
        return new ResponseEntity<>(dutyGroupService.getAllDutyGroups(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DutyGroup> getDutyGroupById(@PathVariable Long id) {
        return new ResponseEntity<>(dutyGroupService.getDutyGroupById(id), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<DutyGroup> addDutyGroup(@RequestBody DutyGroup dutyGroup) {
        DutyGroup createdDutyGroup = dutyGroupService.addDutyGroup(dutyGroup);
        return new ResponseEntity<>(createdDutyGroup, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DutyGroup> updateDutyGroup(@PathVariable Long id, @RequestBody DutyGroup dutyGroup) {
        DutyGroup updatedDutyGroup = dutyGroupService.updateDutyGroup(id, dutyGroup);
        return new ResponseEntity<>(updatedDutyGroup, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDutyGroup(@PathVariable Long id) {
        dutyGroupService.deleteDutyGroup(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}

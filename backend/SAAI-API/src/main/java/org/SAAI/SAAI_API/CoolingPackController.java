package org.SAAI.SAAI_API;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

        import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/coolingpacks")
public class CoolingPackController {

    @Autowired
    private CoolingPackService coolingPackService;

    @PostMapping
    public ResponseEntity<CoolingPack> addCoolingPack(@RequestBody Map<String, String> requestBody) {
        String name = requestBody.get("name");
        String password = requestBody.get("password");
        CoolingPack coolingPack = coolingPackService.addCoolingPack(name, password);
        return new ResponseEntity<>(coolingPack, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CoolingPack> updateCoolingPackStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> requestBody) {
        String password = (String) requestBody.get("password");
        boolean borrowed = (Boolean) requestBody.get("borrowed");
        String givenBy = (String) requestBody.get("givenBy");
        String borrowedBy = (String) requestBody.get("borrowedBy");

        CoolingPack updatedCoolingPack = coolingPackService.updateCoolingPackStatus(id, borrowed, givenBy, borrowedBy, password);
        return new ResponseEntity<>(updatedCoolingPack, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCoolingPack(@PathVariable Long id, @RequestParam String password) {
        coolingPackService.deleteCoolingPack(id, password);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping
    public ResponseEntity<List<CoolingPack>> getAllCoolingPacks(@RequestParam String password) {
        List<CoolingPack> coolingPacks = coolingPackService.getAllCoolingPacks(password);
        return new ResponseEntity<>(coolingPacks, HttpStatus.OK);
    }
}

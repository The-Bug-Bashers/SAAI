package de.wayshare.saai;

import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "*")
@RestController
public class InfoScreenController {

  @Autowired private InfoScreenService infoScreenService;

  @GetMapping("/api/infoscreen")
  public ResponseEntity<Map<String, Object>> getInfoScreen() {
    Map<String, Object> events = infoScreenService.getInfoScreenEvents();
    return new ResponseEntity<>(events, HttpStatus.OK);
  }
}

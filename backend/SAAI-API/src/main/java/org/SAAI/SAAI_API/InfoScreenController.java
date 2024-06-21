package org.SAAI.SAAI_API;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*") // allow for all origins to acces this endpoint

@RestController
public class InfoScreenController {

    @Autowired
    private InfoScreenService infoScreenService;

    @GetMapping("/infoscreen")
    public ResponseEntity<List<Map<String, Object>>> getInfoScreen() {
        List<Map<String, Object>> events = infoScreenService.getInfoScreenEvents();
        return new ResponseEntity<>(events, HttpStatus.OK);
    }
}

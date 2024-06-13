package org.SAAI.SAAI_API;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
public class SumController {

    @PostMapping("/sum")
    public Map<String, Integer> sum(@RequestBody Map<String, Integer> request) {
        int num1 = request.get("num1");
        int num2 = request.get("num2");
        int result = num1 + num2;
        Map<String, Integer> response = new HashMap<>();
        response.put("sum", result);
        return response;
    }
}
package org.SAAI.SAAI_API;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
public class SumController {

    @GetMapping("/sum")
    public Map<String, Integer> sum(@RequestParam int num1, @RequestParam int num2) {
        int result = num1 + num2;
        Map<String, Integer> response = new HashMap<>();
        response.put("sum", result);
        return response;
    }
}
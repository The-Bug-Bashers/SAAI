package org.SAAI.SAAI_API;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.ParameterizedTypeReference;

import java.util.List;
import java.util.Map;
import java.text.SimpleDateFormat;
import java.util.*;



@Service
public class InfoScreenService {

    @Value("${infoscreen.service.url}")
    private String infoScreenUrl;

    @Autowired
    private TokenService tokenService;










    public List<Map<String, Object>> getInfoScreenEvents() {
        String token = tokenService.getToken();

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(infoScreenUrl, HttpMethod.GET, entity, new ParameterizedTypeReference<List<Map<String, Object>>>() {});

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Failed to retrieve info screen events");
        }

        // Filter and format the events
        List<Map<String, Object>> filteredEvents = filterEvents(response.getBody());

        return filteredEvents;
    }










    private List<Map<String, Object>> filterEvents(List<Map<String, Object>> events) {
        List<Map<String, Object>> todayEvents = new ArrayList<>();

        // Get today's date boundaries
        Calendar todayStartCalendar = Calendar.getInstance();
        todayStartCalendar.set(Calendar.HOUR_OF_DAY, 0);
        todayStartCalendar.set(Calendar.MINUTE, 0);
        todayStartCalendar.set(Calendar.SECOND, 0);
        todayStartCalendar.set(Calendar.MILLISECOND, 0);
        Date todayStart = todayStartCalendar.getTime();

        Calendar todayEndCalendar = Calendar.getInstance();
        todayEndCalendar.set(Calendar.HOUR_OF_DAY, 23);
        todayEndCalendar.set(Calendar.MINUTE, 59);
        todayEndCalendar.set(Calendar.SECOND, 59);
        todayEndCalendar.set(Calendar.MILLISECOND, 999);
        Date todayEnd = todayEndCalendar.getTime();

        // Iterate through events and filter the ones overlapping with today
        for (Map<String, Object> event : events) {
            String startDateTimeStr = (String) event.get("start_datetime");
            String endDateTimeStr = (String) event.get("end_datetime");
            Date startDateTime, endDateTime;
            try {
                SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssX");
                startDateTime = dateFormat.parse(startDateTimeStr);
                endDateTime = dateFormat.parse(endDateTimeStr);
            } catch (Exception e) {
                // Handle parsing exception
                continue;
            }

            // Check if event overlaps with today
            if (startDateTime.before(todayEnd) && endDateTime.after(todayStart)) {
                todayEvents.add(event);
            }
        }

        // Format the events
        List<Map<String, Object>> formattedEvents = new ArrayList<>();
        for (Map<String, Object> event : todayEvents) {
            Map<String, Object> formattedEvent = new HashMap<>();
            formattedEvent.put("start_time", formatTime((String) event.get("start_datetime")));
            formattedEvent.put("end_time", formatTime((String) event.get("end_datetime")));
            formattedEvent.put("responsible_users", extractParamedics((List<Map<String, Object>>) event.get("responsible_users")));
            formattedEvents.add(formattedEvent);
        }

        return formattedEvents;
    }




    private String formatTime(String dateTimeStr) {
        try {
            SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssX");
            SimpleDateFormat outputFormat = new SimpleDateFormat("HH:mm");
            Date dateTime = inputFormat.parse(dateTimeStr);
            return outputFormat.format(dateTime);
        } catch (Exception e) {
            return "";
        }
    }

    private List<String> extractParamedics(List<Map<String, Object>> users) {
        List<String> paramedics = new ArrayList<>();
        for (Map<String, Object> user : users) {
            paramedics.add((String) user.get("username"));
        }
        return paramedics;
    }
}

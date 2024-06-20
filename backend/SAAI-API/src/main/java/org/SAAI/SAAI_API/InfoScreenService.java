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
import java.util.Calendar;
import java.util.Date;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Comparator;

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

        return filterEvents(response.getBody());
    }

    private List<Map<String, Object>> filterEvents(List<Map<String, Object>> events) {
        List<Map<String, Object>> todayEvents = new ArrayList<>();
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

        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssX");

        for (Map<String, Object> event : events) {
            try {
                Date startDateTime = dateFormat.parse((String) event.get("start_datetime"));
                Date endDateTime = dateFormat.parse((String) event.get("end_datetime"));

                boolean isRepeating = event.containsKey("event_metadata") && !((List<Map<String, Object>>) event.get("event_metadata")).isEmpty();
                boolean isTodayEvent = startDateTime.before(todayEnd) && endDateTime.after(todayStart);

                if (isTodayEvent || (isRepeating && isTodayRepeatingEvent((List<Map<String, Object>>) event.get("event_metadata")))) {
                    todayEvents.add(event);
                }
            } catch (Exception e) {
                // Handle parsing exception
            }
        }

        List<Map<String, Object>> formattedEvents = new ArrayList<>();
        for (Map<String, Object> event : todayEvents) {
            Map<String, Object> formattedEvent = new HashMap<>();
            formattedEvent.put("start_time", formatTime((String) event.get("start_datetime")));
            formattedEvent.put("end_time", formatTime((String) event.get("end_datetime")));
            formattedEvent.put("responsible_users", extractParamedics((List<Map<String, Object>>) event.get("responsible_users")));
            formattedEvents.add(formattedEvent);
        }

        formattedEvents.sort(Comparator.comparing(e -> (String) e.get("start_time")));

        return formattedEvents;
    }

    private boolean isTodayRepeatingEvent(List<Map<String, Object>> eventMetadata) {
        Calendar calendar = Calendar.getInstance();
        int today = calendar.get(Calendar.DAY_OF_WEEK);
        for (Map<String, Object> metadata : eventMetadata) {
            String repeatWeekday = (String) metadata.get("repeat_weekday");
            if (repeatWeekday != null && getDayOfWeek(repeatWeekday) == today) {
                return true;
            }
        }
        return false;
    }

    private int getDayOfWeek(String day) {
        switch (day.toUpperCase()) {
            case "SUNDAY": return Calendar.SUNDAY;
            case "MONDAY": return Calendar.MONDAY;
            case "TUESDAY": return Calendar.TUESDAY;
            case "WEDNESDAY": return Calendar.WEDNESDAY;
            case "THURSDAY": return Calendar.THURSDAY;
            case "FRIDAY": return Calendar.FRIDAY;
            case "SATURDAY": return Calendar.SATURDAY;
            default: throw new IllegalArgumentException("Invalid day of the week: " + day);
        }
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

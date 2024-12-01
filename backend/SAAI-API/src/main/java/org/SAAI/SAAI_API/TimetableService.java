package org.SAAI.SAAI_API;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Set;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;


@Service
public class TimetableService {

    @Autowired
    private TokenService tokenService;

    @Value("${users.service.password}")
    private String adminPassword; // Retrieve the password from application.properties

    private final RestTemplate restTemplate = new RestTemplate();


    public void generateTimetablesForWeek() {
        // Calculate the Monday of the current week
        LocalDate today = LocalDate.now();
        LocalDate monday = today.with(java.time.DayOfWeek.MONDAY);

        // Days to process (Monday to Friday)
        List<String> weekDays = List.of("Monday", "Tuesday", "Wednesday", "Thursday", "Friday");

        // Fetch duty groups and user UUID mappings
        List<Map<String, Object>> dutyGroups = fetchDutyGroups();
        Map<String, String> userUuidMap = fetchUserUuidMap();

        // Generate timetables for each day starting from the calculated Monday
        for (int i = 0; i < weekDays.size(); i++) {
            LocalDate currentDay = monday.plusDays(i);
            String dayName = currentDay.getDayOfWeek().toString();

            // Call the timetable generation logic for the specific day with the correct date
            generateTimetableForDay(dutyGroups, userUuidMap, capitalize(dayName.toLowerCase()), currentDay);
        }
    }


    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }


    private List<Map<String, Object>> fetchDutyGroups() {
        String url = "https://saai.wayshare.de:9090/api/dutygroups?password=" + adminPassword;
        return restTemplate.getForObject(url, List.class);
    }

    private Map<String, String> fetchUserUuidMap() {
        String url = "https://saai.wayshare.de:9090/api/users";

        // Prepare the request body with the password
        Map<String, String> body = new HashMap<>();
        body.put("password", adminPassword);

        // Create the HTTP entity with headers and body
        HttpEntity<Map<String, String>> request = new HttpEntity<>(body);

        // Execute the POST request
        ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                request,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
        );

        // Convert the response to a map of username to UUID
        List<Map<String, Object>> users = response.getBody();
        Map<String, String> userUuidMap = new HashMap<>();
        for (Map<String, Object> user : users) {
            // Safely handle mixed types and null values
            String username = user.get("username") != null ? user.get("username").toString() : "Unknown";
            String uuid = user.get("uuid") != null ? user.get("uuid").toString() : "Unknown";

            userUuidMap.put(username, uuid);
        }
        return userUuidMap;
    }

    private void generateTimetableForDay(List<Map<String, Object>> dutyGroups, Map<String, String> userUuidMap, String day, LocalDate date) {
        // Sort duty groups by dutyStart
        dutyGroups.sort(Comparator.comparing(group -> group.get("dutyStart") != null ? group.get("dutyStart").toString() : ""));

        Set<String> usedGroups = new HashSet<>();

        for (Map<String, Object> group : dutyGroups) {
            // Safely extract values from the group
            String dutyStart = group.get("dutyStart") != null ? group.get("dutyStart").toString() : null;
            String dutyEnd = day.equals("Friday") && group.get("fridayDutyEnd") != null
                    ? group.get("fridayDutyEnd").toString()
                    : group.get("dutyEnd") != null ? group.get("dutyEnd").toString() : null;

            List<String> dutyDays = group.get("dutyDays") instanceof List
                    ? (List<String>) group.get("dutyDays")
                    : new ArrayList<>();

            if (!dutyDays.contains(day)) continue; // Skip if this group doesn't handle the current day

            // Prepare user UUIDs for the timetable
            List<String> userUuids = new ArrayList<>();
            for (String userName : (List<String>) group.get("userNames")) {
                if (userUuidMap.containsKey(userName)) {
                    userUuids.add(userUuidMap.get(userName));
                }
            }

            // Ensure we have valid start and end times, and user UUIDs
            if (!userUuids.isEmpty() && dutyStart != null && dutyEnd != null) {
                // Adjust times using the specific date
                String startDateTime = adjustTime(date.atTime(LocalTime.parse(dutyStart)));
                String endDateTime = adjustTime(date.atTime(LocalTime.parse(dutyEnd)));

                // Create timetable event
                createTimetableEvent(startDateTime, endDateTime, userUuids);

                // Reset daysSinceLastDuty for the group
                group.put("daysSinceLastDuty", 0);
                usedGroups.add(group.get("id").toString());
            }
        }

        // Send a message if no groups were used
        if (usedGroups.isEmpty()) {
            sendLiveTickerMessage("No available duty group for " + day);
        }
    }




    private String adjustTime(LocalDateTime dateTime) {
        return dateTime.minusHours(1).format(DateTimeFormatter.ISO_DATE_TIME);
    }

    private void createTimetableEvent(String startDateTime, String endDateTime, List<String> userUuids) {
        String url = "https://sanialarm.de/api/v2/timetable_events/";
        Map<String, Object> body = new HashMap<>();
        body.put("start_datetime", startDateTime);
        body.put("end_datetime", endDateTime);
        body.put("timetable_metadata", Collections.emptyList());
        body.put("responsible_users", userUuids);

        String token = tokenService.getToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        restTemplate.postForObject(url, request, Map.class);
    }

    private void sendLiveTickerMessage(String message) {
        String url = "https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=" + message;
        restTemplate.getForObject(url, Void.class);
    }
}

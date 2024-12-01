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
        // Filter duty groups eligible for the current day
        List<Map<String, Object>> eligibleGroups = new ArrayList<>();
        for (Map<String, Object> group : dutyGroups) {
            List<String> dutyDays = group.get("dutyDays") instanceof List
                    ? (List<String>) group.get("dutyDays")
                    : new ArrayList<>();

            if (dutyDays.contains(day)) {
                eligibleGroups.add(group);
            }
        }

        // If no eligible groups, send a live ticker message and return
        if (eligibleGroups.isEmpty()) {
            sendLiveTickerMessage("No available duty group for " + day);
            return;
        }

        // Find the group with the highest daysSinceLastDuty
        Map<String, Object> selectedGroup = Collections.max(eligibleGroups, Comparator.comparingInt(group ->
                group.get("daysSinceLastDuty") instanceof Integer ? (Integer) group.get("daysSinceLastDuty") : 0
        ));

        // Prepare user UUIDs for the selected group
        List<String> userUuids = new ArrayList<>();
        for (String userName : (List<String>) selectedGroup.get("userNames")) {
            if (userUuidMap.containsKey(userName)) {
                userUuids.add(userUuidMap.get(userName));
            }
        }

        // Ensure the selected group has valid times and users
        String dutyStart = selectedGroup.get("dutyStart") != null ? selectedGroup.get("dutyStart").toString() : null;
        String dutyEnd = day.equals("Friday") && selectedGroup.get("fridayDutyEnd") != null
                ? selectedGroup.get("fridayDutyEnd").toString()
                : selectedGroup.get("dutyEnd") != null ? selectedGroup.get("dutyEnd").toString() : null;

        if (!userUuids.isEmpty() && dutyStart != null && dutyEnd != null) {
            // Adjust times using the specific date
            String startDateTime = adjustTime(date.atTime(LocalTime.parse(dutyStart)));
            String endDateTime = adjustTime(date.atTime(LocalTime.parse(dutyEnd)));

            // Create timetable event
            createTimetableEvent(startDateTime, endDateTime, userUuids);

            // Reset daysSinceLastDuty for the selected group
            selectedGroup.put("daysSinceLastDuty", 0);

            // Update selected group in the database
            updateDutyGroup(selectedGroup);
        }

        // Increment daysSinceLastDuty for other eligible groups and update them in the database
        for (Map<String, Object> group : eligibleGroups) {
            if (group != selectedGroup) {
                int currentDays = group.get("daysSinceLastDuty") instanceof Integer ? (Integer) group.get("daysSinceLastDuty") : 0;
                group.put("daysSinceLastDuty", currentDays + 1);

                // Update group in the database
                updateDutyGroup(group);
            }
        }
    }

    private void updateDutyGroup(Map<String, Object> group) {
        String url = "https://saai.wayshare.de:9090/api/dutygroups/" + group.get("id");
        group.put("password", adminPassword); // Add the password to the payload

        // Create an HTTP entity with the group data
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(group);

        try {
            // Execute the PUT request
            restTemplate.exchange(url, HttpMethod.PUT, request, Void.class);
        } catch (Exception e) {
            System.err.println("Error updating duty group " + group.get("id") + ": " + e.getMessage());
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

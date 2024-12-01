package org.SAAI.SAAI_API;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class TimetableService {

    @Autowired
    private TokenService tokenService;

    private final RestTemplate restTemplate = new RestTemplate();

    public void generateTimetablesForWeek() {
        // Fetch duty groups
        List<Map<String, Object>> dutyGroups = fetchDutyGroups();

        // Fetch user data for UUID mapping
        Map<String, String> userUuidMap = fetchUserUuidMap();

        // Process each day of the week
        for (String day : List.of("Monday", "Tuesday", "Wednesday", "Thursday", "Friday")) {
            generateTimetableForDay(dutyGroups, userUuidMap, day);
        }
    }

    private List<Map<String, Object>> fetchDutyGroups() {
        String url = "https://saai.wayshare.de:9090/dutygroups?password=AdminPassword";
        return restTemplate.getForObject(url, List.class);
    }

    private Map<String, String> fetchUserUuidMap() {
        String url = "https://saai.wayshare.de:9090/api/users";
        List<Map<String, Object>> users = restTemplate.getForObject(url, List.class);
        Map<String, String> userUuidMap = new HashMap<>();
        for (Map<String, Object> user : users) {
            userUuidMap.put((String) user.get("username"), (String) user.get("uuid"));
        }
        return userUuidMap;
    }

    private void generateTimetableForDay(List<Map<String, Object>> dutyGroups, Map<String, String> userUuidMap, String day) {
        // Sort groups by dutyStart
        dutyGroups.sort(Comparator.comparing(group -> (String) group.get("dutyStart")));

        // Track used duty groups
        Set<String> usedGroups = new HashSet<>();

        for (Map<String, Object> group : dutyGroups) {
            String dutyStart = (String) group.get("dutyStart");
            String dutyEnd = day.equals("Friday") && group.get("fridayDutyEnd") != null
                    ? (String) group.get("fridayDutyEnd")
                    : (String) group.get("dutyEnd");
            List<String> dutyDays = (List<String>) group.get("dutyDays");
            int daysSinceLastDuty = (int) group.get("daysSinceLastDuty");

            if (!dutyDays.contains(day)) continue; // Skip if group doesn't handle this day

            // Find eligible users
            List<String> userUuids = new ArrayList<>();
            for (String userName : (List<String>) group.get("userNames")) {
                userUuids.add(userUuidMap.get(userName));
            }

            if (!userUuids.isEmpty()) {
                // Adjust time and create event
                String startDateTime = adjustTime(LocalDate.now().atTime(LocalTime.parse(dutyStart)));
                String endDateTime = adjustTime(LocalDate.now().atTime(LocalTime.parse(dutyEnd)));

                createTimetableEvent(startDateTime, endDateTime, userUuids);
                group.put("daysSinceLastDuty", 0); // Reset indicator
                usedGroups.add((String) group.get("id"));
            }
        }

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

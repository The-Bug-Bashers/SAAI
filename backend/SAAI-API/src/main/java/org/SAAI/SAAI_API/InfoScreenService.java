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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Calendar;
import java.util.TimeZone;
import java.util.Comparator;

@Service
public class InfoScreenService {

    private static final Logger logger = LoggerFactory.getLogger(InfoScreenService.class);

    @Value("${infoscreen.service.url}")
    private String infoScreenUrl;

    @Autowired
    private TokenService tokenService;

    public Map<String, Object> getInfoScreenEvents() {
        String token = tokenService.getToken();
        logger.info("Token obtained: {}", token);

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(infoScreenUrl, HttpMethod.GET, entity, new ParameterizedTypeReference<List<Map<String, Object>>>() {});
        logger.info("Response status code: {}", response.getStatusCode());

        if (!response.getStatusCode().is2xxSuccessful()) {
            logger.error("Failed to retrieve info screen events");
            throw new RuntimeException("Failed to retrieve info screen events");
        }

        return generateResponse(response.getBody());
    }

    private String stripFractionalSeconds(String dateTimeStr) {
        if (dateTimeStr != null && dateTimeStr.contains(".")) {
            return dateTimeStr.substring(0, dateTimeStr.indexOf('.')) + dateTimeStr.substring(dateTimeStr.indexOf('+'));
        }
        return dateTimeStr;
    }
	
    private Map<String, Object> generateResponse(List<Map<String, Object>> events) {
        List<Map<String, Object>> todayEvents = filterEvents(events);
        Map<String, Object> response = new HashMap<>();

        String nextActive = getNextActiveStatus(events);
        response.put("next_active", nextActive);
        response.put("events", todayEvents);

        logger.info("Generated response: {}", response);
        return response;
    }

    private List<Map<String, Object>> filterEvents(List<Map<String, Object>> events) {
        List<Map<String, Object>> todayEvents = new ArrayList<>();
        Calendar todayStartCalendar = Calendar.getInstance();
        todayStartCalendar.set(Calendar.HOUR_OF_DAY, 0);
        todayStartCalendar.set(Calendar.MINUTE, 0);
        todayStartCalendar.set(Calendar.SECOND, 0);
        Date todayStart = todayStartCalendar.getTime();

        Calendar todayEndCalendar = Calendar.getInstance();
        todayEndCalendar.set(Calendar.HOUR_OF_DAY, 23);
        todayEndCalendar.set(Calendar.MINUTE, 59);
        todayEndCalendar.set(Calendar.SECOND, 59);
        Date todayEnd = todayEndCalendar.getTime();

        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssX");
        dateFormat.setTimeZone(TimeZone.getTimeZone("UTC")); // parse dates in UTC
        SimpleDateFormat localDateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssX");
        localDateFormat.setTimeZone(TimeZone.getTimeZone("Europe/Berlin")); // convert dates to local time

        Date now = new Date();

        for (Map<String, Object> event : events) {
            String startDatetimeStr = stripFractionalSeconds((String) event.get("start_datetime"));
            String endDatetimeStr = stripFractionalSeconds((String) event.get("end_datetime"));

            if (startDatetimeStr == null || endDatetimeStr == null) {
                logger.error("Event with null start_datetime or end_datetime: {}", event);
                continue;
            }

            try {
                Date startDateTime = localDateFormat.parse(dateFormat.format(dateFormat.parse(startDatetimeStr)));
                Date endDateTime = localDateFormat.parse(dateFormat.format(dateFormat.parse(endDatetimeStr)));

                boolean isRepeating = event.containsKey("event_metadata") && !((List<Map<String, Object>>) event.get("event_metadata")).isEmpty();
                boolean isTodayEvent = startDateTime.before(todayEnd) && endDateTime.after(todayStart);

                if (isTodayEvent || (isRepeating && isTodayRepeatingEvent((List<Map<String, Object>>) event.get("event_metadata")))) {
                    todayEvents.add(event);
                    logger.info("Added event: {}", event);
                }
            } catch (Exception e) {
                logger.error("Error parsing event dates", e);
            }
        }

        List<Map<String, Object>> formattedEvents = new ArrayList<>();
        for (Map<String, Object> event : todayEvents) {
            List<String> responsibleUsers = extractParamedics((List<Map<String, Object>>) event.get("responsible_users"));
            if (!responsibleUsers.isEmpty()) {
                Map<String, Object> formattedEvent = new HashMap<>();
                formattedEvent.put("start_time", formatTime(stripFractionalSeconds((String) event.get("start_datetime"))));
                formattedEvent.put("end_time", formatTime(stripFractionalSeconds((String) event.get("end_datetime"))));
                formattedEvent.put("responsible_users", responsibleUsers);
                formattedEvent.put("is_active", isActiveEvent(stripFractionalSeconds((String) event.get("start_datetime")), stripFractionalSeconds((String) event.get("end_datetime")), now));
                formattedEvents.add(formattedEvent);
                logger.info("Formatted event: {}", formattedEvent);
            }
        }

        formattedEvents.sort(Comparator.comparing(e -> (String) e.get("start_time")));

        return formattedEvents;
    }

    private String getNextActiveStatus(List<Map<String, Object>> events) {
        Date now = new Date();

        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssX");
        dateFormat.setTimeZone(TimeZone.getTimeZone("UTC")); // parse dates in UTC
        SimpleDateFormat localDateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssX");
        localDateFormat.setTimeZone(TimeZone.getTimeZone("Europe/Berlin")); // convert dates to local time

        Date nextEventStartTime = null;
        String nextActive = "Not Today anymore";

        for (Map<String, Object> event : events) {
            String startDateTimeStr = stripFractionalSeconds((String) event.get("start_datetime"));
            String endDateTimeStr = stripFractionalSeconds((String) event.get("end_datetime"));

            if (startDateTimeStr == null || endDateTimeStr == null) {
                logger.warn("Event with null start_datetime or end_datetime: {}", event);
                continue; // Skip this event
            }

            try {
                Date startDateTime = localDateFormat.parse(dateFormat.format(dateFormat.parse(startDateTimeStr)));
                Date endDateTime = localDateFormat.parse(dateFormat.format(dateFormat.parse(endDateTimeStr)));

                if (now.after(startDateTime) && now.before(endDateTime)) {
                    logger.info("Currently active event found: {}", event);
                    return "Now";
                }

                if (now.before(startDateTime)) {
                    if (nextEventStartTime == null || startDateTime.before(nextEventStartTime)) {
                        nextEventStartTime = startDateTime;
                        logger.info("Next upcoming event found: {}", event);
                    }
                }
            } catch (Exception e) {
                logger.error("Error parsing event dates", e);
            }
        }

        if (nextEventStartTime != null) {
            long diffInMillis = nextEventStartTime.getTime() - now.getTime();
            long hours = diffInMillis / (1000 * 60 * 60);
            long minutes = (diffInMillis / (1000 * 60)) % 60;
            nextActive = hours + "h, " + minutes + "min";
            logger.info("Next active event in: {}", nextActive);
        } else {
            logger.info("No more events for today");
        }

        return nextActive;
    }

    private boolean isTodayRepeatingEvent(List<Map<String, Object>> eventMetadata) {
        Calendar today = Calendar.getInstance();
        int todayDayOfWeek = today.get(Calendar.DAY_OF_WEEK);

        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");

        for (Map<String, Object> metadata : eventMetadata) {
            String repeatWeekday = (String) metadata.get("repeat_weekday");
            String repeatStartStr = (String) metadata.get("repeat_start");
            String repeatEndStr = (String) metadata.get("repeat_end");

            try {
                Date repeatStart = repeatStartStr != null ? dateFormat.parse(repeatStartStr) : null;
                Date repeatEnd = repeatEndStr != null ? dateFormat.parse(repeatEndStr) : null;

                if (repeatStart != null && repeatStart.after(today.getTime())) {
                    continue;
                }

                if (repeatEnd != null && repeatEnd.before(today.getTime())) {
                    continue;
                }

                if (repeatWeekday != null && getDayOfWeek(repeatWeekday) == todayDayOfWeek) {
                    return true;
                }
            } catch (Exception e) {
                logger.error("Error parsing repeat event dates", e);
            }
        }
        return false;
    }

    private int getDayOfWeek(String day) {
        return switch (day.toUpperCase()) {
            case "SUNDAY" -> Calendar.SUNDAY;
            case "MONDAY" -> Calendar.MONDAY;
            case "TUESDAY" -> Calendar.TUESDAY;
            case "WEDNESDAY" -> Calendar.WEDNESDAY;
            case "THURSDAY" -> Calendar.THURSDAY;
            case "FRIDAY" -> Calendar.FRIDAY;
            case "SATURDAY" -> Calendar.SATURDAY;
            default -> throw new IllegalArgumentException("Invalid day of the week: " + day);
        };
    }

    private String formatTime(String dateTimeStr) {
        try {
            SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssX");
            inputFormat.setTimeZone(TimeZone.getTimeZone("UTC")); // parse dates in UTC
            SimpleDateFormat outputFormat = new SimpleDateFormat("HH:mm");
            outputFormat.setTimeZone(TimeZone.getTimeZone("Europe/Berlin")); // convert dates to local time
            Date dateTime = inputFormat.parse(dateTimeStr);
            return outputFormat.format(dateTime);
        } catch (Exception e) {
            logger.error("Error formatting time", e);
            return "";
        }
    }

    private boolean isActiveEvent(String startDateTimeStr, String endDateTimeStr, Date now) {
        try {
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssX");
            dateFormat.setTimeZone(TimeZone.getTimeZone("UTC")); // parse dates in UTC
            SimpleDateFormat localDateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssX");
            localDateFormat.setTimeZone(TimeZone.getTimeZone("Europe/Berlin")); // convert dates to local time
            Date startDateTime = localDateFormat.parse(dateFormat.format(dateFormat.parse(startDateTimeStr)));
            Date endDateTime = localDateFormat.parse(dateFormat.format(dateFormat.parse(endDateTimeStr)));
            boolean isActive = now.after(startDateTime) && now.before(endDateTime);
            logger.info("Event {} is active: {}", startDateTimeStr, isActive);
            return isActive;
        } catch (Exception e) {
            logger.error("Error parsing active event dates", e);
            return false;
        }
    }

    private List<String> extractParamedics(List<Map<String, Object>> users) {
        List<String> paramedics = new ArrayList<>();
        if (users != null) {
            for (Map<String, Object> user : users) {
                paramedics.add((String) user.get("username"));
            }
        }
        return paramedics;
    }
}

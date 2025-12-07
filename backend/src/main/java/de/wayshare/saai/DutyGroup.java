package de.wayshare.saai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class DutyGroup {

    // ObjectMapper for JSON serialization/deserialization
    private static final ObjectMapper objectMapper = new ObjectMapper();
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Lob
    private String userNamesJson;  // JSON representation of user names in the group
    private Integer daysSinceLastDuty;  // Days since the last duty day
    @Lob
    private String dutyDaysJson;  // JSON representation of days of the week for duty
    private LocalTime dutyStart;  // Start time of the duty
    private LocalTime dutyEnd;    // End time of the duty
    private LocalTime fridayDutyEnd; // Optional end time specifically for Fridays

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public List<String> getUserNames() {
        try {
            return objectMapper.readValue(userNamesJson, List.class);
        } catch (JsonProcessingException e) {
            return new ArrayList<>();
        }
    }

    public void setUserNames(List<String> userNames) {
        try {
            this.userNamesJson = objectMapper.writeValueAsString(userNames);
        } catch (JsonProcessingException e) {
            this.userNamesJson = "[]";
        }
    }

    public Integer getDaysSinceLastDuty() {
        return daysSinceLastDuty;
    }

    public void setDaysSinceLastDuty(Integer daysSinceLastDuty) {
        this.daysSinceLastDuty = daysSinceLastDuty;
    }

    public List<String> getDutyDays() {
        try {
            return objectMapper.readValue(dutyDaysJson, List.class);
        } catch (JsonProcessingException e) {
            return new ArrayList<>();
        }
    }

    public void setDutyDays(List<String> dutyDays) {
        try {
            this.dutyDaysJson = objectMapper.writeValueAsString(dutyDays);
        } catch (JsonProcessingException e) {
            this.dutyDaysJson = "[]";
        }
    }

    public LocalTime getDutyStart() {
        return dutyStart;
    }

    public void setDutyStart(LocalTime dutyStart) {
        this.dutyStart = dutyStart;
    }

    public LocalTime getDutyEnd() {
        return dutyEnd;
    }

    public void setDutyEnd(LocalTime dutyEnd) {
        this.dutyEnd = dutyEnd;
    }

    public LocalTime getFridayDutyEnd() {
        return fridayDutyEnd;
    }

    public void setFridayDutyEnd(LocalTime fridayDutyEnd) {
        this.fridayDutyEnd = fridayDutyEnd;
    }
}

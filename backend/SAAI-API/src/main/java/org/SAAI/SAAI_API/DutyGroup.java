package org.SAAI.SAAI_API;

import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.util.List;

@Entity
public class DutyGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ElementCollection
    private List<String> userNames;  // List of user names in the group

    private Integer daysSinceLastDuty;  // Days since the last duty day

    @ElementCollection
    private List<String> dutyDays;  // Days of the week available for duty (e.g., Monday, Tuesday)

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public List<String> getUserNames() {
        return userNames;
    }

    public void setUserNames(List<String> userNames) {
        this.userNames = userNames;
    }

    public Integer getDaysSinceLastDuty() {
        return daysSinceLastDuty;
    }

    public void setDaysSinceLastDuty(Integer daysSinceLastDuty) {
        this.daysSinceLastDuty = daysSinceLastDuty;
    }

    public List<String> getDutyDays() {
        return dutyDays;
    }

    public void setDutyDays(List<String> dutyDays) {
        this.dutyDays = dutyDays;
    }
}

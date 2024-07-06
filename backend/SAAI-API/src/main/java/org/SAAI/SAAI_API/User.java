package org.SAAI.SAAI_API;

import javax.persistence.Entity;
import javax.persistence.Id;
import java.persistence.Column;

@Entity
public class User {

    @Id
    private String username;

    @Column(nullable = false, columnDefinition = "varchar(255) default 'new'")
    private String experience = "new";

    // Getters and Setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getExperience() {
        return experience;
    }

    public void setExperience(String experience) {
        this.experience = experience;
    }
}

package de.wayshare.saai;

import jakarta.persistence.Cacheable;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
@Cacheable(false)
public class Message {
    @Id
    private String id = "current"; // Singleton approach, only one message

    private String content = "No message"; // Default message
    private int stage = 0; // 0 = no message, 1, 2, or 3 for message stages

    // Getters and Setters
    public String getId() {
        return id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public int getStage() {
        return stage;
    }

    public void setStage(int stage) {
        this.stage = stage;
    }
}

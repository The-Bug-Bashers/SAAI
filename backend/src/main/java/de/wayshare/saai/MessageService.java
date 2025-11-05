package de.wayshare.saai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MessageService {

    private static final Logger logger = LoggerFactory.getLogger(MessageService.class);

    @Value("${users.service.password}")
    private String expectedPassword;

    @Autowired
    private MessageRepository messageRepository;

    // Fetch the current message
    public Message getMessage() {
        return messageRepository.findById("current").orElse(new Message());
    }

    @Transactional
    public void updateMessage(String content, int stage, String password) {
        if (password == null || !password.equals(expectedPassword)) {
            logger.error("Incorrect password");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect password");
        }

        if (stage < 0 || stage > 3) {
            logger.error("Invalid stage");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stage must be between 0 and 3");
        }

        Message message = messageRepository.findById("current").orElse(new Message());
        message.setContent(content);
        message.setStage(stage);
        messageRepository.save(message);

        logger.info("Message updated: content={}, stage={}", content, stage);
    }
}

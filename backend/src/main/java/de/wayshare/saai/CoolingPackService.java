package de.wayshare.saai;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CoolingPackService {

    @Value("${coolingpacks.service.password}")
    private String coolingPacksPassword;

    @Value("${users.service.password}")
    private String usersPassword;

    @Autowired
    private CoolingPackRepository coolingPackRepository;

    private void validateCoolingPacksPassword(String password) {
        if (password == null || password.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password not provided");
        }
        if (!coolingPacksPassword.equals(password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect password for cooling packs");
        }
    }

    private void validateUsersPassword(String password) {
        if (password == null || password.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password not provided");
        }
        if (!usersPassword.equals(password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect password for users");
        }
    }

    private void validateAnyPassword(String password) {
        if (password == null || password.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password not provided");
        }
        if (!coolingPacksPassword.equals(password) && !usersPassword.equals(password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect password");
        }
    }

    @Transactional
    public CoolingPack addCoolingPack(String name, Integer maxLendingDuration, String password) {
        validateUsersPassword(password);  // POST requires users.service.password

        CoolingPack coolingPack = new CoolingPack();
        coolingPack.setName(name);
        coolingPack.setBorrowed(false);
        coolingPack.setMaxLendingDuration(maxLendingDuration);

        return coolingPackRepository.save(coolingPack);
    }


    @Transactional
    public CoolingPack updateCoolingPackStatus(
            Long id, boolean borrowed, String givenBy, String borrowedBy, Integer maxLendingDuration, String password) {
        validateCoolingPacksPassword(password);  // PUT requires coolingpacks.service.password

        CoolingPack coolingPack = coolingPackRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cooling pack not found"));

        coolingPack.setBorrowed(borrowed);
        coolingPack.setGivenBy(givenBy);
        coolingPack.setBorrowedBy(borrowedBy);
        coolingPack.setBorrowedDate(borrowed ? LocalDate.now() : null);

        if (maxLendingDuration != null) {
            coolingPack.setMaxLendingDuration(maxLendingDuration);
        }

        return coolingPackRepository.save(coolingPack);
    }


    @Transactional
    public void deleteCoolingPack(Long id, String password) {
        validateUsersPassword(password);  // DELETE requires users.service.password
        if (!coolingPackRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cooling pack not found");
        }
        coolingPackRepository.deleteById(id);
    }

    public List<CoolingPack> getAllCoolingPacks(String password) {
        validateAnyPassword(password);  // GET accepts either password
        return coolingPackRepository.findAll();
    }

    public void notifyOverdueItems(String coolingPacksPassword, String usersPassword) {
        // Step 1: Fetch all cooling packs
        String coolingPacksUrl = "https://saai.wayshare.de:9090/api/coolingpacks?password=" + coolingPacksPassword;
        RestTemplate restTemplate = new RestTemplate();
        List<Map<String, Object>> coolingPacks = restTemplate.getForObject(coolingPacksUrl, List.class);

        // Step 2: Fetch all users with their telephone numbers
        String usersUrl = "https://saai.wayshare.de:9090/api/users";
        Map<String, String> userRequestBody = new HashMap<>();
        userRequestBody.put("password", usersPassword);
        HttpEntity<Map<String, String>> userRequestEntity = new HttpEntity<>(userRequestBody);

        ResponseEntity<List<Map<String, Object>>> usersResponse = restTemplate.exchange(
                usersUrl,
                HttpMethod.POST,
                userRequestEntity,
                new ParameterizedTypeReference<>() {
                }
        );
        List<Map<String, Object>> users = usersResponse.getBody();

        // Map usernames to telephone numbers
        Map<String, String> userTelephoneMap = new HashMap<>();
        for (Map<String, Object> user : users) {
            String username = (String) user.get("username");
            String telephoneNumber = (String) user.get("telephoneNumber");
            if (telephoneNumber != null && !telephoneNumber.equals("none")) {
                userTelephoneMap.put(username, telephoneNumber);
            }
        }

        // Step 3: Check for overdue items and notify paramedics
        LocalDate today = LocalDate.now();
        for (Map<String, Object> pack : coolingPacks) {
            Boolean isBorrowed = (Boolean) pack.get("borrowed");
            if (isBorrowed != null && isBorrowed) {
                String givenBy = (String) pack.get("givenBy");
                LocalDate borrowedDate = LocalDate.parse((String) pack.get("borrowedDate"));
                Integer maxLendingDuration = (Integer) pack.get("maxLendingDuration");

                if (maxLendingDuration != null && borrowedDate.plusDays(maxLendingDuration).isBefore(today)) {
                    // Prepare the message
                    String itemName = (String) pack.get("name");
                    String borrower = (String) pack.get("borrowedBy");
                    String message = String.format(
                            "Der gegenstand: %s den du an %s verliehen hast, wurde innerhalb des erlaubten Zeitraums, der %d tage beträgt nicht zurückgegeben. Bitte kümmere dich darum, das er schnellstmöglich zurückgegeben wird.",
                            itemName, borrower, maxLendingDuration
                    );

                    // Fetch the telephone number of the paramedic
                    String telephoneNumber = userTelephoneMap.get(givenBy);
                    if (telephoneNumber != null) {
                        sendNotificationMessage(telephoneNumber, message);
                    }

                    // Log live ticker message
                    String liveTickerMessage = String.format("Overdue item notification sent for '%s' lent by '%s'.", itemName, givenBy);
                    sendLiveTickerMessage(liveTickerMessage);
                }
            }
        }
    }

    private void sendNotificationMessage(String telephoneNumber, String message) {
        String url = "https://saai.wayshare.de:9090/api/signalmessage";
        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("telephoneNumber", telephoneNumber);
        requestBody.put("message", message);
        requestBody.put("password", usersPassword);

        RestTemplate restTemplate = new RestTemplate();
        HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(requestBody);

        try {
            restTemplate.postForObject(url, requestEntity, Void.class);
        } catch (Exception e) {
            System.err.println("Error sending notification message: " + e.getMessage());
        }
    }

    private void sendLiveTickerMessage(String message) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=" + message;
        try {
            restTemplate.getForObject(url, Void.class);
        } catch (Exception e) {
            System.err.println("Error sending live ticker message: " + e.getMessage());
        }
    }
}

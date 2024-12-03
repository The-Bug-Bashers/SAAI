package org.SAAI.SAAI_API;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

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
}

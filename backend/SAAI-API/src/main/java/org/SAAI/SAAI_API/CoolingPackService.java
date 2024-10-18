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
    private String expectedPassword;

    @Autowired
    private CoolingPackRepository coolingPackRepository;

    private void validatePassword(String password) {
        if (password == null || password.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password not provided");
        }
        if (!expectedPassword.equals(password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect password");
        }
    }

    @Transactional
    public CoolingPack addCoolingPack(String name, String password) {
        validatePassword(password);
        CoolingPack coolingPack = new CoolingPack();
        coolingPack.setName(name);
        coolingPack.setBorrowed(false); // Initially not borrowed
        return coolingPackRepository.save(coolingPack);
    }

    @Transactional
    public CoolingPack updateCoolingPackStatus(Long id, boolean borrowed, String givenBy, String borrowedBy, String password) {
        validatePassword(password);
        CoolingPack coolingPack = coolingPackRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cooling pack not found"));
        coolingPack.setBorrowed(borrowed);
        coolingPack.setGivenBy(givenBy);
        coolingPack.setBorrowedBy(borrowedBy);
        coolingPack.setBorrowedDate(borrowed ? LocalDate.now() : null); // Set date only if borrowed
        return coolingPackRepository.save(coolingPack);
    }

    @Transactional
    public void deleteCoolingPack(Long id, String password) {
        validatePassword(password);
        if (!coolingPackRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cooling pack not found");
        }
        coolingPackRepository.deleteById(id);
    }

    public List<CoolingPack> getAllCoolingPacks(String password) {
        validatePassword(password);
        return coolingPackRepository.findAll();
    }
}

package de.wayshare.saai;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DutyGroupService {

  @Autowired private DutyGroupRepository dutyGroupRepository;

  @Value("${users.service.password}")
  private String adminPassword;

  private void checkAdminPassword(String password) {
    if (!adminPassword.equals(password)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid admin password");
    }
  }

  public List<DutyGroup> getAllDutyGroups(String password) {
    checkAdminPassword(password);
    return dutyGroupRepository.findAll();
  }

  public DutyGroup getDutyGroupById(Long id, String password) {
    checkAdminPassword(password);
    return dutyGroupRepository
        .findById(id)
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Duty group not found"));
  }

  @Transactional
  public DutyGroup addDutyGroup(DutyGroup dutyGroup, String password) {
    checkAdminPassword(password);
    return dutyGroupRepository.save(dutyGroup);
  }

  @Transactional
  public DutyGroup updateDutyGroup(Long id, DutyGroup updatedDutyGroup, String password) {
    checkAdminPassword(password);
    DutyGroup dutyGroup =
        dutyGroupRepository
            .findById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Duty group not found"));

    dutyGroup.setUserNames(updatedDutyGroup.getUserNames());
    dutyGroup.setDaysSinceLastDuty(updatedDutyGroup.getDaysSinceLastDuty());
    dutyGroup.setDutyDays(updatedDutyGroup.getDutyDays());

    return dutyGroupRepository.save(dutyGroup);
  }

  @Transactional
  public void deleteDutyGroup(Long id, String password) {
    checkAdminPassword(password);
    if (!dutyGroupRepository.existsById(id)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Duty group not found");
    }
    dutyGroupRepository.deleteById(id);
  }
}

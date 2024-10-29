package org.SAAI.SAAI_API;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;


import java.util.List;

@Service
public class DutyGroupService {

    @Autowired
    private DutyGroupRepository dutyGroupRepository;

    public List<DutyGroup> getAllDutyGroups() {
        return dutyGroupRepository.findAll();
    }

    public DutyGroup getDutyGroupById(Long id) {
        return dutyGroupRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Duty group not found"));
    }

    @Transactional
    public DutyGroup addDutyGroup(DutyGroup dutyGroup) {
        return dutyGroupRepository.save(dutyGroup);
    }

    @Transactional
    public DutyGroup updateDutyGroup(Long id, DutyGroup updatedDutyGroup) {
        DutyGroup dutyGroup = dutyGroupRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Duty group not found"));

        dutyGroup.setUserNames(updatedDutyGroup.getUserNames());
        dutyGroup.setDaysSinceLastDuty(updatedDutyGroup.getDaysSinceLastDuty());
        dutyGroup.setDutyDays(updatedDutyGroup.getDutyDays());

        return dutyGroupRepository.save(dutyGroup);
    }

    @Transactional
    public void deleteDutyGroup(Long id) {
        if (!dutyGroupRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Duty group not found");
        }
        dutyGroupRepository.deleteById(id);
    }
}

package btpoop.registration.controller;

import btpoop.registration.model.Registration;
import btpoop.registration.repository.RegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/registrations")
@RequiredArgsConstructor
public class RegistrationController {

    private final RegistrationRepository registrationRepository;

    @GetMapping
    public ResponseEntity<List<Registration>> getAllRegistrations() {
        return ResponseEntity.ok(registrationRepository.findAll());
    }
}

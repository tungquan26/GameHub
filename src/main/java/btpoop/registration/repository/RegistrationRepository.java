package btpoop.registration.repository;

import btpoop.registration.model.Registration;
import btpoop.tournament.model.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    long countByTournament(Tournament tournament);
}

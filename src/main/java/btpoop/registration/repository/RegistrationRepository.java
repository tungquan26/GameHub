package btpoop.registration.repository;

import btpoop.enums.RegistrationStatus;
import btpoop.registration.model.Registration;
import btpoop.tournament.model.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    List<Registration> findByTournamentOrderByRegistrationIdAsc(Tournament tournament);
    List<Registration> findByTournament_TournamentIdAndStatus(Long tournamentId, RegistrationStatus status);
}

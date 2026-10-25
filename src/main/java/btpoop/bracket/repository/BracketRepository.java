package btpoop.bracket.repository;

import btpoop.bracket.model.Bracket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BracketRepository extends JpaRepository<Bracket, Long> {
    Optional<Bracket> findByTournament_TournamentId(Long tournamentId);
}

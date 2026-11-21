package btpoop.tournament.repository;

import btpoop.tournament.model.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    @Query(value = "select * from tournaments where tournament_id = :id for update", nativeQuery = true)
    Optional<Tournament> findByIdForUpdate(long id);
}

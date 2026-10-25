package btpoop.ranking.repository;

import btpoop.ranking.model.PlayerRanking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerRankingRepository extends JpaRepository<PlayerRanking, Long> {
    List<PlayerRanking> findAllByOrderByCurrentRankAsc();
    List<PlayerRanking> findByTournament_TournamentIdOrderByCurrentRankAsc(Long tournamentId);
    Optional<PlayerRanking> findByPlayer_UserIdAndTournament_TournamentId(Long playerId, Long tournamentId);
    Optional<PlayerRanking> findByPlayer_UserIdAndTournamentIsNull(Long playerId);
}

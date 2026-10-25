package btpoop.ranking.repository;

import btpoop.ranking.model.TeamRanking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRankingRepository extends JpaRepository<TeamRanking, Long> {
    List<TeamRanking> findAllByOrderByCurrentRankAsc();
    List<TeamRanking> findByTournament_TournamentIdOrderByCurrentRankAsc(Long tournamentId);
    Optional<TeamRanking> findByTeam_TeamIdAndTournament_TournamentId(Long teamId, Long tournamentId);
    Optional<TeamRanking> findByTeam_TeamIdAndTournamentIsNull(Long teamId);
}

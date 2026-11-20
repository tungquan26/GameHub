package btpoop.ranking.repository;

import btpoop.ranking.model.TeamRanking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRankingRepository extends JpaRepository<TeamRanking, Long> {
    List<TeamRanking> findByTournamentIsNullOrderByCurrentRankAsc();
    List<TeamRanking> findByTournament_TournamentIdOrderByCurrentRankAsc(Long tournamentId);
}

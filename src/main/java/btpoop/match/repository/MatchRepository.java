package btpoop.match.repository;

import btpoop.match.model.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByScheduledTimeBetweenAndNotified1WeekFalse(LocalDateTime start, LocalDateTime end);
    List<Match> findByScheduledTimeBetweenAndNotified1DayFalse(LocalDateTime start, LocalDateTime end);
    List<Match> findByScheduledTimeBetweenAndNotified1HourFalse(LocalDateTime start, LocalDateTime end);
    List<Match> findByTournament_TournamentIdOrderByRound_RoundNumberAscMatchOrderAsc(Long tournamentId);
}

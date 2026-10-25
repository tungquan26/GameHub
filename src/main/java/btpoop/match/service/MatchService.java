package btpoop.match.service;

import btpoop.match.model.Match;
import btpoop.team.model.Team;
import java.time.LocalDateTime;
import java.util.List;

public interface MatchService {
    Match scheduleMatch(Long matchId, Team teamA, Team teamB, LocalDateTime time);
    Match scheduleMatch(Long matchId, LocalDateTime time, String location);
    Match updateMatchResult(Long matchId, int scoreA, int scoreB);
    Match getMatchById(Long matchId);
    List<Match> getMatchesByTournamentId(Long tournamentId);
}

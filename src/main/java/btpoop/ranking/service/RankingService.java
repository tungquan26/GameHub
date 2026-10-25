package btpoop.ranking.service;

import btpoop.ranking.model.PlayerRanking;
import btpoop.ranking.model.TeamRanking;
import java.util.List;

public interface RankingService {
    List<PlayerRanking> getPlayerRankings(Long tournamentId);
    List<TeamRanking> getTeamRankings(Long tournamentId);
    List<PlayerRanking> rankPlayers(List<PlayerRanking> players);
    List<TeamRanking> rankTeams(List<TeamRanking> teams);
    void updateRankingsAndStatsAfterMatch(Long matchId);
}

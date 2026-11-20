package btpoop.ranking.service;

import btpoop.ranking.model.PlayerRanking;
import btpoop.ranking.model.TeamRanking;
import btpoop.tournament.model.Tournament;
import java.util.List;

public interface RankingService {
    List<PlayerRanking> getPlayerRankings(Long tournamentId);
    List<TeamRanking> getTeamRankings(Long tournamentId);
    List<PlayerRanking> rankPlayers(List<PlayerRanking> players);
    List<TeamRanking> rankTeams(List<TeamRanking> teams);
    void rebuildTeamRankings(Tournament tournament);
    void updateRankingsAndStatsAfterMatch(Long matchId);
}

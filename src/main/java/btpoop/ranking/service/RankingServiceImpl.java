package btpoop.ranking.service;

import btpoop.enums.MatchStatus;
import btpoop.match.model.Match;
import btpoop.match.model.MatchFinishedEvent;
import btpoop.match.model.MatchResult;
import btpoop.match.repository.MatchRepository;
import btpoop.ranking.model.PlayerRanking;
import btpoop.ranking.model.TeamRanking;
import btpoop.ranking.repository.PlayerRankingRepository;
import btpoop.ranking.repository.TeamRankingRepository;
import btpoop.statistics.model.PlayerStats;
import btpoop.statistics.repository.PlayerStatsRepository;
import btpoop.team.model.Team;
import btpoop.team.model.TeamMember;
import btpoop.tournament.model.Tournament;
import btpoop.user.model.Player;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RankingServiceImpl implements RankingService {

    private final PlayerRankingRepository playerRankingRepository;
    private final TeamRankingRepository teamRankingRepository;
    private final PlayerStatsRepository playerStatsRepository;
    private final MatchRepository matchRepository;
    @Override
    @Transactional(readOnly = true)
    public List<PlayerRanking> getPlayerRankings(Long tournamentId) {
        return tournamentId == null ? playerRankingRepository.findByTournamentIsNullOrderByCurrentRankAsc()
                : playerRankingRepository.findByTournament_TournamentIdOrderByCurrentRankAsc(tournamentId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeamRanking> getTeamRankings(Long tournamentId) {
        return tournamentId == null ? teamRankingRepository.findByTournamentIsNullOrderByCurrentRankAsc()
                : teamRankingRepository.findByTournament_TournamentIdOrderByCurrentRankAsc(tournamentId);
    }

    @Override
    public List<PlayerRanking> rankPlayers(List<PlayerRanking> players) {
        Collections.sort(players);
        for (int i = 0; i < players.size(); i++) {
            players.get(i).setCurrentRank(i + 1);
        }
        return players;
    }

    @Override
    public List<TeamRanking> rankTeams(List<TeamRanking> teams) {
        teams.sort(Comparator.<TeamRanking>naturalOrder().thenComparingLong(row -> row.getTeam().getTeamId()));
        for (int i = 0; i < teams.size(); i++) {
            teams.get(i).setCurrentRank(i + 1);
        }
        return teams;
    }

    @Override
    @Transactional
    public void rebuildTeamRankings(Tournament tournament) {
        long tournamentId = tournament.getTournamentId();
        var previous = teamRankingRepository.findByTournament_TournamentIdOrderByCurrentRankAsc(tournamentId);
        Map<Long, TeamRanking> previousByTeam = new HashMap<>();
        for (var row : previous) {
            previousByTeam.putIfAbsent(row.getTeam().getTeamId(), row);
        }
        Map<Long, TeamRanking> standings = new LinkedHashMap<>();
        for (var match : matchRepository.findByTournament_TournamentIdOrderByRound_RoundNumberAscMatchOrderAsc(tournamentId)) {
            var result = match.getResult();
            if (match.getStatus() != MatchStatus.COMPLETED || result == null
                    || match.getTeamA() == null || match.getTeamB() == null) continue;
            var a = match.getTeamA();
            var b = match.getTeamB();
            var winner = result.getWinner();
            var draw = result.getScoreA() == result.getScoreB();
            updateTeamStanding(standings, previousByTeam, tournament, a, winner, result.getScoreA(), result.getScoreB(), draw);
            updateTeamStanding(standings, previousByTeam, tournament, b, winner, result.getScoreB(), result.getScoreA(), draw);
        }
        teamRankingRepository.deleteAll(previous.stream()
                .filter(row -> standings.get(row.getTeam().getTeamId()) != row).toList());
        teamRankingRepository.saveAll(rankTeams(new ArrayList<>(standings.values())));
    }

    private void updateTeamStanding(Map<Long, TeamRanking> standings, Map<Long, TeamRanking> previous,
                                    Tournament tournament, Team team, Team winner, int scored, int conceded, boolean draw) {
        var standing = standings.computeIfAbsent(team.getTeamId(), id -> {
            var row = previous.get(id);
            if (row == null) return new TeamRanking(team, tournament);
            row.resetStats();
            return row;
        });
        standing.updateStats(scored, conceded, winner != null && winner.getTeamId() == team.getTeamId(), draw);
    }

    /**
     * 🌟 TỰ ĐỘNG ĐỒNG BỘ THỐNG KÊ VÀ XẾP HẠNG KHI TRẬN ĐẤU KẾT THÚC
     */
    @EventListener
    @Transactional
    public void handleMatchFinishedEvent(MatchFinishedEvent event) {
        if (event == null || event.getMatchId() == null) return;
        updateRankingsAndStatsAfterMatch(event.getMatchId());
    }

    @Override
    @Transactional
    public void updateRankingsAndStatsAfterMatch(Long matchId) {
        Match match = matchRepository.findById(matchId).orElse(null);
        if (match == null || match.getTeamA() == null || match.getTeamB() == null || match.getResult() == null) {
            return;
        }

        Team teamA = match.getTeamA();
        Team teamB = match.getTeamB();
        MatchResult result = match.getResult();
        Tournament tournament = match.getTournament();

        boolean aWins = (result.getWinner() != null && result.getWinner().getTeamId() == teamA.getTeamId());
        boolean bWins = (result.getWinner() != null && result.getWinner().getTeamId() == teamB.getTeamId());
        rebuildTeamRankings(tournament);

        // 4. Tính Elo trung bình giữa 2 team để cập nhật Elo công bằng
        double avgEloA = calculateAverageElo(teamA);
        double avgEloB = calculateAverageElo(teamB);

        // 5. Cập nhật PlayerStats & PlayerRanking cho thành viên Team A và Team B
        updatePlayersForTeam(teamA, aWins, avgEloB, tournament);
        updatePlayersForTeam(teamB, bWins, avgEloA, tournament);
    }

    private double calculateAverageElo(Team team) {
        if (team == null || team.getMembers() == null || team.getMembers().isEmpty()) {
            return 1200.0;
        }
        double totalElo = 0.0;
        int count = 0;
        for (TeamMember member : team.getMembers()) {
            if (member.getPlayer() != null && member.getPlayer().getStats() != null) {
                totalElo += member.getPlayer().getStats().getEloScore();
                count++;
            }
        }
        return count == 0 ? 1200.0 : (totalElo / count);
    }

    private void updatePlayersForTeam(Team team, boolean isWinner, double opponentElo, Tournament tournament) {
        if (team == null || team.getMembers() == null) return;
        Long tourneyId = (tournament != null) ? tournament.getTournamentId() : null;

        for (TeamMember member : team.getMembers()) {
            Player player = member.getPlayer();
            if (player == null) continue;

            PlayerStats stats = player.getStats();
            if (stats == null) {
                stats = new PlayerStats();
                player.setStats(stats);
            }
            stats.updateElo(isWinner, opponentElo);
            playerStatsRepository.save(stats);

            // Cập nhật PlayerRanking
            PlayerRanking pr = (tourneyId != null)
                    ? playerRankingRepository.findByPlayer_UserIdAndTournament_TournamentId(player.getUserId(), tourneyId)
                            .orElseGet(() -> new PlayerRanking(player, tournament))
                    : playerRankingRepository.findByPlayer_UserIdAndTournamentIsNull(player.getUserId())
                            .orElseGet(() -> new PlayerRanking(player));
            pr.setRankingScore(stats.getEloScore());
            playerRankingRepository.save(pr);
        }

        // Tái xếp hạng (Re-rank) các Player
        List<PlayerRanking> allPlayerRanks = (tourneyId != null)
                ? playerRankingRepository.findByTournament_TournamentIdOrderByCurrentRankAsc(tourneyId)
                : playerRankingRepository.findByTournamentIsNullOrderByCurrentRankAsc();
        rankPlayers(allPlayerRanks);
        playerRankingRepository.saveAll(allPlayerRanks);
    }
}

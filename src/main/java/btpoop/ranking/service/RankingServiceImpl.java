package btpoop.ranking.service;

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
import btpoop.team.repository.TeamRepository;
import btpoop.tournament.model.Tournament;
import btpoop.user.model.Player;
import btpoop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RankingServiceImpl implements RankingService {

    private final PlayerRankingRepository playerRankingRepository;
    private final TeamRankingRepository teamRankingRepository;
    private final PlayerStatsRepository playerStatsRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;

    @Override
    public List<PlayerRanking> getPlayerRankings(Long tournamentId) {
        List<PlayerRanking> list;
        if (tournamentId != null) {
            list = playerRankingRepository.findByTournament_TournamentIdOrderByCurrentRankAsc(tournamentId);
        } else {
            list = playerRankingRepository.findAllByOrderByCurrentRankAsc();
        }

        // Fallback khởi tạo ban đầu nếu DB chưa có bản ghi ranking nào
        if (list.isEmpty()) {
            list = userRepository.findAll().stream()
                    .filter(u -> u instanceof Player)
                    .map(u -> new PlayerRanking((Player) u))
                    .collect(Collectors.toList());
            list = rankPlayers(list);
            if (!list.isEmpty()) {
                playerRankingRepository.saveAll(list);
            }
        }
        return list;
    }

    @Override
    public List<TeamRanking> getTeamRankings(Long tournamentId) {
        List<TeamRanking> list;
        if (tournamentId != null) {
            list = teamRankingRepository.findByTournament_TournamentIdOrderByCurrentRankAsc(tournamentId);
        } else {
            list = teamRankingRepository.findAllByOrderByCurrentRankAsc();
        }

        // Fallback khởi tạo ban đầu nếu DB chưa có bản ghi ranking nào
        if (list.isEmpty()) {
            list = teamRepository.findAll().stream()
                    .map(TeamRanking::new)
                    .collect(Collectors.toList());
            list = rankTeams(list);
            if (!list.isEmpty()) {
                teamRankingRepository.saveAll(list);
            }
        }
        return list;
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
        Collections.sort(teams);
        for (int i = 0; i < teams.size(); i++) {
            teams.get(i).setCurrentRank(i + 1);
        }
        return teams;
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

        int scoreA = result.getScoreA();
        int scoreB = result.getScoreB();
        boolean aWins = (result.getWinner() != null && result.getWinner().getTeamId() == teamA.getTeamId());
        boolean bWins = (result.getWinner() != null && result.getWinner().getTeamId() == teamB.getTeamId());
        boolean isDraw = (scoreA == scoreB);

        Long tourneyId = (tournament != null) ? tournament.getTournamentId() : null;

        // 1. Cập nhật Team Ranking cho Team A
        TeamRanking rankA = (tourneyId != null)
                ? teamRankingRepository.findByTeam_TeamIdAndTournament_TournamentId(teamA.getTeamId(), tourneyId)
                        .orElseGet(() -> new TeamRanking(teamA, tournament))
                : teamRankingRepository.findByTeam_TeamIdAndTournamentIsNull(teamA.getTeamId())
                        .orElseGet(() -> new TeamRanking(teamA));
        rankA.updateStats(scoreA, scoreB, aWins, isDraw);
        teamRankingRepository.save(rankA);

        // 2. Cập nhật Team Ranking cho Team B
        TeamRanking rankB = (tourneyId != null)
                ? teamRankingRepository.findByTeam_TeamIdAndTournament_TournamentId(teamB.getTeamId(), tourneyId)
                        .orElseGet(() -> new TeamRanking(teamB, tournament))
                : teamRankingRepository.findByTeam_TeamIdAndTournamentIsNull(teamB.getTeamId())
                        .orElseGet(() -> new TeamRanking(teamB));
        rankB.updateStats(scoreB, scoreA, bWins, isDraw);
        teamRankingRepository.save(rankB);

        // 3. Tái xếp hạng (Re-rank) toàn bộ Team của giải đấu (hoặc global)
        List<TeamRanking> allTeamRanks = (tourneyId != null)
                ? teamRankingRepository.findByTournament_TournamentIdOrderByCurrentRankAsc(tourneyId)
                : teamRankingRepository.findAllByOrderByCurrentRankAsc();
        rankTeams(allTeamRanks);
        teamRankingRepository.saveAll(allTeamRanks);

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
                : playerRankingRepository.findAllByOrderByCurrentRankAsc();
        rankPlayers(allPlayerRanks);
        playerRankingRepository.saveAll(allPlayerRanks);
    }
}

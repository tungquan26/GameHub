package btpoop.ranking.controller;

import btpoop.ranking.model.PlayerRanking;
import btpoop.ranking.model.TeamRanking;
import btpoop.ranking.service.RankingService;
import btpoop.team.service.TeamService;
import btpoop.user.model.Player;
import btpoop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rankings")
@RequiredArgsConstructor
public class RankingController {

    private final RankingService rankingService;
    private final UserRepository userRepository;
    private final TeamService teamService;

    @GetMapping("/players")
    public ResponseEntity<List<PlayerRanking>> getPlayerRankings() {
        List<PlayerRanking> players = userRepository.findAll().stream()
                .filter(u -> u instanceof Player)
                .map(u -> new PlayerRanking((Player) u))
                .collect(Collectors.toList());

        List<PlayerRanking> rankedPlayers = rankingService.rankPlayers(players);
        return ResponseEntity.ok(rankedPlayers);
    }

    @GetMapping("/teams")
    public ResponseEntity<List<TeamRanking>> getTeamRankings() {
        List<TeamRanking> teams = teamService.getAllTeams().stream()
                .map(TeamRanking::new)
                .collect(Collectors.toList());

        List<TeamRanking> rankedTeams = rankingService.rankTeams(teams);
        return ResponseEntity.ok(rankedTeams);
    }
}

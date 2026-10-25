package btpoop.ranking.controller;

import btpoop.ranking.model.PlayerRanking;
import btpoop.ranking.model.TeamRanking;
import btpoop.ranking.service.RankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rankings")
@RequiredArgsConstructor
@CrossOrigin("*")
public class RankingController {

    private final RankingService rankingService;

    @GetMapping("/players")
    public ResponseEntity<List<PlayerRanking>> getPlayerRankings(@RequestParam(required = false) Long tournamentId) {
        List<PlayerRanking> rankedPlayers = rankingService.getPlayerRankings(tournamentId);
        return ResponseEntity.ok(rankedPlayers);
    }

    @GetMapping("/teams")
    public ResponseEntity<List<TeamRanking>> getTeamRankings(@RequestParam(required = false) Long tournamentId) {
        List<TeamRanking> rankedTeams = rankingService.getTeamRankings(tournamentId);
        return ResponseEntity.ok(rankedTeams);
    }
}

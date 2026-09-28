package btpoop.ranking.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rankings")
public class RankingController {

    @GetMapping("/players")
    public ResponseEntity<String> getPlayerRankings() {
        // TODO: Viết logic lấy bảng xếp hạng người chơi
        return ResponseEntity.ok("Player Ranking API is working");
    }

    @GetMapping("/teams")
    public ResponseEntity<String> getTeamRankings() {
        // TODO: Viết logic lấy bảng xếp hạng đội tuyển
        return ResponseEntity.ok("Team Ranking API is working");
    }
}

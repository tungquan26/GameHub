package btpoop.statistics.controller;

import btpoop.statistics.service.StatisticsService;
import btpoop.user.model.PlayerStats;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
@CrossOrigin("*") // Hỗ trợ frontend gọi API không bị lỗi CORS
public class StatisticsController {

    private final StatisticsService statisticsService;

    // API: Xem chỉ số của 1 người chơi
    @GetMapping("/players/{playerId}")
    public ResponseEntity<PlayerStats> getPlayerStats(@PathVariable Long playerId) {
        PlayerStats stats = statisticsService.getPlayerStats(playerId);
        return ResponseEntity.ok(stats);
    }

    // API: Chỉnh sửa chỉ số sau trận đấu (Dành cho test thủ công hoặc gọi từ hệ thống)
    @PostMapping("/players/{playerId}/update")
    public ResponseEntity<String> updateStatsAfterMatch(
            @PathVariable Long playerId,
            @RequestParam boolean isWinner,
            @RequestParam double opponentElo) {
        
        statisticsService.updatePlayerStatsAfterMatch(playerId, isWinner, opponentElo);
        return ResponseEntity.ok("Cập nhật thông số thành công cho người chơi ID: " + playerId);
    }
}

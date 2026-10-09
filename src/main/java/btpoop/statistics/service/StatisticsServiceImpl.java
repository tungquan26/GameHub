package btpoop.statistics.service;

import btpoop.user.model.Player;
import btpoop.user.model.PlayerStats;
import btpoop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StatisticsServiceImpl implements StatisticsService {

    private final UserRepository userRepository;

    @Override
    public PlayerStats getPlayerStats(Long playerId) {
        // Tìm user, ép kiểu an toàn sang Player, sau đó lấy Stats
        return userRepository.findById(playerId)
                .filter(user -> user instanceof Player)
                .map(user -> ((Player) user).getStats())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người chơi hoặc ID không thuộc về Player"));
    }

    @Override
    public void updatePlayerStatsAfterMatch(Long playerId, boolean isWinner, double opponentElo) {
        // 1. Lấy Player ra
        Player player = (Player) userRepository.findById(playerId)
                .filter(user -> user instanceof Player)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người chơi"));

        // 2. Lấy bộ chỉ số cũ
        PlayerStats stats = player.getStats();

        // 3. Gọi hàm updateElo
        stats.updateElo(isWinner, opponentElo);

        // 4. Lưu ngược lại vào Database
        userRepository.save(player);
    }
}

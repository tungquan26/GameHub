package btpoop.statistics.service;

import btpoop.statistics.model.PlayerStats;

public interface StatisticsService {
    /**
     * Lấy thông tin thống kê của một người chơi dựa trên ID.
     */
    PlayerStats getPlayerStats(Long playerId);
    
    /**
     * Cập nhật thông số của người chơi sau mỗi trận đấu.
     * @param playerId ID của người chơi
     * @param isWinner Người chơi có thắng trận hay không
     * @param opponentElo Elo của đối thủ (hoặc Elo trung bình của team địch)
     */
    void updatePlayerStatsAfterMatch(Long playerId, boolean isWinner, double opponentElo);
}

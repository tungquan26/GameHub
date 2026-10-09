package btpoop.match.service;

import btpoop.match.model.Match;
import btpoop.team.model.Team;
import java.time.LocalDateTime;

public interface MatchService {
    /**
     * Xếp lịch cho một trận đấu (gán đội và thời gian).
     * @param matchId ID của trận đấu trống đã được tạo sẵn bởi Bracket
     * @param teamA Đội A
     * @param teamB Đội B
     * @param time Thời gian dự kiến thi đấu
     */
    Match scheduleMatch(Long matchId, Team teamA, Team teamB, LocalDateTime time);

    /**
     * Cập nhật tỉ số trận đấu và chốt kết quả.
     * @param matchId ID trận đấu
     * @param scoreA Điểm đội A
     * @param scoreB Điểm đội B
     */
    Match updateMatchResult(Long matchId, int scoreA, int scoreB);
}

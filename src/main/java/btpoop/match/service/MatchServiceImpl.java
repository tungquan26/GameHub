package btpoop.match.service;

import btpoop.enums.MatchStatus;
import btpoop.match.model.MatchFinishedEvent;
import btpoop.match.model.MatchScheduledEvent;
import btpoop.match.model.Match;
import btpoop.match.model.MatchResult;
import btpoop.match.repository.MatchRepository;
import btpoop.team.model.Team;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MatchServiceImpl implements MatchService {

    // Công cụ phát sự kiện (Event)
    private final ApplicationEventPublisher eventPublisher;
    
    // Đã un-comment và inject thành công
    private final MatchRepository matchRepository;

    @Override
    public Match scheduleMatch(Long matchId, Team teamA, Team teamB, LocalDateTime time) {
        // 1. Lấy trận đấu trống từ DB (đã được Bracket tạo ra từ trước)
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trận đấu với ID: " + matchId));
        
        // 2. Gán dữ liệu 2 đội và thời gian
        match.setTeamA(teamA);
        match.setTeamB(teamB);
        match.setScheduledTime(time);
        match.setStatus(MatchStatus.SCHEDULED); // Đảm bảo trạng thái là Đã xếp lịch
        
        // 3. Lưu xuống Database
        Match savedMatch = matchRepository.save(match);
        
        // 🌟 Bắn sự kiện: "Đã xếp lịch xong" 
        // Các Service khác chỉ cần lắng nghe sự kiện này
        eventPublisher.publishEvent(new MatchScheduledEvent(savedMatch.getMatchId()));

        return savedMatch;
    }

    @Override
    public Match updateMatchResult(Long matchId, int scoreA, int scoreB) {
        // 1. Lấy trận đấu từ DB
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trận đấu với ID: " + matchId));

        // 2. Tính toán đội chiến thắng
        Team winner = null;
        if (scoreA > scoreB) {
            winner = match.getTeamA();
        } else if (scoreB > scoreA) {
            winner = match.getTeamB();
        } // Hòa thì winner = null (tùy vào logic giải quyết hòa sau này)

        // 3. Khởi tạo đối tượng MatchResult (được gán bằng @Embeddable)
        MatchResult result = new MatchResult(scoreA, scoreB, winner);
        match.setResult(result);
        match.setStatus(MatchStatus.COMPLETED); // Chuyển trạng thái sang kết thúc
        
        // 4. Lưu xuống Database
        Match savedMatch = matchRepository.save(match);

        // 🌟 Bắn sự kiện: "Trận đấu có kết quả"
        // Lúc này:
        // - BracketService sẽ nghe thấy để đưa đội thắng lên nhánh trên.
        // - NotificationService sẽ nghe để gửi mail chúc mừng/chia buồn.
        // - StatisticsService sẽ nghe để cộng điểm Elo.
        eventPublisher.publishEvent(new MatchFinishedEvent(savedMatch.getMatchId(), winner));

        return savedMatch;
    }
}

package btpoop.match.service;

import btpoop.enums.MatchStatus;
import btpoop.match.model.Match;
import btpoop.match.model.MatchFinishedEvent;
import btpoop.match.model.MatchResult;
import btpoop.match.model.MatchScheduledEvent;
import btpoop.match.repository.MatchRepository;
import btpoop.team.model.Team;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MatchServiceImpl implements MatchService {

    private final ApplicationEventPublisher eventPublisher;
    private final MatchRepository matchRepository;

    @Override
    @Transactional
    public Match scheduleMatch(Long matchId, Team teamA, Team teamB, LocalDateTime time) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trận đấu với ID: " + matchId));
        
        match.setTeamA(teamA);
        match.setTeamB(teamB);
        match.setScheduledTime(time);
        match.setStatus(MatchStatus.SCHEDULED);
        
        Match savedMatch = matchRepository.save(match);
        eventPublisher.publishEvent(new MatchScheduledEvent(savedMatch.getMatchId()));
        return savedMatch;
    }

    @Override
    @Transactional
    public Match scheduleMatch(Long matchId, LocalDateTime time, String location) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trận đấu với ID: " + matchId));

        if (time != null) {
            match.setScheduledTime(time);
        }
        if (location != null && !location.isBlank()) {
            match.setLocation(location);
        }
        match.setStatus(MatchStatus.SCHEDULED);

        Match savedMatch = matchRepository.save(match);
        eventPublisher.publishEvent(new MatchScheduledEvent(savedMatch.getMatchId()));
        return savedMatch;
    }

    @Override
    @Transactional
    public Match updateMatchResult(Long matchId, int scoreA, int scoreB) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trận đấu với ID: " + matchId));

        if (scoreA == scoreB) {
            throw new IllegalArgumentException("Trận đấu theo thể thức loại trực tiếp không thể có kết quả hòa.");
        }

        Team winner = scoreA > scoreB ? match.getTeamA() : match.getTeamB();
        if (winner == null) {
            throw new IllegalStateException("Không thể xác định đội thắng vì thông tin đội chưa sẵn sàng.");
        }

        MatchResult result = new MatchResult(scoreA, scoreB, winner);
        match.setResult(result);
        match.setStatus(MatchStatus.COMPLETED);
        
        Match savedMatch = matchRepository.save(match);

        // 🌟 Tự động đẩy đội thắng lên vòng tiếp theo trong nhánh đấu
        if (savedMatch.getNextMatch() != null) {
            Match next = savedMatch.getNextMatch();
            if ("A".equalsIgnoreCase(savedMatch.getNextMatchSlot())) {
                next.setTeamA(winner);
            } else if ("B".equalsIgnoreCase(savedMatch.getNextMatchSlot())) {
                next.setTeamB(winner);
            }
            matchRepository.save(next);
        }

        // Bắn sự kiện trận đấu kết thúc
        eventPublisher.publishEvent(new MatchFinishedEvent(savedMatch.getMatchId(), winner));
        return savedMatch;
    }

    @Override
    @Transactional(readOnly = true)
    public Match getMatchById(Long matchId) {
        return matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trận đấu với ID: " + matchId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Match> getMatchesByTournamentId(Long tournamentId) {
        return matchRepository.findByTournament_TournamentIdOrderByRound_RoundNumberAscMatchOrderAsc(tournamentId);
    }
}

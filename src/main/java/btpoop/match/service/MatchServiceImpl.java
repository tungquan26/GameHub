package btpoop.match.service;

import btpoop.enums.MatchStatus;
import btpoop.match.model.Match;
import btpoop.match.model.MatchFinishedEvent;
import btpoop.match.model.MatchResult;
import btpoop.match.model.MatchScheduledEvent;
import btpoop.match.repository.MatchRepository;
import btpoop.ranking.service.RankingService;
import btpoop.team.model.Team;
import btpoop.tournament.repository.TournamentRepository;
import org.springframework.transaction.annotation.Isolation;
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
    private final RankingService rankings;
    private final TournamentRepository tournaments;

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
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Match updateMatchResult(Long matchId, int scoreA, int scoreB) {
        // Load scores and downstream matches only after acquiring the tournament lock.
        matchRepository.findTournamentId(matchId).flatMap(tournaments::findByIdForUpdate)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trận đấu với ID: " + matchId));
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trận đấu với ID: " + matchId));
        boolean alreadyCompleted = match.getStatus() == MatchStatus.COMPLETED;

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

        advanceWinner(savedMatch, winner);

        // Bắn sự kiện trận đấu kết thúc
        if (alreadyCompleted) rankings.rebuildTeamRankings(savedMatch.getTournament());
        else eventPublisher.publishEvent(new MatchFinishedEvent(savedMatch.getMatchId(), winner));
        return savedMatch;
    }

    private void advanceWinner(Match match, Team winner) {
        var next = match.getNextMatch();
        if (next == null) return;

        boolean slotA = "A".equalsIgnoreCase(match.getNextMatchSlot());
        if (!slotA && !"B".equalsIgnoreCase(match.getNextMatchSlot())) return;
        var previous = slotA ? next.getTeamA() : next.getTeamB();
        if (previous == null ? winner == null : winner != null && previous.getTeamId() == winner.getTeamId()) return;

        if (slotA) next.setTeamA(winner);
        else next.setTeamB(winner);
        next.setResult(null);
        next.setStatus(MatchStatus.SCHEDULED);
        advanceWinner(next, null);
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

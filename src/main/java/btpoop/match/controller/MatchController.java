package btpoop.match.controller;

import btpoop.match.model.Match;
import btpoop.match.service.MatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;

    @GetMapping("/{id}")
    public ResponseEntity<Match> getMatchById(@PathVariable Long id) {
        return ResponseEntity.ok(matchService.getMatchById(id));
    }

    @GetMapping("/tournament/{tournamentId}")
    public ResponseEntity<List<Match>> getMatchesByTournamentId(@PathVariable Long tournamentId) {
        return ResponseEntity.ok(matchService.getMatchesByTournamentId(tournamentId));
    }

    @PutMapping("/{id}/schedule")
    public ResponseEntity<Match> scheduleMatch(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime scheduledTime,
            @RequestParam(required = false) String location) {
        return ResponseEntity.ok(matchService.scheduleMatch(id, scheduledTime, location));
    }

    @PutMapping("/{id}/result")
    public ResponseEntity<Match> updateMatchResult(
            @PathVariable Long id,
            @RequestParam int scoreA,
            @RequestParam int scoreB) {
        return ResponseEntity.ok(matchService.updateMatchResult(id, scoreA, scoreB));
    }
}

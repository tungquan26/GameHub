package btpoop.tournament.controller;

import btpoop.tournament.model.Tournament;
import btpoop.tournament.service.TournamentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tournaments")
@RequiredArgsConstructor
public class TournamentController {

    private final TournamentService tournamentService;

    @GetMapping
    public ResponseEntity<List<Tournament>> getAllTournaments() {
        return ResponseEntity.ok(tournamentService.getAllTournaments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tournament> getTournamentById(@PathVariable Long id) {
        return ResponseEntity.ok(tournamentService.getTournamentById(id));
    }

    @PostMapping
    public ResponseEntity<Tournament> createTournament(
            @RequestBody Tournament tournament,
            @RequestParam Long gameId,
            @RequestParam Long organizerId, jakarta.servlet.http.HttpSession session) {
        btpoop.user.controller.SessionUser.require(session,organizerId);
        return ResponseEntity.ok(tournamentService.createTournament(tournament, gameId, organizerId));
    }
}

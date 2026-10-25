package btpoop.bracket.controller;

import btpoop.bracket.model.Bracket;
import btpoop.bracket.service.BracketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/brackets")
@RequiredArgsConstructor
public class BracketController {

    private final BracketService bracketService;

    @GetMapping
    public ResponseEntity<List<Bracket>> getAllBrackets() {
        return ResponseEntity.ok(bracketService.getAllBrackets());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Bracket> getBracketById(@PathVariable Long id) {
        return ResponseEntity.ok(bracketService.getBracketById(id));
    }

    @PostMapping
    public ResponseEntity<Bracket> createBracket(@RequestBody Bracket bracket, @RequestParam Long tournamentId) {
        return ResponseEntity.ok(bracketService.createBracket(bracket, tournamentId));
    }

    @PostMapping("/generate/{tournamentId}")
    public ResponseEntity<Bracket> generateBracket(@PathVariable Long tournamentId) {
        return ResponseEntity.ok(bracketService.generateBracket(tournamentId));
    }

    @GetMapping("/tournament/{tournamentId}")
    public ResponseEntity<Bracket> getBracketByTournamentId(@PathVariable Long tournamentId) {
        return ResponseEntity.ok(bracketService.getBracketByTournamentId(tournamentId));
    }
}

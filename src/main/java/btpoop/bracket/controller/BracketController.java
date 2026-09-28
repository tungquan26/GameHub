package btpoop.bracket.controller;

import btpoop.bracket.model.Bracket;
import btpoop.bracket.repository.BracketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/brackets")
@RequiredArgsConstructor
public class BracketController {

    private final BracketRepository bracketRepository;

    @GetMapping
    public ResponseEntity<List<Bracket>> getAllBrackets() {
        return ResponseEntity.ok(bracketRepository.findAll());
    }
}

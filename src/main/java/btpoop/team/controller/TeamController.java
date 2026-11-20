package btpoop.team.controller;

import btpoop.team.model.Team;
import btpoop.team.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @GetMapping
    public ResponseEntity<List<Team>> getAllTeams() {
        return ResponseEntity.ok(teamService.getAllTeams());
    }

    @PostMapping
    public ResponseEntity<Team> createTeam(@RequestBody Team team, @RequestParam Long captainId, jakarta.servlet.http.HttpSession session) {
        btpoop.user.controller.SessionUser.require(session,captainId);
        return ResponseEntity.ok(teamService.createTeam(team, captainId));
    }
}

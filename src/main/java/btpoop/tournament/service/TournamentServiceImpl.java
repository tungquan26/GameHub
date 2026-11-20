package btpoop.tournament.service;

import btpoop.game.model.Game;
import btpoop.game.repository.GameRepository;
import btpoop.tournament.model.Tournament;
import btpoop.tournament.repository.TournamentRepository;
import btpoop.user.model.Organizer;
import btpoop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TournamentServiceImpl implements TournamentService {

    private final TournamentRepository tournamentRepository;
    private final GameRepository gameRepository;
    private final UserRepository userRepository;

    @Override
    public List<Tournament> getAllTournaments() {
        return tournamentRepository.findAll();
    }

    @Override
    public Tournament getTournamentById(Long id) {
        return tournamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));
    }

    @Override
    public Tournament createTournament(Tournament tournament, Long gameId, Long organizerId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));
        
        var organizer = userRepository.findById(organizerId)
                .orElseThrow(() -> new RuntimeException("Organizer not found"));

        tournament.setGame(game);
        tournament.setOrganizer(organizer);
        tournament.setMaxTeams(Tournament.MAX_TEAMS);
        return tournamentRepository.save(tournament);
    }
}

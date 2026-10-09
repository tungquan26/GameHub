package btpoop.tournament.service;

import btpoop.tournament.model.Tournament;
import java.util.List;

public interface TournamentService {
    List<Tournament> getAllTournaments();
    Tournament getTournamentById(Long id);
    Tournament createTournament(Tournament tournament, Long gameId, Long organizerId);
}

package btpoop.bracket.service;

import btpoop.bracket.model.Bracket;
import java.util.List;

public interface BracketService {
    List<Bracket> getAllBrackets();
    Bracket getBracketById(Long id);
    Bracket createBracket(Bracket bracket, Long tournamentId);
}

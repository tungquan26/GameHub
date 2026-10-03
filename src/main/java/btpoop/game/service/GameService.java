package btpoop.game.service;

import btpoop.game.model.Game;
import java.util.List;

public interface GameService {
    Game createGame(Game game);
    Game updateGame(Long gameId, Game gameDetails);
    Game getGameById(Long gameId);
    List<Game> getAllGames();
}

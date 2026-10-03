package btpoop.game.service;

import btpoop.game.model.Game;
import btpoop.game.repository.GameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GameServiceImpl implements GameService {

    private final GameRepository gameRepository;

    @Override
    public Game createGame(Game game) {
        return gameRepository.save(game);
    }

    @Override
    public Game updateGame(Long gameId, Game gameDetails) {
        Game game = getGameById(gameId);
        game.setName(gameDetails.getName());
        game.setMinPlayers(gameDetails.getMinPlayers());
        game.setMaxPlayers(gameDetails.getMaxPlayers());
        game.setDescription(gameDetails.getDescription());
        return gameRepository.save(game);
    }

    @Override
    public Game getGameById(Long gameId) {
        return gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));
    }

    @Override
    public List<Game> getAllGames() {
        return gameRepository.findAll();
    }
}

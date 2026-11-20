package btpoop.game.repository;

import btpoop.game.model.Game;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameRepository extends JpaRepository<Game, Long> {
    boolean existsByName(String name);
    Game findByName(String name);
}

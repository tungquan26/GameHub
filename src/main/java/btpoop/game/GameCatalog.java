package btpoop.game;

import btpoop.enums.GameType;
import btpoop.game.model.Game;
import btpoop.game.repository.GameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;

import org.springframework.stereotype.Component;

@Component

@RequiredArgsConstructor
class GameCatalog implements CommandLineRunner {
    private final GameRepository games;
    public void run(String... args) {
        add("Liên Minh Huyền Thoại", GameType.MOBA, 5);
        add("Valorant", GameType.FPS, 5);
        add("Teamfight Tactics", GameType.RTS, 1);
        add("CS2", GameType.FPS, 5);
        add("Delta Force", GameType.FPS, 5);
        add("Liên Quân Mobile", GameType.MOBA, 5);
        add("Free Fire", GameType.BATTLE_ROYALE, 4);
        add("League of Legends: Wild Rift", GameType.MOBA, 5);
    }
    private void add(String name, GameType type, int size) {
        if (!games.existsByName(name)) games.save(new Game(0, name, type, size, size, null));
    }
}

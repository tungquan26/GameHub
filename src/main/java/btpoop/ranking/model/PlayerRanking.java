package btpoop.ranking.model;

import btpoop.tournament.model.Tournament;
import btpoop.user.model.Player;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "player_rankings")
@Data
@NoArgsConstructor
public class PlayerRanking implements Comparable<PlayerRanking> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @ManyToOne
    @JoinColumn(name = "tournament_id")
    private Tournament tournament;

    private double rankingScore;
    private int currentRank;

    public PlayerRanking(Player player) {
        this.player = player;
        this.rankingScore = (player != null && player.getStats() != null) ? player.getStats().getEloScore() : 1200.0;
        this.currentRank = 0;
    }

    public PlayerRanking(Player player, Tournament tournament) {
        this(player);
        this.tournament = tournament;
    }

    public double getRankingScore() {
        if (player != null && player.getStats() != null) {
            return player.getStats().getEloScore();
        }
        return rankingScore;
    }

    @Override
    public int compareTo(PlayerRanking other) {
        return Double.compare(other.getRankingScore(), this.getRankingScore());
    }
}

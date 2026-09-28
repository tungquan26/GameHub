package btpoop.user.model;

import jakarta.persistence.Embeddable;
import lombok.Data;

@Embeddable
@Data
public class PlayerStats {

    private double eloScore = 1200.0;
    private int matchesPlayed = 0;
    private int wins = 0;

    public void updateElo(boolean isWinner, double opponentElo) {
        this.matchesPlayed++;
        if (isWinner) {
            this.wins++;
            this.eloScore += 20 + (opponentElo - this.eloScore) * 0.1; 
        } else {
            this.eloScore -= 20 - (this.eloScore - opponentElo) * 0.1;
        }
    }

    public double getWinRate() { 
        return matchesPlayed == 0 ? 0 : ((double) wins / matchesPlayed) * 100; 
    }
}

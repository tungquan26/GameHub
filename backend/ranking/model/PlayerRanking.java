package ranking.model;

import user.model.Player;

public class PlayerRanking implements Comparable<PlayerRanking> {

    public int getCurrentRank() { 
        return currentRank; 
    }

    private Player player;
    private int currentRank;

    public PlayerRanking(Player player) {
        this.player = player;
    }

    public Player getPlayer() {
        return player;
    }

    public void setCurrentRank(int currentRank) {
        this.currentRank = currentRank;
    }

    public double getRankingScore() {
        if (player != null && player.getStats() != null) {
            return player.getStats().getEloScore();
        }
        return 0.0;
    }

    @Override
    public int compareTo(PlayerRanking other) {
        return Double.compare(other.getRankingScore(), this.getRankingScore());
    }
}

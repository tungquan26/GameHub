package btpoop.ranking.model;

import btpoop.team.model.Team;

public class TeamRanking implements Comparable<TeamRanking> {
    private Team team;
    private int matchesPlayed;
    private int wins;
    private int draws;
    private int losses;
    private int points;
    private int totalScoreDifference;
    private int currentRank;


    public TeamRanking(Team team) {
        this.team = team;
        this.matchesPlayed = 0;
        this.wins = 0;
        this.draws = 0;
        this.losses = 0;
        this.points = 0;
        this.totalScoreDifference = 0;
        this.currentRank = 0;
    }

    public int getMatchesPlayed() { return matchesPlayed; }
    public int getWins() { return wins; }
    public int getDraws() { return draws; }
    public int getLosses() { return losses; }
    public Team getTeam() { return team; }
    public int getPoints() { return points; }
    public int getTotalScoreDifference() { return totalScoreDifference; }
    public int getCurrentRank() { 
        return currentRank; 
    }

    public void setCurrentRank(int currentRank) { 
        this.currentRank = currentRank; 
    }

    public void updateStats(int goalsFor, int goalsAgainst, boolean isWinner, boolean isDraw) {
        this.matchesPlayed++;
        this.totalScoreDifference += (goalsFor - goalsAgainst);
        
        if (isWinner) {
            this.wins++;
            this.points += 3;
        } else if (isDraw) {
            this.draws++;
            this.points += 1;
        } else {
            this.losses++;
        }
    }

    @Override
    public int compareTo(TeamRanking other) {
        
        if (this.points != other.points) {
            return Integer.compare(other.points, this.points);
        }
        
        return Integer.compare(other.totalScoreDifference, this.totalScoreDifference);
    }
}
package btpoop.ranking.model;

import btpoop.team.model.Team;
import btpoop.tournament.model.Tournament;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "team_rankings")
@Data
@NoArgsConstructor
public class TeamRanking implements Comparable<TeamRanking> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne
    @JoinColumn(name = "tournament_id")
    private Tournament tournament;

    private int matchesPlayed = 0;
    private int wins = 0;
    private int draws = 0;
    private int losses = 0;
    private int points = 0;
    private int totalScoreDifference = 0;
    private int currentRank = 0;

    public TeamRanking(Team team) {
        this.team = team;
    }

    public TeamRanking(Team team, Tournament tournament) {
        this.team = team;
        this.tournament = tournament;
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
        if (this.totalScoreDifference != other.totalScoreDifference) {
            return Integer.compare(other.totalScoreDifference, this.totalScoreDifference);
        }
        return Integer.compare(other.wins, this.wins);
    }
}

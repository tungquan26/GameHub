package btpoop.match.model;

import btpoop.team.model.Team;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchResult {
    private int scoreA;
    private int scoreB;
    
    @ManyToOne
    @JoinColumn(name = "winner_id")
    private Team winner;
}

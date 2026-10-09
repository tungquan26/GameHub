package btpoop.match.model;

import btpoop.team.model.Team;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MatchFinishedEvent {
    private final Long matchId;
    private final Team winnerTeam;
}

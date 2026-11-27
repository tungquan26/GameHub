package btpoop.match.model;

import btpoop.team.model.Team;
import java.time.LocalDateTime;

public record MatchScheduledEvent(Long matchId) {
    public record Schedule(Long teamA, Long teamB, LocalDateTime time, String location) {
        public static Schedule of(Match match) {
            return new Schedule(id(match.getTeamA()), id(match.getTeamB()), match.getScheduledTime(), match.getLocation());
        }

        private static Long id(Team team) {
            return team == null ? null : team.getTeamId();
        }
    }
}

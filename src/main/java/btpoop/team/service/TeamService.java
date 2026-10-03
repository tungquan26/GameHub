package btpoop.team.service;

import btpoop.team.model.Team;
import btpoop.team.model.TeamMember;

import java.util.List;

public interface TeamService {
    Team createTeam(Team team, Long captainId);
    TeamMember addPlayerToTeam(Long teamId, Long playerId, Long requesterId);
    void removePlayerFromTeam(Long teamId, Long playerId, Long requesterId);
    Team getTeamById(Long teamId);
    List<Team> getAllTeams();
}

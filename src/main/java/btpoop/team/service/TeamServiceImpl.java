package btpoop.team.service;

import btpoop.game.model.Game;
import btpoop.enums.TeamMemberRole;
import btpoop.enums.TeamStatus;
import btpoop.team.model.Team;
import btpoop.team.model.TeamMember;
import btpoop.team.repository.TeamMemberRepository;
import btpoop.team.repository.TeamRepository;
import btpoop.user.model.Player;
import btpoop.user.model.User;
import btpoop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TeamServiceImpl implements TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Team createTeam(Team teamReq, Long captainId) {
        User user = userRepository.findById(captainId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!(user instanceof Player)) {
            throw new RuntimeException("Only a Player can be a team captain");
        }
        
        Team team = new Team();
        team.setTeamName(teamReq.getTeamName());
        team.setDescription(teamReq.getDescription());
        team.setGame(teamReq.getGame());
        team.setCaptain((Player) user);
        team.setStatus(TeamStatus.ACTIVE);
        
        team = teamRepository.save(team);
        
        TeamMember captainMember = new TeamMember();
        captainMember.setTeam(team);
        captainMember.setPlayer((Player) user);
        captainMember.setRole(TeamMemberRole.CAPTAIN);
        captainMember.setJoinedAt(LocalDateTime.now());
        
        teamMemberRepository.save(captainMember);
        
        return team;
    }

    @Override
    @Transactional
    public TeamMember addPlayerToTeam(Long teamId, Long playerId, Long requesterId) {
        Team team = getTeamById(teamId);
        
        // 1. Kiểm tra quyền của người yêu cầu
        if (team.getCaptain().getUserId() != requesterId) {
            throw new RuntimeException("Only the captain can add members to the team");
        }
        
        // 2. CHECK LUẬT MAX MEMBERS CỦA GAME
        int currentMembersCount = team.getMembers().size();
        Game game = team.getGame();
        
        if (currentMembersCount >= game.getMaxPlayers()) {
            throw new RuntimeException("Team has reached the maximum number of players (" + game.getMaxPlayers() + ") for " + game.getName());
        }

        User user = userRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        if (!(user instanceof Player)) {
            throw new RuntimeException("Only a Player can join a team");
        }
        
        // 3. Kiểm tra xem người chơi đã ở trong đội chưa
        boolean alreadyInTeam = team.getMembers().stream()
                .anyMatch(member -> member.getPlayer().getUserId() == playerId);
        if (alreadyInTeam) {
            throw new RuntimeException("Player is already in the team");
        }
        
        TeamMember newMember = new TeamMember();
        newMember.setTeam(team);
        newMember.setPlayer((Player) user);
        newMember.setRole(TeamMemberRole.MEMBER);
        newMember.setJoinedAt(LocalDateTime.now());
        
        return teamMemberRepository.save(newMember);
    }

    @Override
    @Transactional
    public void removePlayerFromTeam(Long teamId, Long playerId, Long requesterId) {
        Team team = getTeamById(teamId);
        
        boolean isCaptain = team.getCaptain().getUserId() == requesterId;
        boolean isSelf = playerId.equals(requesterId);
        
        if (!isCaptain && !isSelf) {
            throw new RuntimeException("Only the captain can remove members, or members can leave voluntarily");
        }
        
        if (team.getCaptain().getUserId() == playerId) {
            throw new RuntimeException("Cannot remove the captain. Transfer leadership first.");
        }
        
        TeamMember memberToRemove = team.getMembers().stream()
                .filter(m -> m.getPlayer().getUserId() == playerId)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Member not found in team"));
                
        teamMemberRepository.delete(memberToRemove);
    }

    @Override
    public Team getTeamById(Long teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));
    }

    @Override
    public List<Team> getAllTeams() {
        return teamRepository.findAll();
    }
}

package btpoop.registration.service;

import btpoop.registration.model.Registration;
import btpoop.enums.RegistrationStatus;
import btpoop.user.model.Player; 
import btpoop.team.model.Team;
import btpoop.team.model.TeamMember;
import btpoop.registration.repository.RegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MakeTeamModule {

    private final RegistrationRepository registrationRepository;

    public List<Team> findSuitableTeams(Player soloPlayer) {
        // Lấy dữ liệu từ Database thay vì nhận tham số truyền vào
        List<Registration> allRegistrations = registrationRepository.findAll();
        List<Team> suggestedTeams = new ArrayList<>();
        
        double playerElo = soloPlayer.getStats() != null ? soloPlayer.getStats().getEloScore() : 1200; 

        for (Registration reg : allRegistrations) {
            if (reg.getStatus() == RegistrationStatus.PENDING) {
                Team team = reg.getTeam(); 
                if (team != null && team.getMembers() != null && team.getMembers().size() < 7) { 
                    double teamAverageElo = calculateTeamAverageElo(team);
                    if (Math.abs(teamAverageElo - playerElo) <= 150) {
                        suggestedTeams.add(team);
                    }
                }
            }
        }
        return suggestedTeams;
    }

    private double calculateTeamAverageElo(Team team) {
        if (team.getMembers() == null || team.getMembers().isEmpty()) return 1200.0;
        
        double totalElo = 0;
        for (TeamMember member : team.getMembers()) {
            totalElo += member.getPlayer() != null && member.getPlayer().getStats() != null 
                        ? member.getPlayer().getStats().getEloScore() : 1200; 
        }
        return totalElo / team.getMembers().size();
    }
}
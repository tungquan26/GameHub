package btpoop.registration.service;

import btpoop.registration.model.Registration;
import btpoop.enums.RegistrationStatus;
import btpoop.user.model.Player; 
import btpoop.team.model.Team;
import btpoop.team.model.TeamMember;

import java.util.ArrayList;
import java.util.List;

public class MakeTeamModule {

    public MakeTeamModule() {
    }

    /**
     * @param soloPlayer Người chơi đang cần tìm đội
     * @param allRegistrations Danh sách toàn bộ các đăng ký của giải đấu
     * @return Danh sách các đội phù hợp để người chơi xin gia nhập
     */
    public List<Team> findSuitableTeams(Player soloPlayer, List<Registration> allRegistrations) {
        List<Team> suggestedTeams = new ArrayList<>();
        
        double playerElo = soloPlayer.getStats().getEloScore(); 

        for (Registration reg : allRegistrations) {
            if (reg.getStatus() == RegistrationStatus.PENDING) {
                Team team = reg.getTeam(); 
                
                if (team.getMembers().size() < 7) { 
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
        if (team.getMembers().isEmpty()) return 0.0;
        
        double totalElo = 0;
        for (TeamMember member : team.getMembers()) {
            totalElo += member.getPlayer().getStats().getEloScore(); 
        }
        
        return totalElo / team.getMembers().size();
    }
}
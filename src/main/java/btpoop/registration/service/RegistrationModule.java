package btpoop.registration.service;

import btpoop.registration.model.Registration;
import btpoop.enums.CheckInStatus;
import btpoop.enums.RegistrationStatus;
import btpoop.team.model.Team;
import btpoop.tournament.model.Tournament;
import btpoop.registration.repository.RegistrationRepository;
import btpoop.tournament.repository.TournamentRepository;
import btpoop.enums.TournamentStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RegistrationModule {

    private final RegistrationRepository registrationRepository;
    private final TournamentRepository tournamentRepository;

    public Registration registerTeamForTournament(Team team, Tournament tournament, boolean isPrivateMode) {
        long currentTeams = registrationRepository.countByTournament(tournament);

        if (currentTeams >= 16) {
            tournament.setStatus(TournamentStatus.REGISTRATION_CLOSED);
            tournamentRepository.save(tournament);
            throw new RuntimeException("Giải đấu đã đủ 16 đội, hệ thống đã khóa đăng ký.");
        }

        Registration newRegistration = new Registration();
        newRegistration.setTeam(team);
        newRegistration.setTournament(tournament);
        newRegistration.setRegistrationDate(LocalDateTime.now());
        newRegistration.setCheckInStatus(CheckInStatus.NOT_CHECKED_IN);

        int currentMembers = team.getMembers() != null ? team.getMembers().size() : 0;

        if (currentMembers > 7) {
            newRegistration.setStatus(RegistrationStatus.REJECTED);
        } else if (currentMembers >= 5) {
            newRegistration.setStatus(RegistrationStatus.APPROVED);
        } else {
            newRegistration.setStatus(RegistrationStatus.PENDING);
        }

        // Lưu đăng ký vào cơ sở dữ liệu
        return registrationRepository.save(newRegistration);
    }
}
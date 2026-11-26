package btpoop.registration.service;

import btpoop.enums.CheckInStatus;
import btpoop.enums.RegistrationStatus;
import btpoop.enums.TeamStatus;
import btpoop.enums.TournamentStatus;
import btpoop.registration.model.Registration;
import btpoop.registration.repository.RegistrationRepository;
import btpoop.team.model.Team;
import btpoop.team.model.TeamMember;
import btpoop.team.repository.TeamRepository;
import btpoop.tournament.model.Tournament;
import jakarta.persistence.EntityManager;
import btpoop.tournament.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Objects;
import java.util.TreeMap;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class RegistrationModule {
    private final EntityManager em;
    private final RegistrationRepository registrations;
    private final TeamRepository teams;
    private final TournamentRepository tournaments;
    private final ObjectMapper json;

    public record Entries(List<Team> teams, List<Registration> registrations, int occupied) {}

    public Entries entries(Tournament tournament) {
        var rows = registrations.findByTournamentOrderByRegistrationIdAsc(tournament);
        var snapshots = new HashSet<Long>();
        rows.stream()
                .forEach(row -> snapshots.add(row.getTeam().getTeamId()));
        var manual = em.createQuery("from Team where tournamentScope = :id order by teamId", Team.class)
                .setParameter("id", tournament.getTournamentId()).getResultList().stream()
                .filter(team -> team.getStatus() == TeamStatus.ACTIVE && !snapshots.contains(team.getTeamId())).toList();
        var teams = new TreeMap<Long, Team>();
        manual.forEach(team -> teams.put(team.getTeamId(), team));
        rows.stream().filter(row -> row.getStatus() == RegistrationStatus.APPROVED)
                .map(Registration::getTeam).forEach(team -> teams.put(team.getTeamId(), team));
        var occupied = new HashSet<>(teams.keySet());
        rows.stream().filter(RegistrationModule::isActive).forEach(row -> occupied.add(row.getTeam().getTeamId()));
        return new Entries(new ArrayList<>(teams.values()), rows, occupied.size());
    }

    public static boolean isActive(Registration row) {
        return row.getStatus() == RegistrationStatus.APPROVED || row.getStatus() == RegistrationStatus.PENDING;
    }

    public static long sourceId(Registration row) {
        return row.getSourceTeamId() == null ? row.getTeam().getTeamId() : row.getSourceTeamId();
    }

    public static boolean isCaptain(Registration row, long viewer) {
        return row.getCaptainUserId() != null ? row.getCaptainUserId() == viewer : isCaptain(row.getTeam(), viewer);
    }

    public static java.util.Collection<Long> memberIds(Registration row) {
        return row.getCaptainUserId() != null ? row.getRosterUserIds()
                : row.getTeam().getMembers().stream().map(member -> member.getPlayer().getUserId()).toList();
    }

    public void requireSlot(Entries entries) {
        if (entries.occupied() >= Tournament.MAX_TEAMS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Giải đấu đã đủ 8 đội.");
        }
    }

    public void validateRoster(Tournament tournament, int size) {
        var game = tournament.getGame();
        if (game == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ban tổ chức chưa chọn bộ môn thi đấu.");
        }
        int max = game.getMaxPlayers();
        if (tournament.getSettingsJson() != null) {
            var configured = json.readTree(tournament.getSettingsJson()).path("regSettings").path("maxTeamSize");
            max = Math.min(max, configured.asInt(max));
        }
        int min = game.getMinPlayers();
        if (max < min) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giới hạn quân số của giải thấp hơn yêu cầu của bộ môn.");
        }
        if (!game.acceptsTeamSize(size) || size > max) {
            String range = min == max ? Integer.toString(min) : min + " đến " + max;
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đội cần có " + range + " thành viên.");
        }
    }

    public void register(long tournamentId, long sourceTeamId, long actor) {
        var tournament = lockedTournament(tournamentId);
        var source = teams.findByIdForUpdate(sourceTeamId).orElse(null);
        if (source == null || source.getTournamentScope() != null || source.getStatus() != TeamStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đội cộng đồng đang hoạt động.");
        }
        if (!isCaptain(source, actor)) throw captainRequired();
        var entries = entries(tournament);
        var matching = entries.registrations().stream().filter(row -> sourceId(row) == sourceTeamId).toList();
        if (matching.stream().anyMatch(RegistrationModule::isActive)) return;
        requireOpen(tournament, actor);
        if (tournament.getGame() == null || source.getGame() == null
                || source.getGame().getGameId() != tournament.getGame().getGameId()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bộ môn của đội phải khớp với bộ môn của giải.");
        }
        var members = new LinkedHashMap<Long, TeamMember>();
        for (var member : source.getMembers()) members.putIfAbsent(member.getPlayer().getUserId(), member);
        validateRoster(tournament, members.size());
        requireSlot(entries);

        var registration = matching.stream().filter(row -> row.getStatus() == RegistrationStatus.CANCELLED
                && row.getSourceTeamId() != null).findFirst().orElseGet(Registration::new);
        var team = registration.getTeam();
        if (team == null) {
            team = new Team();
            team.setTeamName(UUID.randomUUID().toString());
            team.setTournamentScope(tournamentId);
        }
        team.setGame(source.getGame());
        team.setParticipantName(source.getTeamName());
        team.setParticipantMembers(new ArrayList<>(members.values().stream().map(member -> member.getPlayer().getUsername()).toList()));
        em.persist(team);
        registration.setTeam(team);
        registration.setSourceTeamId(sourceTeamId);
        registration.setCaptainUserId(actor);
        registration.getRosterUserIds().clear();
        registration.getRosterUserIds().addAll(members.keySet());
        registration.setTournament(tournament);
        registration.setRegistrationDate(LocalDateTime.now(Tournament.TIME_ZONE));
        registration.setCheckInStatus(CheckInStatus.NOT_CHECKED_IN);
        registration.setStatus(RegistrationStatus.APPROVED);
        registrations.save(registration);
    }

    public void cancel(long tournamentId, long sourceTeamId, long actor) {
        var tournament = lockedTournament(tournamentId);
        var entries = registrations.findByTournamentOrderByRegistrationIdAsc(tournament).stream()
                .filter(row -> sourceId(row) == sourceTeamId).toList();
        var active = entries.stream().filter(RegistrationModule::isActive).toList();
        var registration = (active.isEmpty() ? entries : active).stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Đội chưa đăng ký giải này."));
        if (!isCaptain(registration, actor)) throw captainRequired();
        if (active.isEmpty()) return;
        requireOpen(tournament, actor);
        var teams = active.stream().map(Registration::getTeam).toList();
        requireOutsideBracket(tournament, teams);
        active.forEach(row -> row.setStatus(RegistrationStatus.CANCELLED));
    }

    public void revoke(Tournament tournament, long entrantId) {
        var rows = registrations.findByTournamentOrderByRegistrationIdAsc(tournament).stream()
                .filter(row -> row.getTeam().getTeamId() == entrantId).toList();
        var team = rows.isEmpty() ? em.find(Team.class, entrantId) : rows.getFirst().getTeam();
        if (team == null || (rows.isEmpty() && !Objects.equals(team.getTournamentScope(), tournament.getTournamentId()))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đội trong giải này.");
        }
        var active = rows.stream().filter(RegistrationModule::isActive).toList();
        boolean manual = rows.isEmpty();
        if ((manual && team.getStatus() == TeamStatus.INACTIVE) || (!manual && active.isEmpty())) return;

        var status = tournament.statusAt(LocalDateTime.now(Tournament.TIME_ZONE));
        if (status != TournamentStatus.OPEN_REGISTRATION && status != TournamentStatus.REGISTRATION_CLOSED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chỉ có thể thu hồi suất trước khi giải bắt đầu và khi giải chưa bị hủy.");
        }
        requireOutsideBracket(tournament, List.of(team));
        if (manual) {
            team.setStatus(TeamStatus.INACTIVE);
        } else {
            active.forEach(row -> row.setStatus(RegistrationStatus.CANCELLED));
        }
    }

    private void requireOutsideBracket(Tournament tournament, List<Team> teams) {
        long matches = em.createQuery("""
                select count(m) from Match m where m.tournament = :tournament
                and (m.teamA in :teams or m.teamB in :teams)
                """, Long.class).setParameter("tournament", tournament).setParameter("teams", teams).getSingleResult();
        if (matches > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Đội đã được đưa vào nhánh đấu.");
        }
    }

    private Tournament lockedTournament(long id) {
        return tournaments.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private static boolean isCaptain(Team team, long actor) {
        return team.getCaptain() != null && team.getCaptain().getUserId() == actor;
    }

    private static ResponseStatusException captainRequired() {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ đội trưởng có thể đăng ký hoặc hủy đăng ký.");
    }

    private void requireOpen(Tournament tournament, long actor) {
        var now = LocalDateTime.now(Tournament.TIME_ZONE);
        if (tournament.getOrganizer().getUserId() == actor || tournament.statusAt(now) != TournamentStatus.OPEN_REGISTRATION) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Giải đấu hiện không nhận đăng ký đội.");
        }
        if (tournament.getSettingsJson() == null) return;
        var settings = json.readTree(tournament.getSettingsJson()).path("regSettings");
        if (!settings.isObject()) return;
        if (now.isBefore(LocalDateTime.parse(settings.path("registrationStartDate").asText()))
                || !now.isBefore(LocalDateTime.parse(settings.path("registrationEndDate").asText()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Giải đấu hiện nằm ngoài thời gian đăng ký.");
        }
    }
}

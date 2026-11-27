package btpoop.registration.service;

import btpoop.enums.CheckInStatus;
import btpoop.enums.RegistrationStatus;
import btpoop.enums.TeamStatus;
import btpoop.enums.TournamentStatus;
import btpoop.registration.model.Registration;
import btpoop.registration.repository.RegistrationRepository;
import btpoop.team.model.Team;
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

    public static java.util.Collection<Long> memberIds(Registration row) {
        return row.getSourceTeamId() != null || row.getCaptainUserId() != null ? row.getRosterUserIds()
                : row.getTeam().getMembers().stream().map(member -> member.getPlayer().getUserId()).toList();
    }

    public static boolean ready(Tournament tournament, Registration row) {
        return row.getStatus() == RegistrationStatus.APPROVED && tournament.getGame() != null
                && memberIds(row).size() >= tournament.getGame().getMinPlayers();
    }

    private void snapshotLegacyRoster(Registration row) {
        if (row.getSourceTeamId() == null) {
            var ids = List.copyOf(memberIds(row));
            row.setSourceTeamId(row.getTeam().getTeamId());
            row.getRosterUserIds().addAll(ids);
        }
    }

    public List<String> rosterNames(Registration row) {
        var ids = memberIds(row);
        if (ids.isEmpty()) return List.of();
        return em.createQuery("select u.username from User u where u.userId in :ids order by u.userId", String.class)
                .setParameter("ids", ids).getResultList();
    }

    public void requireSlot(Entries entries) {
        if (entries.occupied() >= Tournament.MAX_TEAMS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Giải đấu đã đủ 8 đội.");
        }
    }

    private int maximumSize(Tournament tournament) {
        int max = tournament.getGame().getMaxPlayers();
        if (tournament.getSettingsJson() != null) {
            var configured = json.readTree(tournament.getSettingsJson()).path("regSettings").path("maxTeamSize");
            max = Math.min(max, configured.asInt(max));
        }
        return max;
    }

    public void register(long tournamentId, long sourceTeamId, long actor) {
        var tournament = lockedTournament(tournamentId);
        var source = teams.findByIdForUpdate(sourceTeamId).orElse(null);
        if (source == null || source.getTournamentScope() != null || source.getStatus() != TeamStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đội cộng đồng đang hoạt động.");
        }
        boolean member = source.getMembers().stream().anyMatch(m -> m.getPlayer().getUserId() == actor);
        if (!member && (source.getCaptain() == null || source.getCaptain().getUserId() != actor)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn cần là thành viên của đội đã chọn.");
        }
        var entries = entries(tournament);
        var active = entries.registrations().stream().filter(RegistrationModule::isActive).toList();
        var current = active.stream().filter(row -> sourceId(row) == sourceTeamId).findFirst().orElse(null);
        if (current != null && memberIds(current).contains(actor)) return;
        for (var row : active) {
            if (memberIds(row).contains(actor)) {
                var team = row.getTeam();
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đang thi đấu cho đội "
                        + Objects.requireNonNullElse(team.getParticipantName(), team.getTeamName()) + ".");
            }
        }
        requireOpen(tournament, actor);
        if (tournament.getGame() == null || source.getGame() == null
                || source.getGame().getGameId() != tournament.getGame().getGameId()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bộ môn của đội phải khớp với bộ môn của giải.");
        }
        int max = maximumSize(tournament);
        if (max < tournament.getGame().getMinPlayers() || (current != null && memberIds(current).size() >= max)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Đội không còn chỗ đăng ký.");
        }
        Registration registration = current;
        if (registration == null) {
            requireSlot(entries);
            registration = reserveTeam(tournament, source, entries);
        } else {
            snapshotLegacyRoster(registration);
        }
        registration.getRosterUserIds().add(actor);
        updateParticipantNames(registration);
        registrations.save(registration);
    }

    private Registration reserveTeam(Tournament tournament, Team source, Entries entries) {
        var registration = entries.registrations().stream().filter(row -> sourceId(row) == source.getTeamId()
                && row.getStatus() == RegistrationStatus.CANCELLED && row.getTeam().getTournamentScope() != null)
                .findFirst().orElseGet(Registration::new);
        var team = registration.getTeam();
        if (team == null) {
            team = new Team();
            team.setTeamName(UUID.randomUUID().toString());
            team.setTournamentScope(tournament.getTournamentId());
            em.persist(team);
        }
        team.setGame(source.getGame());
        team.setParticipantName(source.getTeamName());
        registration.setTeam(team);
        registration.setSourceTeamId(source.getTeamId());
        registration.setCaptainUserId(source.getCaptain() == null ? null : source.getCaptain().getUserId());
        registration.getRosterUserIds().clear();
        registration.setTournament(tournament);
        registration.setRegistrationDate(LocalDateTime.now(Tournament.TIME_ZONE));
        registration.setCheckInStatus(CheckInStatus.NOT_CHECKED_IN);
        registration.setStatus(RegistrationStatus.APPROVED);
        return registration;
    }

    private void updateParticipantNames(Registration row) {
        if (row.getTeam().getTournamentScope() != null) row.getTeam().setParticipantMembers(rosterNames(row));
    }

    public void cancel(long tournamentId, long sourceTeamId, long actor) {
        var tournament = lockedTournament(tournamentId);
        var entries = registrations.findByTournamentOrderByRegistrationIdAsc(tournament).stream()
                .filter(row -> sourceId(row) == sourceTeamId).toList();
        var active = entries.stream().filter(RegistrationModule::isActive).toList();
        if (active.isEmpty()) return;
        requireOpen(tournament, actor);
        for (var row : active) {
            if (!memberIds(row).contains(actor)) continue;
            requireOutsideBracket(tournament, List.of(row.getTeam()));
            snapshotLegacyRoster(row);
            row.getRosterUserIds().remove(actor);
            updateParticipantNames(row);
            if (row.getRosterUserIds().isEmpty()) row.setStatus(RegistrationStatus.CANCELLED);
        }
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

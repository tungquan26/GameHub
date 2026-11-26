package btpoop.web.controller;

import btpoop.enums.RegistrationStatus;
import btpoop.enums.TournamentFormat;
import btpoop.enums.TournamentStatus;
import btpoop.game.repository.GameRepository;
import btpoop.registration.service.RegistrationModule;
import btpoop.tournament.model.Tournament;
import btpoop.tournament.repository.TournamentRepository;
import btpoop.user.controller.SessionUser;
import btpoop.user.model.User;
import jakarta.persistence.EntityManager;
import btpoop.user.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.core.type.TypeReference;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/website")
@Transactional
@RequiredArgsConstructor
public class WebsiteController {
    private final EntityManager em;
    private final TournamentRepository tournaments;
    private final UserRepository users;
    private final ObjectMapper json;
    private final GameRepository games;
    private final WebsiteBracket brackets;
    private final RegistrationModule registrations;
    private static final Set<String> SETTINGS = Set.of("venueAddress","venueLat","venueLon","contactType","contact",
        "profileImg","bannerImg","rules","gameInfo","regSettings","homepageLayout");
    private static final Set<String> PROFILE = Set.of("gamerTag","tagName","prefix","bio","displayPronouns","pronouns",
        "country","city","zipCode","phone","displayCityMode","birthday","email","avatarUrl","bannerUrl");

    private Map<String,Object> decode(String value) {
        return value == null ? new HashMap<>() : json.readValue(value, new TypeReference<HashMap<String,Object>>(){});
    }
    private void merge(Map<String,Object> target, Map<String,Object> patch, Set<String> allowed) {
        patch.forEach((key,value) -> { if (allowed.contains(key)) target.put(key,value); });
    }
    private Map<String,Object> profile(User user) {
        var view = decode(user.getProfileJson());
        view.put("id", user.getUserId());
        view.put("username", user.getUsername());
        view.putIfAbsent("email", user.getEmail());
        return view;
    }
    @GetMapping("/profile")
    public Map<String,Object> profile(HttpSession session) {
        return profile(em.find(User.class, SessionUser.id(session)));
    }
    @GetMapping("/profiles/{id}")
    @Transactional(readOnly = true)
    public Map<String,Object> publicProfile(@PathVariable long id) {
        var user = em.find(User.class, id);
        if (user == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);

        var saved = decode(user.getProfileJson());
        var view = new LinkedHashMap<String,Object>();
        view.put("id", user.getUserId());
        for (var key : List.of("gamerTag", "tagName", "prefix", "bio", "avatarUrl", "bannerUrl", "country")) {
            if (saved.get(key) instanceof String value && !value.isBlank()) view.put(key, value);
        }
        var tag = view.getOrDefault("gamerTag", view.getOrDefault("tagName", user.getUsername()));
        view.remove("gamerTag");
        view.put("tagName", tag);

        var displayCity = "Hiển thị thành phố".equals(saved.get("displayCityMode")) || "Display city".equals(saved.get("displayCityMode"));
        if (displayCity && saved.get("city") instanceof String city && !city.isBlank()) {
            view.put("city", city);
            view.put("displayCityMode", "Hiển thị thành phố");
        }
        if (Boolean.TRUE.equals(saved.get("displayPronouns")) && saved.get("pronouns") instanceof String pronouns && !pronouns.isBlank()) {
            view.put("pronouns", pronouns);
            view.put("displayPronouns", true);
        }
        return view;
    }
    @PatchMapping("/profile")
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Map<String,Object> profile(HttpSession session, @RequestBody Map<String,Object> patch) {
        var user = users.findByIdForUpdate(SessionUser.id(session))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        var data = decode(user.getProfileJson());
        merge(data, patch, PROFILE);
        user.setProfileJson(json.writeValueAsString(data));
        return profile(user);
    }
    private Tournament get(long id, boolean lock) {
        return (lock ? tournaments.findByIdForUpdate(id) : tournaments.findById(id))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
    private Map<String,Object> view(Tournament t, HttpSession session) {
        var data = decode(t.getSettingsJson());
        var entries = registrations.entries(t);
        Long viewer = session != null && session.getAttribute("userId") instanceof Long id ? id : null;
        Set<Long> viewerTeamIds = new HashSet<>();
        Set<Long> attendees = new HashSet<>();
        for (var row : entries.registrations()) {
            if (row.getStatus() != RegistrationStatus.APPROVED) continue;
            var roster = RegistrationModule.memberIds(row);
            attendees.addAll(roster);
            if (viewer != null && roster.contains(viewer)) viewerTeamIds.add(row.getTeam().getTeamId());
        }
        data.put("tournamentTeams", entries.teams().stream().map(team -> {
            var members = team.getParticipantMembers().isEmpty() ? team.getMembers().stream()
                    .map(member -> member.getPlayer().getUsername()).toList() : team.getParticipantMembers();
            return Map.of("id", team.getTeamId(), "name", Objects.requireNonNullElse(team.getParticipantName(), team.getTeamName()),
                    "members", members, "viewerMember", viewerTeamIds.contains(team.getTeamId()));
        }).toList());
        data.put("maxTeams", Tournament.MAX_TEAMS);
        data.put("teamCount", entries.occupied());
        if (viewer != null) {
            data.put("myTeamRegistrations", entries.registrations().stream().filter(RegistrationModule::isActive)
                    .filter(row -> RegistrationModule.isCaptain(row, viewer))
                    .map(row -> Map.of("teamId", RegistrationModule.sourceId(row), "entrantId", row.getTeam().getTeamId(),
                            "name", Objects.requireNonNullElse(row.getTeam().getParticipantName(), row.getTeam().getTeamName()),
                            "status", row.getStatus())).distinct().toList());
        }
        data.put("id",t.getTournamentId());
        data.put("name",t.getName());
        data.put("startDate",t.getStartDate());
        data.put("endDate",t.getEndDate());
        data.put("ownerId",t.getOrganizer().getUserId());
        data.put("game",t.getGame() == null ? "" : t.getGame().getName());
        if (t.getGame() != null) {
            data.put("teamMinPlayers", t.getGame().getMinPlayers());
            data.put("teamMaxPlayers", t.getGame().getMaxPlayers());
        }
        data.put("status",t.statusAt(LocalDateTime.now(Tournament.TIME_ZONE)));
        data.put("bracket",brackets.view(t.getTournamentId()));
        data.put("attendees", attendees.size());
        if (!viewerTeamIds.isEmpty()) {
            data.put("registrantId", viewer);
        }
        return data;
    }
    @GetMapping("/tournaments")
    public List<Map<String,Object>> list(jakarta.servlet.http.HttpServletRequest request) {
        var session = request.getSession(false);
        return em.createQuery("from Tournament order by tournamentId desc",Tournament.class).getResultList().stream()
            .map(t -> view(t,session)).toList();
    }
    @GetMapping("/tournaments/{id}")
    public Map<String,Object> detail(@PathVariable long id,jakarta.servlet.http.HttpServletRequest request) { return view(get(id,false),request.getSession(false)); }

    @PostMapping("/tournaments")
    public Map<String,Object> create(@RequestBody Map<String,Object> patch,HttpSession session) {
        var t = new Tournament();
        t.setOrganizer(em.getReference(User.class, SessionUser.id(session)));
        t.setStatus(TournamentStatus.OPEN_REGISTRATION);
        t.setFormat(TournamentFormat.SINGLE_ELIMINATION);
        apply(t,patch);
        em.persist(t);
        return view(t,session);
    }
    public record Participant(String name,List<String> members) {}
    @PostMapping("/tournaments/{id}/participants")
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Map<String,Object> participant(@PathVariable long id,@RequestBody Participant body,HttpSession session) {
        var t = get(id,true);
        SessionUser.require(session,t.getOrganizer().getUserId());
        if (body == null || body.name() == null || body.name().isBlank() || body.members() == null
                || body.members().stream().anyMatch(name -> name == null || name.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập tên đội và danh sách thành viên.");
        }
        var members = body.members().stream().map(String::strip).toList();
        registrations.validateRoster(t, members.size());
        var uniqueNames = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        uniqueNames.addAll(members);
        if (uniqueNames.size() != members.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên thành viên trong cùng một đội phải khác nhau.");
        }
        registrations.requireSlot(registrations.entries(t));
        var team = new btpoop.team.model.Team();
        team.setTournamentScope(id);
        team.setTeamName(UUID.randomUUID().toString());
        team.setParticipantName(body.name().strip());
        team.setParticipantMembers(new ArrayList<>(members));
        team.setGame(t.getGame());
        em.persist(team);
        var response = view(t,session);
        response.put("addedTeamId", team.getTeamId());
        return response;
    }
    @PatchMapping("/tournaments/{id}")
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Map<String,Object> update(@PathVariable long id,@RequestBody Map<String,Object> patch,HttpSession session) {
        var t = get(id,true);
        SessionUser.require(session,t.getOrganizer().getUserId());
        apply(t,patch);
        return view(t,session);
    }
    private void apply(Tournament t,Map<String,Object> patch) {
        if (patch.containsKey("name")) t.setName(Objects.toString(patch.get("name"), "").trim());
        try {
            if (patch.containsKey("startDate")) t.setStartDate(LocalDateTime.parse(patch.get("startDate").toString()));
            if (patch.containsKey("endDate")) t.setEndDate(LocalDateTime.parse(patch.get("endDate").toString()));
            if (t.getName()==null || t.getName().isBlank() || !t.getEndDate().isAfter(t.getStartDate())) throw new IllegalArgumentException();
            if (patch.get("gameInfo") instanceof Map<?,?> game) {
                var selected = games.findByName(String.valueOf(game.get("game")));
                if (selected == null) throw new IllegalArgumentException();
                t.setGame(selected);
                t.setFormat(TournamentFormat.valueOf(String.valueOf(game.get("format"))));
            }
        } catch (RuntimeException ex) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Thông tin giải không hợp lệ"); }
        var settings = decode(t.getSettingsJson());
        if (patch.containsKey("regSettings")) {
            if (!(patch.get("regSettings") instanceof Map<?,?> reg)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
            try {
                var start = LocalDateTime.parse(String.valueOf(reg.get("registrationStartDate")));
                var end = LocalDateTime.parse(String.valueOf(reg.get("registrationEndDate")));
                int max = Integer.parseInt(String.valueOf(reg.get("maxTeamSize")));
                int min = t.getGame() == null ? 1 : t.getGame().getMinPlayers();
                if (!end.isAfter(start) || max < min || max > 20) throw new IllegalArgumentException();
            } catch (RuntimeException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Cấu hình đăng ký không hợp lệ");
            }
        }
        merge(settings,patch,SETTINGS);
        t.setSettingsJson(json.writeValueAsString(settings));
    }
    public record RegistrationRequest(Long teamId) {}

    @PutMapping("/tournaments/{id}/registration")
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Map<String,Object> register(@PathVariable long id, @RequestBody RegistrationRequest body, HttpSession session) {
        long actor = SessionUser.id(session);
        if (body == null || body.teamId() == null || body.teamId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn đội đăng ký.");
        }
        registrations.register(id, body.teamId(), actor);
        return view(get(id, false), session);
    }

    @DeleteMapping("/tournaments/{id}/registration")
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Map<String,Object> cancelRegistration(@PathVariable long id, @RequestParam long teamId, HttpSession session) {
        registrations.cancel(id, teamId, SessionUser.id(session));
        return view(get(id, false), session);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> websiteError(ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode())
                .body(Map.of("message", Objects.requireNonNullElse(error.getReason(), "Yêu cầu không thể thực hiện.")));
    }
}

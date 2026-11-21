package btpoop.web.controller;

import btpoop.enums.TeamMemberRole;
import btpoop.game.repository.GameRepository;
import btpoop.team.model.*;
import btpoop.user.controller.SessionUser;
import btpoop.user.model.*;
import jakarta.persistence.*;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
import java.util.*;

@RestController
@RequestMapping("/api/website/teams")
@Transactional
@RequiredArgsConstructor
public class WebsiteTeamController {
    private final EntityManager em;
    private final GameRepository games;
    private final ObjectMapper json;
    public record Values(String name,String game,String logo,boolean recruiting) {}
    public record Action(String type,Long id,Values values,String applicantKey) {}

    private String tag(User u) {
        if (u.getProfileJson()!=null) {
            var profile = json.readTree(u.getProfileJson());
            for (var key : List.of("gamerTag", "tagName")) {
                var tag = profile.path(key).asText("");
                if (!tag.isBlank()) return tag;
            }
        }
        return u.getUsername();
    }
    private Map<String,Object> view(Team t,HttpSession session) {
        var members = new LinkedHashMap<String,String>();
        for (var m : t.getMembers()) members.put("id:"+m.getPlayer().getUserId(),tag(m.getPlayer()));
        var requests = new LinkedHashMap<String,String>();
        for (var id : t.getApplicants()) {
            var viewer = session==null ? null : session.getAttribute("userId");
            if (id.equals(viewer) || t.getCaptain().getUserId().equals(viewer))
                requests.put("id:"+id,tag(em.find(User.class,id)));
        }
        var data = new LinkedHashMap<String,Object>();
        data.put("id",t.getTeamId());
        data.put("name",t.getTeamName());
        data.put("captain",tag(t.getCaptain()));
        data.put("captainKey","id:"+t.getCaptain().getUserId());
        data.put("game",t.getGame().getName());
        data.put("members",members.values());
        data.put("memberIdentities",members);
        data.put("pendingRequests",requests.values());
        data.put("requestIdentities",requests);
        data.put("logo",t.getLogo());
        data.put("recruiting",t.isRecruiting());
        return data;
    }
    @GetMapping
    public List<Map<String,Object>> list(jakarta.servlet.http.HttpServletRequest request) {
        return listTeams(request.getSession(false));
    }
    private List<Map<String,Object>> listTeams(HttpSession session) {
        return em.createQuery("from Team where tournamentScope is null order by teamId desc",Team.class)
            .getResultList().stream().map(t -> view(t,session)).toList();
    }
    private void member(Team team,long user,TeamMemberRole role) {
        var m = new TeamMember();
        m.setTeam(team);
        m.setPlayer(em.getReference(Player.class,user));
        m.setRole(role);
        team.getMembers().add(m);
    }
    private boolean isFull(Team team) {
        return team.getGame() != null && team.getGame().getMaxPlayers() > 0
                && team.getMembers().size() >= team.getGame().getMaxPlayers();
    }
    @PostMapping
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public List<Map<String,Object>> act(@RequestBody Action a,HttpSession session) {
        long actor = SessionUser.id(session);
        boolean create = "create".equals(a.type());
        Team t = create ? new Team() : (Team) em.createNativeQuery(
                "select * from teams where team_id = :id for update", Team.class)
                .setParameter("id", a.id()).getSingleResultOrNull();
        if (t==null || t.getTournamentScope()!=null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        if (create) t.setCaptain(em.getReference(Player.class,actor));
        if (Set.of("edit","dissolve","accept","reject").contains(a.type())) SessionUser.require(session,t.getCaptain().getUserId());
        switch (a.type()) {
            case "create","edit" -> {
                var v=a.values();
                var game = v==null ? null : games.findByName(v.game());
                if (v==null || v.name()==null || v.name().isBlank() || game==null)
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
                t.setTeamName(v.name().trim());
                t.setGame(game);
                t.setRecruiting(v.recruiting());
                t.setLogo(v.logo());
                if (create) { member(t,actor,TeamMemberRole.CAPTAIN); em.persist(t); }
            }
            case "join" -> {
                if (!t.isRecruiting() || isFull(t) || t.getMembers().stream().anyMatch(m -> m.getPlayer().getUserId()==actor))
                    throw new ResponseStatusException(HttpStatus.CONFLICT);
                t.getApplicants().add(actor);
            }
            case "cancel" -> t.getApplicants().remove(actor);
            case "accept","reject" -> {
                if (a.applicantKey()==null || !a.applicantKey().matches("id:[0-9]+")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
                long applicant=Long.parseLong(a.applicantKey().substring(3));
                if ("accept".equals(a.type()) && isFull(t))
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Đội đã đủ người.");
                if (!t.getApplicants().remove(applicant)) throw new ResponseStatusException(HttpStatus.CONFLICT);
                if ("accept".equals(a.type())) member(t,applicant,TeamMemberRole.MEMBER);
            }
            case "leave" -> {
                if (t.getCaptain().getUserId()==actor) throw new ResponseStatusException(HttpStatus.CONFLICT);
                t.getMembers().removeIf(m -> m.getPlayer().getUserId()==actor);
            }
            case "dissolve" -> em.remove(t);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        em.flush();
        return listTeams(session);
    }
}

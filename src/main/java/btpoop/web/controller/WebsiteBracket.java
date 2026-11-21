package btpoop.web.controller;

import btpoop.bracket.model.*;
import btpoop.bracket.repository.BracketRepository;
import btpoop.enums.*;
import btpoop.match.model.Match;
import btpoop.match.model.MatchResult;
import btpoop.ranking.service.RankingService;
import btpoop.ranking.service.TournamentStandings;
import btpoop.registration.service.RegistrationModule;
import btpoop.team.model.Team;
import btpoop.tournament.model.Tournament;
import btpoop.tournament.repository.TournamentRepository;
import btpoop.user.controller.SessionUser;
import jakarta.persistence.*;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/website/tournaments")
@RequiredArgsConstructor
@Transactional
public class WebsiteBracket {
    private final EntityManager em;
    private final BracketRepository brackets;
    private final TournamentRepository tournaments;
    private final RankingService rankings;
    private final RegistrationModule registrations;
    record Side(long id) {}
    record Scores(int scoreA,int scoreB) {}
    record Game(Side teamA,Side teamB,String scheduledTime,Scores result) {}
    record Stage(List<Game> matches) {}
    record Draw(String bracketId,int bracketSize,List<Stage> rounds,Long revision) {}
    private static ResponseStatusException invalid() { return new ResponseStatusException(HttpStatus.BAD_REQUEST); }
    private Team participant(Side side, Map<Long, Team> teams) {
        if (side==null) return null;
        Team t=teams.get(side.id());
        if (t==null) throw invalid();
        return t;
    }
    private Object side(Team t) {
        return t==null ? null : Map.of("id",t.getTeamId(),"name",t.getParticipantName()==null?t.getTeamName():t.getParticipantName());
    }
    public Object view(long tournament) {
        return brackets.findByTournament_TournamentId(tournament).map(b -> {
            var stages=new ArrayList<Object>();
            int number=0;
            for (Round r:b.getRounds()) {
                var rows=new ArrayList<Object>();
                for (Match m:r.getMatches()) {
                    var row=new LinkedHashMap<String,Object>();
                    row.put("matchId",m.getMatchId()); row.put("matchNumber",++number);
                    row.put("roundNumber",r.getRoundNumber()); row.put("roundName",r.getName());
                    row.put("matchOrder",m.getMatchOrder()); row.put("scheduledTime",m.getScheduledTime());
                    row.put("status",m.getStatus()); row.put("teamA",side(m.getTeamA())); row.put("teamB",side(m.getTeamB()));
                    row.put("nextMatchId",m.getNextMatchId()); row.put("nextMatchSlot",m.getNextMatchSlot());
                    var score=m.getResult();
                    if (score!=null && score.getWinner()!=null) row.put("result",Map.of("scoreA",score.getScoreA(),"scoreB",score.getScoreB(),"winner",side(score.getWinner())));
                    rows.add(row);
                }
                stages.add(Map.of("roundId",r.getRoundId(),"roundNumber",r.getRoundNumber(),"name",r.getName(),"matches",rows));
            }
            return Map.of("bracketId",b.getBracketId(),"revision",b.getRevision(),"format",b.getFormat(),
                "bracketSize",number+1,"rounds",stages);
        }).orElse(null);
    }

    @GetMapping("/{id}/standings")
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public TournamentStandings.Result standings(@PathVariable long id) {
        var tournament = em.find(Tournament.class, id);
        if (tournament == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        if (tournament.getStatus() == TournamentStatus.CANCELLED) {
            return new TournamentStandings.Result(TournamentStandings.Status.UNAVAILABLE);
        }
        return brackets.findByTournament_TournamentId(id).map(TournamentStandings::calculate)
                .orElseGet(() -> new TournamentStandings.Result(TournamentStandings.Status.PENDING));
    }

    @PutMapping("/{id}/bracket")
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Object save(@PathVariable long id,@RequestBody Draw draw,HttpSession session,
                       @RequestParam(required=false) Long previousRevision, @RequestParam(required=false) Long previousId) {
        var t = tournaments.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        SessionUser.require(session,t.getOrganizer().getUserId());
        var eligibleTeams = new HashMap<Long, Team>();
        for (var team : registrations.entries(t).teams()) eligibleTeams.put(team.getTeamId(), team);
        int size=draw.bracketSize();
        if ((size!=4 && size!=8) || draw.rounds()==null || draw.rounds().size()!=Integer.numberOfTrailingZeros(size)) throw invalid();
        var old=brackets.findByTournament_TournamentId(id).orElse(null);
        if (old!=null && (previousRevision==null || !Objects.equals(previousId,old.getBracketId()) || old.getRevision()!=previousRevision)) throw new ResponseStatusException(HttpStatus.CONFLICT);
        boolean reuse = old!=null && String.valueOf(old.getBracketId()).equals(draw.bracketId());
        if (old!=null && !reuse) {
            for (Round r:old.getRounds()) for (Match m:r.getMatches()) m.setNextMatch(null);
            em.flush(); em.remove(old); em.flush();
        }
        var b=reuse ? old : new Bracket();
        if (reuse) {
            if (b.getRounds().size()!=draw.rounds().size()) throw invalid();
            b.setRevision(b.getRevision()+1);
        } else {
            b.setTournament(t);
            b.setFormat(TournamentFormat.SINGLE_ELIMINATION);
            em.persist(b);
        }
        List<Match> previous=List.of();
        var seen=new HashSet<Long>();
        for (int i=0;i<draw.rounds().size();i++) {
            var games=draw.rounds().get(i).matches();
            if (games==null || games.size()!=(size>>(i+1))) throw invalid();
            var r=reuse ? b.getRounds().get(i) : new Round(); r.setBracket(b); r.setRoundNumber(i+1);
            r.setName(switch(games.size()){case 1 -> "Chung kết"; case 2 -> "Bán kết"; default -> "Tứ kết";});
            if (!reuse) { em.persist(r); b.getRounds().add(r); }
            for (int j=0;j<games.size();j++) {
                var game=games.get(j); var m=reuse ? r.getMatches().get(j) : new Match(); m.setRound(r); m.setTournament(t); m.setMatchOrder(j);
                if (i==0) {
                    m.setTeamA(participant(game.teamA(),eligibleTeams)); m.setTeamB(participant(game.teamB(),eligibleTeams));
                    for (Team team:Arrays.asList(m.getTeamA(),m.getTeamB())) if (team!=null && !seen.add(team.getTeamId())) throw invalid();
                } else {
                    Match a=previous.get(j*2), c=previous.get(j*2+1);
                    m.setTeamA(a.getResult()==null?null:a.getResult().getWinner());
                    m.setTeamB(c.getResult()==null?null:c.getResult().getWinner());
                    a.setNextMatch(m); a.setNextMatchSlot("A"); c.setNextMatch(m); c.setNextMatchSlot("B");
                }
                if (game.scheduledTime()!=null && !game.scheduledTime().isBlank()) m.setScheduledTime(LocalDateTime.parse(game.scheduledTime()));
                m.setStatus(MatchStatus.SCHEDULED);
                m.setResult(null);
                var scores=game.result();
                if (scores!=null) {
                    if (m.getTeamA()==null || m.getTeamB()==null || scores.scoreA()<0 || scores.scoreB()<0 || scores.scoreA()==scores.scoreB()) throw invalid();
                    m.setResult(new MatchResult(scores.scoreA(),scores.scoreB(),scores.scoreA()>scores.scoreB()?m.getTeamA():m.getTeamB()));
                    m.setStatus(MatchStatus.COMPLETED);
                }
                if (!reuse) { em.persist(m); r.getMatches().add(m); }
            }
            previous=r.getMatches();
        }
        em.flush();
        rankings.rebuildTeamRankings(t);
        return view(id);
    }
}

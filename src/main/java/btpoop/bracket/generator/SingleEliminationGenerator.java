package btpoop.bracket.generator;

import btpoop.bracket.model.Bracket;
import btpoop.bracket.model.Round;
import btpoop.enums.MatchStatus;
import btpoop.match.model.Match;
import btpoop.team.model.Team;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class SingleEliminationGenerator implements BracketGenerator {

    @Override
    public void generateBracket(Bracket bracket, List<Team> teams) {
        if (teams.size() != 16) {
            throw new IllegalArgumentException("Giải đấu hiện tại yêu cầu chính xác 16 đội để bốc thăm.");
        }

        int numRounds = 4;
        int bracketSize = 16; 

        List<Round> rounds = new ArrayList<>();
        List<Team> shuffledTeams = new ArrayList<>(teams);
        Collections.shuffle(shuffledTeams); // Bốc thăm ngẫu nhiên

        int teamIndex = 0;

        for (int r = 1; r <= numRounds; r++) {
            Round round = new Round();
            round.setRoundNumber(r);
            round.setName(getRoundName(r));
            round.setBracket(bracket);

            int numMatchesInRound = bracketSize / (1 << r);
            List<Match> matches = new ArrayList<>();

            for (int m = 0; m < numMatchesInRound; m++) {
                Match match = new Match();
                match.setRound(round);
                match.setTournament(bracket.getTournament());
                match.setStatus(MatchStatus.SCHEDULED);

                // Chỉ điền 16 đội vào vòng 1, các vòng sau trống chờ đội thắng đi tiếp
                if (r == 1) {
                    match.setTeamA(shuffledTeams.get(teamIndex++));
                    match.setTeamB(shuffledTeams.get(teamIndex++));
                }
                
                matches.add(match);
            }
            round.setMatches(matches);
            rounds.add(round);
        }
        bracket.setRounds(rounds);
    }

    private String getRoundName(int currentRound) {
        if (currentRound == 4) return "Chung kết";
        if (currentRound == 3) return "Bán kết";
        if (currentRound == 2) return "Tứ kết";
        return "Vòng 1/8";
    }
}

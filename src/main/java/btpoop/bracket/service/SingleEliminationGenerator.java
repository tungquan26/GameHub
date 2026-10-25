package btpoop.bracket.service;

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
        if (teams == null || teams.size() < 2) {
            throw new IllegalArgumentException("Giải đấu yêu cầu tối thiểu 2 đội để bốc thăm nhánh đấu.");
        }

        int bracketSize = teams.size();
        if ((bracketSize & (bracketSize - 1)) != 0) {
            throw new IllegalArgumentException("Số lượng đội tham gia phải là lũy thừa của 2 (VD: 2, 4, 8, 16, 32). Hiện tại có: " + bracketSize + " đội.");
        }

        int numRounds = (int) (Math.log(bracketSize) / Math.log(2));

        List<Round> rounds = new ArrayList<>();
        List<List<Match>> roundMatchesList = new ArrayList<>();
        List<Team> shuffledTeams = new ArrayList<>(teams);
        Collections.shuffle(shuffledTeams); // Bốc thăm ngẫu nhiên

        int teamIndex = 0;

        for (int r = 1; r <= numRounds; r++) {
            Round round = new Round();
            round.setRoundNumber(r);
            round.setName(getRoundName(r, numRounds));
            round.setBracket(bracket);

            int numMatchesInRound = bracketSize / (1 << r);
            List<Match> matches = new ArrayList<>();

            for (int m = 0; m < numMatchesInRound; m++) {
                Match match = new Match();
                match.setRound(round);
                match.setTournament(bracket.getTournament());
                match.setStatus(MatchStatus.SCHEDULED);
                match.setMatchOrder(m);

                // Chỉ điền đội vào vòng 1, các vòng sau trống chờ đội thắng đi tiếp
                if (r == 1) {
                    match.setTeamA(shuffledTeams.get(teamIndex++));
                    match.setTeamB(shuffledTeams.get(teamIndex++));
                }

                matches.add(match);
            }
            round.setMatches(matches);
            rounds.add(round);
            roundMatchesList.add(matches);
        }

        // Liên kết các trận đấu sang vòng tiếp theo (Binary Tree Linking)
        for (int r = 0; r < numRounds - 1; r++) {
            List<Match> currentMatches = roundMatchesList.get(r);
            List<Match> nextMatches = roundMatchesList.get(r + 1);

            for (int m = 0; m < currentMatches.size(); m++) {
                Match currentMatch = currentMatches.get(m);
                Match nextMatch = nextMatches.get(m / 2);
                currentMatch.setNextMatch(nextMatch);
                currentMatch.setNextMatchSlot(m % 2 == 0 ? "A" : "B");
            }
        }

        bracket.setRounds(rounds);
    }

    private String getRoundName(int currentRound, int totalRounds) {
        if (currentRound == totalRounds) return "Chung kết";
        if (currentRound == totalRounds - 1) return "Bán kết";
        if (currentRound == totalRounds - 2) return "Tứ kết";
        if (currentRound == totalRounds - 3) return "Vòng 1/8";
        return "Vòng " + currentRound;
    }
}

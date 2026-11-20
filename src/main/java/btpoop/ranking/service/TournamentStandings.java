package btpoop.ranking.service;

import btpoop.bracket.model.Bracket;
import btpoop.enums.MatchStatus;
import btpoop.enums.TournamentFormat;
import btpoop.match.model.Match;
import btpoop.team.model.Team;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class TournamentStandings {
    public enum Status { PENDING, FINAL, UNAVAILABLE }

    public record Row(int rank, long teamId, String teamName, String roundReached,
                      int matchesPlayed, int wins, int losses) {}

    public record Result(Status status, List<Row> rows) {
        public Result(Status status) {
            this(status, List.of());
        }
    }

    private record Eliminated(String roundName, List<Long> teams) {}

    private TournamentStandings() {}

    public static Result calculate(Bracket bracket) {
        var rounds = bracket.getRounds();
        if (bracket.getFormat() != TournamentFormat.SINGLE_ELIMINATION || rounds.size() < 2 || rounds.size() > 3) {
            return new Result(Status.UNAVAILABLE);
        }

        var teams = new HashMap<Long, Team>();
        var wins = new HashMap<Long, Integer>();
        var eliminated = new ArrayList<Eliminated>();
        Set<Long> previousWinners = Set.of();
        long tournamentId = bracket.getTournament().getTournamentId();
        for (int index = 0; index < rounds.size(); index++) {
            var round = rounds.get(index);
            int matchesInRound = 1 << (rounds.size() - index - 1);
            if (round.getMatches().size() != matchesInRound) return new Result(Status.PENDING);

            var participants = new HashSet<Long>();
            var roundWinners = new HashSet<Long>();
            var roundLosers = new ArrayList<Long>();
            for (var match : round.getMatches()) {
                if (!hasValidResult(match, tournamentId)) return new Result(Status.PENDING);
                var teamA = match.getTeamA();
                var teamB = match.getTeamB();
                long a = teamA.getTeamId();
                long b = teamB.getTeamId();
                if (!participants.add(a) || !participants.add(b)) return new Result(Status.PENDING);

                long winner = match.getResult().getWinner().getTeamId();
                roundWinners.add(winner);
                roundLosers.add(winner == a ? b : a);
                wins.merge(winner, 1, Integer::sum);
                teams.putIfAbsent(a, teamA);
                teams.putIfAbsent(b, teamB);
            }
            if (index > 0 && !participants.equals(previousWinners)) return new Result(Status.PENDING);

            roundLosers.sort(Long::compare);
            eliminated.add(new Eliminated(round.getName(), roundLosers));
            previousWinners = roundWinners;
        }

        var rows = new ArrayList<Row>();
        long champion = previousWinners.iterator().next();
        rows.add(row(1, teams.get(champion), rounds.getLast().getName(), wins, 0));
        for (var group : eliminated.reversed()) {
            int rank = rows.size() + 1;
            for (long id : group.teams()) rows.add(row(rank, teams.get(id), group.roundName(), wins, 1));
        }
        return new Result(Status.FINAL, List.copyOf(rows));
    }

    private static boolean hasValidResult(Match match, long tournamentId) {
        var result = match.getResult();
        if (match.getStatus() != MatchStatus.COMPLETED || match.getTournament().getTournamentId() != tournamentId
                || match.getTeamA() == null || match.getTeamB() == null || result == null || result.getWinner() == null
                || result.getScoreA() < 0 || result.getScoreB() < 0 || result.getScoreA() == result.getScoreB()) {
            return false;
        }
        var scoredWinner = result.getScoreA() > result.getScoreB() ? match.getTeamA() : match.getTeamB();
        return result.getWinner().getTeamId() == scoredWinner.getTeamId();
    }

    private static Row row(int rank, Team team, String roundName, Map<Long, Integer> wins, int losses) {
        int teamWins = wins.getOrDefault(team.getTeamId(), 0);
        String name = team.getParticipantName();
        if (name == null || name.isBlank()) name = team.getTeamName();
        return new Row(rank, team.getTeamId(), name, roundName, teamWins + losses, teamWins, losses);
    }
}

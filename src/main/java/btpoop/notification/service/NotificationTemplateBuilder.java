package btpoop.notification.service;

import btpoop.match.model.Match;
import btpoop.team.model.Team;
import java.util.Objects;
import java.time.format.DateTimeFormatter;

public class NotificationTemplateBuilder {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public static String buildMatchReminderMessage(Match match) {
        String tournamentName = (match.getTournament() != null) ? match.getTournament().getName() : "N/A";
        String roundName = (match.getRound() != null) ? match.getRound().getName() : "N/A";
        String teamAName = teamName(match.getTeamA());
        String teamBName = teamName(match.getTeamB());
        String timeStr = (match.getScheduledTime() != null) ? match.getScheduledTime().format(FORMATTER) : "Chưa cập nhật";
        String locationStr = (match.getLocation() != null && !match.getLocation().isBlank()) ? match.getLocation() : "Chưa cập nhật";

        return String.format(
                "Chi tiết trận đấu:\n" +
                "- Giải đấu: %s\n" +
                "- Vòng/Nhánh: %s\n" +
                "- Cặp đấu: %s VS %s\n" +
                "- Thời gian: %s\n" +
                "- Địa điểm: %s\n",
                tournamentName, roundName, teamAName, teamBName, timeStr, locationStr
        );
    }
    private static String teamName(Team team) {
        return team == null ? "Chưa xác định" : Objects.requireNonNullElse(team.getParticipantName(), team.getTeamName());
    }
}

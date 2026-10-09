package btpoop.notification.util;

import btpoop.match.model.Match;

public class NotificationTemplateBuilder {
    public static String buildMatchReminderMessage(Match match) {
        String locationStr = (match.getLocation() != null) ? match.getLocation() : "Chưa cập nhật";
        String roundName = (match.getRound() != null) ? match.getRound().getName() : "N/A";
        String tournamentName = (match.getTournament() != null) ? match.getTournament().getName() : "N/A";

        return String.format(
                "Chi tiết trận đấu:\n" +
                "- Giải đấu: %s\n" +
                "- Vòng/Nhánh: %s\n" +
                "- Thời gian: %s\n" +
                "- Địa điểm: %s\n",
                tournamentName, roundName, match.getScheduledTime().toString(), locationStr
        );
    }
}

package btpoop.notification.service;

import btpoop.match.model.Match;
import btpoop.match.repository.MatchRepository;
import btpoop.team.model.TeamMember;
import btpoop.user.model.Player;
import btpoop.notification.util.NotificationTemplateBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class NotificationScheduler {

    private final MatchRepository matchRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    // Chạy mỗi giờ một lần (ví dụ: 0 phút 0 giây mỗi giờ)
    @Scheduled(cron = "0 0 * * * *")
    public void scheduleMatchNotifications() {
        LocalDateTime now = LocalDateTime.now();

        // 1 week notification
        LocalDateTime oneWeekStart = now.plusDays(7);
        LocalDateTime oneWeekEnd = oneWeekStart.plusHours(1);
        List<Match> matches1Week = matchRepository.findByScheduledTimeBetweenAndNotified1WeekFalse(oneWeekStart, oneWeekEnd);
        for (Match match : matches1Week) {
            sendNotificationToTeams(match, "Nhắc nhở: Trận đấu của bạn sẽ diễn ra sau 1 tuần");
            match.setNotified1Week(true);
            matchRepository.save(match);
        }

        // 1 day notification
        LocalDateTime oneDayStart = now.plusDays(1);
        LocalDateTime oneDayEnd = oneDayStart.plusHours(1);
        List<Match> matches1Day = matchRepository.findByScheduledTimeBetweenAndNotified1DayFalse(oneDayStart, oneDayEnd);
        for (Match match : matches1Day) {
            sendNotificationToTeams(match, "Nhắc nhở: Trận đấu của bạn sẽ diễn ra vào ngày mai");
            match.setNotified1Day(true);
            matchRepository.save(match);
        }

        // 1 hour notification
        LocalDateTime oneHourStart = now.plusHours(1);
        LocalDateTime oneHourEnd = oneHourStart.plusHours(1);
        List<Match> matches1Hour = matchRepository.findByScheduledTimeBetweenAndNotified1HourFalse(oneHourStart, oneHourEnd);
        for (Match match : matches1Hour) {
            sendNotificationToTeams(match, "Nhắc nhở: Trận đấu của bạn sẽ diễn ra sau 1 tiếng nữa");
            match.setNotified1Hour(true);
            matchRepository.save(match);
        }
    }

    private void sendNotificationToTeams(Match match, String title) {
        String message = NotificationTemplateBuilder.buildMatchReminderMessage(match);

        if (match.getTeamA() != null) {
            for (TeamMember member : match.getTeamA().getMembers()) {
                notifyPlayer(member.getPlayer(), title, message);
            }
        }

        if (match.getTeamB() != null) {
            for (TeamMember member : match.getTeamB().getMembers()) {
                notifyPlayer(member.getPlayer(), title, message);
            }
        }
    }

    private void notifyPlayer(Player player, String title, String message) {
        // Lưu thông báo vào CSDL
        notificationService.createNotification(player.getUserId(), title, message);
        // Gửi qua Email
        if (player.getEmail() != null && !player.getEmail().isEmpty()) {
            emailService.sendEmail(player.getEmail(), title, message);
        }
    }
}

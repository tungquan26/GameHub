package btpoop.notification.service;

import btpoop.match.model.Match;
import btpoop.match.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class NotificationScheduler {

    private final MatchRepository matchRepository;
    private final NotificationService notificationService;

    // Chạy mỗi giờ một lần (ví dụ: 0 phút 0 giây mỗi giờ)
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void scheduleMatchNotifications() {
        LocalDateTime now = LocalDateTime.now();

        // 1 week notification
        LocalDateTime oneWeekStart = now.plusDays(7);
        LocalDateTime oneWeekEnd = oneWeekStart.plusHours(1);
        List<Match> matches1Week = matchRepository.findByScheduledTimeBetweenAndNotified1WeekFalse(oneWeekStart, oneWeekEnd);
        for (Match match : matches1Week) {
            notificationService.sendNotificationToTeams(match, "Nhắc nhở: Trận đấu của bạn sẽ diễn ra sau 1 tuần");
            match.setNotified1Week(true);
            matchRepository.save(match);
        }

        // 1 day notification
        LocalDateTime oneDayStart = now.plusDays(1);
        LocalDateTime oneDayEnd = oneDayStart.plusHours(1);
        List<Match> matches1Day = matchRepository.findByScheduledTimeBetweenAndNotified1DayFalse(oneDayStart, oneDayEnd);
        for (Match match : matches1Day) {
            notificationService.sendNotificationToTeams(match, "Nhắc nhở: Trận đấu của bạn sẽ diễn ra vào ngày mai");
            match.setNotified1Day(true);
            matchRepository.save(match);
        }

        // 1 hour notification
        LocalDateTime oneHourStart = now.plusHours(1);
        LocalDateTime oneHourEnd = oneHourStart.plusHours(1);
        List<Match> matches1Hour = matchRepository.findByScheduledTimeBetweenAndNotified1HourFalse(oneHourStart, oneHourEnd);
        for (Match match : matches1Hour) {
            notificationService.sendNotificationToTeams(match, "Nhắc nhở: Trận đấu của bạn sẽ diễn ra sau 1 tiếng nữa");
            match.setNotified1Hour(true);
            matchRepository.save(match);
        }
    }
}

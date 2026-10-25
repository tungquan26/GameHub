package btpoop.notification.service;

import btpoop.match.model.Match;
import btpoop.match.model.MatchScheduledEvent;
import btpoop.match.repository.MatchRepository;
import btpoop.notification.model.Notification;
import btpoop.notification.repository.NotificationRepository;
import btpoop.team.model.TeamMember;
import btpoop.user.model.Player;
import btpoop.user.model.User;
import btpoop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final MatchRepository matchRepository;
    private final EmailService emailService;

    @Override
    public Notification createNotification(Long userId, String title, String message) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRead(false);
        
        return notificationRepository.save(notification);
    }

    @Override
    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUser_UserId(userId);
    }

    @Override
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void sendNotificationToTeams(Match match, String title) {
        if (match == null) return;
        String message = NotificationTemplateBuilder.buildMatchReminderMessage(match);

        if (match.getTeamA() != null && match.getTeamA().getMembers() != null) {
            for (TeamMember member : match.getTeamA().getMembers()) {
                notifyPlayer(member.getPlayer(), title, message);
            }
        }

        if (match.getTeamB() != null && match.getTeamB().getMembers() != null) {
            for (TeamMember member : match.getTeamB().getMembers()) {
                notifyPlayer(member.getPlayer(), title, message);
            }
        }
    }

    @EventListener
    @Transactional
    public void handleMatchScheduledEvent(MatchScheduledEvent event) {
        if (event == null || event.getMatchId() == null) return;
        Match match = matchRepository.findById(event.getMatchId()).orElse(null);
        if (match != null) {
            sendNotificationToTeams(match, "Thông báo: Lịch thi đấu mới đã được cập nhật");
        }
    }

    private void notifyPlayer(Player player, String title, String message) {
        if (player == null) return;
        createNotification(player.getUserId(), title, message);
        if (player.getEmail() != null && !player.getEmail().isBlank()) {
            emailService.sendEmail(player.getEmail(), title, message);
        }
    }
}

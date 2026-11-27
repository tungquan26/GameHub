package btpoop.notification.service;

import btpoop.match.model.Match;
import btpoop.tournament.model.Tournament;
import btpoop.match.model.MatchScheduledEvent;
import btpoop.match.repository.MatchRepository;
import btpoop.notification.model.Notification;
import btpoop.notification.repository.NotificationRepository;
import btpoop.team.model.Team;
import btpoop.registration.model.Registration;
import btpoop.registration.repository.RegistrationRepository;
import btpoop.registration.service.RegistrationModule;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.event.TransactionalEventListener;
import java.util.LinkedHashSet;
import java.util.Set;
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
    private final RegistrationRepository registrations;
    private final ApplicationEventPublisher events;

    private record ScheduledEmail(String to, String title, String message) {}

    @Override
    public Notification createNotification(Long userId, String title, String message) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return saveNotification(user, title, message);
    }

    private Notification saveNotification(User user, String title, String message) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setCreatedAt(LocalDateTime.now(Tournament.TIME_ZONE));
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

        var recipients = new LinkedHashSet<Long>();
        if (match.getTournament() == null) return;
        var rows = registrations.findByTournamentOrderByRegistrationIdAsc(match.getTournament());
        addRecipients(match.getTeamA(), rows, recipients);
        addRecipients(match.getTeamB(), rows, recipients);
        for (var user : userRepository.findAllById(recipients)) {
            saveNotification(user, title, message);
            if (user.getEmail() != null && !user.getEmail().isBlank()) {
                events.publishEvent(new ScheduledEmail(user.getEmail(), title, message));
            }
        }
    }

    private void addRecipients(Team team, List<Registration> rows, Set<Long> recipients) {
        if (team == null) return;
        var matching = rows.stream().filter(row -> row.getTeam().getTeamId() == team.getTeamId()).toList();
        if (matching.isEmpty()) {
            team.getMembers().forEach(member -> recipients.add(member.getPlayer().getUserId()));
        } else {
            matching.stream().filter(RegistrationModule::isActive)
                    .forEach(row -> recipients.addAll(RegistrationModule.memberIds(row)));
        }
    }

    @TransactionalEventListener
    public void deliverEmail(ScheduledEmail email) {
        emailService.sendEmail(email.to(), email.title(), email.message());
    }

    @EventListener
    @Transactional
    public void handleMatchScheduledEvent(MatchScheduledEvent event) {
        if (event == null || event.matchId() == null) return;
        Match match = matchRepository.findById(event.matchId()).orElse(null);
        if (match != null) {
            sendNotificationToTeams(match, "Thông báo: Lịch thi đấu mới đã được cập nhật");
        }
    }

}

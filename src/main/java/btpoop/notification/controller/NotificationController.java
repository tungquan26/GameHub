package btpoop.notification.controller;

import btpoop.notification.model.Notification;
import btpoop.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final btpoop.notification.repository.NotificationRepository notifications;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getUserNotifications(@PathVariable Long userId, jakarta.servlet.http.HttpSession session) {
        btpoop.user.controller.SessionUser.require(session, userId);
        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, jakarta.servlet.http.HttpSession session) {
        var item = notifications.findById(id).orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND));
        btpoop.user.controller.SessionUser.require(session, item.getUser().getUserId());
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }
}

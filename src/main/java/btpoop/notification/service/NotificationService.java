package btpoop.notification.service;

import btpoop.notification.model.Notification;
import java.util.List;

public interface NotificationService {
    Notification createNotification(Long userId, String title, String message);
    List<Notification> getUserNotifications(Long userId);
    void markAsRead(Long notificationId);
}

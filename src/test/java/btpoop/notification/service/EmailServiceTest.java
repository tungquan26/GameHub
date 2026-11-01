package btpoop.notification.service;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EmailServiceTest {

    private final JavaMailSender sender = mock(JavaMailSender.class);
    private final EmailService service = new EmailService(sender, "sender@example.com");

    @Test
    void sendsRequiredEmailWithConfiguredSender() {
        service.sendRequiredEmail("recipient@example.com", "OTP", "Test message");

        var message = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(sender).send(message.capture());
        assertArrayEquals(new String[]{"recipient@example.com"}, message.getValue().getTo());
        assertEquals("sender@example.com", message.getValue().getFrom());
        assertEquals("OTP", message.getValue().getSubject());
        assertEquals("Test message", message.getValue().getText());
    }

    @Test
    void reportsMissingSenderBeforeConnectingToSmtp() {
        var unconfigured = new EmailService(sender, " ");

        var error = assertThrows(IllegalStateException.class,
                () -> unconfigured.sendRequiredEmail("recipient@example.com", "OTP", "Test"));

        assertTrue(error.getMessage().contains("chưa cấu hình"));
        verifyNoInteractions(sender);
    }

    @Test
    void reportsAuthenticationFailureWithoutExposingSmtpDetails() {
        doThrow(new MailAuthenticationException("private SMTP details"))
                .when(sender).send(any(SimpleMailMessage.class));

        var error = assertThrows(IllegalStateException.class,
                () -> service.sendRequiredEmail("recipient@example.com", "OTP", "Test"));

        assertTrue(error.getMessage().contains("đăng nhập"));
        assertFalse(error.getMessage().contains("private SMTP details"));
    }

    @Test
    void propagatesRequiredDeliveryFailure() {
        doThrow(new MailSendException("private SMTP details"))
                .when(sender).send(any(SimpleMailMessage.class));

        var error = assertThrows(IllegalStateException.class,
                () -> service.sendRequiredEmail("recipient@example.com", "OTP", "Test"));

        assertTrue(error.getMessage().contains("Không thể gửi email"));
        assertFalse(error.getMessage().contains("private SMTP details"));
    }

    @Test
    void keepsReminderEmailFailureFromInterruptingApplicationNotifications() {
        doThrow(new MailSendException("SMTP unavailable"))
                .when(sender).send(any(SimpleMailMessage.class));

        assertDoesNotThrow(() -> service.sendEmail("recipient@example.com", "Reminder", "Test"));
        verify(sender).send(any(SimpleMailMessage.class));
    }
}

package btpoop.notification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;
    private final String fromEmail;
    private final Optional<BrevoEmailSender> brevo;

    public EmailService(JavaMailSender mailSender, @Value("${spring.mail.username:}") String fromEmail,
                        Optional<BrevoEmailSender> brevo) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
        this.brevo = brevo;
    }

    public void sendEmail(String to, String subject, String text) {
        try {
            sendRequiredEmail(to, subject, text);
        } catch (IllegalStateException e) {
            // Thông báo trong ứng dụng vẫn được giữ nếu email nhắc lịch thất bại.
            logger.error("Lỗi khi gửi email tới {}: {}", to, e.getMessage());
        }
    }

    public void sendRequiredEmail(String to, String subject, String text) {
        if (brevo.isPresent()) {
            brevo.get().send(to, subject, text);
            return;
        }
        if (fromEmail == null || fromEmail.isBlank()) {
            throw new IllegalStateException("Máy chủ chưa cấu hình gửi email. Vui lòng liên hệ quản trị viên.");
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        try {
            mailSender.send(message);
            logger.info("Đã gửi email xác nhận thành công tới {}", to);
        } catch (MailAuthenticationException e) {
            logger.error("SMTP từ chối thông tin đăng nhập khi gửi email tới {}", to);
            throw new IllegalStateException("Máy chủ không thể đăng nhập dịch vụ email. Vui lòng liên hệ quản trị viên.", e);
        } catch (MailException e) {
            logger.error("Không thể gửi email tới {} ({})", to, e.getClass().getSimpleName());
            throw new IllegalStateException("Không thể gửi email lúc này. Vui lòng thử lại sau.", e);
        }
    }
}

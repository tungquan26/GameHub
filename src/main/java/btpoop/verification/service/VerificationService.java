package btpoop.verification.service;

import btpoop.notification.service.EmailService;
import btpoop.user.model.User;
import btpoop.user.repository.UserRepository;
import btpoop.verification.model.VerificationToken;
import btpoop.verification.model.VerificationType;
import btpoop.verification.repository.VerificationTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class VerificationService {

    private final VerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public void generateAndSendToken(String email, VerificationType type) {
        VerificationToken tokenEntity = tokenRepository.findByEmailAndType(email, type);
        LocalDateTime now = LocalDateTime.now();

        if (tokenEntity == null) {
            tokenEntity = new VerificationToken();
            tokenEntity.setEmail(email);
            tokenEntity.setType(type);
            tokenEntity.setDailyRequestCount(0);
        }

        if (tokenEntity.getLastRequestDate() != null && tokenEntity.getLastRequestDate().toLocalDate().isBefore(LocalDate.now())) {
            tokenEntity.setDailyRequestCount(0);
        }

        if (tokenEntity.getDailyRequestCount() >= 5) {
            throw new RuntimeException("Bạn đã vượt quá số lần yêu cầu gửi mã trong ngày (tối đa 5 lần).");
        }

        if (tokenEntity.getLastRequestDate() != null) {
            long minutesSinceLastRequest = ChronoUnit.MINUTES.between(tokenEntity.getLastRequestDate(), now);
            if (minutesSinceLastRequest < 1) {
                throw new RuntimeException("Vui lòng đợi ít nhất 1 phút trước khi yêu cầu mã mới.");
            }
        }

        String code = String.format("%06d", new Random().nextInt(1000000));
        tokenEntity.setToken(code);
        tokenEntity.setCreatedAt(now);
        tokenEntity.setExpiresAt(now.plusMinutes(10));
        tokenEntity.setLastRequestDate(now);
        tokenEntity.setDailyRequestCount(tokenEntity.getDailyRequestCount() + 1);

        tokenRepository.save(tokenEntity);

        String subject = type == VerificationType.EMAIL_ACTIVATION 
                ? "Mã xác nhận đăng ký Game Hub" 
                : "Mã khôi phục mật khẩu Game Hub";
        
        String text = "Mã xác nhận của bạn là: " + code + "\nMã này có hiệu lực trong 10 phút.";
        emailService.sendEmail(email, subject, text);
    }

    public boolean verifyEmailActivation(String email, String code) {
        VerificationToken tokenEntity = tokenRepository.findByEmailAndType(email, VerificationType.EMAIL_ACTIVATION);
        validateToken(tokenEntity, code);

        User user = userRepository.findByEmail(email);
        if (user != null) {
            user.setIsVerified(true);
            userRepository.save(user);
        }

        tokenRepository.delete(tokenEntity);
        return true;
    }

    private void validateToken(VerificationToken tokenEntity, String code) {
        if (tokenEntity == null) {
            throw new RuntimeException("Không tìm thấy yêu cầu xác nhận cho email này.");
        }
        if (LocalDateTime.now().isAfter(tokenEntity.getExpiresAt())) {
            throw new RuntimeException("Mã xác nhận đã hết hạn.");
        }
        if (!tokenEntity.getToken().equals(code)) {
            throw new RuntimeException("Mã xác nhận không chính xác.");
        }
    }
}

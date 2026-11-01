package btpoop.verification;

import btpoop.notification.service.EmailService;
import btpoop.user.model.User;
import btpoop.user.repository.UserRepository;
import btpoop.user.service.UserService;
import btpoop.verification.model.VerificationToken;
import btpoop.verification.model.VerificationType;
import btpoop.verification.repository.VerificationTokenRepository;
import btpoop.verification.service.VerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest(properties = {
        "spring.main.web-application-type=none",
        "spring.datasource.url=jdbc:h2:mem:otp-delivery-tests;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "logging.level.root=WARN",
        "management.health.mail.enabled=false"
})
class OtpDeliveryTest {

    @Autowired private UserService userService;
    @Autowired private VerificationService verificationService;
    @Autowired private UserRepository userRepository;
    @Autowired private VerificationTokenRepository tokenRepository;
    @MockitoBean private EmailService emailService;

    @BeforeEach
    void cleanDatabase() {
        tokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void failedRegistrationDeliveryRollsBackUserAndToken() {
        failDelivery();

        assertThrows(IllegalStateException.class, () -> userService.register(newUser()));

        assertNull(userRepository.findByEmail("otp@example.com"));
        assertNull(tokenRepository.findByEmailAndType("otp@example.com", VerificationType.EMAIL_ACTIVATION));
    }

    @Test
    void successfulRegistrationPersistsUserAndDeliveredToken() {
        User registered = userService.register(newUser());

        var token = tokenRepository.findByEmailAndType("otp@example.com", VerificationType.EMAIL_ACTIVATION);
        assertNotNull(userRepository.findById(registered.getUserId()).orElse(null));
        assertFalse(registered.getIsVerified());
        assertNotEquals("password123", registered.getPassword());
        assertNotNull(token);
        assertTrue(token.getToken().matches("[0-9]{6}"));
        assertEquals(1, token.getDailyRequestCount());
        verify(emailService).sendRequiredEmail(eq("otp@example.com"), anyString(), contains(token.getToken()));
    }

    @Test
    void failedResendKeepsPreviousCodeAndDoesNotConsumeAnotherRequest() {
        var previous = new VerificationToken();
        var requestedAt = LocalDateTime.now().minusMinutes(2).withNano(0);
        previous.setEmail("otp@example.com");
        previous.setType(VerificationType.EMAIL_ACTIVATION);
        previous.setToken("123456");
        previous.setCreatedAt(requestedAt);
        previous.setExpiresAt(requestedAt.plusMinutes(10));
        previous.setLastRequestDate(requestedAt);
        previous.setDailyRequestCount(2);
        tokenRepository.save(previous);
        failDelivery();

        assertThrows(IllegalStateException.class,
                () -> verificationService.generateAndSendToken("otp@example.com", VerificationType.EMAIL_ACTIVATION));

        var current = tokenRepository.findByEmailAndType("otp@example.com", VerificationType.EMAIL_ACTIVATION);
        assertEquals("123456", current.getToken());
        assertEquals(2, current.getDailyRequestCount());
        assertEquals(requestedAt, current.getLastRequestDate());
        assertEquals(requestedAt.plusMinutes(10), current.getExpiresAt());
    }

    @Test
    void failedFirstDeliveryDoesNotCreateTokenOrCooldown() {
        failDelivery();

        assertThrows(IllegalStateException.class,
                () -> verificationService.generateAndSendToken("otp@example.com", VerificationType.EMAIL_ACTIVATION));

        assertNull(tokenRepository.findByEmailAndType("otp@example.com", VerificationType.EMAIL_ACTIVATION));
    }

    private void failDelivery() {
        doThrow(new IllegalStateException("SMTP unavailable"))
                .when(emailService).sendRequiredEmail(anyString(), anyString(), anyString());
    }

    private User newUser() {
        var user = new User();
        user.setUsername("otp-user");
        user.setEmail("otp@example.com");
        user.setPassword("password123");
        return user;
    }
}

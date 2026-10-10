package btpoop.user.service;

import btpoop.user.model.User;
import btpoop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import btpoop.verification.service.VerificationService;
import btpoop.verification.model.VerificationType;
import btpoop.verification.util.PasswordUtil;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final VerificationService verificationService;

    @Override
    public User register(User user) {
        if (userRepository.findByUsername(user.getUsername()) != null) {
            throw new IllegalArgumentException("Username đã tồn tại!");
        }
        if (userRepository.findByEmail(user.getEmail()) != null) {
            throw new IllegalArgumentException("Email đã được sử dụng!");
        }

        if (user.getPassword() != null) {
            user.setPassword(PasswordUtil.hashPassword(user.getPassword()));
        }

        user.setIsVerified(false);
        User savedUser = userRepository.save(user);

        // Sinh mã và gửi email xác nhận
        verificationService.generateAndSendToken(savedUser.getEmail(), VerificationType.EMAIL_ACTIVATION);

        return savedUser;
    }

    @Override
    public User login(String username, String password) {
        User user = userRepository.findByUsername(username);

        if (user != null && password != null) {
            String hashedInput = PasswordUtil.hashPassword(password);
            if (user.getPassword().equals(hashedInput)) {
                if (!user.getIsVerified()) {
                    throw new RuntimeException("Tài khoản chưa được xác thực email!");
                }
                return user;
            }
        }

        return null;
    }

    @Override
    public User getUserById(long userId) {
        return userRepository.findById(userId).orElse(null);
    }

    @Override
    public boolean updateProfile(User user) {
        if (userRepository.existsById(user.getUserId())) {
            userRepository.save(user);
            return true;
        }
        return false;
    }

}

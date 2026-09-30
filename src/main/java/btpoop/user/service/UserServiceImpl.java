package btpoop.user.service;

import btpoop.user.model.User;
import btpoop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public User register(User user) {
        if (userRepository.findByUsername(user.getUsername()) != null) {
            throw new IllegalArgumentException("Username đã tồn tại!");
        }
        if (userRepository.findByEmail(user.getEmail()) != null) {
            throw new IllegalArgumentException("Email đã được sử dụng!");
        }

        if (user.getPassword() != null) {
            user.setPassword(hashPassword(user.getPassword()));
        }

        return userRepository.save(user);
    }

    @Override
    public User login(String username, String password) {
        User user = userRepository.findByUsername(username);
        
        if (user != null && password != null) {
            String hashedInput = hashPassword(password);
            if (user.getPassword().equals(hashedInput)) {
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

    // private String hashPassword(String password) {
    //     if (password == null) return null;
    //     try {
    //         MessageDigest md = MessageDigest.getInstance("SHA-256");
    //         byte[] hashBytes = md.digest(password.getBytes());
    //         StringBuilder sb = new StringBuilder();
    //         for (byte b : hashBytes) {
    //             sb.append(String.format("%02x", b));
    //         }
    //         return sb.toString();
    //     } catch (NoSuchAlgorithmException e) {
    //         throw new RuntimeException("Lỗi thuật toán mã hóa mật khẩu", e);
    //     }
    // }
}

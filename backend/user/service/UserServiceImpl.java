package user.service;

import user.model.User;
import user.repository.UserRepository;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public User register(User user) {
        // Kiểm tra xem username đã tồn tại chưa
        if (userRepository.findByUsername(user.getUsername()) != null) {
            throw new IllegalArgumentException("Username đã tồn tại!");
        }
        
        // Kiểm tra xem email đã tồn tại chưa
        if (userRepository.findByEmail(user.getEmail()) != null) {
            throw new IllegalArgumentException("Email đã được sử dụng!");
        }

        // Mã hóa mật khẩu bằng SHA-256 trước khi lưu
        if (user.getPassword() != null) {
            user.setPassword(hashPassword(user.getPassword()));
        }

        // Lưu user vào database
        return userRepository.save(user);
    }

    @Override
    public User login(String username, String password) {
        User user = userRepository.findByUsername(username);
        
        // Kiểm tra user có tồn tại và password đã băm có khớp không
        if (user != null && password != null) {
            String hashedInput = hashPassword(password);
            if (user.getPassword().equals(hashedInput)) {
                return user;
            }
        }
        
        return null; // Đăng nhập thất bại
    }

    @Override
    public User getUserById(long userId) {
        return userRepository.findById(userId);
    }

    @Override
    public boolean updateProfile(User user) {
        // Kiểm tra user có tồn tại không trước khi update
        User existingUser = userRepository.findById(user.getUserId());
        if (existingUser != null) {
            return userRepository.update(user);
        }
        return false;
    }

    private String hashPassword(String password) {
        if (password == null) {
            return null;
        }
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = md.digest(password.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Lỗi thuật toán mã hóa mật khẩu", e);
        }
    }
}

package btpoop.user.repository;

import btpoop.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
    
    // Tự động generate lệnh SQL tìm kiếm theo email
    User findByEmail(String email);

    List<ChatAccount> findTop10ByIsVerifiedTrueAndUserIdNotAndUsernameStartingWithIgnoreCaseOrderByUsernameAsc(
            long userId, String username);

    interface ChatAccount {
        long getUserId();
        String getUsername();
    }
}

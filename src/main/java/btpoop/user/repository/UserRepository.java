package btpoop.user.repository;

import btpoop.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
    
    // Tự động generate lệnh SQL tìm kiếm theo email
    User findByEmail(String email);

    @Query(value = "select * from users where user_id = :id for update", nativeQuery = true)
    Optional<User> findByIdForUpdate(long id);

    List<ChatAccount> findTop10ByIsVerifiedTrueAndUserIdNotAndUsernameStartingWithIgnoreCaseOrderByUsernameAsc(
            long userId, String username);

    interface ChatAccount {
        long getUserId();
        String getUsername();
    }
}

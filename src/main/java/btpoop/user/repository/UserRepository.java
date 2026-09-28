package btpoop.user.repository;

import btpoop.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
    
    // Tự động generate lệnh SQL tìm kiếm theo email
    User findByEmail(String email);
}

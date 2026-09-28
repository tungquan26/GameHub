package btpoop.user.repository;

import btpoop.user.model.User;

public interface UserRepository {
    User save(User user);
    User findByUsername(String username);
    User findByEmail(String email);
    User findById(long userId);
    boolean update(User user);
}

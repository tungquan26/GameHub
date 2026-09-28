package btpoop.user.service;

import btpoop.user.model.User;

public interface UserService {
    User register(User user);
    User login(String username, String password);
    User getUserById(long userId);
    boolean updateProfile(User user);
}

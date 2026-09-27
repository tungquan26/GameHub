package user.controller;

import enums.UserRole;
import user.model.User;
import user.service.UserService;

/**
 * UserController đón nhận dữ liệu từ Frontend/Giao diện
 * Không dùng System.in hay System.out ở đây, chỉ nhận tham số và trả về kết quả.
 */
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Xử lý yêu cầu đăng ký tài khoản mới.
     * @return Chuỗi thông báo trạng thái để Frontend hiển thị lên Popup/Thông báo
     */
    public String handleRegister(String username, String password, String email, String fullName, UserRole role) {
        try {
            // Đóng gói dữ liệu nhận từ frontend thành đối tượng User
            User newUser = new User();
            newUser.setUsername(username);
            newUser.setPassword(password);
            newUser.setEmail(email);
            newUser.setFullName(fullName);
            newUser.setRole(role);

            // Gọi xuống Service để xử lý nghiệp vụ
            userService.register(newUser);
            return "SUCCESS: Đăng ký thành công!";
            
        } catch (IllegalArgumentException e) {
            // Lỗi này do UserService ném ra (trùng username/email)
            return "ERROR: " + e.getMessage(); 
        } catch (Exception e) {
            return "ERROR: Hệ thống gặp sự cố (" + e.getMessage() + ")";
        }
    }

    /**
     * Xử lý yêu cầu đăng nhập.
     * @return Đối tượng User nếu thành công, null nếu thất bại để Frontend tự xử lý điều hướng
     */
    public User handleLogin(String username, String password) {
        // Chỉ việc chuyển tiếp xuống service và trả kết quả ngược lại cho Frontend
        return userService.login(username, password);
    }
}

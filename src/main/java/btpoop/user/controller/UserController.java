package btpoop.user.controller;

import btpoop.user.model.User;
import btpoop.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<String> handleRegister(@RequestBody User newUser) {
        try {
            userService.register(newUser);
            return ResponseEntity.ok("SUCCESS: Đăng ký thành công!");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("ERROR: " + e.getMessage()); 
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("ERROR: Hệ thống gặp sự cố (" + e.getMessage() + ")");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<User> handleLogin(@RequestParam String username, @RequestParam String password) {
        User user = userService.login(username, password);
        if (user != null) {
            return ResponseEntity.ok(user);
        } else {
            return ResponseEntity.status(401).body(null);
        }
    }
}

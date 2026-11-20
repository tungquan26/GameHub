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

    @PostMapping("/logout")
    public void logout(jakarta.servlet.http.HttpSession session) { session.invalidate(); }

    @PostMapping("/register")
    public ResponseEntity<String> handleRegister(@RequestBody User newUser) {
        try {
            var player = new btpoop.user.model.Player();
            player.setUsername(newUser.getUsername());
            player.setEmail(newUser.getEmail());
            player.setPassword(newUser.getPassword());
            userService.register(player);
            return ResponseEntity.ok("SUCCESS: Đăng ký thành công!");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("ERROR: " + e.getMessage()); 
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("ERROR: Hệ thống gặp sự cố (" + e.getMessage() + ")");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> handleLogin(@RequestParam String username, @RequestParam String password, @RequestParam(defaultValue="false") boolean remember, jakarta.servlet.http.HttpServletRequest request, jakarta.servlet.http.HttpServletResponse response) {
        User user = userService.login(username, password);
        if (user != null) {
            var oldSession = request.getSession(false);
            if (oldSession != null) oldSession.invalidate();
            var session = request.getSession(true);
            session.setAttribute("userId", user.getUserId());
            if (remember) {
                int lifetime = 30 * 24 * 60 * 60;
                session.setMaxInactiveInterval(lifetime);
                var cookie = org.springframework.http.ResponseCookie.from("JSESSIONID",session.getId())
                    .httpOnly(true).secure(request.isSecure()).sameSite("Lax").path("/").maxAge(lifetime).build();
                response.addHeader("Set-Cookie",cookie.toString());
            }
            return ResponseEntity.ok(java.util.Map.of("userId",user.getUserId(),"username",user.getUsername(),"email",user.getEmail()));
        } else {
            return ResponseEntity.status(401).body(null);
        }
    }
}

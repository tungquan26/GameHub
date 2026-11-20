package btpoop.user.controller;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class SessionUser {
    private SessionUser() {}
    public static long id(HttpSession session) {
        if (session.getAttribute("userId") instanceof Long id) return id;
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
    }
    public static void require(HttpSession session, Long owner) {
        if (!java.util.Objects.equals(id(session), owner)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
}

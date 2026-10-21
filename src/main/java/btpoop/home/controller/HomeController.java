package btpoop.home.controller;

import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;

@Controller
public class HomeController {

    // Whitelist các mục giải đấu để chống Path Traversal / Template Injection
    private static final Set<String> TOURNAMENT_SECTIONS = Set.of(
        "home",
        "details",
        "registration-settings",
        "teams",
        "game-info",
        "view"
    );

    @GetMapping("/")
    public String index() {
        return "home/index";
    }

    @GetMapping({"/auth/login", "/login"})
    public String login() {
        return "auth/login";
    }

    @GetMapping({"/auth/register", "/register"})
    public String register() {
        return "auth/register";
    }

    @GetMapping("/dashboard")
    public String dashboard() {
        return "home/dashboard";
    }

    @GetMapping("/search")
    public String search() {
        return "home/search";
    }

    @GetMapping("/events")
    public String events() {
        return "home/events";
    }

    @GetMapping("/community")
    public String community() {
        return "home/community";
    }

    @GetMapping("/profile")
    public String profile() {
        return "home/profile";
    }

    @GetMapping("/profile/settings")
    public String profileSettings() {
        return "home/profile-settings";
    }

    @GetMapping({"/auth/verify", "/verify"})
    public String verify() {
        return "auth/verify";
    }

    @GetMapping("/create")
    public String create() {
        return "home/create";
    }
    
    @GetMapping("/tournament/{section}")
    public String tournamentSection(
            @PathVariable("section") String section,
            Model model) {
        if (!TOURNAMENT_SECTIONS.contains(section)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid tournament section");
        }
        model.addAttribute("activeSection", section);
        return "tournament/" + section;
    }
}

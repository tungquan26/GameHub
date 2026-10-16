package btpoop.home.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/register")
    public String register() {
        return "register";
    }

    @GetMapping("/dashboard")
    public String dashboard() {
        return "dashboard";
    }

    @GetMapping("/verify")
    public String verify() {
        return "verify";
    }

    @GetMapping("/create")
    public String create() {
        return "create";
    }

    @GetMapping("/settings")
    public String settings() {
        return "settings";
    }
}

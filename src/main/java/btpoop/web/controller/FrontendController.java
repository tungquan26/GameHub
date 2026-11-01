package btpoop.web.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Serves the React shell for known client routes without intercepting APIs or assets. */
@Controller
public class FrontendController {

    @GetMapping({
            "/{page:login|register|verify|profile|dashboard|search|events|community|news|create}",
            "/{page:login|register|verify|profile|dashboard|search|events|community|news|create}/",
            "/profile/settings", "/profile/settings/",
            "/auth/{page:login|register|verify}",
            "/auth/{page:login|register|verify}/",
            "/tournament", "/tournament/",
            "/tournament/{page:details|registration-settings|teams|game-info|home|view|schedule}",
            "/tournament/{page:details|registration-settings|teams|game-info|home|view|schedule}/"
    })
    public String frontend() {
        return "forward:/index.html";
    }
}

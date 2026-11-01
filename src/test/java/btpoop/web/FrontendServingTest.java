package btpoop.web;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "debug=false", "logging.level.root=WARN", "management.health.mail.enabled=false"
})
class FrontendServingTest {

    @LocalServerPort
    private int port;

    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10)).build();

    private HttpResponse<String> get(String path) throws Exception {
        return client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                        .timeout(Duration.ofSeconds(20)).header("Accept", "*/*").GET().build(),
                HttpResponse.BodyHandlers.ofString());
    }

    @Test
    void servesReactAtEveryFrontendRouteIncludingDirectLinksAndTrailingSlashes() throws Exception {
        var home = get("/");
        assertEquals(200, home.statusCode());
        assertTrue(home.headers().firstValue("content-type").orElse("").contains("text/html"));
        assertTrue(home.body().contains("id=\"root\""));

        // Read the frontend's route catalog so a new React route cannot silently lack server support.
        String catalog = Files.readString(Path.of("frontend/constants/routes.js"));
        List<String> paths = new ArrayList<>(Pattern.compile("path: \"([^\"]+)\"")
                .matcher(catalog).results().map(match -> match.group(1)).toList());
        assertTrue(paths.size() >= 19);
        paths.addAll(List.of("/auth/login", "/auth/register", "/auth/verify", "/tournament"));
        for (String path : paths) {
            for (String variant : path.equals("/") ? List.of(path) : List.of(path, path + "/")) {
                var response = get(variant + "?id=31&email=test%2Broute%40example.com&view=public");
                assertEquals(200, response.statusCode(), variant);
                assertEquals(home.body(), response.body(), variant);
            }
        }
    }

    @Test
    void servesBuiltScriptsStylesAndPublicFiles() throws Exception {
        String html = get("/").body();
        var assets = Pattern.compile("(?:src|href)=\"(/[^\"?#]+)\"").matcher(html)
                .results().map(match -> match.group(1)).toList();
        assertTrue(assets.stream().anyMatch(path -> path.endsWith(".js") && path.startsWith("/assets/")));
        assertTrue(assets.stream().anyMatch(path -> path.endsWith(".css")));
        assertTrue(assets.contains("/config.js"));
        for (String asset : assets) {
            var response = get(asset);
            assertEquals(200, response.statusCode(), asset);
            assertFalse(response.body().contains("id=\"root\""), asset);
        }
        try (var files = Files.walk(Path.of("frontend/dist"))) {
            for (Path file : files.filter(Files::isRegularFile).toList()) {
                String relative = Path.of("frontend/dist").relativize(file).toString();
                // Use the actual classpath rather than assuming Maven's build directory (IDE uses target-ide).
                try (var resource = getClass().getResourceAsStream("/static/" + relative.replace('\\', '/'))) {
                    assertNotNull(resource, relative);
                    assertArrayEquals(Files.readAllBytes(file), resource.readAllBytes(), relative);
                }
            }
        }
    }

    @Test
    void leavesApisActuatorAndMissingResourcesWithSpring() throws Exception {
        var api = get("/api/tournaments");
        assertEquals(200, api.statusCode());
        assertTrue(api.headers().firstValue("content-type").orElse("").contains("application/json"));
        assertTrue(api.body().stripLeading().startsWith("["));

        var health = get("/actuator/health");
        assertEquals(200, health.statusCode());
        assertTrue(health.body().contains("\"status\""));

        for (String path : List.of("/api/does-not-exist", "/assets/missing.js", "/missing.css",
                "/fonts/missing.woff2", "/auth/missing", "/tournament/missing", "/unknown-page")) {
            var response = get(path);
            assertEquals(404, response.statusCode(), path);
            assertFalse(response.body().contains("id=\"root\""), path);
        }
        assertFalse(get("/error").body().contains("id=\"root\""));
    }
}

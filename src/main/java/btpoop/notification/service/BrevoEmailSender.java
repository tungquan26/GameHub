package btpoop.notification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "gamehub.email.provider", havingValue = "brevo")
public class BrevoEmailSender {
    private static final Logger logger = LoggerFactory.getLogger(BrevoEmailSender.class);
    private final RestClient client;
    private final String apiKey;
    private final String senderEmail;

    @Autowired
    public BrevoEmailSender(@Value("${gamehub.email.brevo-api-key:}") String apiKey,
                           @Value("${gamehub.email.sender:}") String senderEmail) {
        this(createClient(), apiKey, senderEmail);
    }

    BrevoEmailSender(RestClient client, String apiKey, String senderEmail) {
        this.client = client;
        this.apiKey = apiKey;
        this.senderEmail = senderEmail;
    }

    private static RestClient createClient() {
        var http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
        var requestFactory = new JdkClientHttpRequestFactory(http);
        requestFactory.setReadTimeout(Duration.ofSeconds(10));
        return RestClient.builder()
                .baseUrl("https://api.brevo.com")
                .requestFactory(requestFactory)
                .build();
    }

    public void send(String to, String subject, String text) {
        if (apiKey.isBlank() || senderEmail.isBlank()) {
            throw new IllegalStateException("Máy chủ chưa cấu hình gửi email. Vui lòng liên hệ quản trị viên.");
        }

        try {
            client.post()
                    .uri("/v3/smtp/email")
                    .header("api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("sender", Map.of("email", senderEmail, "name", "Game-Hub"),
                            "to", List.of(Map.of("email", to)), "subject", subject, "textContent", text))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException error) {
            logger.warn("Brevo returned HTTP {} for a transactional email", error.getStatusCode().value());
            throw new IllegalStateException("Không thể gửi email lúc này. Vui lòng thử lại sau.");
        } catch (RestClientException error) {
            logger.warn("Could not reach Brevo ({})", error.getClass().getSimpleName());
            throw new IllegalStateException("Không thể gửi email lúc này. Vui lòng thử lại sau.");
        }
    }
}

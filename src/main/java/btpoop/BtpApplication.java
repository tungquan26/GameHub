package btpoop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BtpApplication {
    public static void main(String[] args) {
        SpringApplication.run(BtpApplication.class, args);
    }
}

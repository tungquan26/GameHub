package btpoop.verification.controller;

import btpoop.verification.model.VerificationType;
import btpoop.verification.service.VerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/verification")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationService verificationService;

    @PostMapping("/verify-email")
    public ResponseEntity<String> verifyEmail(@RequestParam String email, @RequestParam String code) {
        try {
            verificationService.verifyEmailActivation(email, code);
            return ResponseEntity.ok("Xác thực email thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("ERROR: " + e.getMessage());
        }
    }

    @PostMapping("/resend-activation-code")
    public ResponseEntity<String> resendActivationCode(@RequestParam String email) {
        try {
            verificationService.generateAndSendToken(email, VerificationType.EMAIL_ACTIVATION);
            return ResponseEntity.ok("Mã xác thực đã được gửi lại thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("ERROR: " + e.getMessage());
        }
    }
}

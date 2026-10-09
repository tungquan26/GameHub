package btpoop.verification.repository;

import btpoop.verification.model.VerificationToken;
import btpoop.verification.model.VerificationType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    VerificationToken findByEmailAndType(String email, VerificationType type);
}

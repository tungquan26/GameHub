package btpoop.bracket.repository;

import btpoop.bracket.model.Bracket;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BracketRepository extends JpaRepository<Bracket, Long> {
}

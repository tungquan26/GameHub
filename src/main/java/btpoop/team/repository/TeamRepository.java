package btpoop.team.repository;

import btpoop.team.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {
    @Query(value = "select * from teams where team_id = :id for update", nativeQuery = true)
    Optional<Team> findByIdForUpdate(long id);
}

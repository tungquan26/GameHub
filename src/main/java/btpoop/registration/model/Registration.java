package btpoop.registration.model;

import btpoop.enums.CheckInStatus;
import btpoop.enums.RegistrationStatus;
import btpoop.team.model.Team;
import btpoop.tournament.model.Tournament;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "registrations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Registration {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long registrationId;
    
    @ManyToOne
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;
    
    @ManyToOne
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;
    
    @Column(nullable = false)
    private LocalDateTime registrationDate = LocalDateTime.now();
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RegistrationStatus status = RegistrationStatus.PENDING;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CheckInStatus checkInStatus = CheckInStatus.NOT_CHECKED_IN;
}

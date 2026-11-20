package btpoop.registration.model;

import btpoop.enums.CheckInStatus;
import btpoop.enums.RegistrationStatus;
import btpoop.team.model.Team;
import btpoop.tournament.model.Tournament;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "registrations")
@Data
@NoArgsConstructor
public class Registration {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long registrationId;
    
    @ManyToOne
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(name = "source_team_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Long sourceTeamId;

    @Column(name = "captain_user_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Long captainUserId;

    @ElementCollection
    @CollectionTable(name = "registration_roster", joinColumns = @JoinColumn(name = "registration_id"))
    @Column(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Set<Long> rosterUserIds = new LinkedHashSet<>();
    
    @ManyToOne
    @JoinColumn(name = "tournament_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"registrations","matches"})
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

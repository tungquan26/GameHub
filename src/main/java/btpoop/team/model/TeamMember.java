package btpoop.team.model;

import btpoop.enums.TeamMemberRole;
import btpoop.user.model.Player;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "team_members")
@Data
@NoArgsConstructor
public class TeamMember {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne
    @JoinColumn(name = "team_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"members","applicants"})
    private Team team;

    @ManyToOne
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @Column(nullable = false)
    private LocalDateTime joinedAt = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TeamMemberRole role;
}

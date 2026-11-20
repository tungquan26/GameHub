package btpoop.team.model;

import btpoop.game.model.Game;
import btpoop.enums.TeamStatus;
import btpoop.user.model.Player;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "teams")
@Data
@NoArgsConstructor
public class Team {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long teamId;

    @Column(nullable = false, unique = true)
    private String teamName;

    @ManyToOne
    @JoinColumn(name = "game_id")
    private Game game;

    private String description;
    private boolean recruiting;
    @Lob
    @Column(length = 67108864)
    private String logo;
    private Long tournamentScope;
    private String participantName;

    @ElementCollection
    @CollectionTable(name = "team_participant_members", joinColumns = @JoinColumn(name = "team_team_id"))
    @Column(name = "participant_members")
    private List<String> participantMembers = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "team_applicants", joinColumns = @JoinColumn(name = "team_team_id"))
    @Column(name = "applicants")
    @JsonIgnore
    private Set<Long> applicants = new HashSet<>();

    @ManyToOne
    @JoinColumn(name = "captain_id")
    private Player captain;

    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TeamMember> members = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TeamStatus status = TeamStatus.ACTIVE;
}

package btpoop.tournament.model;

import btpoop.game.model.Game;
import btpoop.enums.TournamentFormat;
import btpoop.enums.TournamentStatus;
import btpoop.match.model.Match;
import btpoop.user.model.User;
import btpoop.registration.model.Registration;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tournaments")
@Data
@NoArgsConstructor
public class Tournament {
    public static final int MAX_TEAMS = 8;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long tournamentId;

    @Column(nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "game_id")
    private Game game;

    @ManyToOne
    @JoinColumn(name = "organizer_id", nullable = false)
    private User organizer;

    @Lob
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(length=67108864)
    private String settingsJson;

    @Column(nullable = false)
    private LocalDateTime startDate;

    @Column(nullable = false)
    private LocalDateTime endDate;

    @Column(nullable = false)
    private int maxTeams = MAX_TEAMS;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TournamentFormat format;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TournamentStatus status;

    @OneToMany(mappedBy = "tournament", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Registration> registrations = new ArrayList<>();

    @OneToMany(mappedBy = "tournament", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Match> matches = new ArrayList<>();
}

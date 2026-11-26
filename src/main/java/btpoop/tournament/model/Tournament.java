package btpoop.tournament.model;

import btpoop.game.model.Game;
import btpoop.enums.TournamentFormat;
import btpoop.enums.MatchStatus;
import btpoop.enums.TournamentStatus;
import btpoop.match.model.Match;
import btpoop.user.model.User;
import btpoop.registration.model.Registration;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tournaments")
@Data
@NoArgsConstructor
public class Tournament {
    public static final int MAX_TEAMS = 8;
    public static final ZoneId TIME_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

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

    public TournamentStatus statusAt(LocalDateTime now) {
        if (status == TournamentStatus.CANCELLED || status == TournamentStatus.COMPLETED) return status;
        if (endDate != null && !now.isBefore(endDate)) return TournamentStatus.COMPLETED;
        for (Match match : matches) {
            if (match.getStatus() != MatchStatus.COMPLETED || match.getResult() == null
                    || match.getResult().getWinner() == null) continue;
            var round = match.getRound();
            if (round == null || round.getBracket().getFormat() != TournamentFormat.SINGLE_ELIMINATION) continue;
            var rounds = round.getBracket().getRounds();
            if (!rounds.isEmpty() && round.getRoundId() == rounds.getLast().getRoundId()
                    && round.getMatches().size() == 1) return TournamentStatus.COMPLETED;
        }
        if (startDate != null && !now.isBefore(startDate)) return TournamentStatus.ONGOING;
        return status;
    }
}

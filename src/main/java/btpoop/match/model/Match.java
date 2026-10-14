package btpoop.match.model;

import btpoop.enums.MatchStatus;
import btpoop.team.model.Team;
import btpoop.tournament.model.Tournament;
import btpoop.bracket.model.Round;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "matches")
@Data
@NoArgsConstructor
public class Match {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long matchId;

    @ManyToOne
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @ManyToOne
    @JoinColumn(name = "team_a_id")
    private Team teamA;

    @ManyToOne
    @JoinColumn(name = "team_b_id")
    private Team teamB;

    private LocalDateTime scheduledTime;


    @ManyToOne
    @JoinColumn(name = "round_id")
    private Round round;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MatchStatus status = MatchStatus.SCHEDULED;

    @Column
    private String location;

    @Column(nullable = false)
    private boolean notified1Week = false;

    @Column(nullable = false)
    private boolean notified1Day = false;

    @Column(nullable = false)
    private boolean notified1Hour = false;

    @Embedded
    private MatchResult result;
}

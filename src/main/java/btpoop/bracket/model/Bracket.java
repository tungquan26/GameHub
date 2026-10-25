package btpoop.bracket.model;

import btpoop.enums.TournamentFormat;
import btpoop.tournament.model.Tournament;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "brackets")
@Data
@NoArgsConstructor
public class Bracket {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long bracketId;

    @ManyToOne
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TournamentFormat format;

    @OneToMany(mappedBy = "bracket", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("roundNumber ASC")
    private List<Round> rounds = new ArrayList<>();
}

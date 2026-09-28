package btpoop.bracket.model;

import btpoop.match.model.Match;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rounds")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Round {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long roundId;

    @ManyToOne
    @JoinColumn(name = "bracket_id", nullable = false)
    private Bracket bracket;

    @Column(nullable = false)
    private int roundNumber;

    @Column(nullable = false)
    private String name;

    @OneToMany(mappedBy = "round", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Match> matches = new ArrayList<>();
}
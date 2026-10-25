package btpoop.bracket.service;

import btpoop.enums.TournamentFormat;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BracketGeneratorFactory {

    private final SingleEliminationGenerator singleEliminationGenerator;
    private final DoubleEliminationGenerator doubleEliminationGenerator;
    private final RoundRobinGenerator roundRobinGenerator;

    public BracketGenerator getGenerator(TournamentFormat format) {
        switch (format) {
            case SINGLE_ELIMINATION:
                return singleEliminationGenerator;
            case DOUBLE_ELIMINATION:
                return doubleEliminationGenerator;
            case ROUND_ROBIN:
                return roundRobinGenerator;
            default:
                throw new IllegalArgumentException("Không hỗ trợ thể thức thi đấu: " + format);
        }
    }
}

package btpoop.bracket.service;

import btpoop.bracket.model.Bracket;
import btpoop.team.model.Team;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class DoubleEliminationGenerator implements BracketGenerator {
    @Override
    public void generateBracket(Bracket bracket, List<Team> teams) {
        // TODO: Thuật toán nhánh thắng nhánh thua
    }
}

package btpoop.bracket.generator;

import btpoop.bracket.model.Bracket;
import btpoop.team.model.Team;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class RoundRobinGenerator implements BracketGenerator {
    @Override
    public void generateBracket(Bracket bracket, List<Team> teams) {
        // TODO: Thuật toán vòng tròn tính điểm
    }
}

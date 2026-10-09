package btpoop.bracket.generator;

import btpoop.bracket.model.Bracket;
import btpoop.team.model.Team;
import java.util.List;

public interface BracketGenerator {
    /**
     * Khởi tạo các vòng đấu và trận đấu cho Bracket.
     * 
     * @param bracket Bracket cần gắn các trận đấu
     * @param teams Danh sách các đội đã đăng ký
     */
    void generateBracket(Bracket bracket, List<Team> teams);
}

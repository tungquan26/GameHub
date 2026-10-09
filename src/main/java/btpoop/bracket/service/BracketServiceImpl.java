package btpoop.bracket.service;

import btpoop.bracket.model.Bracket;
import btpoop.bracket.repository.BracketRepository;
import btpoop.tournament.model.Tournament;
import btpoop.tournament.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

import btpoop.bracket.generator.BracketGenerator;
import btpoop.bracket.generator.BracketGeneratorFactory;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class BracketServiceImpl implements BracketService {

    private final BracketRepository bracketRepository;
    private final TournamentRepository tournamentRepository;
    private final BracketGeneratorFactory generatorFactory;

    @Override
    public List<Bracket> getAllBrackets() {
        return bracketRepository.findAll();
    }

    @Override
    public Bracket getBracketById(Long id) {
        return bracketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bracket not found"));
    }

    @Override
    public Bracket createBracket(Bracket bracket, Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));
        bracket.setTournament(tournament);
        
        // Sinh Bracket sử dụng Factory (Lấy thuật toán theo định dạng giải)
        BracketGenerator generator = generatorFactory.getGenerator(tournament.getFormat());
        
        // Mặc định hiện tại sẽ throw Error nếu không tự truyền 16 đội vào.
        // NOTE: Bước truyền danh sách List<Team> teams sẽ được xử lý khi gọi từ Controller (Fetch từ RegistrationRepository)
        // Nên lúc này ta tạm thời chưa gọi generator.generateBracket(...) tại đây
        // Hoặc có thể sẽ sửa thêm ở Controller để fetch các đội đã APPROVED.

        return bracketRepository.save(bracket);
    }
}

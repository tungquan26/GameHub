package btpoop.bracket.service;

import btpoop.bracket.model.Bracket;
import btpoop.bracket.repository.BracketRepository;
import btpoop.enums.MatchStatus;
import btpoop.match.model.MatchScheduledEvent;
import btpoop.registration.service.RegistrationModule;
import org.springframework.context.ApplicationEventPublisher;
import btpoop.enums.RegistrationStatus;
import btpoop.enums.TournamentFormat;
import btpoop.registration.model.Registration;
import btpoop.registration.repository.RegistrationRepository;
import btpoop.team.model.Team;
import btpoop.tournament.model.Tournament;
import btpoop.tournament.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BracketServiceImpl implements BracketService {

    private final BracketRepository bracketRepository;
    private final TournamentRepository tournamentRepository;
    private final RegistrationRepository registrationRepository;
    private final BracketGeneratorFactory generatorFactory;
    private final ApplicationEventPublisher events;

    @Override
    public List<Bracket> getAllBrackets() {
        return bracketRepository.findAll();
    }

    @Override
    public Bracket getBracketById(Long id) {
        return bracketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bracket not found with ID: " + id));
    }

    @Override
    public Bracket createBracket(Bracket bracket, Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));
        bracket.setTournament(tournament);
        return bracketRepository.save(bracket);
    }

    @Override
    @Transactional
    public Bracket generateBracket(Long tournamentId) {
        Tournament tournament = tournamentRepository.findByIdForUpdate(tournamentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giải đấu với ID: " + tournamentId));

        // 1. Kiểm tra xem giải đấu đã có Bracket trước đó chưa
        Optional<Bracket> existingOpt = bracketRepository.findByTournament_TournamentId(tournamentId);
        if (existingOpt.isPresent()) {
            Bracket existing = existingOpt.get();
            boolean hasPlayedMatches = existing.getRounds().stream()
                    .flatMap(r -> r.getMatches().stream())
                    .anyMatch(m -> m.getStatus() == MatchStatus.COMPLETED || m.getStatus() == MatchStatus.ONGOING);
            if (hasPlayedMatches) {
                throw new IllegalStateException("Không thể tạo lại nhánh đấu vì giải đấu đã có trận đang diễn ra hoặc đã kết thúc.");
            }
            bracketRepository.delete(existing);
            bracketRepository.flush();
        }

        // 2. Lấy danh sách đội đã duyệt (APPROVED) từ Registration
        List<Registration> approvedRegs = registrationRepository.findByTournament_TournamentIdAndStatus(tournamentId, RegistrationStatus.APPROVED);
        List<Team> teams = approvedRegs.stream()
                .filter(row -> RegistrationModule.ready(tournament, row))
                .map(Registration::getTeam)
                .filter(t -> t != null)
                .distinct()
                .collect(Collectors.toList());

        if (teams.isEmpty()) {
            throw new IllegalArgumentException("Không có đội nào ở trạng thái APPROVED để bốc thăm nhánh đấu.");
        }

        // 3. Khởi tạo Bracket mới
        Bracket bracket = new Bracket();
        bracket.setTournament(tournament);
        TournamentFormat format = tournament.getFormat() != null ? tournament.getFormat() : TournamentFormat.SINGLE_ELIMINATION;
        bracket.setFormat(format);

        // 4. Lấy thuật toán generator và sinh nhánh đấu
        BracketGenerator generator = generatorFactory.getGenerator(format);
        generator.generateBracket(bracket, teams);

        var saved = bracketRepository.saveAndFlush(bracket);
        saved.getRounds().forEach(round -> round.getMatches().stream()
                .filter(match -> match.getTeamA() != null || match.getTeamB() != null)
                .forEach(match -> events.publishEvent(new MatchScheduledEvent(match.getMatchId()))));
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Bracket getBracketByTournamentId(Long tournamentId) {
        return bracketRepository.findByTournament_TournamentId(tournamentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhánh đấu cho giải đấu ID: " + tournamentId));
    }
}

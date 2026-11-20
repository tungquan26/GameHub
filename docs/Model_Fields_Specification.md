# Đặc tả mô hình dữ liệu Game-Hub

Tên trường dưới đây là thuộc tính Java. Cột **Ánh xạ** ghi tên bảng hoặc quan hệ JPA. Với quan hệ một–nhiều, danh sách Java được dựng từ các bản ghi liên quan. Các lớp con của `User` dùng chung bảng `users`.

## User · `users`

Tài khoản gốc. Username và email là duy nhất. Giá trị băm mật khẩu dùng cho đăng nhập, còn profileJson chứa hồ sơ hiển thị và email liên hệ.

| Trường | Kiểu Java | Ánh xạ / mặc định |
| --- | --- | --- |
| `userId` | `Long` | Khóa chính |
| `username` | `String` | — |
| `profileJson` | `String` | — |
| `password` | `String` | — |
| `email` | `String` | — |
| `role` | `UserRole` | — |
| `isVerified` | `Boolean` | false |

## Player · `users`

Kế thừa User, gắn với một bản thống kê cá nhân.

| Trường | Kiểu Java | Ánh xạ / mặc định |
| --- | --- | --- |
| `stats` | `PlayerStats` | OneToOne · stats_id |

## Organizer · `users`

Kế thừa User và khởi tạo vai trò ORGANIZER.

## Admin · `users`

Kế thừa User và khởi tạo vai trò ADMIN.

## VerificationToken · `verification_tokens`

Mã xác thực theo email và loại yêu cầu, kèm thời hạn, bộ đếm và thời điểm yêu cầu.

| Trường | Kiểu Java | Ánh xạ / mặc định |
| --- | --- | --- |
| `id` | `long` | Khóa chính |
| `email` | `String` | — |
| `type` | `VerificationType` | — |
| `token` | `String` | — |
| `createdAt` | `LocalDateTime` | — |
| `expiresAt` | `LocalDateTime` | — |
| `dailyRequestCount` | `int` | 0 |
| `lastRequestDate` | `LocalDateTime` | — |

## Game · `games`

Danh mục bộ môn quy định quân số tối thiểu và tối đa của đội.

| Trường | Kiểu Java | Ánh xạ / mặc định |
| --- | --- | --- |
| `gameId` | `long` | Khóa chính |
| `name` | `String` | — |
| `type` | `GameType` | — |
| `minPlayers` | `int` | — |
| `maxPlayers` | `int` | — |
| `description` | `String` | — |

## Team · `teams`

Đội cộng đồng có đội trưởng và danh sách thành viên liên kết tài khoản. Đội thuộc phạm vi giải có tournamentScope và tên hiển thị participantName.

| Trường | Kiểu Java | Ánh xạ / mặc định |
| --- | --- | --- |
| `teamId` | `long` | Khóa chính |
| `teamName` | `String` | — |
| `game` | `Game` | ManyToOne · game_id |
| `description` | `String` | — |
| `recruiting` | `boolean` | — |
| `logo` | `String` | — |
| `tournamentScope` | `Long` | — |
| `participantName` | `String` | — |
| `participantMembers` | `List<String>` | ElementCollection · team_participant_members |
| `applicants` | `Set<Long>` | ElementCollection · team_applicants |
| `captain` | `Player` | ManyToOne · captain_id |
| `members` | `List<TeamMember>` | OneToMany |
| `status` | `TeamStatus` | TeamStatus.ACTIVE |

## TeamMember · `team_members`

Một lần tham gia đội của một người chơi, có vai trò và thời điểm gia nhập.

| Trường | Kiểu Java | Ánh xạ / mặc định |
| --- | --- | --- |
| `id` | `long` | Khóa chính |
| `team` | `Team` | ManyToOne · team_id |
| `player` | `Player` | ManyToOne · player_id |
| `joinedAt` | `LocalDateTime` | LocalDateTime.now() |
| `role` | `TeamMemberRole` | — |

## Tournament · `tournaments`

Giải thuộc về organizer. Mỗi giải nhận tối đa 8 đội. settingsJson chứa liên hệ, địa điểm, hình ảnh, luật, cấu hình đăng ký, bộ môn và bố cục trang chủ.

| Trường | Kiểu Java | Ánh xạ / mặc định |
| --- | --- | --- |
| `tournamentId` | `long` | Khóa chính |
| `name` | `String` | — |
| `game` | `Game` | ManyToOne · game_id |
| `organizer` | `User` | ManyToOne · organizer_id |
| `settingsJson` | `String` | — |
| `startDate` | `LocalDateTime` | — |
| `endDate` | `LocalDateTime` | — |
| `maxTeams` | `int` | MAX_TEAMS |
| `format` | `TournamentFormat` | — |
| `status` | `TournamentStatus` | — |
| `registrations` | `List<Registration>` | OneToMany |
| `matches` | `List<Match>` | OneToMany |

## Registration · `registrations`

Một lượt đăng ký đội vào giải. team trỏ tới đội thi đấu, sourceTeamId nhận diện đội cộng đồng. captainUserId và rosterUserIds ghi nhận đội trưởng và thành viên lúc đăng ký. Khi đọc bản ghi cũ thiếu thông tin chụp tại thời điểm đăng ký, RegistrationModule tra đội và thành viên liên kết.

| Trường | Kiểu Java | Ánh xạ / mặc định |
| --- | --- | --- |
| `registrationId` | `long` | Khóa chính |
| `team` | `Team` | ManyToOne · team_id |
| `sourceTeamId` | `Long` | — |
| `captainUserId` | `Long` | — |
| `rosterUserIds` | `Set<Long>` | ElementCollection · registration_roster |
| `tournament` | `Tournament` | ManyToOne · tournament_id |
| `registrationDate` | `LocalDateTime` | LocalDateTime.now() |
| `status` | `RegistrationStatus` | RegistrationStatus.PENDING |
| `checkInStatus` | `CheckInStatus` | CheckInStatus.NOT_CHECKED_IN |

## Bracket · `brackets`

Nhánh đấu thuộc một giải. revision dùng để phát hiện hai lượt sửa dựa trên cùng một phiên bản.

| Trường | Kiểu Java | Ánh xạ / mặc định |
| --- | --- | --- |
| `bracketId` | `long` | Khóa chính |
| `revision` | `long` | — |
| `tournament` | `Tournament` | ManyToOne · tournament_id |
| `format` | `TournamentFormat` | — |
| `rounds` | `List<Round>` | OneToMany |

## Round · `rounds`

Vòng đấu trong nhánh. roundNumber xác định thứ tự vòng.

| Trường | Kiểu Java | Ánh xạ / mặc định |
| --- | --- | --- |
| `roundId` | `long` | Khóa chính |
| `bracket` | `Bracket` | ManyToOne · bracket_id |
| `roundNumber` | `int` | — |
| `name` | `String` | — |
| `matches` | `List<Match>` | OneToMany |

## Match · `matches`

Trận trong giải, có thể thuộc một vòng. nextMatch và nextMatchSlot xác định nơi chuyển đội đi tiếp. Ba cờ notified ghi nhận các mốc đã nhắc lịch.

| Trường | Kiểu Java | Ánh xạ / mặc định |
| --- | --- | --- |
| `matchId` | `long` | Khóa chính |
| `tournament` | `Tournament` | ManyToOne · tournament_id |
| `teamA` | `Team` | ManyToOne · team_a_id |
| `teamB` | `Team` | ManyToOne · team_b_id |
| `scheduledTime` | `LocalDateTime` | — |
| `round` | `Round` | ManyToOne · round_id |
| `status` | `MatchStatus` | MatchStatus.SCHEDULED |
| `location` | `String` | — |
| `notified1Week` | `boolean` | false |
| `notified1Day` | `boolean` | false |
| `notified1Hour` | `boolean` | false |
| `matchOrder` | `int` | 0 |
| `nextMatch` | `Match` | ManyToOne · next_match_id |
| `nextMatchSlot` | `String` | — |
| `result` | `MatchResult` | Embedded |

## MatchResult · `matches`

Kiểu nhúng trong Match. Tỉ số và đội thắng được lưu cùng bản ghi trận.

| Trường | Kiểu Java | Ánh xạ / mặc định |
| --- | --- | --- |
| `scoreA` | `int` | — |
| `scoreB` | `int` | — |
| `winner` | `Team` | ManyToOne · winner_id |

## TeamRanking · `team_rankings`

Thứ hạng theo điểm, thành tích và hiệu số của đội.

| Trường | Kiểu Java | Ánh xạ / mặc định |
| --- | --- | --- |
| `id` | `Long` | Khóa chính |
| `team` | `Team` | ManyToOne · team_id |
| `tournament` | `Tournament` | ManyToOne · tournament_id |
| `matchesPlayed` | `int` | 0 |
| `wins` | `int` | 0 |
| `draws` | `int` | 0 |
| `losses` | `int` | 0 |
| `points` | `int` | 0 |
| `totalScoreDifference` | `int` | 0 |
| `currentRank` | `int` | 0 |

## PlayerRanking · `player_rankings`

Điểm xếp hạng và vị trí của người chơi.

| Trường | Kiểu Java | Ánh xạ / mặc định |
| --- | --- | --- |
| `id` | `Long` | Khóa chính |
| `player` | `Player` | ManyToOne · player_id |
| `tournament` | `Tournament` | ManyToOne · tournament_id |
| `rankingScore` | `double` | — |
| `currentRank` | `int` | — |

## PlayerStats · `player_stats`

Thống kê cá nhân gắn với Player, gồm Elo và số trận thắng, thua.

| Trường | Kiểu Java | Ánh xạ / mặc định |
| --- | --- | --- |
| `id` | `Long` | Khóa chính |
| `eloScore` | `double` | 1200.0 |
| `matchesPlayed` | `int` | 0 |
| `wins` | `int` | 0 |
| `losses` | `int` | 0 |

## Notification · `notifications`

Thông báo gắn với tài khoản nhận và trạng thái đã đọc.

| Trường | Kiểu Java | Ánh xạ / mặc định |
| --- | --- | --- |
| `notificationId` | `long` | Khóa chính |
| `user` | `User` | ManyToOne · user_id |
| `title` | `String` | — |
| `message` | `String` | — |
| `isRead` | `boolean` | false |
| `createdAt` | `LocalDateTime` | LocalDateTime.now() |

## Conversation · `chat_conversations`

Hội thoại giữa hai tài khoản. Cặp user_a_id và user_b_id có ràng buộc duy nhất.

| Trường | Kiểu Java | Ánh xạ / mặc định |
| --- | --- | --- |
| `id` | `Long` | Khóa chính |
| `userA` | `User` | ManyToOne · user_a_id |
| `userB` | `User` | ManyToOne · user_b_id |
| `updatedAt` | `Instant` | — |

## Message · `chat_messages`

Nội dung tin nhắn thuộc hội thoại, lưu người gửi và thời điểm gửi.

| Trường | Kiểu Java | Ánh xạ / mặc định |
| --- | --- | --- |
| `id` | `Long` | Khóa chính |
| `conversation` | `Conversation` | ManyToOne · conversation_id |
| `sender` | `User` | ManyToOne · sender_id |
| `content` | `String` | — |
| `createdAt` | `Instant` | — |

## Kiểu liệt kê

- `VerificationType` — `EMAIL_ACTIVATION`, `PASSWORD_RESET`.
- `CheckInStatus` — `NOT_CHECKED_IN`, `CHECKED_IN`.
- `GameType` — `MOBA`, `FPS`, `BATTLE_ROYALE`, `SPORTS`, `RTS`, `CARD_GAME`.
- `MatchStatus` — `SCHEDULED`, `ONGOING`, `COMPLETED`, `CANCELLED`.
- `RegistrationStatus` — `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.
- `TeamMemberRole` — `CAPTAIN`, `MEMBER`.
- `TeamStatus` — `ACTIVE`, `INACTIVE`.
- `TournamentFormat` — `SINGLE_ELIMINATION`, `DOUBLE_ELIMINATION`, `SWISS`, `ROUND_ROBIN`.
- `TournamentStatus` — `OPEN_REGISTRATION`, `REGISTRATION_CLOSED`, `ONGOING`, `COMPLETED`, `CANCELLED`.
- `UserRole` — `PLAYER`, `ORGANIZER`, `ADMIN`.

`MatchScheduledEvent` và `MatchFinishedEvent` là sự kiện Java dùng khi lập lịch và hoàn tất trận. Xem các luồng xử lý trong [mô-đun hệ thống](System_Modules.md).

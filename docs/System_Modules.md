# Các module của Game-Hub

Backend là một ứng dụng Spring Boot có điểm khởi động `BtpApplication`. Mỗi mục dưới đây tương ứng với một package trực tiếp trong `src/main/java/btpoop`. Tên package cho biết nơi tìm mã nguồn, còn phần mô tả giải thích module chịu trách nhiệm về dữ liệu nào và phối hợp với các module khác ra sao.

## `user` — Tài khoản và phiên đăng nhập

`User` là lớp cha của `Player`, `Organizer` và `Admin`. `UserRepository` lưu tài khoản, còn `UserServiceImpl` xử lý đăng ký và kiểm tra thông tin đăng nhập. Khi tạo tài khoản, service gọi `VerificationService` để gửi mã kích hoạt.

`UserController` thiết lập phiên HTTP sau khi đăng nhập thành công. Các controller cần biết ai đang thao tác dùng `SessionUser` để lấy ID từ phiên hoặc đối chiếu ID với chủ sở hữu tài nguyên.

## `verification` — Xác thực email

`VerificationToken` lưu mã theo email và loại yêu cầu, cùng thời điểm hết hạn và số lượt yêu cầu trong ngày. `VerificationService` quản lý vòng đời của mã, từ tạo, gửi lại đến kiểm tra mã và xác thực tài khoản.

Module sử dụng `EmailService` của `notification` để gửi thư. Với mã kích hoạt, thời hạn là 10 phút, hai lượt yêu cầu cách nhau ít nhất một phút và giới hạn là năm lượt mỗi ngày. `PasswordUtil` cũng nằm trong package này và được `user` dùng để băm mật khẩu.

## `game` — Bộ môn thi đấu

`Game` mô tả tên bộ môn, thể loại và số người tối thiểu, tối đa của một đội. `GameCatalog` bổ sung các bộ môn còn thiếu khi ứng dụng khởi động. `GameRepository` và `GameServiceImpl` cung cấp dữ liệu danh mục.

Cả `Team` và `Tournament` đều tham chiếu một `Game`. Nhờ đó, `RegistrationModule` có thể kiểm tra đội và giải có cùng bộ môn hay không, rồi đối chiếu quân số với giới hạn của bộ môn.

## `team` — Đội và thành viên

`Team` lưu bộ môn, đội trưởng và trạng thái tuyển người. `TeamMember` biểu diễn quan hệ giữa một `Player` và một đội, gồm vai trò và ngày gia nhập. Đơn xin gia nhập nằm trong tập `applicants` của đội cho tới khi được xử lý.

`TeamServiceImpl` sử dụng các repository của đội, thành viên và tài khoản. Các thao tác cộng đồng trên giao diện như duyệt đơn và rời đội được triển khai trong `WebsiteTeamController` thuộc `web`. Cùng mô hình `Team` còn biểu diễn đội thi đấu của một giải qua trường `tournamentScope`.

## `tournament` — Giải đấu

`Tournament` là đối tượng mà lượt đăng ký, nhánh đấu và trận đấu cùng tham chiếu. Nó xác định chủ giải, bộ môn, thể thức, trạng thái và thời gian thi đấu. `TournamentServiceImpl` tra tài khoản và bộ môn qua repository tương ứng khi xử lý giải.

Phần cấu hình riêng của website như luật, địa điểm, thời gian nhận đăng ký và bố cục trang chủ được lưu trong `settingsJson`. `WebsiteController` đọc và cập nhật các giá trị này khi chủ giải chỉnh sửa trên giao diện.

## `registration` — Đăng ký tham dự giải

`Registration` liên kết một giải với đội thi đấu và lưu ID đội cộng đồng gốc, ID đội trưởng cùng danh sách ID thành viên tại thời điểm đăng ký. Nhờ bản ghi này, giải có thể xác định đội hình đã đăng ký kể cả khi thành viên của đội cộng đồng thay đổi sau đó.

`RegistrationModule` kiểm tra quyền đội trưởng, thời gian mở đăng ký, bộ môn, quân số và giới hạn tám đội của giải. Một yêu cầu được gửi lại cho đội đã đăng ký sẽ dùng lượt hiện có. Khi hủy, module kiểm tra đội đã được xếp vào trận hay chưa. `WebsiteController` dùng các lượt đã duyệt để tính số người tham dự theo ID thành viên duy nhất.

## `bracket` — Cấu trúc nhánh đấu

`Bracket` thuộc một giải và chứa các `Round` theo thứ tự. `BracketServiceImpl` lấy danh sách đội đăng ký và giao việc sinh nhánh cho bộ sinh do `BracketGeneratorFactory` chọn theo thể thức. Ba bộ sinh hiện có xử lý loại trực tiếp, loại kép và vòng tròn.

Mỗi vòng chứa các đối tượng `Match` của module `match`. Khi người tổ chức sửa nhánh trên web, `WebsiteBracket` kiểm tra ID và `revision` của nhánh trước khi lưu để phát hiện hai lượt chỉnh sửa dựa trên cùng một phiên bản.

## `match` — Trận đấu

`Match` lưu hai đội, vòng đấu, lịch, trạng thái và vị trí của trận tiếp theo trong nhánh. `MatchResult` được nhúng vào bản ghi trận để lưu hai điểm số và đội thắng. `MatchServiceImpl` xử lý việc đặt lịch và ghi kết quả.

Module liên lạc với các phần khác qua sự kiện Spring. `MatchScheduledEvent` cho phép `notification` xử lý lịch mới, còn `MatchFinishedEvent` cho phép `ranking` cập nhật xếp hạng từ trận vừa hoàn tất.

## `statistics` — Chỉ số người chơi

`PlayerStats` gắn với `Player` và lưu Elo, số trận, số lần thắng và thua. `StatisticsServiceImpl` lấy đúng người chơi qua `UserRepository` và chuyển kết quả thắng/thua cùng Elo đối thủ cho phương thức `PlayerStats.updateElo`.

`PlayerStatsRepository` lưu bộ chỉ số sau khi tính. Đây là nơi tra cứu khi cần biết thành tích của một cá nhân. Vị trí của người đó trên bảng xếp hạng thuộc module `ranking`.

## `ranking` — Xếp hạng

`PlayerRanking` và `TeamRanking` biểu diễn thứ hạng của người chơi và đội. `RankingServiceImpl` tiếp nhận sự kiện kết thúc trận, đọc kết quả và cập nhật dữ liệu xếp hạng. Bảng đội lưu điểm, số trận, thắng, hòa, thua và hiệu số.

`TournamentStandings` tính thứ hạng chung cuộc trực tiếp từ các vòng của nhánh loại trực tiếp 4 hoặc 8 đội. Màn hình giải nhận `PENDING` khi kết quả còn thiếu, `FINAL` khi đã xác định được thứ hạng và `UNAVAILABLE` với cấu trúc nhánh ngoài phạm vi hỗ trợ.

## `notification` — Thông báo và gửi thư

`Notification` lưu người nhận, tiêu đề, nội dung, thời điểm tạo và trạng thái đã đọc. `NotificationServiceImpl` tiếp nhận sự kiện lập lịch từ `match`. `NotificationTemplateBuilder` tạo nội dung và `EmailService` phụ trách gửi qua SMTP.

`NotificationScheduler` kiểm tra lịch trận mỗi giờ để nhắc trước một tuần, một ngày hoặc một giờ. Các cờ tương ứng trên `Match` giúp nhận biết mốc đã gửi. Phần xác thực tài khoản cũng dùng `EmailService` khi cần chuyển OTP đến người dùng.

## `chat` — Hội thoại riêng

`Conversation` đại diện cho một cặp tài khoản duy nhất. Mỗi `Message` thuộc một hội thoại, có người gửi, nội dung và thời điểm gửi. `ChatService` dùng ID tài khoản trong phiên để xác định các hội thoại mà người dùng có thể đọc và gửi tin.

`ChatController` cung cấp dữ liệu cho trang tin nhắn. Module tìm người nhận theo tiền tố tên tài khoản và đọc lịch sử qua `MessageRepository`. Mỗi trang lịch sử chứa tối đa 50 tin, với `beforeId` để tải tin cũ và `afterId` để lấy tin mới.

## `web` — Tích hợp giao diện React

`FrontendController` chuyển các đường dẫn trang về `index.html` để React Router có thể mở trang trực tiếp. `WebsiteController` tổng hợp dữ liệu hồ sơ, giải đấu và đội tham dự thành cấu trúc mà các trang React sử dụng.

`WebsiteTeamController` xử lý các thao tác với đội cộng đồng. `WebsiteBracket` đọc và lưu nhánh, đồng thời cung cấp thứ hạng chung cuộc. Khi nhận yêu cầu đăng ký đội, `WebsiteController` giao việc kiểm tra và lưu lượt đăng ký cho `RegistrationModule`.

## `enums` — Các kiểu dùng chung

Package này tập trung các giá trị mà nhiều module cùng sử dụng. Chẳng hạn, `TeamMemberRole` biểu diễn vai trò trong đội, `RegistrationStatus` biểu diễn trạng thái của một lượt đăng ký và `TournamentFormat` xác định thể thức thi đấu.

Các kiểu này được dùng trong mô hình JPA và khi các service kiểm tra điều kiện nghiệp vụ. Danh sách đầy đủ các giá trị và trường dữ liệu tương ứng nằm trong [đặc tả mô hình](Model_Fields_Specification.md).

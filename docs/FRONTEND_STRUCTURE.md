# Cấu trúc frontend BTP-OOP

Cập nhật ngày **02/11/2026**, đối chiếu với mã nguồn trong `frontend/`.

## 1. Tổng quan kiến trúc

Frontend hiện là ứng dụng **React 19** dùng JavaScript/JSX, **Vite 7**, **React Router 7** và **Tailwind CSS 4**. Mã nguồn nằm tại `frontend/`, ngang cấp với `src/` của Spring Boot. Giao diện được dựng ở trình duyệt; Spring Boot cung cấp API và phục vụ bản frontend đã build.

Các thư viện giao diện chính gồm Radix UI, Lucide React, `class-variance-authority`, `clsx` và `tailwind-merge`. Nội dung Markdown được hiển thị bằng `react-markdown` và `remark-gfm`. Kiểm thử dùng Vitest 3, Testing Library và JSDOM.

Luồng khởi động:

```text
index.html
  ├── /config.js                   Cấu hình đọc khi mở trang
  └── main.jsx                     Mount React và nạp styles/globals.css
        └── App.jsx
              └── RouterProvider + TourneyProvider
                    └── AppRoutes
                          ├── UnsavedChangesProvider
                          ├── NavigationExperience
                          └── Layout → Page → Component dùng chung
```

`constants/routes.js` khai báo danh mục route và tiêu đề; `App.jsx` ánh xạ route tới component, ghép layout, xử lý chuyển hướng và trang 404. Các trang dashboard và tournament được nạp bằng `React.lazy`.

## 2. Cây thư mục

Cây dưới đây thể hiện mã nguồn và cấu hình hiện có. Các thư mục phát sinh khi cài đặt, build hoặc QA được mô tả riêng ở mục 9.

```text
frontend/
├── assets/                         # Ảnh import vào mã nguồn, Vite xử lý khi build
│   ├── game/                       # 9 ảnh đại diện game
│   ├── hero-banner/                 # 8 ảnh banner: kk1.png đến kk8.png
│   ├── logo.png
│   └── logo_bieutuong.png
├── components/
│   ├── layouts/
│   │   ├── AppLayout.jsx
│   │   ├── AuthLayout.jsx
│   │   ├── PlatformLayout.jsx
│   │   ├── TournamentLayout.jsx
│   │   ├── TournamentPublicLayout.jsx
│   │   └── TournamentSpaceLayout.jsx
│   ├── shared/
│   │   ├── AccountMenu.jsx
│   │   ├── AppSidebar.jsx
│   │   ├── AuthPanel.jsx
│   │   ├── BracketTree.jsx
│   │   ├── CirclePagination.jsx
│   │   ├── EmptyState.jsx
│   │   ├── FloatingHomepageEditor.jsx
│   │   ├── FormField.jsx
│   │   ├── FutureDateField.jsx
│   │   ├── GameArtwork.jsx
│   │   ├── GameCarousel.jsx
│   │   ├── HeroBanner.jsx
│   │   ├── HomepageBuilder.jsx
│   │   ├── HomepageWidget.jsx
│   │   ├── HomepageWidgetForm.jsx
│   │   ├── ImageUploadField.jsx
│   │   ├── ImageWithFallback.jsx
│   │   ├── MarkdownEditorBox.jsx
│   │   ├── MarkdownRenderer.jsx
│   │   ├── MatchEditorDialog.jsx
│   │   ├── MatchStatus.jsx
│   │   ├── NavigationExperience.jsx
│   │   ├── OTPInputGroup.jsx
│   │   ├── PageContent.jsx
│   │   ├── PageHeader.jsx
│   │   ├── PageSkeleton.jsx
│   │   ├── PlatformFooter.jsx
│   │   ├── PlatformHeader.jsx
│   │   ├── ProfileTournamentList.jsx
│   │   ├── RequireAuth.jsx
│   │   ├── SettingsCard.jsx
│   │   ├── TeamAccordionBar.jsx
│   │   ├── TeamFormDialog.jsx
│   │   ├── TournamentArchive.jsx
│   │   ├── TournamentCard.jsx
│   │   ├── TournamentControls.jsx
│   │   ├── TournamentEditorPage.jsx
│   │   ├── TournamentFilters.jsx
│   │   ├── TournamentHero.jsx
│   │   ├── TournamentHighlights.jsx
│   │   ├── TournamentLoadState.jsx
│   │   ├── UnsavedChangesProvider.jsx
│   │   └── VenueLocationPicker.jsx
│   └── ui/                         # Các thành phần giao diện cơ bản
│       ├── button.jsx
│       ├── card.jsx
│       ├── dialog.jsx
│       ├── dropdown-menu.jsx
│       ├── input.jsx
│       ├── popover.jsx
│       └── sheet.jsx
├── constants/
│   ├── fixtures.js
│   ├── games.js
│   ├── hero-slides.js
│   ├── routes.js
│   ├── tournament-catalog.js
│   └── venues.js
├── context/
│   └── TourneyContext.jsx
├── hooks/
│   ├── useAsyncAction.js
│   ├── useCurrentDay.js
│   ├── useDebounce.js
│   ├── useDraft.js
│   ├── useHeroSlides.js
│   ├── useMediaQuery.js
│   ├── useNavIndicator.js
│   ├── useNotifications.js
│   ├── usePersonalActivity.js
│   ├── useRequireAuth.js
│   ├── useReveal.js
│   ├── useTournamentCatalog.js
│   ├── useTournamentData.js
│   └── useTournamentView.js
├── lib/
│   ├── api.js
│   ├── bracket.js
│   ├── dates.js
│   ├── games.js
│   ├── geocoder.js
│   ├── homepage.js
│   ├── identity.js
│   ├── images.js
│   ├── motion.js
│   ├── navigation.js
│   ├── notifications.js
│   ├── page-navigation.js
│   ├── personal-activity.js
│   ├── profile.js
│   ├── public-tournament.js
│   ├── teams.js
│   ├── tournament-search.js
│   ├── tournament-settings.js
│   ├── tournaments.js
│   ├── tourney-store.js
│   └── utils.js
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   └── VerifyPage.jsx
│   ├── dashboard/
│   │   ├── CommunityPage.jsx
│   │   ├── CreatePage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── EventsPage.jsx
│   │   ├── LandingPage.jsx
│   │   ├── NewsPage.jsx
│   │   └── SearchPage.jsx
│   ├── profile/
│   │   ├── AccountSettings.jsx
│   │   ├── ProfileForm.jsx
│   │   ├── ProfilePage.jsx
│   │   └── ProfileSettingsPage.jsx
│   └── tournament/
│       ├── DetailsPage.jsx
│       ├── GameInfoPage.jsx
│       ├── HomePage.jsx
│       ├── PublicViewPage.jsx
│       ├── RegistrationPage.jsx
│       ├── SchedulePage.jsx
│       └── TeamsPage.jsx
├── public/                         # File giữ nguyên tên và đường dẫn khi build
│   ├── config.js
│   └── fonts/
│       ├── be-vietnam-pro/          # Regular, Medium, SemiBold, Bold và OFL.txt
│       └── black-ops-one/           # BlackOpsOne-Regular.ttf và OFL.txt
├── styles/
│   └── globals.css
├── tests/                          # Kiểm thử tự động; xem mục 8
│   ├── setup.js
│   └── *.test.js / *.test.jsx
├── .env.example
├── App.jsx
├── components.json
├── index.html
├── jsconfig.json
├── main.jsx
├── package-lock.json
├── package.json
└── vite.config.js
```

## 3. Trang và điều hướng

Hiện có **19 route chính**. Các đường dẫn dưới đây được định nghĩa trong `constants/routes.js` và ánh xạ trong `App.jsx`.

### 3.1. Xác thực — `pages/auth/`

- `/login` → `LoginPage.jsx`: đăng nhập qua API, lưu hồ sơ hiển thị vào Context và quay về đích `returnTo` hợp lệ; mặc định về dashboard.
- `/register` → `RegisterPage.jsx`: đăng ký tài khoản và chuyển sang xác thực email.
- `/verify` → `VerifyPage.jsx`: nhập OTP, xác thực email và gửi lại mã.

Các trang này dùng `AuthLayout`. Những URL `/auth/login`, `/auth/register`, `/auth/verify` chuyển hướng sang route tương ứng và giữ query/hash.

### 3.2. Nền tảng và không gian cá nhân — `pages/dashboard/`, `pages/profile/`

- `/` → `LandingPage.jsx`: banner, danh mục game và các nhóm giải nổi bật.
- `/search` → `SearchPage.jsx`: tìm kiếm, lọc và phân trang danh sách giải; lưu tiêu chí tìm kiếm trong URL.
- `/dashboard` → `DashboardPage.jsx`: tổng quan hoạt động cá nhân, giải đấu và các trận liên quan.
- `/events` → `EventsPage.jsx`: danh sách giải do người dùng quản lý hoặc tham gia.
- `/community` → `CommunityPage.jsx`: danh sách đội tuyển, tạo/sửa đội, xin vào đội và quản lý thành viên theo quyền.
- `/news` → `NewsPage.jsx`: thông báo lịch thi đấu từ API, làm mới và đánh dấu đã đọc. Trang hiển thị lời nhắc đăng nhập nếu chưa có ID tài khoản phù hợp.
- `/create` → `CreatePage.jsx`: nhập thông tin cơ bản để tạo giải trong store frontend rồi mở trang cấu hình.
- `/profile` → `ProfilePage.jsx`: hồ sơ và danh sách giải tham gia.
- `/profile/settings` → `ProfileSettingsPage.jsx`: ghép `ProfileForm.jsx` để sửa hồ sơ và `AccountSettings.jsx` để quản lý thông tin tài khoản trên frontend.

Các trang này dùng `PlatformLayout`. `/dashboard`, `/events`, `/create` và `/profile/settings` yêu cầu đăng nhập trước khi hiển thị nội dung.

### 3.3. Không gian giải đấu — `pages/tournament/`

- `/tournament/details` → `DetailsPage.jsx`: thông tin giải, thời gian, ảnh, địa điểm và nội quy Markdown.
- `/tournament/game-info` → `GameInfoPage.jsx`: bộ môn, thể thức và các thông số thi đấu.
- `/tournament/registration-settings` → `RegistrationPage.jsx`: điều kiện và thời gian mở/đóng đăng ký.
- `/tournament/teams` → `TeamsPage.jsx`: danh sách đội/người tham gia của giải.
- `/tournament/home` → `HomePage.jsx`: xây dựng nội dung trang chủ giải bằng section, cột và widget.
- `/tournament/view` → `PublicViewPage.jsx`: nội dung công khai, các tab tổng quan/đội tuyển/thể lệ và liên kết lịch.
- `/tournament/schedule` → `SchedulePage.jsx`: sơ đồ nhánh, bảng lịch, giờ đấu và kết quả; thêm `?view=public` để mở chế độ công khai chỉ xem.

`/tournament` chuyển hướng đến `/tournament/home`. Các trang quản lý yêu cầu đăng nhập; quyền cập nhật còn được đối chiếu với chủ sở hữu giải.

URL giải dùng `id`; `sample=1` nhận diện giải trong catalog mẫu, `view=public` chọn lịch công khai và `tab` chọn nội dung trên trang công khai. Nên tạo liên kết qua `tournamentPath()` hoặc `publicSectionPath()` trong `lib/public-tournament.js` để giữ đúng định danh.

## 4. Layout và component

### 4.1. `components/layouts/`

- `PlatformLayout.jsx`: header, vùng nội dung chính, footer và điều hướng không gian cá nhân; ẩn footer ở trang quản lý giải.
- `AuthLayout.jsx`: header ở chế độ xác thực, vùng form và footer dành cho đăng nhập/đăng ký/OTP.
- `TournamentSpaceLayout.jsx`: chọn bố cục quản lý hoặc công khai dựa trên đường dẫn và query.
- `AppLayout.jsx`: bổ sung thanh công cụ quản lý giải ở cạnh trái trên desktop.
- `TournamentLayout.jsx`: chọn giải đang quản lý, menu cấu hình và vùng nội dung của giải.
- `TournamentPublicLayout.jsx`: hero giải, đăng ký/hủy đăng ký theo quyền và các tab công khai; dùng chung cho trang xem giải và lịch `view=public`.

### 4.2. `components/ui/`

Các thành phần cơ bản: `button`, `card`, `input`, `dialog`, `dropdown-menu`, `popover`, `sheet`. Đây là lớp giao diện để các trang và component nghiệp vụ tái sử dụng. `components.json` lưu cấu hình shadcn/ui; tiện ích `cn()` trong `lib/utils.js` kết hợp và xử lý class Tailwind.

### 4.3. `components/shared/`

- Điều hướng và tài khoản: `PlatformHeader`, `PlatformFooter`, `AppSidebar`, `AccountMenu`, `RequireAuth`, `NavigationExperience`.
- Khung nội dung và trạng thái: `PageContent`, `PageHeader`, `PageSkeleton`, `EmptyState`, `TournamentLoadState`, `CirclePagination`.
- Biểu mẫu: `AuthPanel`, `FormField`, `FutureDateField`, `OTPInputGroup`, `SettingsCard`, `UnsavedChangesProvider`.
- Khám phá và hiển thị giải: `HeroBanner`, `GameCarousel`, `GameArtwork`, `TournamentCard`, `TournamentArchive`, `TournamentControls`, `TournamentFilters`, `TournamentHighlights`, `TournamentHero`, `ProfileTournamentList`.
- Chỉnh sửa giải: `TournamentEditorPage`, `ImageUploadField`, `ImageWithFallback`, `VenueLocationPicker`, `MarkdownEditorBox`, `MarkdownRenderer`.
- Đội tuyển và lịch đấu: `TeamAccordionBar`, `TeamFormDialog`, `BracketTree`, `MatchEditorDialog`, `MatchStatus`.
- Dựng trang chủ giải: `HomepageBuilder`, `HomepageWidget`, `HomepageWidgetForm`, `FloatingHomepageEditor`.

`NavigationExperience` phối hợp khôi phục vị trí cuộn/focus khi quay lại trang. `PageContent` xử lý phần khung tải và chuyển cảnh. `UnsavedChangesProvider` cung cấp cảnh báo khi rời biểu mẫu có thay đổi chưa lưu.

## 5. Dữ liệu, Context và API

### 5.1. `context/TourneyContext.jsx` và `lib/tourney-store.js`

`TourneyProvider` giữ trạng thái dùng chung, truy cập qua `useTourney()`:

- Hồ sơ hiện tại: `currentUser`.
- Danh sách giải và giải đang chọn: `tournaments`, `activeTournamentId`, `activeTournament`, `publicTournament`.
- Đội cộng đồng, đăng ký và nhánh đấu: `teams`, `registeredTournaments`, `brackets`.
- Trạng thái tải API, lỗi API và lỗi lưu trên thiết bị.

Context cung cấp các thao tác tạo/cập nhật/chọn giải, quản lý đội, đăng ký/hủy đăng ký, lưu nhánh đấu và tải lại danh sách giải. Dữ liệu được lưu chủ yếu tại LocalStorage với khóa **`btp_react_state_v1`**, có đồng bộ qua sự kiện `storage` giữa các tab. `tourney-store.js` đọc và chuyển đổi các khóa LocalStorage/SessionStorage cũ, chuẩn hóa dữ liệu và làm sạch nhánh đấu cũ khi nạp.

**Phạm vi lưu dữ liệu hiện tại:** xác thực, đọc danh sách/chi tiết giải và thông báo đã gọi API. Các thao tác tạo/cấu hình giải, quản lý đội, đăng ký giải, sửa hồ sơ và lưu nhánh đấu hiện cập nhật Context/storage của trình duyệt; chưa có lời gọi ghi tương ứng trong `lib/api.js`. Việc dữ liệu vẫn tồn tại sau khi tải lại trang không đồng nghĩa đã lưu vào database.

Hồ sơ lưu trên trình duyệt chỉ giữ các trường hiển thị được cho phép, không lưu mật khẩu/token từ phản hồi đăng nhập. `AccountSettings.jsx` hiện thông báo chưa hỗ trợ đổi mật khẩu qua máy chủ; thao tác xóa hồ sơ chỉ xóa hồ sơ tại trình duyệt.

### 5.2. `lib/api.js`

`request()` dùng `fetch`, gửi JSON hoặc form URL-encoded, xử lý phản hồi/lỗi HTTP qua `ApiError`. URL gốc lấy từ `VITE_API_BASE_URL`; mặc định rỗng để gọi cùng origin.

Các nhóm API đang dùng:

- `authApi`: `POST /api/users/login`, `POST /api/users/register`, `POST /api/verification/verify-email`, `POST /api/verification/resend-activation-code`.
- `tournamentApi`: `GET /api/tournaments`, `GET /api/tournaments/:id`.
- `notificationApi`: `GET /api/notifications/user/:userId`, `PUT /api/notifications/:id/read`.

`lib/geocoder.js` là lớp gọi dịch vụ địa điểm riêng, phục vụ tìm kiếm và tra ngược tọa độ. URL được lấy từ `window.BTP_CONFIG.geocoderBaseUrl` trong `public/config.js`, mặc định là Nominatim. Thay URL cấu hình runtime không cần build lại mã React.

### 5.3. `constants/` và dữ liệu mẫu

- `routes.js`: danh mục route, tiêu đề và nhóm layout.
- `games.js`: danh mục 9 game, ID/alias, ảnh và các lựa chọn thể thức.
- `hero-slides.js`: nội dung, ảnh và vị trí hiển thị của 8 banner trang chủ.
- `venues.js`: địa điểm gợi ý có tọa độ.
- `fixtures.js`: dữ liệu giải mẫu và bộ đội cộng đồng ban đầu.
- `tournament-catalog.js`: hợp nhất catalog mẫu và ánh xạ ID cũ.

Catalog mẫu vẫn được dùng trong khám phá và dữ liệu khởi tạo cộng đồng. Các helper giữ định danh nguồn bên trong để tránh nhầm giải mẫu với giải khác trùng ID. Danh tính người dùng được đối chiếu qua `lib/identity.js`; tên hiển thị hoặc dữ liệu mẫu không tự cấp quyền quản lý.

### 5.4. Các module nghiệp vụ trong `lib/`

- Giải đấu: `tournaments.js` chuẩn hóa dữ liệu, lọc và tạo giải; `tournament-settings.js` kiểm tra/cập nhật cấu hình và người tham gia; `tournament-search.js` đọc/ghi tiêu chí tìm kiếm trong URL.
- Trang công khai và quyền: `public-tournament.js` phân giải giải đang xem, tạo liên kết và xử lý đăng ký; `identity.js` tạo/so khớp danh tính; `personal-activity.js` tổng hợp hoạt động cá nhân.
- Đội và hồ sơ: `teams.js` kiểm tra quyền đội trưởng/thành viên và xử lý thao tác đội; `profile.js` chuẩn hóa hồ sơ, dữ liệu hiển thị và định dạng ngày.
- Nhánh đấu: `bracket.js` sinh nhánh loại trực tiếp 4/8 đội từ đội đã thêm, để vị trí thiếu là `null`/TBD, cập nhật kết quả và làm sạch đội tự sinh từ dữ liệu cũ. Các lựa chọn thể thức khác trong giao diện cấu hình không có nghĩa bộ sinh nhánh frontend đã hỗ trợ chúng.
- Trang chủ giải và nội dung: `homepage.js` quản lý section/cột/widget; `images.js` đọc và kiểm tra ảnh; `geocoder.js` tra địa điểm.
- Danh mục game: `games.js` phân giải tên/alias, nhãn hiển thị và ảnh game thống nhất.
- Tiện ích giao diện: `dates.js` kiểm tra ngày; `notifications.js` chuẩn hóa thông báo; `navigation.js` kiểm tra route cần đăng nhập và đích `returnTo`; `page-navigation.js` xử lý khóa trang/focus; `motion.js` hỗ trợ chuyển động và chờ ảnh; `utils.js` cung cấp `cn()`.

## 6. Hooks và tài nguyên giao diện

### 6.1. `hooks/`

- `useTournamentData.js`: tải danh sách giải qua trạng thái API dùng chung, tránh tải lại không cần thiết khi đổi trang.
- `useTournamentCatalog.js`: ghép giải trong store với catalog mẫu cho các trang khám phá.
- `useTournamentView.js`: phân giải giải từ URL/store/catalog, gọi API chi tiết khi cần; cung cấp tải/lỗi/không tìm thấy/thử lại và quyền thao tác.
- `usePersonalActivity.js`: tổng hợp giải, đội và trận liên quan đến tài khoản hiện tại.
- `useNotifications.js`: tải/làm mới thông báo và đánh dấu đã đọc, cập nhật định kỳ hoặc khi quay lại tab.
- `useRequireAuth.js`: kiểm tra danh tính và chuyển tới đăng nhập kèm đích quay lại.
- `useDraft.js`: quản lý bản nháp và trạng thái thay đổi chưa lưu theo đối tượng đang chỉnh sửa.
- `useAsyncAction.js`: quản lý chờ/lỗi/thông báo và ngăn gửi thao tác lặp khi đang xử lý.
- `useDebounce.js`, `useCurrentDay.js`: trì hoãn cập nhật đầu vào và cập nhật ngày hiện tại cho kiểm tra ngày.
- `useMediaQuery.js`, `useNavIndicator.js`, `useReveal.js`, `useHeroSlides.js`: responsive, chỉ báo điều hướng, hiệu ứng xuất hiện và slideshow có hỗ trợ giảm chuyển động.

### 6.2. `assets/`, `public/`, `styles/`

- `assets/`: ảnh import bằng JavaScript, chẳng hạn `@/assets/logo.png`; Vite xử lý tên/đường dẫn trong bản build. Ảnh game được tập trung tại `constants/games.js`, ảnh hero tại `constants/hero-slides.js`.
- `public/`: tài nguyên được chép nguyên vào gốc bản build; `public/config.js` được phục vụ tại `/config.js`, font tại `/fonts/...`. Giữ các tệp giấy phép `OFL.txt` đi kèm font.
- `styles/globals.css`: import Tailwind, khai báo font, biến màu/khoảng cách/bo góc/chuyển động, style nền tảng và các class dùng chung. Font chính là **Be Vietnam Pro**; **Black Ops One** dùng cho phần chữ đặc trưng.

Alias **`@/` trỏ tới gốc `frontend/`**, được khai báo cho Vite trong `vite.config.js` và cho trình soạn thảo trong `jsconfig.json`.

## 7. Chạy và build

### 7.1. Chạy cùng Spring Boot

Tại thư mục gốc dự án, dùng JDK 25 và Maven:

```powershell
mvn spring-boot:run
```

Mở `http://localhost:8080`. `frontend-maven-plugin` cài Node **22.12.0** và npm **10.9.0** trong thư mục build, chạy `npm ci --no-audit --no-fund`, rồi `npm run build`. `maven-resources-plugin` chép `frontend/dist/` vào `${project.build.outputDirectory}/static/` để Spring Boot phục vụ cùng API.

`src/main/java/btpoop/web/controller/FrontendController.java` forward các route React đã biết về `/index.html`, giúp mở trực tiếp hoặc tải lại `/news`, `/profile/settings`, `/tournament/...`. Khi thêm route mới, cập nhật cả catalog, ánh xạ component và controller phục vụ route nếu cần.

Giữ `VITE_API_BASE_URL` rỗng khi đóng gói cùng Spring Boot. Khi sửa React, chạy lại quy trình Maven để cập nhật bản build. Chạy trực tiếp `BtpApplication` trong IDE không tự thực hiện bước build frontend.

Đóng gói và chạy JAR:

```powershell
mvn clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

JAR chứa frontend đã build và backend. Profile Maven `ide` dùng `target-ide`; đường dẫn sao chép tài nguyên dựa trên output directory của Maven.

### 7.2. Phát triển riêng với Vite

Cần Node.js **từ 22.12.0** và npm trên máy. Tại thư mục gốc:

```powershell
cd frontend
npm ci
npm run dev
```

Vite bind `127.0.0.1`; xem URL thực tế trong terminal, thường là `http://127.0.0.1:5173`. Backend phải chạy để sử dụng các chức năng API. Cấu hình proxy trong `vite.config.js` chuyển `/api` tới `http://localhost:8080` theo mặc định.

Có thể sao chép `.env.example` thành `.env` và chỉnh:

```dotenv
API_PROXY_TARGET=http://localhost:8080
VITE_API_BASE_URL=
```

`API_PROXY_TARGET` chỉ điều chỉnh proxy của Vite dev server. `VITE_API_BASE_URL` được nhúng vào mã frontend khi dev/build; thay đổi biến này cho bản production cần build lại.

Các script còn lại, chạy trong `frontend/`:

```powershell
npm run build     # Tạo dist/
npm run preview   # Xem trước dist/ đã build
npm test          # Chạy Vitest một lần
```

`preview` dùng để xem trước giao diện đã build; dùng Spring Boot để kiểm tra bản đóng gói chung với API. Dừng Vite/test trước khi chạy quy trình Maven cài lại dependency để tránh khóa file trên Windows.

## 8. Kiểm thử

`tests/` hiện có **34 file kiểm thử** `.test.js`/`.test.jsx` và `setup.js`. Các kiểm thử không được đưa vào bundle giao diện production.

- `setup.js`: thiết lập Testing Library, Web Storage của JSDOM, giả lập `matchMedia`, dọn DOM và storage giữa các test.
- `api.test.js`, `auth.test.jsx`, `profile.test.jsx`, `news.test.jsx`: API wrapper, xác thực, hồ sơ và thông báo.
- `routing.test.jsx`, `platform-layout.test.jsx`, `landing.test.jsx`, `SettingsCard.test.jsx`: route, layout và component cơ bản.
- `TourneyContext.test.jsx`, `tourney-store.test.js`: state dùng chung, lưu/đọc dữ liệu và tương thích dữ liệu cũ.
- `session3-*`, `session4-*`, `session5-*`: logic và giao diện giải đấu, đội, cấu hình, widget và lịch đấu.
- `ux2-*` đến `ux7-*`: danh tính, khám phá, hoạt động cá nhân, xác thực theo ngữ cảnh và điều hướng.
- `game-catalog.test.jsx`, `game-carousel.test.jsx`, `geocoder.test.js`, `date-registration.test.jsx`, `graphite-motion.test.jsx`: game, carousel, địa điểm, ngày đăng ký và chuyển động.
- `unified-presentation.test.jsx`, `unified-brackets.test.js`: trình bày dữ liệu thống nhất, nhánh TBD và chuyển đổi nhánh cũ.

Chạy `npm test` trong `frontend/`. Khi cần hạn chế số worker: `npm test -- --maxWorkers=2`. Môi trường JSDOM và setup được cấu hình trong `vite.config.js`; `.qa/` bị loại khỏi phạm vi test.

Kiểm thử tích hợp phục vụ frontend nằm ngoài thư mục này, tại `src/test/java/btpoop/web/FrontendServingTest.java`: kiểm tra route trực tiếp, tài nguyên build và việc các API/tài nguyên thiếu không bị trả nhầm HTML của React. Chạy qua Maven sau các bước build tài nguyên; quy trình Maven hiện không tự gọi script `npm test`.

## 9. Mã nguồn và thư mục phát sinh

Toàn dự án dùng một file `.gitignore` tại thư mục gốc. Các mục sau được bỏ qua, có thể xuất hiện lại trong quá trình làm việc:

- `node_modules/`: dependency được cài theo `package-lock.json`; tạo lại bằng `npm ci`.
- `dist/`: kết quả `npm run build`; là đầu vào để Maven chép giao diện vào classpath.
- `.npm-cache/`: cache npm, cũng được cấu hình trong plugin Maven.
- `.qa/`: ảnh, báo cáo, script và profile trình duyệt phục vụ QA thủ công; không phải dependency chạy website.
- `coverage/`: báo cáo độ bao phủ nếu chạy công cụ coverage.
- `.env`, `.env.*`: cấu hình môi trường cục bộ; các file mẫu `.env.example` và `.env.*.example` vẫn được đưa vào Git.

Giữ `package-lock.json` để `npm ci` cài đúng phiên bản đã khóa. Giữ `.env.example` làm mẫu cấu hình và `tests/` để kiểm tra khi thay đổi code. Không sửa trực tiếp `dist/` hoặc tài nguyên đã được chép trong `target/`/`target-ide/`; sửa mã tại `frontend/` rồi build lại.

## 10. Vị trí sửa khi phát triển

- Thêm trang: tạo page trong `pages/`, đăng ký tại `constants/routes.js` và `App.jsx`, kiểm tra điều kiện xác thực trong `lib/navigation.js` và route phía Spring Boot.
- Thêm thành phần dùng chung: dùng `components/ui/` cho phần tử cơ bản, `components/shared/` cho giao diện gắn với chức năng ứng dụng.
- Thêm lời gọi backend: khai báo tại `lib/api.js`, xử lý trạng thái tải/thử lại ở hook hoặc page; phân biệt rõ dữ liệu từ máy chủ với thay đổi chỉ lưu trên trình duyệt.
- Sửa quy tắc nghiệp vụ: tập trung ở `lib/`; logic gắn với vòng đời React đặt trong `hooks/`, state liên trang đặt trong Context.
- Thay bộ nhận diện: ảnh trong `assets/`, danh mục game/banner trong `constants/`, token và font trong `styles/globals.css` cùng `public/fonts/`.

Xem thêm [hướng dẫn chạy dự án](../README.md) và [cấu hình build Maven](../pom.xml).

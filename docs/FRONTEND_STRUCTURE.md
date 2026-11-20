# Frontend Game-Hub

Giao diện là một ứng dụng React 19 dùng React Router, Vite và Tailwind CSS. Spring Boot phục vụ giao diện và API trên cùng một địa chỉ. Khi người dùng tải lại một đường dẫn của React, `FrontendController` chuyển yêu cầu về `index.html`. Trình duyệt dựng trang và lấy dữ liệu qua HTTP.

## 1. Điểm vào và bố cục

[main.jsx](../frontend/main.jsx) gắn React vào phần tử `root` và nạp CSS toàn cục. [App.jsx](../frontend/App.jsx) tạo browser router, đặt `TourneyProvider` quanh cây trang và ánh xạ mỗi đường dẫn sang một component. Khi thêm trang, cập nhật cả ánh xạ này, [danh mục route](../frontend/constants/routes.js) và danh sách đường dẫn Spring phục vụ trực tiếp.

`AuthLayout` hiển thị các biểu mẫu xác thực. `PlatformLayout` tạo khung chung cho trang chủ và các trang ứng dụng. Các trang giải đấu nằm trong `TournamentSpaceLayout`, dùng giao diện quản lý hoặc giao diện công khai tùy đường dẫn và tham số. `PageTransition` xử lý chuyển trang, còn `UnsavedChangesProvider` theo dõi biểu mẫu có chỉnh sửa chưa lưu.

## 2. Danh mục trang

| Đường dẫn | Chức năng | Component | Layout trong danh mục |
| --- | --- | --- | --- |
| `/` | Trang giới thiệu | `LandingPage` | `landing` |
| `/login` | Đăng nhập | `LoginPage` | `auth` |
| `/register` | Đăng ký | `RegisterPage` | `auth` |
| `/verify` | Xác thực mã OTP | `VerifyPage` | `auth` |
| `/profile` | Hồ sơ cá nhân | `ProfilePage` | `app` |
| `/profile/settings` | Cài đặt hồ sơ | `ProfileSettingsPage` | `app` |
| `/search` | Tìm kiếm giải đấu | `SearchPage` | `app` |
| `/events` | Giải đấu của tôi | `EventsPage` | `app` |
| `/community` | Cộng đồng & đội tuyển | `CommunityPage` | `app` |
| `/messages` | Tin nhắn | `MessagesPage` | `app` |
| `/news` | Tin tức | `NewsPage` | `app` |
| `/create` | Tạo giải đấu | `CreatePage` | `app` |
| `/tournament/details` | Chi tiết giải đấu | `DetailsPage` | `tournament` |
| `/tournament/registration-settings` | Cài đặt đăng ký | `RegistrationPage` | `tournament` |
| `/tournament/teams` | Đội tuyển | `TeamsPage` | `tournament` |
| `/tournament/game-info` | Thông tin game | `GameInfoPage` | `tournament` |
| `/tournament/home` | Trang chủ giải đấu | `HomePage` | `tournament` |
| `/tournament/view` | Xem giải đấu công khai | `PublicViewPage` | `public` |
| `/tournament/schedule` | Lịch thi đấu | `SchedulePage` | `tournament` |

`/dashboard` chuyển về trang chủ. `/tournament` chuyển tới `/tournament/home`. Các đường dẫn cũ dưới `/auth/` chuyển tới trang đăng nhập, đăng ký hoặc xác thực tương ứng.

## 3. Phiên và quyền truy cập

`RequireAuth` dùng quy tắc trong [navigation.js](../frontend/lib/navigation.js). Khách vào trang tạo giải, giải của tôi, tin nhắn, cài đặt hồ sơ hoặc trang quản lý giải được chuyển tới đăng nhập kèm `returnTo`. Trang xem giải và lịch có `view=public` mở cho khách. Backend kiểm tra quyền khi ghi dữ liệu.

[TourneyContext.jsx](../frontend/context/TourneyContext.jsx) tải game, danh sách giải và đội cộng đồng. Sau khi đăng nhập, provider đọc hồ sơ từ máy chủ, đối chiếu ID và lưu `gamehub_session_user` vào `sessionStorage`. Khi tải lại, provider xác minh ID với phiên máy chủ trước khi hiển thị tài khoản. `gamehub_active` ghi nhớ giải đang chọn trong tab. Đăng xuất gọi API và xóa dấu phiên trên trình duyệt.

## 4. Thư mục và luồng dữ liệu

- `pages/` chứa màn hình theo nhóm auth, dashboard, profile, messages và tournament. `components/layouts/` chứa khung trang, `components/ui/` chứa các điều khiển cơ bản, `components/shared/` chứa biểu mẫu, thẻ giải, bảng xếp hạng và trình sửa trận dùng chung.
- `lib/api.js` gọi API bằng cookie cùng origin, mã hóa JSON hoặc form tùy endpoint và chuyển lỗi HTTP thành `ApiError`. `lib/` cũng chứa logic xử lý đội, nhánh đấu, tìm kiếm, hồ sơ và tin nhắn. `hooks/` chứa các hook tải dữ liệu, giữ bản nháp và quản lý thao tác bất đồng bộ.
- `assets/` chứa ảnh và video được Vite đóng gói. `public/` chứa tài nguyên phục vụ trực tiếp. `styles/globals.css` là điểm vào của CSS.
- Trang cài đặt ghép `ProfileForm` và `AccountSettings`. Phần hồ sơ cho sửa ảnh đại diện (tối đa 4 MB), GamerTag, tiểu sử, quốc gia và thành phố. Phần tài khoản cho sửa email liên hệ và xóa phiên trên thiết bị. Biểu mẫu đổi mật khẩu hiện thông báo máy chủ chưa hỗ trợ.
- Trang cộng đồng quản lý đội và đơn xin gia nhập. Khi đội trưởng chọn đội để đăng ký giải, frontend gửi `teamId` và dùng dữ liệu giải trong phản hồi để cập nhật màn hình. Luồng nhắn tin riêng sử dụng `pages/messages/` và API hội thoại.

## 5. Chạy và đóng gói

Từ thư mục chứa `pom.xml`, chạy `mvn spring-boot:run` với JDK 25. Maven cài công cụ frontend trong thư mục build, chạy npm, chép `frontend/dist` vào tài nguyên static. `mvn package` đóng gói frontend cùng backend trong JAR.

<a id="72-phát-triển-riêng-với-vite"></a>

### Phát triển riêng với Vite

Trong thư mục `frontend`, dùng Node.js từ 22.12, chạy `npm ci` rồi `npm run dev`. Mở địa chỉ Vite in trong terminal. Proxy mặc định chuyển `/api` tới `http://localhost:8080`. biến `API_PROXY_TARGET` cho phép đổi địa chỉ backend. Để trống `VITE_API_BASE_URL` khi dùng cùng origin.

`npm run build` tạo bản phân phối. `npm test` chạy Vitest trên các bài kiểm thử cục bộ. Git bỏ qua `frontend/tests/`, nên bản clone mới cần có các file test trước khi chạy lệnh này.

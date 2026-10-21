# Tài Liệu Cấu Trúc Frontend (`src/main/resources`)

Tài liệu này tổng hợp toàn bộ cấu trúc thư mục và chức năng chi tiết của từng file thuộc phần Frontend (Thymeleaf Templates, CSS, JavaScript, Images) nằm trong thư mục `src/main/resources` của dự án **BTP-OOP**.

---

## 1. Sơ Đồ Cây Thư Mục Tổng Quan

```text
src/main/resources/
├── application.properties                      # Cấu hình ứng dụng Spring Boot (Database, Mail, Thymeleaf, Server...)
├── static/                                     # Chứa toàn bộ tài nguyên tĩnh (CSS, JS, Images) phục vụ phía Client
│   ├── css/
│   │   ├── common/                             # CSS nền tảng và dùng chung toàn hệ thống
│   │   │   ├── base.css
│   │   │   ├── components.css
│   │   │   ├── toast.css
│   │   │   └── tokens.css
│   │   ├── layouts/                            # CSS định hình bố cục khung (Layout)
│   │   │   ├── app-layout.css
│   │   │   ├── auth.css
│   │   │   └── tournament-layout.css
│   │   └── pages/                              # CSS riêng biệt cho từng trang
│   │       ├── auth/
│   │       │   ├── login.css
│   │       │   ├── register.css
│   │       │   └── verify.css
│   │       ├── home/
│   │       │   ├── community.css
│   │       │   ├── create.css
│   │       │   ├── dashboard.css
│   │       │   ├── events.css
│   │       │   ├── index.css
│   │       │   ├── profile.css
│   │       │   └── search.css
│   │       └── tournament/
│   │           ├── details.css
│   │           ├── game-info.css
│   │           ├── home.css
│   │           ├── registration-settings.css
│   │           ├── teams.css
│   │           └── view.css
│   ├── images/                                 # Hình ảnh tĩnh (Logo, hình nền, ảnh đại diện game)
│   │   ├── game1.png -> game6.png
│   │   ├── hero.png
│   │   ├── logo.png, logo_bieutuong.png, logo_chu.png
│   │   ├── nen_login.png
│   │   └── nen_tc.png
│   └── js/
│       ├── common/                             # Các ES Module tiện ích dùng chung toàn ứng dụng
│       │   ├── api.js
│       │   ├── icons.js
│       │   ├── toast.js
│       │   └── utils.js
│       ├── layouts/                            # Logic xử lý tương tác cho khung Layout (Sidebar, Menu...)
│       │   ├── app-layout.js
│       │   └── tournament-layout.js
│       └── pages/                              # Logic xử lý sự kiện, gọi API riêng cho từng trang
│           ├── auth/
│           │   ├── login.js
│           │   ├── register.js
│           │   └── verify.js
│           ├── home/
│           │   ├── community.js
│           │   ├── create.js
│           │   ├── dashboard.js
│           │   ├── events.js
│           │   ├── index.js
│           │   ├── profile.js
│           │   └── search.js
│           └── tournament/
│               ├── details.js
│               ├── game-info.js
│               ├── home.js
│               ├── registration-settings.js
│               ├── teams.js
│               └── view.js
└── templates/                                  # Chứa các file HTML kết hợp Thymeleaf được render từ Server
    ├── layouts/                                # Các khung giao diện gốc (Master Layouts)
    │   ├── base.html
    │   ├── app-layout.html
    │   ├── auth-layout.html
    │   └── tournament-layout.html
    ├── fragments/                              # Các thành phần giao diện nhỏ tái sử dụng (UI Fragments)
    │   ├── app-sidebar.html
    │   ├── components.html
    │   ├── toast.html
    │   ├── tournament-header.html
    │   └── tournament-sidebar.html
    ├── auth/                                   # Nhóm trang xác thực tài khoản
    │   ├── login.html
    │   ├── register.html
    │   └── verify.html
    ├── home/                                   # Nhóm trang cổng thông tin chính & cá nhân
    │   ├── community.html
    │   ├── create.html
    │   ├── dashboard.html
    │   ├── events.html
    │   ├── index.html
    │   ├── profile-settings.html
    │   ├── profile.html
    │   └── search.html
    └── tournament/                             # Nhóm trang quản trị & hiển thị chi tiết giải đấu
        ├── details.html
        ├── game-info.html
        ├── home.html
        ├── registration-settings.html
        ├── teams.html
        └── view.html
```

---

## 2. Chi Tiết Chức Năng Thư Mục `static/` (Tài Nguyên Tĩnh)

### 2.1. Thư mục `static/css/` – Quản lý giao diện (Stylesheets)

Hệ thống CSS được chia theo kiến trúc phân tầng rõ ràng: **Common -> Layouts -> Pages**, giúp tránh xung đột tên class và dễ bảo trì.

#### a. `static/css/common/` (CSS dùng chung)
| Tên file | Chức năng chi tiết |
| :--- | :--- |
| `tokens.css` | Định nghĩa các biến CSS toàn cục (`:root` CSS Variables) như bảng màu chủ đạo, màu nền, màu chữ, độ bo góc (`border-radius`), đổ bóng (`box-shadow`), và khoảng cách. |
| `base.css` | Reset CSS mặc định của trình duyệt, thiết lập font chữ chuẩn (`Inter`), kiểu dáng cơ bản cho thẻ `body`, thanh cuộn (`scrollbar`), liên kết và các quy tắc hiển thị chung. |
| `components.css` | Định kiểu cho các thành phần UI tái sử dụng trên nhiều trang như thẻ cấu hình (`settings-card`), nút bấm (`btn-save`, button trạng thái), ô nhập liệu (`input`, `select`, `textarea`), badge và modal. |
| `toast.css` | Định kiểu và hiệu ứng chuyển động (animation trượt/mờ) cho hộp thoại thông báo nổi (Toast Notification: thành công, lỗi, cảnh báo). |

#### b. `static/css/layouts/` (CSS khung bố cục)
| Tên file | Chức năng chi tiết |
| :--- | :--- |
| `app-layout.css` | Định dạng bố cục chính của ứng dụng gồm thanh điều hướng bên trái (`app-sidebar`) và vùng nội dung chính (`main-content`) cho các trang thuộc nhóm `home/`. |
| `auth.css` | Định dạng khung bố cục cho các trang xác thực (`login`, `register`, `verify`): căn giữa form, hình nền xác thực, khung chứa logo và hiệu ứng kính mờ (glassmorphism/card). |
| `tournament-layout.css` | Định dạng bố cục chuyên biệt cho trang quản lý/xem giải đấu, bao gồm thanh `tournament-sidebar`, `tournament-header` và vùng nội dung quản trị giải đấu. |

#### c. `static/css/pages/` (CSS riêng cho từng trang)
* **`pages/auth/`**:
  * `login.css`: Giao diện form đăng nhập, liên kết quên mật khẩu và chuyển trang đăng ký.
  * `register.css`: Giao diện form đăng ký tài khoản mới, hiển thị trạng thái kiểm tra mật khẩu/hợp lệ.
  * `verify.css`: Giao diện trang nhập mã OTP xác thực email sau khi đăng ký.
* **`pages/home/`**:
  * `index.css`: Giao diện trang chủ (Landing/Home) với Hero banner, danh sách giải đấu nổi bật, danh mục bộ môn Esports.
  * `dashboard.css`: Giao diện bảng điều khiển cá nhân của người dùng (quản lý các giải đấu đã tạo hoặc đang tham gia).
  * `create.css`: Giao diện trang khởi tạo giải đấu mới (stepper/form nhập tên giải, chọn bộ môn, thời gian, thể thức).
  * `events.css`: Giao diện trang danh sách sự kiện / giải đấu đang diễn ra.
  * `search.css`: Giao diện trang tìm kiếm và bộ lọc giải đấu theo từ khóa, bộ môn, trạng thái.
  * `community.css`: Giao diện trang cộng đồng, bảng tin và hoạt động của người chơi/đội tuyển.
  * `profile.css`: Giao diện trang hồ sơ cá nhân (`profile.html`) và cài đặt thông tin tài khoản (`profile-settings.html`).
* **`pages/tournament/`**:
  * `home.css`: Giao diện trang tổng quan quản trị giải đấu (Overview/Admin Dashboard của giải).
  * `details.css`: Giao diện trang chỉnh sửa thông tin chi tiết giải đấu, nội quy (Markdown preview) và lịch trình.
  * `game-info.css`: Giao diện cấu hình thông tin bộ môn thi đấu, thể thức thi đấu (Solo/Team, BO1/BO3/BO5, nhánh đấu).
  * `registration-settings.css`: Giao diện cài đặt quy tắc đăng ký tham gia giải (thời hạn đóng/mở đăng ký, giới hạn số đội).
  * `teams.css`: Giao diện quản lý danh sách đội tuyển/người chơi đã đăng ký, duyệt đội và xếp hạt giống.
  * `view.css`: Giao diện trang xem giải đấu công khai dành cho người xem/người chơi (hiển thị banner, thông tin, nhánh đấu, danh sách đội).

---

### 2.2. Thư mục `static/js/` – Quản lý kịch bản phía Client (JavaScript)

Sử dụng chuẩn **ES6 Modules** (`import` / `export`) giúp tách biệt rõ ràng phần gọi API, tiện ích chung và logic xử lý DOM của từng trang.

#### a. `static/js/common/` (Module tiện ích dùng chung)
| Tên file | Chức năng chi tiết |
| :--- | :--- |
| `api.js` | Cung cấp các hàm wrapper chuẩn hóa việc gọi HTTP Request bằng `fetch` (`postForm`, `postJson`, `getJson`), giúp các trang giao tiếp với Backend REST/Controller gọn gàng. |
| `toast.js` | Quản lý việc khởi tạo và hiển thị thông báo nổi (Toast) trên màn hình khi có kết quả trả về từ API hoặc cảnh báo lỗi form. |
| `icons.js` | Quản lý và render bộ icon SVG dùng chung trong giao diện. |
| `utils.js` | Chứa các hàm xử lý chuỗi và tiện ích phụ trợ như `escapeHtml` (chống XSS), `parseInlineMarkdown`, và `renderMarkdownToHtml` (chuyển đổi cú pháp Markdown sang HTML cho phần điều lệ/mô tả giải đấu). |

#### b. `static/js/layouts/` (Logic khung bố cục)
| Tên file | Chức năng chi tiết |
| :--- | :--- |
| `app-layout.js` | Xử lý tương tác trên thanh `app-sidebar` (đánh dấu menu đang active, đóng/mở thu gọn sidebar, xử lý nút đăng xuất và điều hướng chung). |
| `tournament-layout.js` | Xử lý tương tác cho khung quản lý giải đấu: chuyển đổi tab trên `tournament-sidebar`, đồng bộ trạng thái giải đấu trên `tournament-header`. |

#### c. `static/js/pages/` (Logic riêng cho từng trang)
* **`pages/auth/`**:
  * `login.js`: Bắt sự kiện submit form đăng nhập, kiểm tra dữ liệu đầu vào, gửi request xác thực và điều hướng khi đăng nhập thành công.
  * `register.js`: Kiểm tra độ mạnh mật khẩu, khớp mật khẩu nhập lại, gửi thông tin đăng ký và chuyển hướng sang trang xác thực OTP.
  * `verify.js`: Xử lý nhập mã OTP xác thực tài khoản, đếm ngược thời gian gửi lại mã và gọi API kích hoạt tài khoản.
* **`pages/home/`**:
  * `index.js`: Xử lý hiệu ứng trang chủ, điều hướng nhanh đến các giải đấu hoặc bộ môn game.
  * `dashboard.js`: Tải và lọc danh sách giải đấu của người dùng trên trang Dashboard cá nhân.
  * `create.js`: Kiểm tra tính hợp lệ của form tạo giải đấu mới, xử lý chọn game/thể thức và gửi dữ liệu khởi tạo giải đấu.
  * `events.js`: Xử lý lọc, phân trang hoặc chuyển đổi trạng thái xem danh sách sự kiện/giải đấu.
  * `search.js`: Xử lý tìm kiếm giải đấu theo thời gian thực (debounce input), lọc theo tiêu chí.
  * `community.js`: Xử lý tương tác người dùng trên trang cộng đồng.
  * `profile.js`: Xử lý cập nhật thông tin hồ sơ cá nhân, đổi mật khẩu, kiểm tra trạng thái thay đổi dữ liệu để bật/tắt nút `Save changes`.
* **`pages/tournament/`**:
  * `home.js`: Xử lý các thao tác nhanh trên trang tổng quan quản trị giải đấu (công bố giải, bước thiết lập tiếp theo).
  * `details.js`: Xử lý chỉnh sửa tên giải, mô tả, thời gian, xem trước nội quy bằng Markdown (`utils.js`) và lưu thay đổi qua API.
  * `game-info.js`: Xử lý thay đổi cấu hình bộ môn game, thể thức đấu loại và số lượng thành viên mỗi đội.
  * `registration-settings.js`: Xử lý bật/tắt cho phép đăng ký, thiết lập thời gian mở/đóng đăng ký giải đấu.
  * `teams.js`: Xử lý thêm/xóa đội, duyệt đơn đăng ký tham gia, xem danh sách thành viên đội và tạo bảng đấu.
  * `view.js`: Xử lý giao diện xem giải đấu phía người dùng (chuyển đổi giữa các tab Thông tin, Nhánh đấu/Bracket, Danh sách đội, Đăng ký tham gia).

---

### 2.3. Thư mục `static/images/` – Tài nguyên hình ảnh
| Tên file | Chức năng chi tiết |
| :--- | :--- |
| `logo.png`, `logo_bieutuong.png`, `logo_chu.png` | Bộ nhận diện thương hiệu của nền tảng (logo đầy đủ, chỉ biểu tượng icon, và chỉ phần chữ) dùng trên Sidebar, Header và trang Auth. |
| `hero.png`, `nen_tc.png` | Hình ảnh banner chính (Hero section) và hình nền trang chủ. |
| `nen_login.png` | Hình nền trang đăng nhập / đăng ký / xác thực tài khoản. |
| `game1.png` -> `game6.png` | Hình ảnh đại diện (Thumbnail/Cover) cho các tựa game Esports được hỗ trợ khi tạo và hiển thị giải đấu. |

---

## 3. Chi Tiết Chức Năng Thư Mục `templates/` (Thymeleaf HTML)

Dự án sử dụng **Thymeleaf** kết hợp cơ chế **Fragment & Layout Inheritance** để tái sử dụng giao diện tối đa.

### 3.1. `templates/layouts/` (Khung giao diện gốc)
| Tên file | Chức năng chi tiết |
| :--- | :--- |
| `base.html` | Chứa fragment `commonHead(title)` khai báo các thẻ `<meta>`, nạp font `Inter` từ Google Fonts và nạp file `tokens.css` dùng chung cho mọi trang. |
| `app-layout.html` | Layout chuẩn cho các trang chính của ứng dụng: ghép nối `app-sidebar`, vùng nội dung động (`content`), thông báo `toast` và nạp các file CSS/JS cấp layout. |
| `auth-layout.html` | Layout dành riêng cho các trang xác thực (`login`, `register`, `verify`), cung cấp khung hiển thị form xác thực đồng nhất. |
| `tournament-layout.html` | Layout quản trị giải đấu (lấy cảm hứng từ Start.gg): ghép nối `tournament-sidebar`, `tournament-header` và vùng nội dung cài đặt giải đấu. |

### 3.2. `templates/fragments/` (Các thành phần UI tái sử dụng)
| Tên file | Chức năng chi tiết |
| :--- | :--- |
| `app-sidebar.html` | Thanh điều hướng chính bên trái màn hình (Logo, nút dẫn tới Trang chủ, Tìm kiếm, Sự kiện, Cộng đồng, Tạo giải đấu, Dashboard, Hồ sơ cá nhân). |
| `tournament-sidebar.html` | Thanh điều hướng quản trị giải đấu (dẫn tới các mục: Overview, Details, Game Info, Registration Settings, Teams/Attendees). |
| `tournament-header.html` | Thanh tiêu đề phía trên của trang quản trị giải đấu (hiển thị tên giải, trạng thái giải đấu và nút chuyển sang chế độ xem công khai). |
| `components.html` | Chứa các Thymeleaf fragment UI chuẩn hóa như `card(cardId, title, subtitle, bodyContent, footerContent)` và `saveFooter(btnId, btnType)` để tạo các khối cài đặt đồng bộ. |
| `toast.html` | Cấu trúc HTML khung chứa các thông báo Toast hiển thị ở góc màn hình. |

### 3.3. Các thư mục trang chức năng (`auth/`, `home/`, `tournament/`)

Bảng dưới đây thể hiện mối liên hệ trực tiếp (Mapping) giữa **Template HTML**, **Layout kế thừa**, **File CSS** và **File JS** tương ứng:

| Nhóm | File Template (`templates/...`) | Layout sử dụng | File CSS (`static/css/pages/...`) | File JS (`static/js/pages/...`) | Mô tả chức năng trang |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | `auth/login.html` | `auth-layout.html` | `auth/login.css` | `auth/login.js` | Trang đăng nhập hệ thống |
| **Auth** | `auth/register.html` | `auth-layout.html` | `auth/register.css` | `auth/register.js` | Trang đăng ký tài khoản mới |
| **Auth** | `auth/verify.html` | `auth-layout.html` | `auth/verify.css` | `auth/verify.js` | Trang nhập mã OTP xác nhận email |
| **Home** | `home/index.html` | `app-layout.html` | `home/index.css` | `home/index.js` | Trang chủ giới thiệu & khám phá giải đấu |
| **Home** | `home/dashboard.html` | `app-layout.html` | `home/dashboard.css` | `home/dashboard.js` | Bảng điều khiển quản lý giải đấu cá nhân |
| **Home** | `home/create.html` | `app-layout.html` | `home/create.css` | `home/create.js` | Trang biểu mẫu tạo giải đấu mới |
| **Home** | `home/events.html` | `app-layout.html` | `home/events.css` | `home/events.js` | Trang danh sách các sự kiện/giải đấu |
| **Home** | `home/search.html` | `app-layout.html` | `home/search.css` | `home/search.js` | Trang tìm kiếm và tra cứu giải đấu |
| **Home** | `home/community.html` | `app-layout.html` | `home/community.css` | `home/community.js` | Trang cộng đồng người chơi |
| **Home** | `home/profile.html` | `app-layout.html` | `home/profile.css` | `home/profile.js` | Trang xem thông tin hồ sơ cá nhân |
| **Home** | `home/profile-settings.html` | `app-layout.html` | `home/profile.css` | `home/profile.js` | Trang chỉnh sửa thông tin cá nhân & bảo mật |
| **Tournament** | `tournament/home.html` | `tournament-layout.html` | `tournament/home.css` | `tournament/home.js` | Trang tổng quan quản trị 1 giải đấu |
| **Tournament** | `tournament/details.html` | `tournament-layout.html` | `tournament/details.css` | `tournament/details.js` | Trang cài đặt thông tin & điều lệ giải đấu |
| **Tournament** | `tournament/game-info.html` | `tournament-layout.html` | `tournament/game-info.css` | `tournament/game-info.js` | Trang cài đặt bộ môn & thể thức thi đấu |
| **Tournament** | `tournament/registration-settings.html` | `tournament-layout.html` | `tournament/registration-settings.css` | `tournament/registration-settings.js` | Trang cấu hình mở/đóng đăng ký giải |
| **Tournament** | `tournament/teams.html` | `tournament-layout.html` | `tournament/teams.css` | `tournament/teams.js` | Trang quản lý đội thi đấu & nhánh đấu |
| **Tournament** | `tournament/view.html` | `app-layout.html` / Độc lập | `tournament/view.css` | `tournament/view.js` | Trang hiển thị công khai của giải đấu (Public View) |

---

## 4. File Cấu Hình `application.properties`

Nằm tại [`src/main/resources/application.properties`](file:///d:/MyProject/BTP-OOP/src/main/resources/application.properties), đóng vai trò cấu hình trung tâm cho ứng dụng Spring Boot, bao gồm:
- Kết nối cơ sở dữ liệu (JDBC URL, Username, Password, JPA/Hibernate).
- Cấu hình Thymeleaf (encoding UTF-8, tắt/bật cache template trong quá trình phát triển).
- Cấu hình dịch vụ gửi mail (SMTP) phục vụ luồng gửi mã OTP xác thực (`verify.html`).

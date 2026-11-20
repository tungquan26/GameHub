# Game-Hub

Game-Hub là website tổ chức giải thể thao điện tử. Người chơi có thể tìm giải, tạo đội cộng đồng và nhắn tin riêng. Đội trưởng đăng ký đội vào giải và hệ thống ghi lại đội hình tại thời điểm đăng ký. Ban tổ chức thiết lập luật, chọn bộ môn, xếp nhánh, đặt lịch và nhập kết quả. Người xem theo dõi lịch đấu và bảng xếp hạng từ trang công khai của giải.

Giao diện dùng React, Vite và Tailwind CSS. Spring Boot phục vụ cả giao diện và API trên cùng một địa chỉ. Dữ liệu được lưu trong MySQL.

## Chạy trên máy

### Yêu cầu

- **JDK 25** và **Maven** để chạy hoặc build dự án.
- **MySQL** đang chạy và một tài khoản database dành cho ứng dụng.
- Kết nối mạng khi build lần đầu. Maven tải thư viện Java, Node.js 22.12.0 và npm 10.9.0 vào thư mục build.

### Cấu hình MySQL

Nếu đã có database của dự án, dùng tên database đó trong URL JDBC. Với cài đặt mới, tạo database bằng tài khoản quản trị MySQL và cấp cho tài khoản ứng dụng quyền đọc, ghi và tạo hoặc cập nhật bảng trong database này.

```sql
CREATE DATABASE IF NOT EXISTS gamehub CHARACTER SET utf8mb4;
```

Tạo `application-local.properties` cạnh `pom.xml`. Thay tên đăng nhập, mật khẩu và tên database theo cấu hình của bạn.

```properties
GAMEHUB_DB_URL=jdbc:mysql://localhost:3306/gamehub
spring.datasource.username=your-mysql-user
spring.datasource.password=your-mysql-password
```

Profile `mysql` dùng Hibernate để tạo hoặc cập nhật bảng khi ứng dụng khởi động. Git bỏ qua file cấu hình cục bộ.

### Cấu hình OTP

Để đăng ký tài khoản mới và nhận email thông báo, thêm hai dòng sau vào cùng file cấu hình. Dự án dùng Gmail SMTP qua cổng `587`. Điền mật khẩu ứng dụng của tài khoản Gmail gửi thư.

```properties
spring.mail.username=your-email@gmail.com
spring.mail.password=your-google-app-password
```

### Khởi động

Từ thư mục chứa `pom.xml`, chạy các lệnh sau trong PowerShell.

```powershell
$env:SPRING_PROFILES_ACTIVE = "mysql"
mvn spring-boot:run
```

Mở [http://localhost:8080](http://localhost:8080). Maven build frontend trước khi Spring Boot khởi động. Nhấn `Ctrl+C` để dừng. Sau khi chỉnh frontend, chạy lại lệnh trên để Spring Boot phục vụ giao diện mới.

## Phát triển frontend

Để thấy thay đổi giao diện ngay khi lưu file, giữ Spring Boot chạy ở cổng `8080` và mở terminal riêng. Cách này cần Node.js từ 22.12 và npm trong PATH.

```powershell
cd frontend
npm ci
npm run dev
```

Mở địa chỉ Vite in trong terminal. Vite chuyển tiếp các yêu cầu `/api` về Spring Boot. Nếu backend chạy ở địa chỉ khác, đặt `API_PROXY_TARGET` trong `frontend/.env.local`. Để trống `VITE_API_BASE_URL` khi dùng proxy Vite hoặc khi React được phục vụ cùng Spring Boot.

## Kiểm thử cục bộ

Git bỏ qua hai thư mục kiểm thử cục bộ `frontend/tests/` và `src/test/`. Khi có các file kiểm thử trên máy, chạy `npm test` trong `frontend/` và `mvn test` ở thư mục gốc.

## Đóng gói và triển khai

Từ thư mục gốc, build JAR bằng `mvn clean package`. Maven đóng gói giao diện React, tài nguyên tĩnh và API vào `target/backend-0.0.1-SNAPSHOT.jar`. Máy chủ cần Java 25 và cấu hình MySQL để chạy JAR. Cấu hình SMTP dùng cho OTP và thông báo qua email.

Trên máy chủ, cấp cấu hình qua biến môi trường. Dùng địa chỉ MySQL mà máy chủ ứng dụng truy cập được và đặt thông tin xác thực trong cấu hình riêng của môi trường chạy.

```dotenv
SPRING_PROFILES_ACTIVE=mysql
GAMEHUB_DB_URL=jdbc:mysql://mysql-host:3306/gamehub
SPRING_DATASOURCE_USERNAME=your-mysql-user
SPRING_DATASOURCE_PASSWORD=your-mysql-password
SPRING_MAIL_USERNAME=your-email@gmail.com
SPRING_MAIL_PASSWORD=your-google-app-password
```

Khởi động bản build bằng lệnh sau khi đặt các biến môi trường.

```text
java -jar backend-0.0.1-SNAPSHOT.jar
```

Lệnh trên chạy từ thư mục chứa JAR. Ứng dụng mặc định nghe ở cổng `8080`. Khi đưa web ra Internet, trỏ reverse proxy HTTPS về Spring Boot và để MySQL trên mạng nội bộ. Khi triển khai bản mới, dùng lại database hiện có. Tạo bản sao MySQL trước lần cập nhật có thay đổi cấu trúc bảng.

## Cấu trúc dự án

- `frontend/` chứa trang React, component, tài nguyên tĩnh và mã gọi API.
- `src/main/java/btpoop/` chứa các module Spring Boot như tài khoản, đăng ký giải, nhánh đấu và xếp hạng.
- `src/main/resources/` chứa cấu hình Spring Boot và profile MySQL.
- `docs/` chứa tài liệu chi tiết về giao diện, mô hình dữ liệu và kiến trúc backend.

## Tài liệu

- [Cấu trúc frontend](docs/FRONTEND_STRUCTURE.md)
- [Đặc tả mô hình dữ liệu](docs/Model_Fields_Specification.md)
- [Các module hệ thống](docs/System_Modules.md)

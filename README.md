# Game-Hub

Website React và API Java được phục vụ cùng địa chỉ bởi Spring Boot.

## Chạy website

Yêu cầu **JDK 25**, **Maven** và kết nối mạng ở lần build đầu để tải thư viện,
Node.js 22.12.0 và npm 10.9.0. Maven cài Node/npm trong thư mục build của dự án,
không thay đổi Node/npm đang cài trên máy.

Tại thư mục chứa `pom.xml`, chạy:

```powershell
mvn spring-boot:run
```

Mở **http://localhost:8080**. Không cần chạy `npm run dev` riêng.
Nhấn `Ctrl+C` trong terminal để dừng.

Nếu đang chạy Vite hoặc kiểm thử frontend, dừng các tiến trình đó trước khi chuyển
sang Maven để `npm ci` có thể cập nhật thư viện, tránh khóa tệp trên Windows.

Mỗi lần chạy Maven sẽ cài dependency frontend theo `frontend/package-lock.json`,
build React và chép `frontend/dist` vào thư mục static trong classpath.
Các trang như `/login`, `/news` và `/tournament/schedule?id=31&view=public`
có thể mở trực tiếp hoặc nhấn F5. API tiếp tục dùng `/api/...` cùng địa chỉ;
giữ `VITE_API_BASE_URL` trống khi build cho Spring Boot.

Khi sửa React, khởi động lại bằng lệnh Maven trên để build giao diện mới.
Bấm Run trực tiếp lớp `BtpApplication` trong IDE không chạy quy trình build frontend;
hãy dùng lệnh Maven để bảo đảm giao diện luôn được cập nhật.

## Cấu hình gửi email

Để gửi OTP và thông báo, sao chép `application-local.properties.example` thành
`application-local.properties` tại thư mục gốc, ngang cấp `pom.xml`, rồi điền
email và mật khẩu ứng dụng SMTP. File riêng này được `.gitignore` bỏ qua và
không được đóng gói vào JAR. Khởi động Maven, IDE hoặc JAR từ thư mục gốc để
Spring Boot tự đọc file; khởi động lại ứng dụng sau khi thay đổi cấu hình.

Cũng có thể đặt các biến sau trong cùng terminal PowerShell trước khi chạy
Maven hoặc JAR; biến môi trường được ưu tiên hơn file cấu hình riêng:

```powershell
$env:SPRING_MAIL_USERNAME = "your-email@gmail.com"
$env:SPRING_MAIL_PASSWORD = "your-app-password"
```

Nếu chưa có cấu hình riêng hoặc biến môi trường, ứng dụng chưa thể gửi email.
Spring Boot không tự nạp file `.env`; file mẫu trong `frontend/` chỉ dành cho Vite.
Không ghi mật khẩu thật vào mã nguồn hoặc tài liệu để commit.

## Đóng gói và chạy JAR

```powershell
mvn clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

Bản JAR chứa cả giao diện, ảnh, font và API. Máy chạy JAR chỉ cần Java 25;
không cần Node.js, npm, Maven hoặc thư mục `frontend` bên ngoài.
Địa chỉ vẫn là **http://localhost:8080**. Dừng phiên đang chạy trước khi chạy JAR
để tránh trùng cổng 8080.

Không đưa `frontend/dist`, `node_modules` hoặc `target` vào Git.
Profile Maven `ide` dùng `target-ide`; tài nguyên giao diện được chép theo
`${project.build.outputDirectory}` nên vẫn đi cùng đúng thư mục build.

## Phát triển frontend với Vite (tùy chọn)

Để có cập nhật giao diện tức thời, xem [hướng dẫn frontend](docs/FRONTEND_STRUCTURE.md#72-phát-triển-riêng-với-vite).
Đây là cách phát triển tùy chọn; chạy website thông thường chỉ cần Spring Boot.

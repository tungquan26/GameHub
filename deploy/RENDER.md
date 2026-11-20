# Triển khai Game-Hub trên Render Free và TiDB Cloud Starter

Render build ứng dụng từ GitHub bằng `Dockerfile`. TiDB lưu dữ liệu qua kết nối MySQL có TLS. Brevo gửi mã OTP và email thông báo qua HTTPS.

## 1. Chuyển dữ liệu lên TiDB

Tạo một instance **TiDB Cloud Starter** với chế độ **MySQL-compatible**, rồi tạo database mới để nhập bản sao MySQL. Có thể đặt tên `gamehub`.

```sql
CREATE DATABASE gamehub CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```

Trong TiDB, mở **Connect**, lấy hostname, port, username đầy đủ (gồm tiền tố) và thông tin TLS. Kết nối từ MySQL CLI theo lệnh trong hộp thoại Connect, chọn database `gamehub`, rồi chạy `SOURCE đường-dẫn-tới-bản-sao.sql`. Bản sao nằm trong `backups/` trên máy. Nhập vào database trống trước lần deploy đầu tiên vì profile `render` kiểm tra schema khi khởi động. [Nhập dữ liệu bằng MySQL CLI](https://docs.pingcap.com/tidbcloud/import-with-mysql-cli-serverless/?plan=starter)

## 2. Chuẩn bị email

Trong Brevo, thêm và xác minh địa chỉ gửi thư, sau đó tạo API key. Dùng địa chỉ người gửi đã xác minh làm `BREVO_SENDER_EMAIL`. Nếu dùng địa chỉ Gmail cá nhân, Brevo có thể thay địa chỉ hiển thị của thư bằng địa chỉ do Brevo quản lý. [Xác minh người gửi](https://developers.brevo.com/docs/getting-started-with-senders-and-domains) · [Quy tắc địa chỉ gửi](https://help.brevo.com/hc/en-us/articles/14925263522578-Comply-with-Gmail-Yahoo-and-Microsoft-s-requirements-for-email-senders)

## 3. Tạo dịch vụ Render

Trong Render, chọn **New → Blueprint** rồi kết nối repo GitHub chứa `render.yaml`. Blueprint chọn gói **Free** và khu vực **Singapore**. Nhập các giá trị sau trực tiếp trên Render.

- `GAMEHUB_DB_URL` có dạng `jdbc:mysql://HOST:4000/gamehub?sslMode=VERIFY_IDENTITY`. Thay host, port và tên database theo TiDB.
- `SPRING_DATASOURCE_USERNAME` và `SPRING_DATASOURCE_PASSWORD` là thông tin tài khoản MySQL trên TiDB.
- `BREVO_API_KEY` và `BREVO_SENDER_EMAIL` lấy từ tài khoản Brevo.

Kiểm tra URL `.onrender.com` sau khi deploy. Mở `/actuator/health` để kiểm tra kết nối database, đối chiếu giải và đội đã nhập rồi xác minh OTP bằng hộp thư thử. [Blueprint Render](https://render.com/docs/infrastructure-as-code) · [Kết nối TiDB qua JDBC](https://docs.pingcap.com/developer/dev-guide-sample-application-java-jdbc/)

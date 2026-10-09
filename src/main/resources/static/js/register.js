document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const submitBtn = document.getElementById('submitBtn');
    const errorMessage = document.getElementById('errorMessage');

    // Kiểm tra dữ liệu hợp lệ để kích hoạt nút
    function checkFormValidity() {
        const isUsernameValid = usernameInput.value.trim() !== '';
        const isPasswordValid = passwordInput.value.trim() !== '';
        const isConfirmPasswordValid = confirmPasswordInput.value.trim() !== '';
        const isPasswordMatch = passwordInput.value === confirmPasswordInput.value;

        // Xóa thông báo lỗi khi đang nhập liệu nếu mật khẩu khớp trở lại
        if (isConfirmPasswordValid && !isPasswordMatch) {
            errorMessage.textContent = 'Mật khẩu không khớp.';
            errorMessage.style.display = 'block';
        } else {
            errorMessage.style.display = 'none';
        }

        if (isUsernameValid && isPasswordValid && isConfirmPasswordValid && isPasswordMatch) {
            form.classList.add('valid');
            submitBtn.disabled = false;
        } else {
            form.classList.remove('valid');
            submitBtn.disabled = true;
        }
    }

    usernameInput.addEventListener('input', checkFormValidity);
    passwordInput.addEventListener('input', checkFormValidity);
    confirmPasswordInput.addEventListener('input', checkFormValidity);
    checkFormValidity();

    // Xử lý gửi form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        
        if (!username || !password || !confirmPassword || password !== confirmPassword) return;
        
        // Trạng thái đang tải
        submitBtn.style.opacity = '0.5';
        submitBtn.style.pointerEvents = 'none';
        errorMessage.style.display = 'none';
        
        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            // Gửi dữ liệu đăng ký đến API (Tạm dùng /api/users/register)
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData.toString()
            });

            if (response.ok) {
                // Đăng ký thành công, chuyển hướng về trang đăng nhập
                window.location.href = '/login'; 
            } else {
                errorMessage.textContent = 'Đăng ký thất bại. Tên người dùng có thể đã tồn tại.';
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            errorMessage.textContent = 'Có lỗi xảy ra khi kết nối đến máy chủ.';
            errorMessage.style.display = 'block';
        } finally {
            // Khôi phục trạng thái nút
            submitBtn.style.opacity = '1';
            submitBtn.style.pointerEvents = 'auto';
        }
    });
});

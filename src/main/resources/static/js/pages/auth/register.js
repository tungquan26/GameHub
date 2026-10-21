import { postJson } from '../../common/api.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const submitBtn = document.getElementById('submitBtn');
    const errorMessage = document.getElementById('errorMessage');

    // Kiểm tra dữ liệu để kích hoạt nút Submit
    function checkFormValidity() {
        const isUsernameValid = usernameInput.value.trim() !== '';
        const isEmailValid = emailInput.value.trim() !== '';
        const isPasswordValid = passwordInput.value.trim() !== '';
        const isConfirmPasswordValid = confirmPasswordInput.value.trim() !== '';
        const isPasswordMatch = passwordInput.value === confirmPasswordInput.value;

        // Xóa thông báo lỗi khi đang nhập liệu, trừ khi mật khẩu không khớp trực tiếp
        if (isConfirmPasswordValid && !isPasswordMatch) {
            errorMessage.textContent = 'Mật khẩu không khớp.';
            errorMessage.style.display = 'block';
        } else {
            errorMessage.style.display = 'none';
        }

        if (isUsernameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid && isPasswordMatch) {
            form.classList.add('valid');
            submitBtn.disabled = false;
        } else {
            form.classList.remove('valid');
            submitBtn.disabled = true;
        }
    }

    usernameInput.addEventListener('input', checkFormValidity);
    emailInput.addEventListener('input', checkFormValidity);
    passwordInput.addEventListener('input', checkFormValidity);
    confirmPasswordInput.addEventListener('input', checkFormValidity);
    checkFormValidity();

    // Xử lý gửi form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        if (!username || !email || !password || !confirmPassword || password !== confirmPassword) return;

        // Trạng thái đang tải
        submitBtn.style.opacity = '0.5';
        submitBtn.style.pointerEvents = 'none';
        errorMessage.style.display = 'none';

        try {
            // Gửi yêu cầu đăng ký đến API (Tương ứng /api/users/register)
            const response = await postJson('/api/users/register', {
                username: username,
                email: email,
                password: password
            });

            if (response.ok) {
                // Đăng ký thành công, chuyển hướng sang trang xác thực
                window.location.href = '/verify?email=' + encodeURIComponent(email);
            } else {
                const errorMsg = await response.text();
                errorMessage.textContent = errorMsg || 'Đăng ký thất bại.';
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            errorMessage.textContent = 'Có lỗi xảy ra khi kết nối máy chủ.';
            errorMessage.style.display = 'block';
        } finally {
            // Khôi phục trạng thái nút
            submitBtn.style.opacity = '1';
            submitBtn.style.pointerEvents = 'auto';
        }
    });
});
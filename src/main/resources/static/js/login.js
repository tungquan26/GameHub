document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('submitBtn');
    const errorMessage = document.getElementById('errorMessage');

    // Kiểm tra dữ liệu hợp lệ để kích hoạt nút
    function checkFormValidity() {
        if (usernameInput.value.trim() !== '' && passwordInput.value.trim() !== '') {
            form.classList.add('valid');
            submitBtn.disabled = false;
        } else {
            form.classList.remove('valid');
            submitBtn.disabled = true;
        }
    }

    usernameInput.addEventListener('input', checkFormValidity);
    passwordInput.addEventListener('input', checkFormValidity);
    checkFormValidity();

    // Xử lý gửi form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!username || !password) return;
        
        // Trạng thái đang tải
        submitBtn.style.opacity = '0.5';
        submitBtn.style.pointerEvents = 'none';
        errorMessage.style.display = 'none';
        
        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            // Gửi dữ liệu đăng nhập đến API
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData.toString()
            });

            if (response.ok) {
                // Đăng nhập thành công, chuyển hướng
                window.location.href = '/dashboard'; 
            } else {
                errorMessage.textContent = 'Tên người dùng hoặc mật khẩu không chính xác.';
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

import { postForm } from '../../common/api.js';

document.addEventListener('DOMContentLoaded', () => {
    const verifyForm = document.getElementById('verifyForm');
    const otpInputs = Array.from(document.querySelectorAll('.otp-input'));
    const submitBtn = document.getElementById('submitBtn');
    const errorMessage = document.getElementById('errorMessage');
    const resendCodeBtn = document.getElementById('resendCodeBtn');
    const email = new URLSearchParams(window.location.search).get('email') || '';

    // Tự động focus vào ô đầu tiên khi tải trang
    if (otpInputs.length > 0) {
        otpInputs[0].focus();
    }

    // Kiểm tra xem đã nhập đủ 6 ký tự số chưa
    function checkFormValidity() {
        const isComplete = otpInputs.every(input => input.value.trim().length === 1);
        if (isComplete) {
            verifyForm.classList.add('valid');
            submitBtn.disabled = false;
        } else {
            verifyForm.classList.remove('valid');
            submitBtn.disabled = true;
        }
    }

    // Xử lý sự kiện trên từng ô OTP
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            // Chỉ cho phép nhập số
            const value = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = value;

            if (errorMessage.style.display === 'block') {
                errorMessage.style.display = 'none';
            }

            // Nếu đã nhập 1 số và chưa phải ô cuối thì chuyển sang ô tiếp theo
            if (value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }

            checkFormValidity();
        });

        input.addEventListener('keydown', (e) => {
            // Nhấn Backspace khi ô hiện tại trống sẽ lùi về ô trước đó
            if (e.key === 'Backspace') {
                if (input.value === '' && index > 0) {
                    otpInputs[index - 1].focus();
                    otpInputs[index - 1].value = '';
                    checkFormValidity();
                }
            } else if (e.key === 'ArrowLeft' && index > 0) {
                e.preventDefault();
                otpInputs[index - 1].focus();
            } else if (e.key === 'ArrowRight' && index < otpInputs.length - 1) {
                e.preventDefault();
                otpInputs[index + 1].focus();
            }
        });

        // Hỗ trợ dán (paste) mã 6 chữ số
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = (e.clipboardData || window.clipboardData)
                .getData('text')
                .replace(/[^0-9]/g, '')
                .slice(0, otpInputs.length);

            if (pastedData.length > 0) {
                pastedData.split('').forEach((char, i) => {
                    if (otpInputs[i]) {
                        otpInputs[i].value = char;
                    }
                });

                const nextFocusIndex = Math.min(pastedData.length, otpInputs.length - 1);
                otpInputs[nextFocusIndex].focus();
                checkFormValidity();
            }
        });

        // Chọn toàn bộ ký tự trong ô khi focus để dễ ghi đè
        input.addEventListener('focus', () => {
            input.select();
        });
    });

    // Xử lý gửi form xác thực
    verifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const otpCode = otpInputs.map(input => input.value).join('');
        const rememberBrowser = document.getElementById('rememberBrowser').checked;

        if (otpCode.length !== 6) {
            showError('Vui lòng nhập đủ 6 chữ số xác thực.');
            return;
        }

        try {
            submitBtn.disabled = true;
            errorMessage.style.display = 'none';

            if (!email) {
                showError('Không tìm thấy email cần xác thực. Vui lòng đăng ký lại.');
                return;
            }

            const response = await postForm('/api/verification/verify-email', {
                email: email,
                code: otpCode,
                rememberBrowser: rememberBrowser
            });

            if (response.ok) {
                window.location.href = '/login';
            } else {
                const msg = await response.text().catch(() => '');
                showError(msg.replace(/^ERROR:\s*/, '') || 'Mã xác thực không hợp lệ hoặc đã hết hạn.');
                checkFormValidity();
            }
        } catch (error) {
            showError('Không thể kết nối máy chủ. Vui lòng thử lại.');
            checkFormValidity();
        }
    });

    // Xử lý nút Gửi lại mã
    if (resendCodeBtn) {
        let countdownInterval = null;

        resendCodeBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (resendCodeBtn.dataset.loading === 'true') return;

            resendCodeBtn.dataset.loading = 'true';
            let timeLeft = 30;
            const originalText = 'GỬI LẠI MÃ';

            try {
                await postForm('/api/verification/resend-activation-code', { email: email });
            } catch (err) {
                // Bỏ qua lỗi mạng khi demo tĩnh
            }

            resendCodeBtn.style.pointerEvents = 'none';
            resendCodeBtn.style.opacity = '0.6';
            resendCodeBtn.textContent = `GỬI LẠI MÃ (${timeLeft}S)`;

            countdownInterval = setInterval(() => {
                timeLeft--;
                if (timeLeft > 0) {
                    resendCodeBtn.textContent = `GỬI LẠI MÃ (${timeLeft}S)`;
                } else {
                    clearInterval(countdownInterval);
                    resendCodeBtn.textContent = originalText;
                    resendCodeBtn.style.pointerEvents = 'auto';
                    resendCodeBtn.style.opacity = '1';
                    resendCodeBtn.dataset.loading = 'false';
                }
            }, 1000);
        });
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.style.display = 'block';
    }
});
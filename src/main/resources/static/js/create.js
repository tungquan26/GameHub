document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('createForm');
    const nameInput = document.getElementById('tournamentName');
    const contactType = document.getElementById('contactType');
    const contactValue = document.getElementById('contactValue');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const submitBtn = document.getElementById('submitBtn');
    const errorMsg = document.getElementById('errorMsg');

    // Bật/tắt nút Submit khi điền đủ thông tin
    function checkValidity() {
        const isFilled = nameInput.value.trim() !== '' &&
                         contactValue.value.trim() !== '' &&
                         startDate.value !== '' &&
                         endDate.value !== '';

        if (startDate.value && endDate.value && new Date(endDate.value) <= new Date(startDate.value)) {
            errorMsg.textContent = 'Ngày kết thúc phải diễn ra sau ngày bắt đầu.';
            errorMsg.style.display = 'block';
            submitBtn.disabled = true;
            return;
        }

        errorMsg.style.display = 'none';
        submitBtn.disabled = !isFilled;
    }

    [nameInput, contactType, contactValue, startDate, endDate].forEach(el => {
        el.addEventListener('input', checkValidity);
        el.addEventListener('change', checkValidity);
    });

    // Đổi placeholder theo loại liên hệ
    contactType.addEventListener('change', () => {
        const placeholders = {
            'EMAIL': 'hello@start.gg',
            'DISCORD': 'https://discord.gg/yourserver',
            'PHONE': '0901234567'
        };
        contactValue.placeholder = placeholders[contactType.value] || '';
    });

    // Xử lý đóng/mở Sidebar trên Mobile
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('active');
        });
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        });
    }

    // Xử lý sự kiện nhấn nút Create Tournament
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const payload = {
            name: nameInput.value.trim(),
            contactType: contactType.value,
            contact: contactValue.value.trim(),
            startDate: startDate.value,
            endDate: endDate.value
        };
        console.log('Thông tin giải đấu khởi tạo:', payload);
        // Tạm thời quay về dashboard (sau này có trang chi tiết sẽ chuyển hướng sang đó)
        window.location.href = '/settings';
    });
});
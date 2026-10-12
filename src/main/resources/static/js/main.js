// main.js
document.addEventListener("DOMContentLoaded", () => {
    console.log("Frontend initialized successfully.");
    
    // 1. BACK TO TOP FUNCTIONALITY
    const backToTopBtn = document.getElementById("backToTop");
    if (backToTopBtn) {
        backToTopBtn.addEventListener("click", (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // 2. CAROUSEL - CĂN GIỮA TUYỆT ĐỐI BẰNG ĐO ĐẠC THỰC TẾ
    const track = document.querySelector('.carousel-track');
    const items = document.querySelectorAll('.carousel-item');
    const container = document.querySelector('.carousel-container') || track.parentElement;
    
    if (track && items.length > 0 && container) {
        let currentIndex = 1; 
        let autoPlayInterval;
        
        // Các biến lưu kích thước thực tế (thay thế cho số 250 cứng)
        let itemWidth = 0;
        let centerOffset = 0;
        
        // HÀM ĐO ĐẠC ĐỘNG: Căn giữa tuyệt đối theo toàn màn hình
        function calculateDimensions() {
            const trackStyle = window.getComputedStyle(track);
            const gap = parseFloat(trackStyle.gap) || 0; 
    
            // Chiều rộng gốc của thẻ game
            const rawItemWidth = items[0].offsetWidth;
            itemWidth = rawItemWidth + gap;
    
            // Lấy tọa độ thực tế của khung chứa so với mép trái màn hình
            const containerRect = container.getBoundingClientRect();
    
            // CÔNG THỨC MỚI: (Nửa màn hình) - (Tọa độ viền trái khung) - (Nửa thẻ game)
            centerOffset = (window.innerWidth / 2) - containerRect.left - (rawItemWidth / 2);
}

        // Giới hạn biên an toàn
        function getMaxTranslate() { return centerOffset; }
        function getMinTranslate() { return centerOffset - ((items.length - 1) * itemWidth); }

        track.addEventListener('dragstart', (e) => e.preventDefault());

        function updateCarousel(snap = true) {
            if (snap) {
                track.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
                const moveDistance = centerOffset - (currentIndex * itemWidth); 
                track.style.transform = `translateX(${moveDistance}px)`;
            }
            
            items.forEach((item, index) => {
                if (index === currentIndex) item.classList.add('active');
                else item.classList.remove('active');
            });
        }
        
        function moveToNext(isAuto = false) {
            if (!isAuto && currentIndex >= items.length - 1) return;
            currentIndex++;
            if (currentIndex >= items.length) currentIndex = 0;
            updateCarousel(true);
        }
        
        function moveToPrev() {
            if (currentIndex <= 0) return;
            currentIndex--;
            updateCarousel(true);
        }

        function startAutoPlay() {
            clearInterval(autoPlayInterval);
            autoPlayInterval = setInterval(() => moveToNext(true), 5000);
        }

        // ==========================================
        // SỰ KIỆN KÉO CHUỘT / VUỐT CẢM ỨNG
        // ==========================================
        let isDragging = false;
        let startX = 0;
        let currentTranslate = 0;
        let hasDragged = false; // BIẾN MỚI: Cờ kiểm tra xem có đang vuốt không

        track.addEventListener('pointerdown', (e) => {
            isDragging = true;
            hasDragged = false; // Đặt lại thành false khi vừa nhấn chuột xuống
            startX = e.clientX;
            currentTranslate = centerOffset - (currentIndex * itemWidth); 
            
            track.style.transition = 'none'; 
            track.style.cursor = 'grabbing';
            clearInterval(autoPlayInterval);
        });

        track.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            
            // Nếu chuột di chuyển quá 5px, đánh dấu đây là hành động KÉO chứ không phải CLICK
            if (Math.abs(e.clientX - startX) > 5) {
                hasDragged = true;
            }
            
            let diff = e.clientX - startX;
            let newTranslate = currentTranslate + diff;
            
            newTranslate = Math.max(getMinTranslate(), Math.min(newTranslate, getMaxTranslate()));
            track.style.transform = `translateX(${newTranslate}px)`;
            
            let activeIndex = Math.round((centerOffset - newTranslate) / itemWidth);
            activeIndex = Math.max(0, Math.min(activeIndex, items.length - 1));
            
            items.forEach((item, index) => {
                if (index === activeIndex) item.classList.add('active');
                else item.classList.remove('active');
            });
        });

        function endDrag(e) {
            if (!isDragging) return;
            isDragging = false;
            track.style.cursor = 'grab';
            
            let diff = e.clientX - startX;
            let newTranslate = currentTranslate + diff;
            newTranslate = Math.max(getMinTranslate(), Math.min(newTranslate, getMaxTranslate()));
            
            currentIndex = Math.round((centerOffset - newTranslate) / itemWidth);
            currentIndex = Math.max(0, Math.min(currentIndex, items.length - 1));
            
            updateCarousel(true); 
            startAutoPlay();
        }

        track.addEventListener('pointerup', endDrag);
        track.addEventListener('pointerleave', endDrag);

        // ==========================================
        // SỰ KIỆN CUỘN TOUCHPAD 2 NGÓN
        // ==========================================
        let isWheeling = false;
        let wheelTimeout;
        let wheelTranslate = 0;

        track.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                e.preventDefault(); 
                clearInterval(autoPlayInterval);
                
                if (!isWheeling) {
                    isWheeling = true;
                    track.style.transition = 'none';
                    wheelTranslate = centerOffset - (currentIndex * itemWidth);
                }
                
                wheelTranslate -= e.deltaX; 
                wheelTranslate = Math.max(getMinTranslate(), Math.min(wheelTranslate, getMaxTranslate()));
                
                track.style.transform = `translateX(${wheelTranslate}px)`;
                
                let activeIndex = Math.round((centerOffset - wheelTranslate) / itemWidth);
                activeIndex = Math.max(0, Math.min(activeIndex, items.length - 1));
                
                items.forEach((item, index) => {
                    if (index === activeIndex) item.classList.add('active');
                    else item.classList.remove('active');
                });
                
                clearTimeout(wheelTimeout);
                wheelTimeout = setTimeout(() => {
                    isWheeling = false;
                    currentIndex = activeIndex; 
                    updateCarousel(true); 
                    startAutoPlay();
                }, 100); 
            }
        }, { passive: false });
        
       // ==========================================
        // CLICK TRỰC TIẾP VÀO THẺ
        // ==========================================
        items.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                // NẾU VỪA KÉO CHUỘT XONG: Chặn sự kiện click để ảnh không bị giật lùi
                if (hasDragged) {
                    e.preventDefault();
                    return;
                }
                
                // NẾU CHỈ LÀ BẤM CLICK BÌNH THƯỜNG: Chuyển đến ảnh đó
                if(currentIndex !== index) {
                    currentIndex = index;
                    updateCarousel(true);
                    startAutoPlay();
                }
            });
        });
        
        // ==========================================
        // KHỞI TẠO VÀ XỬ LÝ KHI RESIZE MÀN HÌNH
        // ==========================================
        calculateDimensions(); // Tính toán lần đầu
        
        // Tự động đo lại và căn giữa lại mỗi khi phóng to/thu nhỏ trình duyệt
        window.addEventListener('resize', () => {
            calculateDimensions();
            updateCarousel(true);
        });

        track.style.cursor = 'grab';
        updateCarousel(true);
        startAutoPlay();
    }
});
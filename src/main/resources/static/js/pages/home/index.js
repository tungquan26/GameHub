// index.js (từ main.js)
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

    // 2. CAROUSEL - CĂN GIỮA TUYỆT ĐỐI CÁC THẺ
    const track = document.querySelector('.carousel-track');
    const items = document.querySelectorAll('.carousel-item');
    const container = document.querySelector('.carousel-container') || (track ? track.parentElement : null);
    
    if (track && items.length > 0 && container) {
        let currentIndex = 1; 
        let autoPlayInterval;
        
        let itemWidth = 0;
        let centerOffset = 0;
        
        // HÀM ĐỘNG: Căn giữa tuyệt đối theo toàn màn hình
        function calculateDimensions() {
            const trackStyle = window.getComputedStyle(track);
            const gap = parseFloat(trackStyle.gap) || 0;
      
            const rawItemWidth = items[0].offsetWidth;
            itemWidth = rawItemWidth + gap;
     
            const containerRect = container.getBoundingClientRect();
     
            centerOffset = (window.innerWidth / 2) - containerRect.left - (rawItemWidth / 2);
        }

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

        // SỰ KIỆN KÉO CHUỘT / VUỐT
        let isDragging = false;
        let startX = 0;
        let currentTranslate = 0;
        let hasDragged = false;

        track.addEventListener('pointerdown', (e) => {
            isDragging = true;
            hasDragged = false;
            startX = e.clientX;
            currentTranslate = centerOffset - (currentIndex * itemWidth);
              
            track.style.transition = 'none'; 
            track.style.cursor = 'grabbing';
            clearInterval(autoPlayInterval);
        });

        track.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            
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

        // SỰ KIỆN CUỘN TOUCHPAD 2 NGÓN
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

        // CLICK TRỰC TIẾP VÀO THẺ
        items.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                if (hasDragged) {
                    e.preventDefault();
                    return;
                }
                
                if (currentIndex !== index) {
                    currentIndex = index;
                    updateCarousel(true);
                    startAutoPlay();
                }
            });
        });
        
        // KHỞI TẠO & XỬ LÝ KHI RESIZE MÀN HÌNH
        calculateDimensions();
        
        window.addEventListener('resize', () => {
            calculateDimensions();
            updateCarousel(true);
        });

        track.style.cursor = 'grab';
        updateCarousel(true);
        startAutoPlay();
    }

    // 3. HERO BANNER AUTO-PLAY SLIDER (Trượt từ phải sang trái - tốc độ chậm, mượt mà, không pause)
    const heroSlides = document.querySelectorAll('#heroSlider .slide');
    if (heroSlides.length > 0) {
        let currentHeroIndex = 0;
        const HERO_INTERVAL = 5000;
        let slideTimer = null;

        function showHeroSlide(nextIndex) {
            const currentSlide = heroSlides[currentHeroIndex];
            const nextSlide = heroSlides[nextIndex];

            // Slide hiện tại trượt mượt sang trái (-100%)
            currentSlide.classList.remove('active');
            currentSlide.classList.add('prev');

            // Slide kế tiếp trượt vào từ bên phải (0)
            nextSlide.classList.remove('prev');
            nextSlide.classList.add('active');

            // Dọn dẹp trạng thái các slide còn lại (để sẵn bên phải)
            heroSlides.forEach((slide, idx) => {
                if (idx !== currentHeroIndex && idx !== nextIndex) {
                    slide.classList.remove('active', 'prev');
                }
            });

            currentHeroIndex = nextIndex;
        }

        function nextHeroSlide() {
            const nextIndex = (currentHeroIndex + 1) % heroSlides.length;
            showHeroSlide(nextIndex);
        }

        function startHeroAutoPlay() {
            if (slideTimer) clearInterval(slideTimer);
            slideTimer = setInterval(nextHeroSlide, HERO_INTERVAL);
        }

        // Tự động chạy liên tục, không dừng khi hover
        startHeroAutoPlay();
    }
});

import { initAppSidebar } from './app-layout.js';

export function syncSidebarIdentity(name, profileUrl, bannerUrl) {
    const sidebarTourneyName = document.getElementById('sidebarTourneyName');
    const sidebarAvatarImg = document.getElementById('sidebarAvatarImg');
    const sidebarAvatarFallback = document.getElementById('sidebarAvatarFallback');
    const tsHeaderBanner = document.getElementById('tsHeaderBanner');

    if (sidebarTourneyName && name) {
        sidebarTourneyName.textContent = name;
        if (sidebarAvatarFallback) {
            sidebarAvatarFallback.textContent = name.trim().charAt(0).toUpperCase() || 'T';
        }
    }
    if (sidebarAvatarImg && sidebarAvatarFallback) {
        if (profileUrl) {
            sidebarAvatarImg.src = profileUrl;
            sidebarAvatarImg.style.display = 'block';
            sidebarAvatarFallback.style.display = 'none';
        } else {
            sidebarAvatarImg.src = '';
            sidebarAvatarImg.style.display = 'none';
            sidebarAvatarFallback.style.display = 'flex';
        }
    }
    if (tsHeaderBanner) {
        tsHeaderBanner.style.backgroundImage = bannerUrl ? `url(${bannerUrl})` : 'none';
    }
}

export function initTournamentLayout() {
    initAppSidebar();

    // Tự động nạp tên giải đấu, avatar, banner từ sessionStorage lên Sidebar
    const rawStored = sessionStorage.getItem('btp_tournament_data');
    const parsedStored = rawStored ? JSON.parse(rawStored) : null;
    const urlParams = new URLSearchParams(window.location.search);
    const defaultName = parsedStored?.name || urlParams.get('name') || 'Nguyễn Quân';
    const profileImg = sessionStorage.getItem('btp_tournament_profile_img') || '';
    const bannerImg = sessionStorage.getItem('btp_tournament_banner_img') || '';

    syncSidebarIdentity(defaultName, profileImg, bannerImg);

    // Xử lý click các mục trên Tournament Sidebar (nếu là anchor # trong cùng trang)
    const tsNavItems = document.querySelectorAll('.ts-nav .ts-nav-item');
    tsNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const href = item.getAttribute('href') || '';
            if (href.startsWith('/')) return; // Cho phép chuyển trang bình thường với route thật

            e.preventDefault();
            tsNavItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            if (item.dataset.nav === 'details' || href === '#settingsTopbar' || href === '#detailsCard') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                const mainContent = document.getElementById('mainContent');
                if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            const targetId = href.replace('#', '');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', initTournamentLayout);
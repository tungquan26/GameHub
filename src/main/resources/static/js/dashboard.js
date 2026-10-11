// ============================
// Dashboard Script — start.gg style
// ============================

document.addEventListener('DOMContentLoaded', () => {

    // ===== Dữ liệu mẫu giải đấu =====
    const SAMPLE_TOURNAMENTS = [
        {
            id: 1,
            name: 'VCT Champions 2026 — Vietnam Qualifier',
            game: 'Valorant',
            date: '15 - 20 Thg 11, 2026',
            location: 'Hồ Chí Minh, Việt Nam',
            attendees: 128,
            status: 'open',
            image: '/images/game1.png'
        },
        {
            id: 2,
            name: 'LCK Summer Split — Open Qualifiers',
            game: 'Liên Minh Huyền Thoại',
            date: '01 - 10 Thg 12, 2026',
            location: 'Online',
            attendees: 256,
            status: 'open',
            image: '/images/game2.png'
        },
        {
            id: 3,
            name: 'CS2 Major Vietnam — Community Cup',
            game: 'CS2',
            date: '22 - 25 Thg 11, 2026',
            location: 'Hà Nội, Việt Nam',
            attendees: 64,
            status: 'closing',
            image: '/images/game3.png'
        },
        {
            id: 4,
            name: 'PUBG Mobile Pro League VN Season 8',
            game: 'PUBG',
            date: '05 - 15 Thg 12, 2026',
            location: 'Online',
            attendees: 80,
            status: 'open',
            image: '/images/game1.png'
        },
        {
            id: 5,
            name: 'Dota 2 Southeast Asia Championship',
            game: 'Dota 2',
            date: '10 - 18 Thg 12, 2026',
            location: 'Bangkok, Thailand',
            attendees: 32,
            status: 'open',
            image: '/images/game2.png'
        },
        {
            id: 6,
            name: 'FIFA Online 4 — Giải Vô Địch Quốc Gia',
            game: 'FIFA Online',
            date: '28 Thg 11 - 03 Thg 12, 2026',
            location: 'Đà Nẵng, Việt Nam',
            attendees: 48,
            status: 'closing',
            image: '/images/game3.png'
        },
        {
            id: 7,
            name: 'Street Fighter 6 — Saigon Showdown',
            game: 'Street Fighter 6',
            date: '12 - 13 Thg 11, 2026',
            location: 'Hồ Chí Minh, Việt Nam',
            attendees: 96,
            status: 'closed',
            image: '/images/game1.png'
        },
        {
            id: 8,
            name: 'Super Smash Bros Ultimate — Campus League',
            game: 'Super Smash Bros',
            date: '20 - 21 Thg 11, 2026',
            location: 'Online',
            attendees: 160,
            status: 'open',
            image: '/images/game2.png'
        },
        {
            id: 9,
            name: 'Valorant Rising Stars — Rookie Cup',
            game: 'Valorant',
            date: '25 - 28 Thg 11, 2026',
            location: 'Online',
            attendees: 200,
            status: 'open',
            image: '/images/game3.png'
        },
        {
            id: 10,
            name: 'League of Legends — University Championship',
            game: 'Liên Minh Huyền Thoại',
            date: '02 - 08 Thg 12, 2026',
            location: 'Hà Nội, Việt Nam',
            attendees: 112,
            status: 'open',
            image: '/images/game1.png'
        },
        {
            id: 11,
            name: 'CS2 Community Night — Weekly #42',
            game: 'CS2',
            date: '18 Thg 11, 2026',
            location: 'Online',
            attendees: 20,
            status: 'closing',
            image: '/images/game2.png'
        },
        {
            id: 12,
            name: 'Dota 2 Vietnam — The International Qualifier',
            game: 'Dota 2',
            date: '25 Thg 12 - 02 Thg 01, 2027',
            location: 'Hồ Chí Minh, Việt Nam',
            attendees: 16,
            status: 'open',
            image: '/images/game3.png'
        }
    ];

    // ===== Trạng thái =====
    const ITEMS_PER_PAGE = 8;
    let currentPage = 1;
    let filteredTournaments = [...SAMPLE_TOURNAMENTS];

    // ===== DOM Elements =====
    const grid = document.getElementById('tournamentsGrid');
    const searchInput = document.getElementById('searchInput');
    const gameFilter = document.getElementById('gameFilter');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const emptyState = document.getElementById('emptyState');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const logoutBtn = document.getElementById('logoutBtn');

    // ===== Render Card =====
    function createCardHTML(tournament) {
        const badgeClass = {
            'open': 'badge-open',
            'closing': 'badge-closing',
            'closed': 'badge-closed'
        }[tournament.status] || 'badge-open';

        const badgeText = {
            'open': 'Registration Open',
            'closing': 'Registration Closing Soon',
            'closed': 'Registration Closed'
        }[tournament.status] || 'Registration Open';

        return `
            <article class="tournament-card" data-id="${tournament.id}">
                <div class="card-image-wrapper">
                    <img src="${tournament.image}" alt="${tournament.name}" class="card-image" loading="lazy">
                    <span class="card-badge ${badgeClass}">${badgeText}</span>
                </div>
                <div class="card-body">
                    <h3 class="card-title">${tournament.name}</h3>
                    <span class="card-game">${tournament.game}</span>
                    <div class="card-meta">
                        <div class="card-meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            <span>${tournament.date}</span>
                        </div>
                        <div class="card-meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                            <span>${tournament.location}</span>
                        </div>
                        <div class="card-meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                                <path d="M16 3.13a4 4 0 010 7.75"/>
                            </svg>
                            <span>${tournament.attendees} người tham dự</span>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    // ===== Render Grid =====
    function renderTournaments(reset = false) {
        if (reset) {
            currentPage = 1;
            grid.innerHTML = '';
        }

        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = currentPage * ITEMS_PER_PAGE;
        const pageItems = filteredTournaments.slice(start, end);

        if (filteredTournaments.length === 0) {
            emptyState.style.display = 'flex';
            loadMoreContainer.style.display = 'none';
            return;
        } else {
            emptyState.style.display = 'none';
        }

        pageItems.forEach(t => {
            grid.insertAdjacentHTML('beforeend', createCardHTML(t));
        });

        // Ẩn/hiện nút "Xem thêm"
        if (end >= filteredTournaments.length) {
            loadMoreContainer.style.display = 'none';
        } else {
            loadMoreContainer.style.display = 'flex';
        }
    }

    // ===== Lọc và tìm kiếm =====
    function applyFilters() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedGame = gameFilter.value;

        filteredTournaments = SAMPLE_TOURNAMENTS.filter(t => {
            const matchesSearch = !searchTerm || t.name.toLowerCase().includes(searchTerm);
            const matchesGame = !selectedGame || t.game === selectedGame;
            return matchesSearch && matchesGame;
        });

        renderTournaments(true);
    }

    // ===== Event Listeners =====

    // Tìm kiếm (debounce)
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(applyFilters, 300);
    });

    // Lọc theo game
    gameFilter.addEventListener('change', applyFilters);

    // Xem thêm
    loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        renderTournaments(false);
    });

    // Mobile menu toggle
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('active');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        });
    }

    // Đăng xuất
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/login';
        });
    }

    // ===== Khởi tạo =====
    renderTournaments(true);

    console.log('Dashboard loaded');
});

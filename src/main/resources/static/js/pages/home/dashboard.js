// ============================
// Dashboard Script — Liệt kê giải đấu đã tạo & giải đấu mẫu
// ============================

import {
    getCreatedTournaments,
    setActiveTournamentById
} from '../../common/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const GAME_IMAGES = {
        'Liên Minh Huyền Thoại': '/images/game1.png',
        'League of Legends': '/images/game1.png',
        'Valorant': '/images/game2.png',
        'Teamfight Tactics': '/images/game3.png',
        'CS2': '/images/game4.png',
        'Delta Force': '/images/game5.png',
        'The Isle': '/images/game6.png',
        'PUBG': '/images/game1.png',
        'Dota 2': '/images/game2.png',
        'FIFA Online': '/images/game3.png',
        'Street Fighter 6': '/images/game1.png',
        'Super Smash Bros': '/images/game2.png',
        'Super Smash Bros. Ultimate': '/images/game2.png'
    };

    // ===== Dữ liệu mẫu giải đấu =====
    const SAMPLE_TOURNAMENTS = [
        {
            id: 1,
            name: 'VCT Champions 2026 — Vòng loại Việt Nam',
            game: 'Valorant',
            date: '15 - 20 Thg 11, 2026',
            startDate: '2026-11-15T09:00',
            endDate: '2026-11-20T21:00',
            location: 'Hồ Chí Minh, Việt Nam',
            attendees: 128,
            status: 'open',
            image: '/images/game2.png'
        },
        {
            id: 2,
            name: 'LCK Mùa Hè — Vòng loại Mở rộng',
            game: 'Liên Minh Huyền Thoại',
            date: '01 - 10 Thg 12, 2026',
            startDate: '2026-12-01T09:00',
            endDate: '2026-12-10T21:00',
            location: 'Trực tuyến',
            attendees: 256,
            status: 'open',
            image: '/images/game1.png'
        },
        {
            id: 3,
            name: 'CS2 Major Vietnam — Cúp Cộng Đồng',
            game: 'CS2',
            date: '22 - 25 Thg 11, 2026',
            startDate: '2026-11-22T09:00',
            endDate: '2026-11-25T21:00',
            location: 'Hà Nội, Việt Nam',
            attendees: 64,
            status: 'closing',
            image: '/images/game4.png'
        },
        {
            id: 4,
            name: 'PUBG Mobile Pro League VN Mùa 8',
            game: 'PUBG',
            date: '05 - 15 Thg 12, 2026',
            startDate: '2026-12-05T09:00',
            endDate: '2026-12-15T21:00',
            location: 'Trực tuyến',
            attendees: 80,
            status: 'open',
            image: '/images/game1.png'
        },
        {
            id: 5,
            name: 'Giải Vô Địch Dota 2 Đông Nam Á',
            game: 'Dota 2',
            date: '10 - 18 Thg 12, 2026',
            startDate: '2026-12-10T09:00',
            endDate: '2026-12-18T21:00',
            location: 'Bangkok, Thái Lan',
            attendees: 32,
            status: 'open',
            image: '/images/game2.png'
        },
        {
            id: 6,
            name: 'FIFA Online 4 — Giải Vô Địch Quốc Gia',
            game: 'FIFA Online',
            date: '28 Thg 11 - 03 Thg 12, 2026',
            startDate: '2026-11-28T09:00',
            endDate: '2026-12-03T21:00',
            location: 'Đà Nẵng, Việt Nam',
            attendees: 48,
            status: 'closing',
            image: '/images/game3.png'
        },
        {
            id: 7,
            name: 'Street Fighter 6 — Đại Chiến Sài Gòn',
            game: 'Street Fighter 6',
            date: '12 - 13 Thg 11, 2026',
            startDate: '2026-11-12T09:00',
            endDate: '2026-11-13T21:00',
            location: 'Hồ Chí Minh, Việt Nam',
            attendees: 96,
            status: 'closed',
            image: '/images/game1.png'
        },
        {
            id: 8,
            name: 'Super Smash Bros Ultimate — Giải Sinh Viên',
            game: 'Super Smash Bros',
            date: '20 - 21 Thg 11, 2026',
            startDate: '2026-11-20T09:00',
            endDate: '2026-11-21T21:00',
            location: 'Trực tuyến',
            attendees: 160,
            status: 'open',
            image: '/images/game2.png'
        },
        {
            id: 9,
            name: 'Valorant Rising Stars — Cúp Tân Binh',
            game: 'Valorant',
            date: '25 - 28 Thg 11, 2026',
            startDate: '2026-11-25T09:00',
            endDate: '2026-11-28T21:00',
            location: 'Trực tuyến',
            attendees: 200,
            status: 'open',
            image: '/images/game2.png'
        },
        {
            id: 10,
            name: 'Liên Minh Huyền Thoại — Giải Thể Thao Sinh Viên',
            game: 'Liên Minh Huyền Thoại',
            date: '02 - 08 Thg 12, 2026',
            startDate: '2026-12-02T09:00',
            endDate: '2026-12-08T21:00',
            location: 'Hà Nội, Việt Nam',
            attendees: 112,
            status: 'open',
            image: '/images/game1.png'
        },
        {
            id: 11,
            name: 'CS2 Đêm Cộng Đồng — Tuần #42',
            game: 'CS2',
            date: '18 Thg 11, 2026',
            startDate: '2026-11-18T09:00',
            endDate: '2026-11-18T21:00',
            location: 'Trực tuyến',
            attendees: 20,
            status: 'closing',
            image: '/images/game4.png'
        },
        {
            id: 12,
            name: 'Dota 2 Việt Nam — Vòng loại Quốc Gia',
            game: 'Dota 2',
            date: '25 Thg 12 - 02 Thg 01, 2027',
            startDate: '2026-12-25T09:00',
            endDate: '2027-01-02T21:00',
            location: 'Hồ Chí Minh, Việt Nam',
            attendees: 16,
            status: 'open',
            image: '/images/game2.png'
        }
    ];

    function formatVietnameseDateRange(startStr, endStr) {
        const s = new Date(startStr);
        const e = new Date(endStr);
        if (Number.isNaN(s.getTime())) return '15 - 16 Thg 10, 2026';

        const pad = (n) => String(n).padStart(2, '0');
        const sDay = pad(s.getDate());
        const sMonth = pad(s.getMonth() + 1);
        const sYear = s.getFullYear();

        if (Number.isNaN(e.getTime())) {
            return `${sDay} Thg ${sMonth}, ${sYear}`;
        }

        const eDay = pad(e.getDate());
        const eMonth = pad(e.getMonth() + 1);
        const eYear = e.getFullYear();

        if (sYear === eYear && sMonth === eMonth) {
            if (sDay === eDay) return `${sDay} Thg ${sMonth}, ${sYear}`;
            return `${sDay} - ${eDay} Thg ${sMonth}, ${sYear}`;
        }
        return `${sDay} Thg ${sMonth} - ${eDay} Thg ${eMonth}, ${eYear}`;
    }

    function buildDashboardTournamentsList() {
        const list = [];

        // 1. Nạp tất cả các giải đấu người dùng đã tạo
        try {
            const createdList = getCreatedTournaments();
            createdList.forEach((entry, idx) => {
                if (!entry) return;
                const d = entry.details || entry;
                const tourneyName = (entry.name || d.name || '').trim();
                if (!tourneyName) return;

                const gameInfo = entry.gameInfo || {};
                const gameName = gameInfo.game || 'Liên Minh Huyền Thoại';
                const startDate = entry.startDate || d.startDate || '';
                const endDate = entry.endDate || d.endDate || '';
                const venueAddress = (entry.venueAddress ?? d.venueAddress ?? '').trim() || 'Hà Nội, Việt Nam';
                const profileImg = entry.profileImg || '';
                const bannerImg = entry.bannerImg || '';

                list.push({
                    id: entry.id || `created_${900 + idx}`,
                    storeId: entry.id || tourneyName,
                    name: tourneyName,
                    game: gameName,
                    date: formatVietnameseDateRange(startDate, endDate),
                    startDate,
                    endDate,
                    location: venueAddress,
                    attendees: 64,
                    status: 'open',
                    role: 'Organizer',
                    image: bannerImg || profileImg || GAME_IMAGES[gameName] || '/images/game1.png'
                });
            });
        } catch {
            // fallback
        }

        // 2. Gộp thêm danh sách giải đấu mẫu (tránh trùng tên)
        SAMPLE_TOURNAMENTS.forEach(sample => {
            if (!list.some(item => item.name.toLowerCase() === sample.name.toLowerCase())) {
                list.push(sample);
            }
        });

        return list;
    }

    // ===== Trạng thái =====
    const ITEMS_PER_PAGE = 8;
    let currentPage = 1;
    const allTournaments = buildDashboardTournamentsList();
    let filteredTournaments = [...allTournaments];

    // ===== DOM Elements =====
    const grid = document.getElementById('tournamentsGrid');
    const searchInput = document.getElementById('searchInput');
    const gameFilter = document.getElementById('gameFilter');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const emptyState = document.getElementById('emptyState');
    const createEventBtn = document.getElementById('createEventBtn');
    const findEventsBtn = document.getElementById('findEventsBtn');

    // ===== Render Card =====
    function createCardHTML(tournament) {
        const badgeClass = {
            'open': 'badge-open',
            'closing': 'badge-closing',
            'closed': 'badge-closed'
        }[tournament.status] || 'badge-open';

        const badgeText = {
            'open': 'Đang mở đăng ký',
            'closing': 'Sắp đóng đăng ký',
            'closed': 'Đã đóng đăng ký'
        }[tournament.status] || 'Đang mở đăng ký';

        return `
            <article class="tournament-card" data-id="${tournament.id}" style="cursor: pointer;">
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

    // ===== Lọc & Tìm kiếm =====
    function applyFilters() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedGame = gameFilter.value;

        filteredTournaments = allTournaments.filter(t => {
            const matchesSearch = !searchTerm || t.name.toLowerCase().includes(searchTerm);
            const matchesGame = !selectedGame || t.game === selectedGame;
            return matchesSearch && matchesGame;
        });

        renderTournaments(true);
    }

    // ===== Event Listeners =====
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(applyFilters, 300);
    });

    gameFilter.addEventListener('change', applyFilters);

    loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        renderTournaments(false);
    });

    if (grid) {
        grid.addEventListener('click', (e) => {
            const card = e.target.closest('.tournament-card');
            if (!card) return;
            const selected = allTournaments.find(item => String(item.id) === String(card.dataset.id));
            if (selected) {
                if (selected.storeId) {
                    setActiveTournamentById(selected.storeId);
                } else {
                    setActiveTournamentById(selected.name);
                }

                sessionStorage.setItem('btp_selected_view_tournament', JSON.stringify({
                    id: selected.id,
                    storeId: selected.storeId || null,
                    name: selected.name,
                    game: selected.game,
                    startDate: selected.startDate,
                    endDate: selected.endDate,
                    location: selected.location,
                    attendees: selected.attendees,
                    role: selected.role || null,
                    status: selected.status, // 'open' | 'closing' | 'closed'
                    image: selected.image,
                    source: 'dashboard'
                }));
            }
            window.location.href = '/tournament/view';
        });
    }

    if (createEventBtn) {
        createEventBtn.addEventListener('click', () => {
            window.location.href = '/create';
        });
    }

    if (findEventsBtn) {
        findEventsBtn.addEventListener('click', () => {
            window.location.href = '/search';
        });
    }

    // ===== Khởi tạo =====
    renderTournaments(true);
});

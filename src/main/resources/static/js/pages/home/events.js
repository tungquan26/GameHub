// =====================================================
// Trang Giải đấu của tôi — Danh sách ngang (Ban tổ chức / Tuyển thủ) + Phân trang
// =====================================================

import {
    getCreatedTournaments,
    setActiveTournamentById,
    renderCirclePagination
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
        'Super Smash Bros. Ultimate': '/images/game2.png'
    };

    const FORMAT_MAP = {
        SINGLE_ELIMINATION: 'Loại trực tiếp đơn',
        DOUBLE_ELIMINATION: 'Loại trực tiếp kép',
        ROUND_ROBIN: 'Vòng tròn tính điểm',
        SWISS: 'Hệ Thụy Sĩ'
    };

    // ===== Dữ liệu mẫu giải đấu của người dùng (Ban tổ chức & Tuyển thủ) =====
    const SAMPLE_USER_EVENTS = [
        {
            id: 201,
            name: 'VCT Champions 2026 — Vòng loại Việt Nam',
            dateLabel: 'Sắp diễn ra • 15 - 20 Thg 11, 2026',
            startDate: '2026-11-15T09:00',
            endDate: '2026-11-20T21:00',
            game: 'Valorant · Loại trực tiếp kép',
            location: 'Hồ Chí Minh, Việt Nam',
            attendees: 128,
            role: 'Player',
            status: 'open',
            image: '/images/game2.png'
        },
        {
            id: 202,
            name: 'BTP University Esports Cup 2026',
            dateLabel: 'Sắp diễn ra • 22 - 25 Thg 11, 2026',
            startDate: '2026-11-22T09:00',
            endDate: '2026-11-25T21:00',
            game: 'Liên Minh Huyền Thoại · Loại trực tiếp đơn',
            location: 'Hà Nội, Việt Nam',
            attendees: 64,
            role: 'Organizer',
            status: 'open',
            image: '/images/game1.png'
        },
        {
            id: 203,
            name: 'CS2 Major Vietnam — Cúp Cộng Đồng',
            dateLabel: 'Sắp diễn ra • 28 Thg 11, 2026',
            startDate: '2026-11-28T09:00',
            endDate: '2026-11-28T21:00',
            game: 'CS2 · Hệ Thụy Sĩ',
            location: 'Trực tuyến',
            attendees: 96,
            role: 'Player',
            status: 'open',
            image: '/images/game4.png'
        },
        {
            id: 204,
            name: 'Street Fighter 6 — Đại Chiến Sài Gòn',
            dateLabel: 'Sắp diễn ra • 05 - 06 Thg 12, 2026',
            startDate: '2026-12-05T09:00',
            endDate: '2026-12-06T21:00',
            game: 'Street Fighter 6 · Loại trực tiếp kép',
            location: 'Hồ Chí Minh, Việt Nam',
            attendees: 160,
            role: 'Player',
            status: 'open',
            image: '/images/game3.png'
        },
        {
            id: 205,
            name: 'BTP Winter Showdown — Giải Mở Rộng',
            dateLabel: 'Sắp diễn ra • 12 - 14 Thg 12, 2026',
            startDate: '2026-12-12T09:00',
            endDate: '2026-12-14T21:00',
            game: 'Teamfight Tactics · Vòng tròn tính điểm',
            location: 'Trực tuyến',
            attendees: 120,
            role: 'Organizer',
            status: 'open',
            image: '/images/game5.png'
        }
    ];

    // ===== Lấy toàn bộ giải đấu từ sessionStorage =====
    function buildEventsList() {
        const dynamicEvents = [];

        // 1. Tất cả giải đấu người dùng đã tạo ở /create -> Organizer
        try {
            const createdList = getCreatedTournaments();
            createdList.forEach((entry, idx) => {
                if (!entry) return;
                const d = entry.details || entry;
                const tourneyName = (entry.name || d.name || '').trim();
                if (!tourneyName) return;

                const gameInfo = entry.gameInfo || {};
                const profileImg = entry.profileImg || '';
                const startDate = entry.startDate || d.startDate || '';
                const endDate = entry.endDate || d.endDate || '';
                const venueAddress = (entry.venueAddress ?? d.venueAddress ?? '').trim();

                const gameName = gameInfo.game || 'Liên Minh Huyền Thoại';
                const formatName = FORMAT_MAP[gameInfo.format] || 'Loại trực tiếp đơn';

                dynamicEvents.push({
                    id: entry.id || `created_${900 + idx}`,
                    storeId: entry.id || tourneyName,
                    name: tourneyName,
                    dateLabel: `Sắp diễn ra • ${formatShortDate(startDate, endDate)}`,
                    startDate,
                    endDate,
                    game: `${gameName} · ${formatName}`,
                    location: venueAddress || 'Hà Nội, Việt Nam',
                    attendees: 64,
                    role: 'Organizer',
                    status: 'open',
                    image: profileImg || GAME_IMAGES[gameName] || '/images/logo.png'
                });
            });
        } catch {
            // fallback
        }

        // 2. Giải đấu người dùng đã bấm Đăng ký tham gia ở /tournament/view -> Player
        try {
            const rawReg = sessionStorage.getItem('btp_registered_tournaments');
            const regList = rawReg ? JSON.parse(rawReg) : [];
            if (Array.isArray(regList)) {
                regList.forEach((item, index) => {
                    if (item && item.name && !dynamicEvents.some(e => e.name.toLowerCase() === item.name.toLowerCase())) {
                        dynamicEvents.push({
                            id: 800 + index,
                            name: item.name,
                            dateLabel: item.dateLabel || `Sắp diễn ra • ${formatShortDate(item.startDate, item.endDate)}`,
                            startDate: item.startDate || '',
                            endDate: item.endDate || '',
                            game: item.game || 'Liên Minh Huyền Thoại',
                            location: item.location || 'Hà Nội, Việt Nam',
                            attendees: item.attendees || 64,
                            role: 'Player',
                            status: 'open',
                            image: item.image || '/images/game1.png'
                        });
                    }
                });
            }
        } catch {
            // fallback
        }

        // 3. Kết hợp với danh sách mẫu (tránh trùng tên)
        const merged = [...dynamicEvents];
        SAMPLE_USER_EVENTS.forEach(sample => {
            if (!merged.some(item => item.name.toLowerCase() === sample.name.toLowerCase())) {
                merged.push(sample);
            }
        });

        return merged;
    }

    function formatShortDate(startStr, endStr) {
        const s = new Date(startStr);
        const e = new Date(endStr);
        if (Number.isNaN(s.getTime())) return '15 - 16 Thg 10, 2026';
        const pad = (n) => String(n).padStart(2, '0');
        const sDay = pad(s.getDate());
        const sMonth = pad(s.getMonth() + 1);
        const sYear = s.getFullYear();

        if (Number.isNaN(e.getTime())) return `${sDay} Thg ${sMonth}, ${sYear}`;
        const eDay = pad(e.getDate());
        const eMonth = pad(e.getMonth() + 1);
        const eYear = e.getFullYear();

        if (sYear === eYear && sMonth === eMonth) {
            if (sDay === eDay) return `${sDay} Thg ${sMonth}, ${sYear}`;
            return `${sDay} - ${eDay} Thg ${sMonth}, ${sYear}`;
        }
        return `${sDay} Thg ${sMonth} - ${eDay} Thg ${eMonth}, ${eYear}`;
    }

    // ===== Trạng thái & DOM =====
    const allEvents = buildEventsList();
    let currentRoleFilter = ''; // '' | 'Organizer' | 'Player'
    let currentKeyword = '';
    let currentPage = 1;
    const ITEMS_PER_PAGE = 5;

    const listEl = document.getElementById('evTournamentList');
    const emptyEl = document.getElementById('evEmptyState');
    const paginationEl = document.getElementById('evPagination');
    const roleTabsEl = document.getElementById('evRoleTabs');
    const searchInputEl = document.getElementById('evSearchInput');

    // Tạo HTML cho 1 thẻ ngang kèm trạng thái Tuyển thủ hoặc Ban tổ chức ở bên cạnh
    function createEventCardHTML(ev) {
        const isOrganizer = ev.role === 'Organizer';
        const badgeClass = isOrganizer ? 'ev-role-organizer' : 'ev-role-player';
        const roleLabel = isOrganizer ? 'Ban tổ chức' : 'Tuyển thủ';
        const roleIcon = isOrganizer
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                   <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
               </svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                   <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                   <circle cx="12" cy="7" r="4"/>
               </svg>`;

        return `
            <article class="ev-card" data-id="${ev.id}">
                <div class="ev-card-left">
                    <div class="ev-logo-box">
                        <img src="${ev.image}" alt="${ev.name}" class="ev-logo-img" loading="lazy">
                    </div>
                    <div class="ev-info">
                        <h3 class="ev-card-title">${ev.name}</h3>
                        <div class="ev-card-date">${ev.dateLabel}</div>
                        <div class="ev-card-game">${ev.game}</div>
                        <div class="ev-meta-row">
                            <span class="ev-meta-item">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                </svg>
                                <span>${ev.location}</span>
                            </span>
                            <span class="ev-meta-item">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z"/>
                                </svg>
                                <span>${ev.attendees} người tham dự</span>
                            </span>
                        </div>
                    </div>
                </div>

                <div class="ev-card-right">
                    <span class="ev-role-badge ${badgeClass}">
                        ${roleIcon}
                        <span>${roleLabel}</span>
                    </span>
                    <span class="ev-view-hint">
                        <span>Xem giải đấu</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </span>
                </div>
            </article>
        `;
    }

    function renderEvents() {
        const kw = currentKeyword.trim().toLowerCase();

        const filtered = allEvents.filter(ev => {
            const matchesRole = !currentRoleFilter || ev.role === currentRoleFilter;
            const matchesKeyword = !kw ||
                ev.name.toLowerCase().includes(kw) ||
                ev.game.toLowerCase().includes(kw) ||
                ev.location.toLowerCase().includes(kw);
            return matchesRole && matchesKeyword;
        });

        listEl.innerHTML = '';

        if (filtered.length === 0) {
            emptyEl.style.display = 'flex';
            if (paginationEl) paginationEl.innerHTML = '';
            return;
        }

        emptyEl.style.display = 'none';

        const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
        if (currentPage > totalPages) currentPage = totalPages;

        const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
        const pagedItems = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

        pagedItems.forEach(ev => {
            listEl.insertAdjacentHTML('beforeend', createEventCardHTML(ev));
        });

        renderCirclePagination(paginationEl, currentPage, totalPages, (nextPage) => {
            currentPage = nextPage;
            renderEvents();
            window.scrollTo({ top: 180, behavior: 'smooth' });
        });
    }

    // ===== Sự kiện lọc vai trò =====
    if (roleTabsEl) {
        roleTabsEl.addEventListener('click', (e) => {
            const btn = e.target.closest('.ev-role-tab');
            if (!btn) return;
            currentRoleFilter = btn.getAttribute('data-role') || '';
            currentPage = 1;
            roleTabsEl.querySelectorAll('.ev-role-tab').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            renderEvents();
        });
    }

    // ===== Sự kiện tìm kiếm =====
    if (searchInputEl) {
        searchInputEl.addEventListener('input', () => {
            currentKeyword = searchInputEl.value;
            currentPage = 1;
            renderEvents();
        });
    }

    // ===== Khi bấm vào thẻ giải đấu chuyển thẳng sang /tournament/view =====
    if (listEl) {
        listEl.addEventListener('click', (e) => {
            const card = e.target.closest('.ev-card');
            if (!card) return;
            const selected = allEvents.find(item => String(item.id) === String(card.dataset.id));
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
                    game: selected.game.split('·')[0].trim(),
                    startDate: selected.startDate,
                    endDate: selected.endDate,
                    location: selected.location,
                    attendees: selected.attendees,
                    role: selected.role, // 'Organizer' | 'Player'
                    status: selected.status || 'open',
                    image: selected.image,
                    source: 'events'
                }));
            }
            window.location.href = '/tournament/view';
        });
    }

    // ===== Khởi tạo =====
    renderEvents();
});

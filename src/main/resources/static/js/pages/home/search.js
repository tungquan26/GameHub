// =====================================================
// Search Tournaments Script — Đồng bộ giải đấu đã tạo & Tiếng Việt
// =====================================================

import {
    getCreatedTournaments,
    setActiveTournamentById
} from '../../common/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const TODAY = new Date('2026-10-22T00:00:00');

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

    // ===== Dữ liệu mẫu giải đấu =====
    const DEFAULT_TOURNAMENTS = [
        {
            id: 101,
            name: '第74回スマバトSP',
            dateLabel: 'Sắp diễn ra • 24 Thg 10, 2026',
            startDate: '2026-10-24',
            game: 'Super Smash Bros. Ultimate',
            gameDisplay: 'Super Smash Bros. Ultimate',
            location: '大東市, JP',
            attendees: 312,
            status: 'upcoming',
            badgeLabel: 'Sắp đóng đăng ký',
            badgeClass: 'stc-badge-closing',
            image: '/images/game1.png'
        },
        {
            id: 102,
            name: 'LEGENDS7',
            dateLabel: 'Sắp diễn ra • 26 Thg 10, 2026',
            startDate: '2026-10-26',
            game: 'Super Smash Bros. Ultimate',
            gameDisplay: 'Super Smash Bros. Ultimate',
            location: 'San Salvador, SV',
            attendees: 326,
            status: 'upcoming',
            badgeLabel: 'Sắp diễn ra',
            badgeClass: 'stc-badge-upcoming',
            image: '/images/game2.png'
        },
        {
            id: 103,
            name: 'World Warrior 2026 - Japan 5',
            dateLabel: 'Đang diễn ra • 21 - 23 Thg 10, 2026',
            startDate: '2026-10-21',
            game: 'Street Fighter 6',
            gameDisplay: 'Street Fighter 6',
            location: 'Trực tuyến',
            attendees: 426,
            status: 'in_progress',
            badgeLabel: 'Đang diễn ra',
            badgeClass: 'stc-badge-progress',
            image: '/images/game3.png'
        },
        {
            id: 104,
            name: 'Headstomper 2026',
            dateLabel: 'Sắp diễn ra • 06 Thg 11, 2026',
            startDate: '2026-11-06',
            game: 'Avatar Legends: The Fighting Game',
            gameDisplay: 'Avatar Legends: The Fighting Game — cùng 10 bộ môn khác',
            location: 'Malmö, SE',
            attendees: 450,
            status: 'upcoming',
            badgeLabel: 'Đang mở đăng ký',
            badgeClass: 'stc-badge-open',
            image: '/images/game4.png'
        },
        {
            id: 105,
            name: 'TGU 2026',
            dateLabel: 'Sắp diễn ra • 13 Thg 11, 2026',
            startDate: '2026-11-13',
            game: '2XKO',
            gameDisplay: '2XKO — cùng 7 bộ môn khác',
            location: 'Tambon Ban Mai, TH',
            attendees: 180,
            status: 'upcoming',
            badgeLabel: 'Đang mở đăng ký',
            badgeClass: 'stc-badge-open',
            image: '/images/game5.png'
        },
        {
            id: 1,
            name: 'VCT Champions 2026 — Vòng loại Việt Nam',
            dateLabel: 'Đang diễn ra • 22 Thg 10, 2026',
            startDate: '2026-10-22',
            game: 'Valorant',
            gameDisplay: 'Valorant',
            location: 'Hồ Chí Minh, Việt Nam',
            attendees: 128,
            status: 'in_progress',
            badgeLabel: 'Đang diễn ra',
            badgeClass: 'stc-badge-progress',
            image: '/images/game1.png'
        },
        {
            id: 2,
            name: 'LCK Mùa Hè — Vòng loại Mở rộng',
            dateLabel: 'Sắp diễn ra • 01 Thg 12, 2026',
            startDate: '2026-12-01',
            game: 'Liên Minh Huyền Thoại',
            gameDisplay: 'Liên Minh Huyền Thoại',
            location: 'Trực tuyến',
            attendees: 256,
            status: 'upcoming',
            badgeLabel: 'Đang mở đăng ký',
            badgeClass: 'stc-badge-open',
            image: '/images/game2.png'
        },
        {
            id: 3,
            name: 'CS2 Major Vietnam — Cúp Cộng Đồng',
            dateLabel: 'Đã kết thúc • 18 Thg 10, 2026',
            startDate: '2026-10-18',
            game: 'CS2',
            gameDisplay: 'CS2',
            location: 'Hà Nội, Việt Nam',
            attendees: 64,
            status: 'completed',
            badgeLabel: 'Đã kết thúc',
            badgeClass: 'stc-badge-completed',
            image: '/images/game3.png'
        },
        {
            id: 4,
            name: 'PUBG Mobile Pro League VN Mùa 8',
            dateLabel: 'Sắp diễn ra • 15 Thg 12, 2026',
            startDate: '2026-12-15',
            game: 'PUBG',
            gameDisplay: 'PUBG',
            location: 'Trực tuyến',
            attendees: 80,
            status: 'upcoming',
            badgeLabel: 'Đang mở đăng ký',
            badgeClass: 'stc-badge-open',
            image: '/images/game4.png'
        },
        {
            id: 5,
            name: 'Giải Vô Địch Dota 2 Đông Nam Á',
            dateLabel: 'Sắp diễn ra • 10 Thg 02, 2027',
            startDate: '2027-02-10',
            game: 'Dota 2',
            gameDisplay: 'Dota 2',
            location: 'Bangkok, TH',
            attendees: 32,
            status: 'upcoming',
            badgeLabel: 'Đang mở đăng ký',
            badgeClass: 'stc-badge-open',
            image: '/images/game5.png'
        },
        {
            id: 6,
            name: 'FIFA Online 4 — Giải Vô Địch Quốc Gia',
            dateLabel: 'Đã kết thúc • 16 Thg 10, 2026',
            startDate: '2026-10-16',
            game: 'FIFA Online',
            gameDisplay: 'FIFA Online',
            location: 'Đà Nẵng, Việt Nam',
            attendees: 48,
            status: 'completed',
            badgeLabel: 'Đã kết thúc',
            badgeClass: 'stc-badge-completed',
            image: '/images/game6.png'
        },
        {
            id: 7,
            name: 'Street Fighter 6 — Đại Chiến Sài Gòn',
            dateLabel: 'Sắp diễn ra • 12 Thg 11, 2026',
            startDate: '2026-11-12',
            game: 'Street Fighter 6',
            gameDisplay: 'Street Fighter 6',
            location: 'Hồ Chí Minh, Việt Nam',
            attendees: 96,
            status: 'upcoming',
            badgeLabel: 'Sắp đóng đăng ký',
            badgeClass: 'stc-badge-closing',
            image: '/images/game1.png'
        },
        {
            id: 8,
            name: 'Super Smash Bros Ultimate — Giải Sinh Viên',
            dateLabel: 'Sắp diễn ra • 20 Thg 11, 2026',
            startDate: '2026-11-20',
            game: 'Super Smash Bros. Ultimate',
            gameDisplay: 'Super Smash Bros. Ultimate',
            location: 'Trực tuyến',
            attendees: 160,
            status: 'upcoming',
            badgeLabel: 'Đang mở đăng ký',
            badgeClass: 'stc-badge-open',
            image: '/images/game2.png'
        },
        {
            id: 9,
            name: 'Valorant Rising Stars — Cúp Tân Binh',
            dateLabel: 'Sắp diễn ra • 18 Thg 01, 2027',
            startDate: '2027-01-18',
            game: 'Valorant',
            gameDisplay: 'Valorant',
            location: 'Trực tuyến',
            attendees: 200,
            status: 'upcoming',
            badgeLabel: 'Đang mở đăng ký',
            badgeClass: 'stc-badge-open',
            image: '/images/game3.png'
        },
        {
            id: 10,
            name: 'Liên Minh Huyền Thoại — Giải Thể Thao Sinh Viên',
            dateLabel: 'Sắp diễn ra • 02 Thg 03, 2027',
            startDate: '2027-03-02',
            game: 'Liên Minh Huyền Thoại',
            gameDisplay: 'Liên Minh Huyền Thoại',
            location: 'Hà Nội, Việt Nam',
            attendees: 112,
            status: 'upcoming',
            badgeLabel: 'Đang mở đăng ký',
            badgeClass: 'stc-badge-open',
            image: '/images/game4.png'
        }
    ];

    function formatVietnameseShortDate(startStr, endStr) {
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

    function buildInitialSearchList() {
        const list = [];
        try {
            const createdList = getCreatedTournaments();
            createdList.forEach((entry, idx) => {
                if (!entry) return;
                const d = entry.details || entry;
                const tourneyName = (entry.name || d.name || '').trim();
                if (!tourneyName) return;

                const gameInfo = entry.gameInfo || {};
                const gameName = gameInfo.game || 'Liên Minh Huyền Thoại';
                const formatName = FORMAT_MAP[gameInfo.format] || 'Loại trực tiếp đơn';
                const startDate = entry.startDate || d.startDate || '';
                const endDate = entry.endDate || d.endDate || '';
                const isoStart = startDate ? startDate.slice(0, 10) : '2026-10-24';
                const venueAddress = (entry.venueAddress ?? d.venueAddress ?? '').trim() || 'Hà Nội, Việt Nam';
                const profileImg = entry.profileImg || '';

                list.push({
                    id: entry.id || `created_${900 + idx}`,
                    storeId: entry.id || tourneyName,
                    name: tourneyName,
                    dateLabel: `Sắp diễn ra • ${formatVietnameseShortDate(startDate, endDate)}`,
                    startDate: isoStart,
                    endDate,
                    game: gameName,
                    gameDisplay: `${gameName} · ${formatName}`,
                    location: venueAddress,
                    attendees: 64,
                    role: 'Organizer',
                    status: 'upcoming',
                    badgeLabel: 'Đang mở đăng ký',
                    badgeClass: 'stc-badge-open',
                    image: profileImg || GAME_IMAGES[gameName] || '/images/game1.png'
                });
            });
        } catch {
            // fallback
        }

        DEFAULT_TOURNAMENTS.forEach(item => {
            if (!list.some(existing => existing.name.toLowerCase() === item.name.toLowerCase())) {
                list.push(item);
            }
        });

        return list;
    }

    // ===== Trạng thái tìm kiếm & phân trang =====
    const ITEMS_PER_PAGE = 5;
    let allTournaments = buildInitialSearchList();
    let filteredTournaments = [...allTournaments];
    let currentPage = 1;

    const filterState = {
        keyword: '',
        location: '',
        statuses: [],       // ['upcoming', 'in_progress', 'completed']
        game: '',
        dateRanges: [],     // ['next_7_days', 'next_month', 'next_3_months', 'next_6_months', 'past_7_days', 'custom']
        customStartDate: '',
        customEndDate: ''
    };

    // ===== DOM Elements =====
    const tournamentSearchInput = document.getElementById('tournamentSearchInput');
    const clearKeywordBtn = document.getElementById('clearKeywordBtn');
    const locationSearchInput = document.getElementById('locationSearchInput');
    const locationMenuToggleBtn = document.getElementById('locationMenuToggleBtn');
    const locationDropdown = document.getElementById('locationDropdown');
    const locationFieldWrapper = document.getElementById('locationFieldWrapper');

    const filtersPillBtn = document.getElementById('filtersPillBtn');
    const filtersPillLabel = document.getElementById('filtersPillLabel');
    const filtersDropdownMenu = document.getElementById('filtersDropdownMenu');
    const statusCheckboxes = filtersDropdownMenu.querySelectorAll('input[name="statusFilter"]');
    const clearStatusFilterBtn = document.getElementById('clearStatusFilterBtn');
    const doneStatusFilterBtn = document.getElementById('doneStatusFilterBtn');

    const gamePillBtn = document.getElementById('gamePillBtn');
    const gamePillLabel = document.getElementById('gamePillLabel');
    const gameDropdownMenu = document.getElementById('gameDropdownMenu');

    const datePillBtn = document.getElementById('datePillBtn');
    const datePillLabel = document.getElementById('datePillLabel');
    const dateDropdownMenu = document.getElementById('dateDropdownMenu');
    const dateRangeCheckboxes = dateDropdownMenu.querySelectorAll('input[name="dateRangeFilter"]');
    const customDatesBox = document.getElementById('customDatesBox');
    const customStartDateInput = document.getElementById('customStartDateInput');
    const customEndDateInput = document.getElementById('customEndDateInput');
    const clearDateFilterBtn = document.getElementById('clearDateFilterBtn');
    const doneDateFilterBtn = document.getElementById('doneDateFilterBtn');

    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const listContainer = document.getElementById('searchTournamentList');
    const emptyState = document.getElementById('searchEmptyState');
    const paginationContainer = document.getElementById('searchPagination');

    // ===== Nạp thêm dữ liệu từ API /api/tournaments =====
    async function loadApiTournaments() {
        try {
            const response = await fetch('/api/tournaments');
            if (!response.ok) return;
            const data = await response.json();
            if (!Array.isArray(data) || data.length === 0) return;

            const mappedFromApi = data.map((item, idx) => {
                const startObj = item.startDate ? new Date(item.startDate) : new Date(2026, 10, 15);
                const day = String(startObj.getDate() || 15).padStart(2, '0');
                const month = String((startObj.getMonth() || 10) + 1).padStart(2, '0');
                const year = startObj.getFullYear() || 2026;
                const isoDate = startObj.toISOString().slice(0, 10);
                const gameName = item.game && item.game.name ? item.game.name : 'Valorant';
                const attendeesCount = Array.isArray(item.registrations) ? item.registrations.length : 64;

                let normalizedStatus = 'upcoming';
                let badgeLabel = 'Đang mở đăng ký';
                let badgeClass = 'stc-badge-open';
                let prefixLabel = 'Sắp diễn ra';

                if (item.status === 'IN_PROGRESS' || item.status === 'ONGOING') {
                    normalizedStatus = 'in_progress';
                    badgeLabel = 'Đang diễn ra';
                    badgeClass = 'stc-badge-progress';
                    prefixLabel = 'Đang diễn ra';
                } else if (item.status === 'COMPLETED' || item.status === 'FINISHED') {
                    normalizedStatus = 'completed';
                    badgeLabel = 'Đã kết thúc';
                    badgeClass = 'stc-badge-completed';
                    prefixLabel = 'Đã kết thúc';
                } else if (item.status === 'REGISTRATION_CLOSED') {
                    normalizedStatus = 'upcoming';
                    badgeLabel = 'Sắp đóng đăng ký';
                    badgeClass = 'stc-badge-closing';
                }

                return {
                    id: item.tournamentId || (500 + idx),
                    name: item.name || 'Giải đấu Cộng đồng BTP',
                    dateLabel: `${prefixLabel} • ${day} Thg ${month}, ${year}`,
                    startDate: isoDate,
                    game: gameName,
                    gameDisplay: gameName,
                    location: 'Trực tuyến',
                    attendees: attendeesCount,
                    status: normalizedStatus,
                    badgeLabel,
                    badgeClass,
                    image: `/images/game${(idx % 6) + 1}.png`
                };
            });

            const baseList = buildInitialSearchList();
            mappedFromApi.forEach(apiItem => {
                if (!baseList.some(existing => existing.name.toLowerCase() === apiItem.name.toLowerCase())) {
                    baseList.push(apiItem);
                }
            });
            allTournaments = baseList;
            applyFilters();
        } catch (err) {
            // Giữ nguyên dữ liệu hiện có nếu API chưa sẵn sàng
        }
    }

    // ===== Kiểm tra 1 giải đấu có khớp bộ lọc ngày bắt đầu không =====
    function matchesDateRangeFilter(tournament) {
        if (filterState.dateRanges.length === 0) return true;

        const tDate = new Date(tournament.startDate + 'T00:00:00');
        if (isNaN(tDate.getTime())) return true;

        const diffDays = (tDate.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24);

        return filterState.dateRanges.some(rangeKey => {
            switch (rangeKey) {
                case 'next_7_days':
                    return diffDays >= 0 && diffDays <= 7;
                case 'next_month':
                    return diffDays >= 0 && diffDays <= 31;
                case 'next_3_months':
                    return diffDays >= 0 && diffDays <= 92;
                case 'next_6_months':
                    return diffDays >= 0 && diffDays <= 185;
                case 'past_7_days':
                    return diffDays >= -7 && diffDays <= 0;
                case 'custom': {
                    let afterStart = true;
                    let beforeEnd = true;
                    if (filterState.customStartDate) {
                        const fromDate = new Date(filterState.customStartDate + 'T00:00:00');
                        afterStart = tDate >= fromDate;
                    }
                    if (filterState.customEndDate) {
                        const toDate = new Date(filterState.customEndDate + 'T23:59:59');
                        beforeEnd = tDate <= toDate;
                    }
                    return afterStart && beforeEnd;
                }
                default:
                    return true;
            }
        });
    }

    // ===== Render 1 thẻ giải đấu ngang =====
    function createHorizontalCardHTML(tournament) {
        const badgeClass = tournament.badgeClass || 'stc-badge-open';
        const badgeText = tournament.badgeLabel || 'Đang mở đăng ký';

        const attendeesRowHTML = tournament.attendees > 0
            ? `
                <div class="stc-meta-row">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z"/>
                    </svg>
                    <span>${tournament.attendees} người tham dự</span>
                </div>
            `
            : '';

        return `
            <article class="search-tournament-card" data-id="${tournament.id}">
                <div class="stc-left">
                    <div class="stc-logo-box">
                        <img src="${tournament.image}" alt="${tournament.name}" class="stc-logo-img" loading="lazy">
                    </div>
                    <div class="stc-info">
                        <h3 class="stc-title">${tournament.name}</h3>
                        <div class="stc-date-line">${tournament.dateLabel}</div>
                        <div class="stc-game-line">${tournament.gameDisplay || tournament.game}</div>
                        <div class="stc-meta-row">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                            <span>${tournament.location}</span>
                        </div>
                        ${attendeesRowHTML}
                    </div>
                </div>
                <div class="stc-right">
                    <span class="stc-badge ${badgeClass}">${badgeText}</span>
                </div>
            </article>
        `;
    }

    // ===== Render danh sách & Phân trang =====
    function renderList() {
        listContainer.innerHTML = '';

        if (filteredTournaments.length === 0) {
            emptyState.style.display = 'flex';
            paginationContainer.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        paginationContainer.style.display = 'flex';

        const totalPages = Math.max(1, Math.ceil(filteredTournaments.length / ITEMS_PER_PAGE));
        if (currentPage > totalPages) currentPage = totalPages;

        const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
        const pageSlice = filteredTournaments.slice(startIdx, startIdx + ITEMS_PER_PAGE);

        pageSlice.forEach(t => {
            listContainer.insertAdjacentHTML('beforeend', createHorizontalCardHTML(t));
        });

        renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
        paginationContainer.innerHTML = '';
        const maxDisplayPages = Math.max(totalPages, 1);

        for (let p = 1; p <= Math.min(maxDisplayPages, 5); p++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'page-circle-btn' + (p === currentPage ? ' active' : '');
            btn.textContent = p;
            btn.addEventListener('click', () => {
                currentPage = p;
                renderList();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            paginationContainer.appendChild(btn);
        }

        if (maxDisplayPages > 5) {
            const dots = document.createElement('span');
            dots.className = 'page-dots';
            dots.textContent = '...';
            paginationContainer.appendChild(dots);

            const lastBtn = document.createElement('button');
            lastBtn.type = 'button';
            lastBtn.className = 'page-circle-btn' + (currentPage === maxDisplayPages ? ' active' : '');
            lastBtn.textContent = maxDisplayPages;
            lastBtn.addEventListener('click', () => {
                currentPage = maxDisplayPages;
                renderList();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            paginationContainer.appendChild(lastBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'page-circle-btn';
        nextBtn.disabled = currentPage >= maxDisplayPages;
        nextBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="14" height="14">
                <polyline points="9 18 15 12 9 6"/>
            </svg>
        `;
        nextBtn.addEventListener('click', () => {
            if (currentPage < maxDisplayPages) {
                currentPage++;
                renderList();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        paginationContainer.appendChild(nextBtn);
    }

    // ===== Áp dụng bộ lọc =====
    function applyFilters() {
        const kw = filterState.keyword.trim().toLowerCase();
        const loc = filterState.location.trim().toLowerCase();

        filteredTournaments = allTournaments.filter(t => {
            const matchesKeyword = !kw ||
                t.name.toLowerCase().includes(kw) ||
                t.game.toLowerCase().includes(kw) ||
                (t.gameDisplay && t.gameDisplay.toLowerCase().includes(kw));

            const matchesLocation = !loc || t.location.toLowerCase().includes(loc);

            const matchesStatus =
                filterState.statuses.length === 0 ||
                filterState.statuses.includes(t.status);

            const matchesGame = !filterState.game || t.game === filterState.game;

            const matchesDate = matchesDateRangeFilter(t);

            return matchesKeyword && matchesLocation && matchesStatus && matchesGame && matchesDate;
        });

        currentPage = 1;
        updateFilterPillLabels();
        renderList();
    }

    function updateFilterPillLabels() {
        const statusCount = filterState.statuses.length;
        const statusNameMap = {
            upcoming: 'Sắp diễn ra',
            in_progress: 'Đang diễn ra',
            completed: 'Đã kết thúc'
        };

        if (statusCount === 1) {
            filtersPillLabel.textContent = statusNameMap[filterState.statuses[0]] || 'Trạng thái (1)';
            filtersPillBtn.classList.add('has-active-filter');
        } else if (statusCount > 1) {
            filtersPillLabel.textContent = `Trạng thái (${statusCount})`;
            filtersPillBtn.classList.add('has-active-filter');
        } else {
            filtersPillLabel.textContent = 'Trạng thái';
            filtersPillBtn.classList.remove('has-active-filter');
        }

        if (filterState.game) {
            gamePillLabel.textContent = filterState.game;
            gamePillBtn.classList.add('has-active-filter');
        } else {
            gamePillLabel.textContent = 'Tựa game';
            gamePillBtn.classList.remove('has-active-filter');
        }

        const dateCount = filterState.dateRanges.length;
        const dateLabelMap = {
            next_7_days: '7 ngày tới',
            next_month: 'Tháng tới',
            next_3_months: '3 tháng tới',
            next_6_months: '6 tháng tới',
            past_7_days: '7 ngày qua',
            custom: 'Tùy chọn ngày'
        };

        if (dateCount === 1) {
            datePillLabel.textContent = dateLabelMap[filterState.dateRanges[0]] || 'Ngày bắt đầu';
            datePillBtn.classList.add('has-active-filter');
        } else if (dateCount > 1) {
            datePillLabel.textContent = `Ngày bắt đầu (${dateCount})`;
            datePillBtn.classList.add('has-active-filter');
        } else {
            datePillLabel.textContent = 'Ngày bắt đầu';
            datePillBtn.classList.remove('has-active-filter');
        }

        const hasAnyFilter = Boolean(
            filterState.keyword ||
            filterState.location ||
            filterState.statuses.length > 0 ||
            filterState.game ||
            filterState.dateRanges.length > 0
        );
        resetFiltersBtn.style.display = hasAnyFilter ? 'inline-block' : 'none';
    }

    function closeAllDropdowns() {
        filtersDropdownMenu.style.display = 'none';
        gameDropdownMenu.style.display = 'none';
        dateDropdownMenu.style.display = 'none';
        locationDropdown.style.display = 'none';
    }

    function toggleDropdown(menuEl) {
        const isOpen = menuEl.style.display === 'block';
        closeAllDropdowns();
        menuEl.style.display = isOpen ? 'none' : 'block';
    }

    let searchTimer;
    tournamentSearchInput.addEventListener('input', () => {
        filterState.keyword = tournamentSearchInput.value;
        clearKeywordBtn.style.display = filterState.keyword ? 'inline-block' : 'none';
        clearTimeout(searchTimer);
        searchTimer = setTimeout(applyFilters, 200);
    });

    clearKeywordBtn.addEventListener('click', () => {
        tournamentSearchInput.value = '';
        filterState.keyword = '';
        clearKeywordBtn.style.display = 'none';
        applyFilters();
    });

    locationSearchInput.addEventListener('input', () => {
        filterState.location = locationSearchInput.value;
        clearTimeout(searchTimer);
        searchTimer = setTimeout(applyFilters, 200);
    });

    locationSearchInput.addEventListener('focus', () => {
        closeAllDropdowns();
        locationDropdown.style.display = 'block';
    });

    locationMenuToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown(locationDropdown);
    });

    locationDropdown.addEventListener('click', (e) => {
        const btn = e.target.closest('.dropdown-item');
        if (!btn) return;
        const selectedLoc = btn.getAttribute('data-location') || '';
        filterState.location = selectedLoc;
        locationSearchInput.value = selectedLoc;

        locationDropdown.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');

        closeAllDropdowns();
        applyFilters();
    });

    filtersPillBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown(filtersDropdownMenu);
    });

    gamePillBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown(gameDropdownMenu);
    });

    datePillBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown(dateDropdownMenu);
    });

    filtersDropdownMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    dateDropdownMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    function syncStatusStateFromDOM() {
        filterState.statuses = Array.from(statusCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
    }

    statusCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            syncStatusStateFromDOM();
            applyFilters();
        });
    });

    clearStatusFilterBtn.addEventListener('click', () => {
        statusCheckboxes.forEach(cb => { cb.checked = false; });
        filterState.statuses = [];
        applyFilters();
    });

    doneStatusFilterBtn.addEventListener('click', () => {
        syncStatusStateFromDOM();
        applyFilters();
        closeAllDropdowns();
    });

    function syncDateStateFromDOM() {
        filterState.dateRanges = Array.from(dateRangeCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        filterState.customStartDate = customStartDateInput ? customStartDateInput.value : '';
        filterState.customEndDate = customEndDateInput ? customEndDateInput.value : '';

        if (customDatesBox) {
            customDatesBox.style.display = filterState.dateRanges.includes('custom') ? 'flex' : 'none';
        }
    }

    dateRangeCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            syncDateStateFromDOM();
            applyFilters();
        });
    });

    if (customStartDateInput) {
        customStartDateInput.addEventListener('change', () => {
            syncDateStateFromDOM();
            applyFilters();
        });
    }

    if (customEndDateInput) {
        customEndDateInput.addEventListener('change', () => {
            syncDateStateFromDOM();
            applyFilters();
        });
    }

    clearDateFilterBtn.addEventListener('click', () => {
        dateRangeCheckboxes.forEach(cb => { cb.checked = false; });
        if (customStartDateInput) customStartDateInput.value = '';
        if (customEndDateInput) customEndDateInput.value = '';
        if (customDatesBox) customDatesBox.style.display = 'none';
        filterState.dateRanges = [];
        filterState.customStartDate = '';
        filterState.customEndDate = '';
        applyFilters();
    });

    doneDateFilterBtn.addEventListener('click', () => {
        syncDateStateFromDOM();
        applyFilters();
        closeAllDropdowns();
    });

    gameDropdownMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = e.target.closest('.dropdown-item');
        if (!item) return;

        filterState.game = item.getAttribute('data-game') || '';
        gameDropdownMenu.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');

        closeAllDropdowns();
        applyFilters();
    });

    resetFiltersBtn.addEventListener('click', () => {
        filterState.keyword = '';
        filterState.location = '';
        filterState.statuses = [];
        filterState.game = '';
        filterState.dateRanges = [];
        filterState.customStartDate = '';
        filterState.customEndDate = '';

        tournamentSearchInput.value = '';
        locationSearchInput.value = '';
        clearKeywordBtn.style.display = 'none';

        statusCheckboxes.forEach(cb => { cb.checked = false; });
        dateRangeCheckboxes.forEach(cb => { cb.checked = false; });
        if (customStartDateInput) customStartDateInput.value = '';
        if (customEndDateInput) customEndDateInput.value = '';
        if (customDatesBox) customDatesBox.style.display = 'none';

        document.querySelectorAll('#gameDropdownMenu .dropdown-item, .location-dropdown .dropdown-item').forEach(el => {
            const isDefault =
                el.getAttribute('data-location') === '' ||
                el.getAttribute('data-game') === '';
            el.classList.toggle('active', isDefault);
        });

        closeAllDropdowns();
        applyFilters();
    });

    document.addEventListener('click', (e) => {
        if (!locationFieldWrapper.contains(e.target)) {
            locationDropdown.style.display = 'none';
        }
        if (
            !e.target.closest('#filtersPillWrapper') &&
            !e.target.closest('#gamePillWrapper') &&
            !e.target.closest('#datePillWrapper')
        ) {
            filtersDropdownMenu.style.display = 'none';
            gameDropdownMenu.style.display = 'none';
            dateDropdownMenu.style.display = 'none';
        }
    });

    if (listContainer) {
        listContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.search-tournament-card');
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
                    endDate: selected.endDate || selected.startDate,
                    location: selected.location,
                    attendees: selected.attendees,
                    role: selected.role || null,
                    status: selected.status,
                    badgeLabel: selected.badgeLabel,
                    image: selected.image,
                    source: 'search'
                }));
            }
            window.location.href = '/tournament/view';
        });
    }

    applyFilters();
    loadApiTournaments();
});

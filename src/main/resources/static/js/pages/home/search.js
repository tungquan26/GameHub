// =====================================================
// Search Tournaments Script — Start.gg Style
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    // Mốc ngày tham chiếu mặc định để các bộ lọc Next 7 Days / Past 7 Days luôn khớp dữ liệu mẫu
    const TODAY = new Date('2026-10-22T00:00:00');

    // ===== Dữ liệu mẫu chuẩn theo thiết kế Start.gg + Dashboard =====
    const DEFAULT_TOURNAMENTS = [
        {
            id: 101,
            name: '第74回スマバトSP',
            dateLabel: 'Upcoming • Oct 24th, 2026',
            startDate: '2026-10-24',
            game: 'Super Smash Bros. Ultimate',
            gameDisplay: 'Super Smash Bros. Ultimate',
            location: '大東市, JP',
            attendees: 312,
            status: 'upcoming',
            badgeLabel: 'Registration Closes Soon',
            badgeClass: 'stc-badge-closing',
            image: '/images/game1.png'
        },
        {
            id: 102,
            name: 'LEGENDS7',
            dateLabel: 'Upcoming • Oct 26th, 2026',
            startDate: '2026-10-26',
            game: 'Super Smash Bros. Ultimate',
            gameDisplay: 'Super Smash Bros. Ultimate',
            location: 'San Salvador, SV',
            attendees: 326,
            status: 'upcoming',
            badgeLabel: 'Upcoming',
            badgeClass: 'stc-badge-upcoming',
            image: '/images/game2.png'
        },
        {
            id: 103,
            name: 'World Warrior 2026 - Japan 5',
            dateLabel: 'In Progress • Oct 21st - Oct 23rd, 2026',
            startDate: '2026-10-21',
            game: 'Street Fighter 6',
            gameDisplay: 'Street Fighter 6',
            location: 'Online',
            attendees: 426,
            status: 'in_progress',
            badgeLabel: 'In Progress',
            badgeClass: 'stc-badge-progress',
            image: '/images/game3.png'
        },
        {
            id: 104,
            name: 'Headstomper 2026',
            dateLabel: 'Upcoming • Nov 6th, 2026',
            startDate: '2026-11-06',
            game: 'Avatar Legends: The Fighting Game',
            gameDisplay: 'Avatar Legends: The Fighting Game — and 10 more games',
            location: 'Malmö, SE',
            attendees: 450,
            status: 'upcoming',
            badgeLabel: 'Registration Open',
            badgeClass: 'stc-badge-open',
            image: '/images/game4.png'
        },
        {
            id: 105,
            name: 'TGU 2026',
            dateLabel: 'Upcoming • Nov 13th, 2026',
            startDate: '2026-11-13',
            game: '2XKO',
            gameDisplay: '2XKO — and 7 more games',
            location: 'Tambon Ban Mai, TH',
            attendees: 180,
            status: 'upcoming',
            badgeLabel: 'Registration Open',
            badgeClass: 'stc-badge-open',
            image: '/images/game5.png'
        },
        {
            id: 1,
            name: 'VCT Champions 2026 — Vietnam Qualifier',
            dateLabel: 'In Progress • Oct 22nd, 2026',
            startDate: '2026-10-22',
            game: 'Valorant',
            gameDisplay: 'Valorant',
            location: 'Hồ Chí Minh, Việt Nam',
            attendees: 128,
            status: 'in_progress',
            badgeLabel: 'In Progress',
            badgeClass: 'stc-badge-progress',
            image: '/images/game1.png'
        },
        {
            id: 2,
            name: 'LCK Summer Split — Open Qualifiers',
            dateLabel: 'Upcoming • Dec 1st, 2026',
            startDate: '2026-12-01',
            game: 'Liên Minh Huyền Thoại',
            gameDisplay: 'Liên Minh Huyền Thoại',
            location: 'Online',
            attendees: 256,
            status: 'upcoming',
            badgeLabel: 'Registration Open',
            badgeClass: 'stc-badge-open',
            image: '/images/game2.png'
        },
        {
            id: 3,
            name: 'CS2 Major Vietnam — Community Cup',
            dateLabel: 'Completed • Oct 18th, 2026',
            startDate: '2026-10-18',
            game: 'CS2',
            gameDisplay: 'CS2',
            location: 'Hà Nội, Việt Nam',
            attendees: 64,
            status: 'completed',
            badgeLabel: 'Completed',
            badgeClass: 'stc-badge-completed',
            image: '/images/game3.png'
        },
        {
            id: 4,
            name: 'PUBG Mobile Pro League VN Season 8',
            dateLabel: 'Upcoming • Dec 15th, 2026',
            startDate: '2026-12-15',
            game: 'PUBG',
            gameDisplay: 'PUBG',
            location: 'Online',
            attendees: 80,
            status: 'upcoming',
            badgeLabel: 'Registration Open',
            badgeClass: 'stc-badge-open',
            image: '/images/game4.png'
        },
        {
            id: 5,
            name: 'Dota 2 Southeast Asia Championship',
            dateLabel: 'Upcoming • Feb 10th, 2027',
            startDate: '2027-02-10',
            game: 'Dota 2',
            gameDisplay: 'Dota 2',
            location: 'Bangkok, TH',
            attendees: 32,
            status: 'upcoming',
            badgeLabel: 'Registration Open',
            badgeClass: 'stc-badge-open',
            image: '/images/game5.png'
        },
        {
            id: 6,
            name: 'FIFA Online 4 — Giải Vô Địch Quốc Gia',
            dateLabel: 'Completed • Oct 16th, 2026',
            startDate: '2026-10-16',
            game: 'FIFA Online',
            gameDisplay: 'FIFA Online',
            location: 'Đà Nẵng, Việt Nam',
            attendees: 48,
            status: 'completed',
            badgeLabel: 'Completed',
            badgeClass: 'stc-badge-completed',
            image: '/images/game6.png'
        },
        {
            id: 7,
            name: 'Street Fighter 6 — Saigon Showdown',
            dateLabel: 'Upcoming • Nov 12th, 2026',
            startDate: '2026-11-12',
            game: 'Street Fighter 6',
            gameDisplay: 'Street Fighter 6',
            location: 'Hồ Chí Minh, Việt Nam',
            attendees: 96,
            status: 'upcoming',
            badgeLabel: 'Registration Closes Soon',
            badgeClass: 'stc-badge-closing',
            image: '/images/game1.png'
        },
        {
            id: 8,
            name: 'Super Smash Bros Ultimate — Campus League',
            dateLabel: 'Upcoming • Nov 20th, 2026',
            startDate: '2026-11-20',
            game: 'Super Smash Bros. Ultimate',
            gameDisplay: 'Super Smash Bros. Ultimate',
            location: 'Online',
            attendees: 160,
            status: 'upcoming',
            badgeLabel: 'Registration Open',
            badgeClass: 'stc-badge-open',
            image: '/images/game2.png'
        },
        {
            id: 9,
            name: 'Valorant Rising Stars — Rookie Cup',
            dateLabel: 'Upcoming • Jan 18th, 2027',
            startDate: '2027-01-18',
            game: 'Valorant',
            gameDisplay: 'Valorant',
            location: 'Online',
            attendees: 200,
            status: 'upcoming',
            badgeLabel: 'Registration Open',
            badgeClass: 'stc-badge-open',
            image: '/images/game3.png'
        },
        {
            id: 10,
            name: 'League of Legends — University Championship',
            dateLabel: 'Upcoming • Mar 2nd, 2027',
            startDate: '2027-03-02',
            game: 'Liên Minh Huyền Thoại',
            gameDisplay: 'Liên Minh Huyền Thoại',
            location: 'Hà Nội, Việt Nam',
            attendees: 112,
            status: 'upcoming',
            badgeLabel: 'Registration Open',
            badgeClass: 'stc-badge-open',
            image: '/images/game4.png'
        }
    ];

    // ===== Trạng thái tìm kiếm & phân trang =====
    const ITEMS_PER_PAGE = 5;
    let allTournaments = [...DEFAULT_TOURNAMENTS];
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
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthTag = monthNames[startObj.getMonth()] || 'Nov';
                const day = startObj.getDate() || 15;
                const year = startObj.getFullYear() || 2026;
                const isoDate = startObj.toISOString().slice(0, 10);
                const gameName = item.game && item.game.name ? item.game.name : 'Valorant';
                const attendeesCount = Array.isArray(item.registrations) ? item.registrations.length : 64;

                let normalizedStatus = 'upcoming';
                let badgeLabel = 'Registration Open';
                let badgeClass = 'stc-badge-open';
                let prefixLabel = 'Upcoming';

                if (item.status === 'IN_PROGRESS' || item.status === 'ONGOING') {
                    normalizedStatus = 'in_progress';
                    badgeLabel = 'In Progress';
                    badgeClass = 'stc-badge-progress';
                    prefixLabel = 'In Progress';
                } else if (item.status === 'COMPLETED' || item.status === 'FINISHED') {
                    normalizedStatus = 'completed';
                    badgeLabel = 'Completed';
                    badgeClass = 'stc-badge-completed';
                    prefixLabel = 'Completed';
                } else if (item.status === 'REGISTRATION_CLOSED') {
                    normalizedStatus = 'upcoming';
                    badgeLabel = 'Registration Closes Soon';
                    badgeClass = 'stc-badge-closing';
                }

                return {
                    id: item.tournamentId || (500 + idx),
                    name: item.name || 'BTP Community Tournament',
                    dateLabel: `${prefixLabel} • ${monthTag} ${day}th, ${year}`,
                    startDate: isoDate,
                    game: gameName,
                    gameDisplay: gameName,
                    location: 'Online',
                    attendees: attendeesCount,
                    status: normalizedStatus,
                    badgeLabel,
                    badgeClass,
                    image: `/images/game${(idx % 6) + 1}.png`
                };
            });

            allTournaments = [...mappedFromApi, ...DEFAULT_TOURNAMENTS];
            applyFilters();
        } catch (err) {
            // Giữ nguyên dữ liệu mẫu nếu API chưa sẵn sàng
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
        const badgeText = tournament.badgeLabel || 'Registration Open';

        const attendeesRowHTML = tournament.attendees > 0
            ? `
                <div class="stc-meta-row">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z"/>
                    </svg>
                    <span>${tournament.attendees} Attendees</span>
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
            // 1. Keyword
            const matchesKeyword = !kw ||
                t.name.toLowerCase().includes(kw) ||
                t.game.toLowerCase().includes(kw) ||
                (t.gameDisplay && t.gameDisplay.toLowerCase().includes(kw));

            // 2. Location
            const matchesLocation = !loc || t.location.toLowerCase().includes(loc);

            // 3. Status filter (Upcoming / In Progress / Completed)
            const matchesStatus =
                filterState.statuses.length === 0 ||
                filterState.statuses.includes(t.status);

            // 4. Game filter
            const matchesGame = !filterState.game || t.game === filterState.game;

            // 5. Start Date filter
            const matchesDate = matchesDateRangeFilter(t);

            return matchesKeyword && matchesLocation && matchesStatus && matchesGame && matchesDate;
        });

        currentPage = 1;
        updateFilterPillLabels();
        renderList();
    }

    function updateFilterPillLabels() {
        // Cập nhật trạng thái nút Filters (STATUS)
        const statusCount = filterState.statuses.length;
        const statusNameMap = {
            upcoming: 'Upcoming',
            in_progress: 'In Progress',
            completed: 'Completed'
        };

        if (statusCount === 1) {
            filtersPillLabel.textContent = statusNameMap[filterState.statuses[0]] || 'Filters (1)';
            filtersPillBtn.classList.add('has-active-filter');
        } else if (statusCount > 1) {
            filtersPillLabel.textContent = `Filters (${statusCount})`;
            filtersPillBtn.classList.add('has-active-filter');
        } else {
            filtersPillLabel.textContent = 'Filters';
            filtersPillBtn.classList.remove('has-active-filter');
        }

        // Cập nhật nút Game
        if (filterState.game) {
            gamePillLabel.textContent = filterState.game;
            gamePillBtn.classList.add('has-active-filter');
        } else {
            gamePillLabel.textContent = 'Game';
            gamePillBtn.classList.remove('has-active-filter');
        }

        // Cập nhật nút Date (Start Date)
        const dateCount = filterState.dateRanges.length;
        const dateLabelMap = {
            next_7_days: 'Next 7 Days',
            next_month: 'Next Month',
            next_3_months: 'Next 3 Months',
            next_6_months: 'Next 6 Months',
            past_7_days: 'Past 7 Days',
            custom: 'Custom Dates'
        };

        if (dateCount === 1) {
            datePillLabel.textContent = dateLabelMap[filterState.dateRanges[0]] || 'Date';
            datePillBtn.classList.add('has-active-filter');
        } else if (dateCount > 1) {
            datePillLabel.textContent = `Date (${dateCount})`;
            datePillBtn.classList.add('has-active-filter');
        } else {
            datePillLabel.textContent = 'Date';
            datePillBtn.classList.remove('has-active-filter');
        }

        // Hiện/ẩn nút Reset filters
        const hasAnyFilter = Boolean(
            filterState.keyword ||
            filterState.location ||
            filterState.statuses.length > 0 ||
            filterState.game ||
            filterState.dateRanges.length > 0
        );
        resetFiltersBtn.style.display = hasAnyFilter ? 'inline-block' : 'none';
    }

    // ===== Đóng tất cả dropdown =====
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

    // ===== Sự kiện nhập từ khóa tìm kiếm =====
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

    // ===== Sự kiện Location input & dropdown =====
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

    // ===== Sự kiện 3 nút Pills: Filters, Game, Date =====
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

    // Ngăn sự kiện click bên trong Popover làm đóng menu ngoài ý muốn
    filtersDropdownMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    dateDropdownMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // ===== Xử lý Checkboxes & Clear / Done trong Filters (STATUS) =====
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

    // ===== Xử lý Checkboxes & Clear / Done trong Date (Start Date) =====
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

    // ===== Chọn mục trong Game Dropdown =====
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

    // ===== Nút Reset tất cả bộ lọc =====
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

    // Click bên ngoài để đóng dropdown
    document.addEventListener('click', (e) => {
        if (!locationFieldWrapper.contains(e.target)) {
            locationDropdown.style.display = 'none';
        }
        if (!e.target.closest('.pill-dropdown-wrapper')) {
            filtersDropdownMenu.style.display = 'none';
            gameDropdownMenu.style.display = 'none';
            dateDropdownMenu.style.display = 'none';
        }
    });

    // Click vào thẻ giải đấu chuyển sang trang xem giải đấu
        listContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.search-tournament-card');
        if (!card) return;
        const selected = allTournaments.find(item => String(item.id) === String(card.dataset.id));
        if (selected) {
            sessionStorage.setItem('btp_selected_view_tournament', JSON.stringify({
                id: selected.id,
                name: selected.name,
                game: selected.game,
                startDate: selected.startDate,
                location: selected.location,
                attendees: selected.attendees,
                status: selected.status,
                badgeLabel: selected.badgeLabel,
                image: selected.image,
                source: 'search'
            }));
        }
        window.location.href = '/tournament/view';
    });

    // ===== Khởi tạo =====
    renderList();
    loadApiTournaments();
});

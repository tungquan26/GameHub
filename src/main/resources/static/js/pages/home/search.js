// =====================================================
// Search Tournaments Script — Start.gg Style
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    // ===== Dữ liệu mẫu chuẩn theo thiết kế Start.gg + Dashboard =====
    const DEFAULT_TOURNAMENTS = [
        {
            id: 101,
            name: '第74回スマバトSP',
            dateLabel: 'Upcoming • Oct 24th, 2026',
            monthTag: 'Oct',
            game: 'Super Smash Bros. Ultimate',
            gameDisplay: 'Super Smash Bros. Ultimate',
            location: '大東市, JP',
            attendees: 312,
            status: 'closing',
            image: '/images/game1.png'
        },
        {
            id: 102,
            name: 'LEGENDS7',
            dateLabel: 'Upcoming • Oct 24th, 2026',
            monthTag: 'Oct',
            game: 'Super Smash Bros. Ultimate',
            gameDisplay: 'Super Smash Bros. Ultimate',
            location: 'San Salvador, SV',
            attendees: 326,
            status: 'closing',
            image: '/images/game2.png'
        },
        {
            id: 103,
            name: 'World Warrior 2026 - Japan 5',
            dateLabel: 'Upcoming • Nov 28th, 2026',
            monthTag: 'Nov',
            game: 'Street Fighter 6',
            gameDisplay: 'Street Fighter 6',
            location: 'Online',
            attendees: 426,
            status: 'open',
            image: '/images/game3.png'
        },
        {
            id: 104,
            name: 'Headstomper 2026',
            dateLabel: 'Upcoming • Nov 6th, 2026',
            monthTag: 'Nov',
            game: 'Avatar Legends: The Fighting Game',
            gameDisplay: 'Avatar Legends: The Fighting Game — and 10 more games',
            location: 'Malmö, SE',
            attendees: 450,
            status: 'open',
            image: '/images/game4.png'
        },
        {
            id: 105,
            name: 'TGU 2026',
            dateLabel: 'Upcoming • Nov 13th, 2026',
            monthTag: 'Nov',
            game: '2XKO',
            gameDisplay: '2XKO — and 7 more games',
            location: 'Tambon Ban Mai, TH',
            attendees: 0,
            status: 'open',
            image: '/images/game5.png'
        },
        {
            id: 1,
            name: 'VCT Champions 2026 — Vietnam Qualifier',
            dateLabel: 'Upcoming • Nov 15th, 2026',
            monthTag: 'Nov',
            game: 'Valorant',
            gameDisplay: 'Valorant',
            location: 'Hồ Chí Minh, Việt Nam',
            attendees: 128,
            status: 'open',
            image: '/images/game1.png'
        },
        {
            id: 2,
            name: 'LCK Summer Split — Open Qualifiers',
            dateLabel: 'Upcoming • Dec 1st, 2026',
            monthTag: 'Dec',
            game: 'Liên Minh Huyền Thoại',
            gameDisplay: 'Liên Minh Huyền Thoại',
            location: 'Online',
            attendees: 256,
            status: 'open',
            image: '/images/game2.png'
        },
        {
            id: 3,
            name: 'CS2 Major Vietnam — Community Cup',
            dateLabel: 'Upcoming • Nov 22nd, 2026',
            monthTag: 'Nov',
            game: 'CS2',
            gameDisplay: 'CS2',
            location: 'Hà Nội, Việt Nam',
            attendees: 64,
            status: 'closing',
            image: '/images/game3.png'
        },
        {
            id: 4,
            name: 'PUBG Mobile Pro League VN Season 8',
            dateLabel: 'Upcoming • Dec 5th, 2026',
            monthTag: 'Dec',
            game: 'PUBG',
            gameDisplay: 'PUBG',
            location: 'Online',
            attendees: 80,
            status: 'open',
            image: '/images/game4.png'
        },
        {
            id: 5,
            name: 'Dota 2 Southeast Asia Championship',
            dateLabel: 'Upcoming • Dec 10th, 2026',
            monthTag: 'Dec',
            game: 'Dota 2',
            gameDisplay: 'Dota 2',
            location: 'Bangkok, TH',
            attendees: 32,
            status: 'open',
            image: '/images/game5.png'
        },
        {
            id: 6,
            name: 'FIFA Online 4 — Giải Vô Địch Quốc Gia',
            dateLabel: 'Upcoming • Nov 28th, 2026',
            monthTag: 'Nov',
            game: 'FIFA Online',
            gameDisplay: 'FIFA Online',
            location: 'Đà Nẵng, Việt Nam',
            attendees: 48,
            status: 'closing',
            image: '/images/game6.png'
        },
        {
            id: 7,
            name: 'Street Fighter 6 — Saigon Showdown',
            dateLabel: 'Upcoming • Nov 12th, 2026',
            monthTag: 'Nov',
            game: 'Street Fighter 6',
            gameDisplay: 'Street Fighter 6',
            location: 'Hồ Chí Minh, Việt Nam',
            attendees: 96,
            status: 'closing',
            image: '/images/game1.png'
        },
        {
            id: 8,
            name: 'Super Smash Bros Ultimate — Campus League',
            dateLabel: 'Upcoming • Nov 20th, 2026',
            monthTag: 'Nov',
            game: 'Super Smash Bros. Ultimate',
            gameDisplay: 'Super Smash Bros. Ultimate',
            location: 'Online',
            attendees: 160,
            status: 'open',
            image: '/images/game2.png'
        },
        {
            id: 9,
            name: 'Valorant Rising Stars — Rookie Cup',
            dateLabel: 'Upcoming • Nov 25th, 2026',
            monthTag: 'Nov',
            game: 'Valorant',
            gameDisplay: 'Valorant',
            location: 'Online',
            attendees: 200,
            status: 'open',
            image: '/images/game3.png'
        },
        {
            id: 10,
            name: 'League of Legends — University Championship',
            dateLabel: 'Upcoming • Dec 2nd, 2026',
            monthTag: 'Dec',
            game: 'Liên Minh Huyền Thoại',
            gameDisplay: 'Liên Minh Huyền Thoại',
            location: 'Hà Nội, Việt Nam',
            attendees: 112,
            status: 'open',
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
        status: '',     // '' | 'open' | 'closing'
        eventType: '',  // '' | 'online' | 'offline'
        game: '',
        dateMonth: ''   // '' | 'Oct' | 'Nov' | 'Dec'
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

    const gamePillBtn = document.getElementById('gamePillBtn');
    const gamePillLabel = document.getElementById('gamePillLabel');
    const gameDropdownMenu = document.getElementById('gameDropdownMenu');

    const datePillBtn = document.getElementById('datePillBtn');
    const datePillLabel = document.getElementById('datePillLabel');
    const dateDropdownMenu = document.getElementById('dateDropdownMenu');

    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const listContainer = document.getElementById('searchTournamentList');
    const emptyState = document.getElementById('searchEmptyState');
    const paginationContainer = document.getElementById('searchPagination');

    // ===== Nạp thêm dữ liệu từ API /api/tournaments (Phương án A) =====
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
                const gameName = item.game && item.game.name ? item.game.name : 'Valorant';
                const attendeesCount = Array.isArray(item.registrations) ? item.registrations.length : 64;

                return {
                    id: item.tournamentId || (500 + idx),
                    name: item.name || 'BTP Community Tournament',
                    dateLabel: `Upcoming • ${monthTag} ${day}th, ${year}`,
                    monthTag,
                    game: gameName,
                    gameDisplay: gameName,
                    location: 'Online',
                    attendees: attendeesCount,
                    status: item.status === 'REGISTRATION_CLOSED' ? 'closing' : 'open',
                    image: `/images/game${(idx % 6) + 1}.png`
                };
            });

            // Ghép dữ liệu từ API lên đầu danh sách nhưng giữ nguyên bộ dữ liệu mẫu
            allTournaments = [...mappedFromApi, ...DEFAULT_TOURNAMENTS];
            applyFilters();
        } catch (err) {
            // Nếu API chưa có dữ liệu hoặc lỗi mạng thì vẫn dùng DEFAULT_TOURNAMENTS mượt mà
        }
    }

    // ===== Render 1 thẻ giải đấu ngang =====
    function createHorizontalCardHTML(tournament) {
        const isClosing = tournament.status === 'closing';
        const badgeClass = isClosing ? 'stc-badge-closing' : 'stc-badge-open';
        const badgeText = isClosing ? 'Registration Closes Soon' : 'Registration Open';

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

        // Hiển thị giống mẫu Start.gg: 1 2 3 4 5 ... 100 >
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

        // Nút Next (>)
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

            // 3. Status filter
            const matchesStatus = !filterState.status || t.status === filterState.status;

            // 4. Event Type (Online / Offline)
            let matchesType = true;
            if (filterState.eventType === 'online') {
                matchesType = t.location.toLowerCase() === 'online';
            } else if (filterState.eventType === 'offline') {
                matchesType = t.location.toLowerCase() !== 'online';
            }

            // 5. Game filter
            const matchesGame = !filterState.game || t.game === filterState.game;

            // 6. Date filter
            const matchesDate = !filterState.dateMonth || t.monthTag === filterState.dateMonth;

            return matchesKeyword && matchesLocation && matchesStatus && matchesType && matchesGame && matchesDate;
        });

        currentPage = 1;
        updateFilterPillLabels();
        renderList();
    }

    function updateFilterPillLabels() {
        // Cập nhật trạng thái nút Filters
        let activeFilterCount = 0;
        if (filterState.status) activeFilterCount++;
        if (filterState.eventType) activeFilterCount++;

        if (activeFilterCount > 0) {
            filtersPillLabel.textContent = `Filters (${activeFilterCount})`;
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

        // Cập nhật nút Date
        if (filterState.dateMonth) {
            const monthMap = { Oct: 'Oct 2026', Nov: 'Nov 2026', Dec: 'Dec 2026' };
            datePillLabel.textContent = monthMap[filterState.dateMonth] || 'Date';
            datePillBtn.classList.add('has-active-filter');
        } else {
            datePillLabel.textContent = 'Date';
            datePillBtn.classList.remove('has-active-filter');
        }

        // Hiện/ẩn nút Reset filters
        const hasAnyFilter = Boolean(
            filterState.keyword ||
            filterState.location ||
            filterState.status ||
            filterState.eventType ||
            filterState.game ||
            filterState.dateMonth
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

    // Chọn mục trong Filters Dropdown
    filtersDropdownMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = e.target.closest('.dropdown-item');
        if (!item) return;

        if (item.hasAttribute('data-filter-status')) {
            filterState.status = item.getAttribute('data-filter-status') || '';
            filtersDropdownMenu.querySelectorAll('[data-filter-status]').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
        } else if (item.hasAttribute('data-filter-type')) {
            filterState.eventType = item.getAttribute('data-filter-type') || '';
            filtersDropdownMenu.querySelectorAll('[data-filter-type]').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
        }

        applyFilters();
    });

    // Chọn mục trong Game Dropdown
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

    // Chọn mục trong Date Dropdown
    dateDropdownMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = e.target.closest('.dropdown-item');
        if (!item) return;

        filterState.dateMonth = item.getAttribute('data-date') || '';
        dateDropdownMenu.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');

        closeAllDropdowns();
        applyFilters();
    });

    // Nút Reset tất cả bộ lọc
    resetFiltersBtn.addEventListener('click', () => {
        filterState.keyword = '';
        filterState.location = '';
        filterState.status = '';
        filterState.eventType = '';
        filterState.game = '';
        filterState.dateMonth = '';

        tournamentSearchInput.value = '';
        locationSearchInput.value = '';
        clearKeywordBtn.style.display = 'none';

        document.querySelectorAll('.pill-dropdown-menu .dropdown-item, .location-dropdown .dropdown-item').forEach(el => {
            const isDefault =
                el.getAttribute('data-location') === '' ||
                el.getAttribute('data-filter-status') === '' ||
                el.getAttribute('data-filter-type') === '' ||
                el.getAttribute('data-game') === '' ||
                el.getAttribute('data-date') === '';
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
        window.location.href = '/tournament/view';
    });

    // ===== Khởi tạo =====
    renderList();
    loadApiTournaments();
});

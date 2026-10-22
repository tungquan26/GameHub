import { CONTACT_ICONS } from '../../common/icons.js';
import { showToast } from '../../common/toast.js';
import { escapeHtml, renderMarkdownToHtml, getCreatedTournaments, setActiveTournamentById } from '../../common/utils.js';
import { initAppSidebar } from '../../layouts/app-layout.js';

document.addEventListener('DOMContentLoaded', () => {
    initAppSidebar();

    const GAME_IMAGES = {
        'Liên Minh Huyền Thoại': '/images/game1.png',
        'League of Legends': '/images/game1.png',
        'Valorant': '/images/game2.png',
        'Teamfight Tactics': '/images/game3.png',
        'CS2': '/images/game4.png',
        'Counter-Strike 2': '/images/game4.png',
        'Delta Force': '/images/game5.png',
        'The Isle': '/images/game6.png',
        'PUBG': '/images/game1.png',
        'Dota 2': '/images/game2.png',
        'FIFA Online': '/images/game3.png',
        'Street Fighter 6': '/images/game1.png',
        'Super Smash Bros': '/images/game2.png',
        'Super Smash Bros. Ultimate': '/images/game2.png'
    };

    const FORMAT_LABELS = {
        'SINGLE_ELIMINATION': 'Loại trực tiếp',
        'DOUBLE_ELIMINATION': 'Nhánh thắng - Nhánh thua',
        'ROUND_ROBIN': 'Vòng tròn tính điểm',
        'SWISS': 'Thể thức Thụy Sĩ'
    };

    const STAGE_LABELS = {
        'SINGLE_STAGE': '1 giai đoạn',
        'TWO_STAGE': '2 giai đoạn'
    };

    const TITLE_VI_MAP = {
        'Overview': 'Tổng quan',
        'Game Info': 'Thông tin bộ môn',
        'Location': 'Địa điểm',
        'Contact Info': 'Thông tin liên hệ',
        'Rules': 'Điều lệ',
        'Custom Text': 'Nội dung tùy chỉnh',
        'New Section': 'Khu vực mới'
    };

    function localizeTitle(title) {
        const clean = (title || '').trim();
        return TITLE_VI_MAP[clean] || clean;
    }

    // 1. Đọc dữ liệu từ sessionStorage (đồng bộ với danh sách nhiều giải đấu đã tạo)
    const rawSelectedView = sessionStorage.getItem('btp_selected_view_tournament');
    const selectedView = rawSelectedView ? JSON.parse(rawSelectedView) : null;

    if (selectedView) {
        if (selectedView.storeId) {
            setActiveTournamentById(selectedView.storeId);
        } else if (selectedView.name) {
            setActiveTournamentById(selectedView.name);
        }
    }

    const createdTournaments = getCreatedTournaments();
    const rawDetails = sessionStorage.getItem('btp_tournament_data');
    const details = rawDetails ? JSON.parse(rawDetails) : {};

    const rawRegSettings = sessionStorage.getItem('btp_tournament_reg_settings');
    const regSettings = rawRegSettings ? JSON.parse(rawRegSettings) : null;

    const rawGameInfo = sessionStorage.getItem('btp_tournament_game_info');
    const gameInfo = rawGameInfo ? JSON.parse(rawGameInfo) : {};

    // Kiểm tra xem giải đấu đang xem có phải giải do chính người dùng tạo trong phiên này không
    const isOwnCreatedTourney = Boolean(
        !selectedView ||
        (details.name && selectedView.name && details.name.trim().toLowerCase() === selectedView.name.trim().toLowerCase()) ||
        createdTournaments.some(t => ((t?.name || t?.details?.name || '').trim().toLowerCase()) === (selectedView?.name || '').trim().toLowerCase())
    );

    const profileImg = isOwnCreatedTourney
        ? (sessionStorage.getItem('btp_tournament_profile_img') || '')
        : (selectedView?.image || '');
    const bannerImg = isOwnCreatedTourney
        ? (sessionStorage.getItem('btp_tournament_banner_img') || '')
        : '';

    const defaultRulesMarkdown = `# Hệ thống quản lý giải đấu — Quy định chung\n## 1. Quy định tài khoản & Đội tuyển tham gia\n**Nội dung chính**\n- Quản lý tài khoản người dùng và phân quyền ban tổ chức.\n- Đảm bảo mọi thành viên tham gia tuân thủ đúng quy định chung của giải đấu.\n- Nghiêm cấm sử dụng phần mềm thứ 3 can thiệp vào trò chơi.`;
    const rulesMarkdown = sessionStorage.getItem('btp_tournament_rules') || defaultRulesMarkdown;

    const tourneyName = (isOwnCreatedTourney ? details.name : selectedView?.name) || details.name || 'Giải đấu mới';
    const startDate = (isOwnCreatedTourney ? details.startDate : selectedView?.startDate) || details.startDate || '2026-10-15T00:00';
    const endDate = (isOwnCreatedTourney ? details.endDate : selectedView?.endDate) || details.endDate || startDate;
    const venueAddress = isOwnCreatedTourney
        ? (details.venueAddress || '').trim()
        : (selectedView?.location || '').trim();
    const venueLat = isOwnCreatedTourney ? (details.venueLat || null) : null;
    const venueLon = isOwnCreatedTourney ? (details.venueLon || null) : null;
    const contactType = (details.contactType === 'DISCORD' || details.contactType === 'Discord') ? 'DISCORD' : 'EMAIL';
    const contactValue = details.contact || 'quannguyen041026@gmail.com';

    const selectedGame = isOwnCreatedTourney
        ? (gameInfo.game || 'Liên Minh Huyền Thoại')
        : (selectedView?.game || gameInfo.game || 'Liên Minh Huyền Thoại');
    const selectedFormat = FORMAT_LABELS[gameInfo.format] || 'Loại trực tiếp';
    const selectedStage = STAGE_LABELS[gameInfo.stageType] || '1 giai đoạn';

    // =========================================================================
    // 2. XÁC ĐỊNH TƯ CÁCH NGƯỜI DÙNG & TRẠNG THÁI GIẢI ĐẤU CHO NÚT BÊN TRÁI
    // =========================================================================
    const ORGANIZER_SAMPLE_NAMES = [
        'btp university esports cup 2026',
        'btp winter showdown — open series'
    ];

    function isUserRegisteredFor(nameToCheck) {
        if (!nameToCheck) return false;
        const normalized = nameToCheck.trim().toLowerCase();
        if ((selectedView?.role === 'Player' || selectedView?.role === 'Tuyển thủ') && selectedView?.name?.trim().toLowerCase() === normalized) {
            return true;
        }
        try {
            const rawList = sessionStorage.getItem('btp_registered_tournaments');
            const regList = rawList ? JSON.parse(rawList) : [];
            return Array.isArray(regList) && regList.some(item => (item.name || '').trim().toLowerCase() === normalized);
        } catch {
            return false;
        }
    }

    function isUserOrganizerOf(nameToCheck) {
        if (!nameToCheck) return false;
        const normalized = nameToCheck.trim().toLowerCase();
        if ((selectedView?.role === 'Organizer' || selectedView?.role === 'Ban tổ chức') && selectedView?.name?.trim().toLowerCase() === normalized) {
            return true;
        }
        if (details.name && details.name.trim().toLowerCase() === normalized) {
            return true;
        }
        if (createdTournaments.some(t => ((t?.name || t?.details?.name || '').trim().toLowerCase()) === normalized)) {
            return true;
        }
        return ORGANIZER_SAMPLE_NAMES.includes(normalized);
    }

    function resolveTournamentStatus() {
        const rawStatus = (selectedView?.status || '').toLowerCase();
        const badgeLabel = (selectedView?.badgeLabel || '').toLowerCase();

        if (rawStatus === 'completed' || badgeLabel === 'completed' || badgeLabel === 'đã kết thúc') {
            return 'COMPLETED';
        }
        if (rawStatus === 'in_progress' || rawStatus === 'ongoing' || badgeLabel === 'in progress' || badgeLabel === 'đang diễn ra') {
            return 'IN_PROGRESS';
        }
        if (rawStatus === 'closed' || rawStatus === 'registration_closed' || badgeLabel === 'registration closed' || badgeLabel === 'đã đóng đăng ký') {
            return 'REGISTRATION_CLOSED';
        }
        if (badgeLabel === 'upcoming' || badgeLabel === 'sắp diễn ra') {
            return 'REGISTRATION_NOT_STARTED';
        }

        if (isOwnCreatedTourney && regSettings?.registrationStartDate && regSettings?.registrationEndDate) {
            const now = new Date();
            const regStart = new Date(regSettings.registrationStartDate);
            const regEnd = new Date(regSettings.registrationEndDate);
            if (!Number.isNaN(regStart.getTime()) && now < regStart) {
                return 'REGISTRATION_NOT_STARTED';
            }
            if (!Number.isNaN(regEnd.getTime()) && now > regEnd) {
                return 'REGISTRATION_CLOSED';
            }
        }

        return 'OPEN_REGISTRATION';
    }

    // =========================================================================
    // 3. RENDER HỘP BÊN TRÁI (PUBLIC TOURNAMENT SIDEBAR)
    // =========================================================================
    const tvSidebarBanner = document.getElementById('tvSidebarBanner');
    const tvSidebarAvatarImg = document.getElementById('tvSidebarAvatarImg');
    const tvSidebarAvatarFallback = document.getElementById('tvSidebarAvatarFallback');
    const tvSidebarTourneyName = document.getElementById('tvSidebarTourneyName');
    const tvSidebarDateRange = document.getElementById('tvSidebarDateRange');
    const tvSidebarLocation = document.getElementById('tvSidebarLocation');
    const tvSidebarGameInfoList = document.getElementById('tvSidebarGameInfoList');
    const tvRegisterNowBtn = document.getElementById('tvRegisterNowBtn');

    if (tvSidebarTourneyName) tvSidebarTourneyName.textContent = tourneyName;
    if (tvSidebarBanner && bannerImg) {
        tvSidebarBanner.style.backgroundImage = `url(${bannerImg})`;
    }

    if (tvSidebarAvatarImg && tvSidebarAvatarFallback) {
        if (profileImg) {
            tvSidebarAvatarImg.src = profileImg;
            tvSidebarAvatarImg.style.display = 'block';
            tvSidebarAvatarFallback.style.display = 'none';
        } else {
            tvSidebarAvatarFallback.textContent = tourneyName.trim().charAt(0).toUpperCase() || 'G';
        }
    }

    if (tvSidebarDateRange) {
        tvSidebarDateRange.textContent = formatShortDateRange(startDate, endDate);
    }

    if (tvSidebarLocation) {
        tvSidebarLocation.textContent = venueAddress || 'Hà Nội, Việt Nam';
    }

    if (tvSidebarGameInfoList) {
        const eventDateText = formatFullSingleDate(startDate);
        const gameTitleLine = `[${selectedStage}] ${selectedGame} (${selectedFormat})`;
        tvSidebarGameInfoList.innerHTML = `
            <div class="tv-game-item" id="tvSidebarGameCard">
                <div class="tv-game-title">${escapeHtml(gameTitleLine)}</div>
                <div class="tv-game-sub">
                    <span class="tv-blue-dot"></span>
                    <span>${escapeHtml(eventDateText)}</span>
                </div>
            </div>
        `;

        const gameCard = document.getElementById('tvSidebarGameCard');
        if (gameCard) {
            gameCard.addEventListener('click', () => {
                const gameWidgetEl = document.querySelector('.th-game-card');
                if (gameWidgetEl) {
                    gameWidgetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }
    }

    function updateActionButtonState() {
        if (!tvRegisterNowBtn) return;

        tvRegisterNowBtn.className = 'tv-register-btn';
        tvRegisterNowBtn.disabled = false;
        tvRegisterNowBtn.onclick = null;

        const currentStatus = resolveTournamentStatus();
        const isOrganizer = isUserOrganizerOf(tourneyName);
        const isRegisteredPlayer = isUserRegisteredFor(tourneyName);

        // 1. Giải đấu đã hoàn thành hoặc đang diễn ra
        if (currentStatus === 'COMPLETED') {
            tvRegisterNowBtn.classList.add('is-status-completed');
            tvRegisterNowBtn.disabled = true;
            tvRegisterNowBtn.textContent = 'Đã kết thúc';
            return;
        }

        if (currentStatus === 'IN_PROGRESS') {
            tvRegisterNowBtn.classList.add('is-status-ongoing');
            tvRegisterNowBtn.disabled = true;
            tvRegisterNowBtn.textContent = 'Đang diễn ra';
            return;
        }

        // 2. Nếu người dùng đã thuộc giải đấu (Ban tổ chức hoặc Tuyển thủ đã đăng ký)
        if (isOrganizer) {
            tvRegisterNowBtn.classList.add('is-organizer');
            tvRegisterNowBtn.textContent = 'Quản lý giải đấu';
            tvRegisterNowBtn.onclick = () => {
                window.location.href = '/tournament/details';
            };
            return;
        }

        if (isRegisteredPlayer) {
            tvRegisterNowBtn.classList.add('is-registered');
            tvRegisterNowBtn.disabled = true;
            tvRegisterNowBtn.textContent = '✓ Đã đăng ký';
            return;
        }

        // 3. Người dùng chưa thuộc giải đấu nhưng giải đấu ngoài thời gian đăng ký
        if (currentStatus === 'REGISTRATION_CLOSED') {
            tvRegisterNowBtn.classList.add('is-status-closed');
            tvRegisterNowBtn.disabled = true;
            tvRegisterNowBtn.textContent = 'Đã đóng đăng ký';
            return;
        }

        if (currentStatus === 'REGISTRATION_NOT_STARTED') {
            tvRegisterNowBtn.classList.add('is-status-upcoming');
            tvRegisterNowBtn.disabled = true;
            tvRegisterNowBtn.textContent = 'Chưa mở đăng ký';
            return;
        }

        // 4. Người dùng CHƯA thuộc giải đấu VÀ giải đấu ĐANG mở đăng ký
        tvRegisterNowBtn.textContent = 'Đăng ký tham gia';
        tvRegisterNowBtn.onclick = () => {
            try {
                const rawList = sessionStorage.getItem('btp_registered_tournaments');
                const regList = rawList ? JSON.parse(rawList) : [];
                const exists = regList.some(item => (item.name || '').trim().toLowerCase() === tourneyName.trim().toLowerCase());
                if (!exists) {
                    regList.unshift({
                        name: tourneyName,
                        dateLabel: `Sắp diễn ra • ${formatShortDateRange(startDate, endDate)}`,
                        startDate,
                        endDate,
                        game: selectedGame,
                        location: venueAddress || 'Hà Nội, Việt Nam',
                        attendees: (selectedView?.attendees || 64) + 1,
                        role: 'Tuyển thủ',
                        image: profileImg || GAME_IMAGES[selectedGame] || '/images/game1.png'
                    });
                    sessionStorage.setItem('btp_registered_tournaments', JSON.stringify(regList));
                }
            } catch {
                // ignore storage errors
            }
            updateActionButtonState();
            showToast(`Đã đăng ký tham gia giải đấu "${tourneyName}" thành công!`, 'success');
        };
    }

    updateActionButtonState();

    // =========================================================================
    // 4. RENDER PHẦN BÊN PHẢI (ĐỒNG BỘ 100% VỚI TRANG CHỦ CỦA GIẢI ĐẤU)
    // =========================================================================
    const homeBannerImg = document.getElementById('homeBannerImg');
    const homeBannerFallback = document.getElementById('homeBannerFallback');
    if (bannerImg && homeBannerImg && homeBannerFallback) {
        homeBannerImg.src = bannerImg;
        homeBannerImg.style.display = 'block';
        homeBannerFallback.style.display = 'none';
    }

    const homeProfileImg = document.getElementById('homeProfileImg');
    const homeProfileFallback = document.getElementById('homeProfileFallback');
    if (homeProfileImg && homeProfileFallback) {
        if (profileImg) {
            homeProfileImg.src = profileImg;
            homeProfileImg.style.display = 'block';
            homeProfileFallback.style.display = 'none';
        } else {
            homeProfileFallback.textContent = tourneyName.trim().charAt(0).toUpperCase() || 'G';
        }
    }

    document.getElementById('homeTourneyName').textContent = tourneyName;
    document.getElementById('homeDateRange').textContent = formatShortDateRange(startDate, endDate);
    document.getElementById('homeVenueText').textContent = venueAddress || 'Chưa cập nhật địa điểm';

    const contactIconSvg = CONTACT_ICONS[contactType] || CONTACT_ICONS.EMAIL;
    document.getElementById('homeMetaContactIcon').innerHTML = contactIconSvg;

    const homeContactLink = document.getElementById('homeContactLink');
    homeContactLink.textContent = contactValue;
    homeContactLink.href = contactType === 'EMAIL' ? `mailto:${contactValue}` : contactValue;

    const STORAGE_KEY_LAYOUT = 'btp_tournament_homepage_layout';
    const DEFAULT_HOMEPAGE_LAYOUT = [
        {
            id: 'sec_overview',
            title: 'Tổng quan',
            layout: '1col',
            columns: [
                [
                    {
                        id: 'wid_overview',
                        type: 'MARKDOWN',
                        title: '',
                        content: 'Chào mừng các đội tuyển và tuyển thủ đến với giải đấu **BTP Tournament**! Mọi thông tin chi tiết về thể thức thi đấu, địa điểm, liên hệ và điều lệ giải đấu đều được cập nhật đầy đủ bên dưới.'
                    }
                ]
            ]
        },
        {
            id: 'sec_game',
            title: 'Thông tin bộ môn',
            layout: '1col',
            columns: [
                [
                    {
                        id: 'wid_game',
                        type: 'GAME_INFO',
                        title: ''
                    }
                ]
            ]
        },
        {
            id: 'sec_loc_contact',
            title: '',
            layout: '1col',
            columns: [
                [
                    {
                        id: 'wid_location',
                        type: 'LOCATION',
                        title: 'Địa điểm'
                    },
                    {
                        id: 'wid_contact',
                        type: 'CONTACT',
                        title: 'Thông tin liên hệ'
                    }
                ]
            ]
        },
        {
            id: 'sec_rules',
            title: 'Điều lệ',
            layout: '1col',
            columns: [
                [
                    {
                        id: 'wid_rules',
                        type: 'RULES',
                        title: ''
                    }
                ]
            ]
        }
    ];

    function loadSavedLayout() {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY_LAYOUT);
            if (!raw) return DEFAULT_HOMEPAGE_LAYOUT;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {
            // fallback
        }
        return DEFAULT_HOMEPAGE_LAYOUT;
    }

    const sectionsContainer = document.getElementById('thSectionsContainer');
    const sections = loadSavedLayout();

    function buildWidgetContentHtml(widget) {
        const displayTitle = localizeTitle(widget.title);
        const headingHtml = displayTitle
            ? `<h3 class="th-widget-title">${escapeHtml(displayTitle)}</h3>`
            : '';

        if (widget.type === 'MARKDOWN') {
            const mdHtml = renderMarkdownToHtml(widget.content || '');
            return `
                ${headingHtml}
                <div class="th-card th-overview-card">
                    ${mdHtml || '<p style="color:#94a3b8;">(Chưa có nội dung)</p>'}
                </div>
            `;
        }

        if (widget.type === 'IMAGE') {
            const imgSrc = (widget.imageUrl || '').trim();
            const caption = (widget.caption || '').trim();
            const linkUrl = (widget.linkUrl || '').trim();

            if (!imgSrc) return '';

            const imgTagHtml = `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(caption || displayTitle || 'Hình ảnh giải đấu')}" class="th-image-widget-img">`;
            const wrappedImgHtml = linkUrl
                ? `<a href="${escapeHtml(linkUrl)}" target="_blank" rel="noopener" class="th-image-widget-link">${imgTagHtml}</a>`
                : imgTagHtml;
            const captionHtml = caption
                ? `<div class="th-image-widget-caption">${escapeHtml(caption)}</div>`
                : '';

            return `
                ${headingHtml}
                <div class="th-card th-image-card">
                    ${wrappedImgHtml}
                    ${captionHtml}
                </div>
            `;
        }

        if (widget.type === 'GAME_INFO') {
            const gamePosterUrl = GAME_IMAGES[selectedGame] || '/images/game1.png';
            return `
                ${headingHtml}
                <div class="th-card th-game-card">
                    <img src="${gamePosterUrl}" alt="${escapeHtml(selectedGame)}" class="th-game-poster">
                    <div class="th-game-details">
                        <div class="th-game-sub">${escapeHtml(selectedFormat)} · ${escapeHtml(selectedGame)}</div>
                        <div class="th-game-time">
                            <span class="th-blue-dot"></span>
                            <span>${escapeHtml(formatFullTimestamp(startDate))}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        if (widget.type === 'LOCATION') {
            if (venueAddress) {
                const mapQuery = (venueLat && venueLon) ? `${venueLat},${venueLon}` : venueAddress;
                const encodedVenue = encodeURIComponent(venueAddress);
                const encodedMapQuery = encodeURIComponent(mapQuery);
                const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedVenue}`;
                const iframeSrc = `https://maps.google.com/maps?q=${encodedMapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

                return `
                    ${headingHtml}
                    <div class="th-card th-location-card">
                        <div class="th-location-left">
                            <div class="th-location-address">${escapeHtml(venueAddress)}</div>
                            <div class="th-location-actions">
                                <a href="${directionsUrl}" target="_blank" rel="noopener" class="th-loc-action-btn">
                                    <svg viewBox="0 0 24 24" fill="currentColor" class="th-loc-icon">
                                        <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z"/>
                                    </svg>
                                    <span>Chỉ đường</span>
                                </a>
                                <button type="button" class="th-loc-action-btn js-copy-location-btn" data-venue="${escapeHtml(venueAddress)}">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="th-loc-icon">
                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                    </svg>
                                    <span>Sao chép liên kết</span>
                                </button>
                            </div>
                        </div>
                        <div class="th-location-map">
                            <iframe src="${iframeSrc}" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                        </div>
                    </div>
                `;
            } else {
                return `
                    ${headingHtml}
                    <div class="th-card th-location-card">
                        <div class="th-location-left">
                            <div class="th-location-address">Chưa cập nhật địa điểm (Vui lòng nhập tại mục Chi tiết)</div>
                        </div>
                        <div class="th-location-map">
                            <iframe src="https://maps.google.com/maps?q=Viet%20Nam&t=&z=5&ie=UTF8&iwloc=&output=embed" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                        </div>
                    </div>
                `;
            }
        }

        if (widget.type === 'CONTACT') {
            const cHref = contactType === 'EMAIL' ? `mailto:${contactValue}` : contactValue;
            const cLabel = contactType === 'EMAIL' ? 'Email' : 'Discord';
            return `
                ${headingHtml}
                <div class="th-card th-contact-card">
                    <a href="${escapeHtml(cHref)}" class="th-contact-item">
                        <div class="th-contact-icon-wrap">${contactIconSvg}</div>
                        <span class="th-contact-label">${cLabel}</span>
                    </a>
                </div>
            `;
        }

        if (widget.type === 'RULES') {
            return `
                ${headingHtml}
                <div class="th-card th-rules-card">
                    <div class="th-rules-body collapsed js-rules-body">
                        ${renderMarkdownToHtml(rulesMarkdown)}
                    </div>
                    <button type="button" class="th-show-more-btn js-rules-toggle-btn">Xem thêm</button>
                </div>
            `;
        }

        return '';
    }

    function renderPublicSections() {
        if (!sectionsContainer) return;

        sectionsContainer.innerHTML = sections.map(sec => {
            const secTitle = localizeTitle(sec.title);
            const viewSectionTitle = secTitle
                ? `<h2 class="th-section-title">${escapeHtml(secTitle)}</h2>`
                : '';

            const columnsHtml = (sec.columns || [[]]).map((colWidgets, colIdx) => {
                const widgetsHtml = colWidgets.map(wid => `
                    <div class="th-widget-wrap" data-widget-id="${wid.id}">
                        ${buildWidgetContentHtml(wid)}
                    </div>
                `).join('');

                return `
                    <div class="th-section-col" data-col-idx="${colIdx}">
                        ${widgetsHtml}
                    </div>
                `;
            }).join('');

            return `
                <section class="th-section" data-section-id="${sec.id}">
                    ${viewSectionTitle}
                    <div class="th-section-grid layout-${sec.layout || '1col'}">
                        ${columnsHtml}
                    </div>
                </section>
            `;
        }).join('');

        bindDynamicPublicEvents();
    }

    function bindDynamicPublicEvents() {
        sectionsContainer.querySelectorAll('.js-copy-location-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const venue = btn.getAttribute('data-venue') || '';
                const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`;
                navigator.clipboard?.writeText(mapUrl);
                showToast('Đã sao chép liên kết địa điểm vào bộ nhớ tạm.');
            });
        });

        sectionsContainer.querySelectorAll('.js-rules-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.th-rules-card');
                const body = card?.querySelector('.js-rules-body');
                if (!body) return;
                const isCollapsed = body.classList.toggle('collapsed');
                btn.textContent = isCollapsed ? 'Xem thêm' : 'Thu gọn';
            });
        });
    }

    renderPublicSections();

    // =========================================================================
    // 5. CÁC HÀM ĐỊNH DẠNG NGÀY THÁNG TIẾNG VIỆT
    // =========================================================================
    function formatShortDateRange(startStr, endStr) {
        const s = new Date(startStr);
        const e = new Date(endStr);
        if (Number.isNaN(s.getTime())) return '15/10 — 16/10/2026';

        const sDay = String(s.getDate()).padStart(2, '0');
        const sMonth = String(s.getMonth() + 1).padStart(2, '0');
        const sYear = s.getFullYear();

        if (Number.isNaN(e.getTime())) {
            return `${sDay}/${sMonth}/${sYear}`;
        }

        const eDay = String(e.getDate()).padStart(2, '0');
        const eMonth = String(e.getMonth() + 1).padStart(2, '0');
        const eYear = e.getFullYear();

        if (sYear === eYear && sMonth === eMonth && sDay === eDay) {
            return `${sDay}/${sMonth}/${sYear}`;
        }
        if (sYear === eYear) {
            return `${sDay}/${sMonth} — ${eDay}/${eMonth}/${sYear}`;
        }
        return `${sDay}/${sMonth}/${sYear} — ${eDay}/${eMonth}/${eYear}`;
    }

    function formatFullSingleDate(dateStr) {
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return 'Ngày 15 tháng 10 năm 2026';
        return `Ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
    }

    function formatFullTimestamp(dateStr) {
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return 'Ngày 15/10/2026 lúc 00:00 ICT';

        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');

        return `Ngày ${day}/${month}/${year} lúc ${hours}:${minutes} ICT`;
    }
});

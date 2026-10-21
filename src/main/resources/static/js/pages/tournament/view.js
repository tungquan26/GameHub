import { CONTACT_ICONS } from '../../common/icons.js';
import { showToast } from '../../common/toast.js';
import { escapeHtml, renderMarkdownToHtml } from '../../common/utils.js';
import { initAppSidebar } from '../../layouts/app-layout.js';

document.addEventListener('DOMContentLoaded', () => {
    initAppSidebar();

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
        'Super Smash Bros': '/images/game2.png'
    };

    const FORMAT_LABELS = {
        'SINGLE_ELIMINATION': 'Single Elimination',
        'DOUBLE_ELIMINATION': 'Double Elimination',
        'ROUND_ROBIN': 'Round Robin',
        'SWISS': 'Swiss'
    };

    const STAGE_LABELS = {
        'SINGLE_STAGE': 'Single Stage',
        'TWO_STAGE': 'Two Stage'
    };

    // 1. Đọc dữ liệu từ sessionStorage
    const rawDetails = sessionStorage.getItem('btp_tournament_data');
    const details = rawDetails ? JSON.parse(rawDetails) : {};

    const profileImg = sessionStorage.getItem('btp_tournament_profile_img') || '';
    const bannerImg = sessionStorage.getItem('btp_tournament_banner_img') || '';

    const rawGameInfo = sessionStorage.getItem('btp_tournament_game_info');
    const gameInfo = rawGameInfo ? JSON.parse(rawGameInfo) : {};

    const defaultRulesMarkdown = `# Game Tournament Management System — System Modules\n## 1. Module Authentication & User Management\n**Công dụng**\n- Quản lý tài khoản người dùng và phân quyền ban tổ chức.\n- Đảm bảo mọi thành viên tham gia tuân thủ đúng quy định chung của giải đấu.\n- Nghiêm cấm sử dụng phần mềm thứ 3 can thiệp vào trò chơi.`;
    const rulesMarkdown = sessionStorage.getItem('btp_tournament_rules') || defaultRulesMarkdown;

    const tourneyName = details.name || 'Nguyễn Quân';
    const startDate = details.startDate || '2026-10-15T00:00';
    const endDate = details.endDate || '2026-10-16T23:59';
    const venueAddress = (details.venueAddress || '').trim();
    const venueLat = details.venueLat || null;
    const venueLon = details.venueLon || null;
    const contactType = (details.contactType === 'DISCORD' || details.contactType === 'Discord') ? 'DISCORD' : 'EMAIL';
    const contactValue = details.contact || 'quannguyen041026@gmail.com';

    const selectedGame = gameInfo.game || 'Liên Minh Huyền Thoại';
    const selectedFormat = FORMAT_LABELS[gameInfo.format] || 'Single Elimination';
    const selectedStage = STAGE_LABELS[gameInfo.stageType] || 'Single Stage';

    // =========================================================================
    // 2. RENDER HỘP BÊN TRÁI (PUBLIC TOURNAMENT SIDEBAR)
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
            tvSidebarAvatarFallback.textContent = tourneyName.trim().charAt(0).toUpperCase() || 'T';
        }
    }

    if (tvSidebarDateRange) {
        tvSidebarDateRange.textContent = formatShortDateRange(startDate, endDate);
    }

    if (tvSidebarLocation) {
        tvSidebarLocation.textContent = venueAddress || 'Hà Nội, Việt Nam';
    }

    // Hiển thị thông tin trò chơi từ Game Info theo đúng định dạng ảnh mẫu (không có chữ EVENTS)
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

    if (tvRegisterNowBtn) {
        tvRegisterNowBtn.addEventListener('click', () => {
            try {
                const rawList = sessionStorage.getItem('btp_registered_tournaments');
                const regList = rawList ? JSON.parse(rawList) : [];
                const exists = regList.some(item => item.name === tourneyName);
                if (!exists) {
                    regList.unshift({
                        name: tourneyName,
                        dateLabel: `Upcoming • ${formatShortDateRange(startDate, endDate)}`,
                        game: selectedGame,
                        location: venueAddress || 'Hà Nội, Việt Nam',
                        attendees: 64,
                        role: 'Player',
                        image: profileImg || GAME_IMAGES[selectedGame] || '/images/game1.png'
                    });
                    sessionStorage.setItem('btp_registered_tournaments', JSON.stringify(regList));
                }
            } catch {
                // ignore storage errors
            }
            showToast(`Đã gửi yêu cầu đăng ký tham gia giải đấu "${tourneyName}"!`, 'success');
        });
    }

    // =========================================================================
    // 3. RENDER PHẦN BÊN PHẢI (NỘI DUNG TRANG HOME CỦA TOURNAMENT)
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
            homeProfileFallback.textContent = tourneyName.trim().charAt(0).toUpperCase() || 'T';
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

    // Render các Section & Widget từ btp_tournament_homepage_layout
    const STORAGE_KEY_LAYOUT = 'btp_tournament_homepage_layout';
    const DEFAULT_HOMEPAGE_LAYOUT = [
        {
            id: 'sec_overview',
            title: 'Overview',
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
            title: 'Game Info',
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
                        title: 'Location'
                    },
                    {
                        id: 'wid_contact',
                        type: 'CONTACT',
                        title: 'Contact Info'
                    }
                ]
            ]
        },
        {
            id: 'sec_rules',
            title: 'Rules',
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

    function renderPublicSections() {
        if (!sectionsContainer) return;
        sectionsContainer.innerHTML = '';

        sections.forEach(sec => {
            const secEl = document.createElement('section');
            secEl.className = 'th-section-block';

            const titleHtml = sec.title
                ? `<h2 class="th-section-heading">${escapeHtml(sec.title)}</h2>`
                : '';

            const gridClass = `th-columns-grid layout-${sec.layout || '1col'}`;
            let colsHtml = '';

            (sec.columns || [[]]).forEach(colWidgets => {
                const widgetsInner = colWidgets
                    .map(w => renderWidgetCard(w))
                    .join('');
                colsHtml += `<div class="th-column-slot">${widgetsInner}</div>`;
            });

            secEl.innerHTML = `
                ${titleHtml}
                <div class="${gridClass}">
                    ${colsHtml}
                </div>
            `;

            sectionsContainer.appendChild(secEl);
        });

        bindRulesShowMoreEvents();
    }

    function renderWidgetCard(widget) {
        const innerBody = renderWidgetInnerContent(widget);
        return `
            <div class="th-widget-card">
                ${innerBody}
            </div>
        `;
    }

    function renderWidgetInnerContent(widget) {
        switch (widget.type) {
            case 'MARKDOWN': {
                const heading = widget.title
                    ? `<h3 class="th-widget-subheading">${escapeHtml(widget.title)}</h3>`
                    : '';
                const mdHtml = renderMarkdownToHtml(widget.content || '');
                return `
                    <div class="th-widget-inner th-markdown-widget">
                        ${heading}
                        <div class="th-rules-markdown">${mdHtml}</div>
                    </div>
                `;
            }

            case 'IMAGE': {
                const heading = widget.title
                    ? `<h3 class="th-widget-subheading">${escapeHtml(widget.title)}</h3>`
                    : '';
                const imgUrl = (widget.imageUrl || '').trim();
                const caption = (widget.caption || '').trim();
                const linkUrl = (widget.linkUrl || '').trim();

                if (!imgUrl) return '';

                const imgElement = `<img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(caption || widget.title || 'Tournament Image')}" class="th-widget-image-el">`;
                const wrappedImg = linkUrl
                    ? `<a href="${escapeHtml(linkUrl)}" target="_blank" rel="noopener noreferrer" class="th-widget-image-link">${imgElement}</a>`
                    : `<div class="th-widget-image-frame">${imgElement}</div>`;
                const captionHtml = caption
                    ? `<p class="th-widget-image-caption">${escapeHtml(caption)}</p>`
                    : '';

                return `
                    <div class="th-widget-inner th-image-widget">
                        ${heading}
                        ${wrappedImg}
                        ${captionHtml}
                    </div>
                `;
            }

            case 'GAME_INFO': {
                const subHeading = widget.title
                    ? `<h3 class="th-widget-subheading">${escapeHtml(widget.title)}</h3>`
                    : '';
                const gameCover = GAME_IMAGES[selectedGame] || '/images/game1.png';
                const fullStartText = formatFullDateTime(startDate);
                return `
                    <div class="th-widget-inner">
                        ${subHeading}
                        <div class="th-game-card">
                            <div class="th-game-info-col">
                                <h3 class="th-event-name">${escapeHtml(selectedGame)}</h3>
                                <div class="th-event-time">${escapeHtml(fullStartText)}</div>
                                <div class="th-event-meta">
                                    <span>${escapeHtml(selectedGame)}</span>
                                    <span class="th-dot">&middot;</span>
                                    <span>${escapeHtml(selectedFormat)}</span>
                                </div>
                            </div>
                            <div class="th-game-cover-col">
                                <img src="${escapeHtml(gameCover)}" alt="${escapeHtml(selectedGame)}" class="th-game-cover-img">
                            </div>
                        </div>
                    </div>
                `;
            }

            case 'LOCATION': {
                const headingText = widget.title !== undefined ? widget.title : 'Location';
                const headingHtml = headingText
                    ? `<h3 class="th-widget-subheading">${escapeHtml(headingText)}</h3>`
                    : '';

                let mapSrc = 'https://maps.google.com/maps?q=Vietnam&t=&z=6&ie=UTF8&iwloc=&output=embed';
                let directionsUrl = 'https://www.google.com/maps';

                if (venueLat && venueLon) {
                    mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(venueLat + ',' + venueLon)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
                    directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueLat + ',' + venueLon)}`;
                } else if (venueAddress) {
                    mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(venueAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
                    directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueAddress)}`;
                }

                return `
                    <div class="th-widget-inner">
                        ${headingHtml}
                        <div class="th-location-card">
                            <div class="th-location-top">
                                <div class="th-location-text">
                                    <strong>Venue Address</strong>
                                    <p>${escapeHtml(venueAddress || 'Chưa cập nhật địa chỉ chi tiết trong mục Details.')}</p>
                                </div>
                                <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="th-directions-btn" title="Mở Google Maps chỉ đường">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M21.71 11.29l-9-9a.996.996 0 00-1.41 0l-9 9a.996.996 0 000 1.41l9 9c.39.39 1.02.39 1.41 0l9-9a.996.996 0 000-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z"/>
                                    </svg>
                                </a>
                            </div>
                            <div class="th-map-frame-wrap">
                                <iframe class="th-map-iframe" src="${mapSrc}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
                            </div>
                        </div>
                    </div>
                `;
            }

            case 'CONTACT': {
                const headingText = widget.title !== undefined ? widget.title : 'Contact Info';
                const headingHtml = headingText
                    ? `<h3 class="th-widget-subheading">${escapeHtml(headingText)}</h3>`
                    : '';
                const hrefVal = contactType === 'EMAIL' ? `mailto:${contactValue}` : contactValue;
                return `
                    <div class="th-widget-inner">
                        ${headingHtml}
                        <div class="th-contact-card">
                            <span class="th-contact-icon">${contactIconSvg}</span>
                            <a href="${escapeHtml(hrefVal)}" class="th-contact-link">${escapeHtml(contactValue)}</a>
                        </div>
                    </div>
                `;
            }

            case 'RULES': {
                const subHeading = widget.title
                    ? `<h3 class="th-widget-subheading">${escapeHtml(widget.title)}</h3>`
                    : '';
                const rulesHtml = renderMarkdownToHtml(rulesMarkdown);
                return `
                    <div class="th-widget-inner">
                        ${subHeading}
                        <div class="th-rules-card">
                            <div class="th-rules-body is-collapsed" data-rules-body>
                                <div class="th-rules-markdown">${rulesHtml}</div>
                                <div class="th-rules-fade" data-rules-fade></div>
                            </div>
                            <button type="button" class="th-show-more-btn" data-rules-toggle>Show more</button>
                        </div>
                    </div>
                `;
            }

            default:
                return '';
        }
    }

    function bindRulesShowMoreEvents() {
        const toggles = sectionsContainer.querySelectorAll('[data-rules-toggle]');
        toggles.forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.th-rules-card');
                if (!card) return;
                const body = card.querySelector('[data-rules-body]');
                const fade = card.querySelector('[data-rules-fade]');
                const isCollapsed = body.classList.contains('is-collapsed');
                if (isCollapsed) {
                    body.classList.remove('is-collapsed');
                    if (fade) fade.style.display = 'none';
                    btn.textContent = 'Show less';
                } else {
                    body.classList.add('is-collapsed');
                    if (fade) fade.style.display = 'block';
                    btn.textContent = 'Show more';
                }
            });
        });
    }

    renderPublicSections();

    // =========================================================================
    // 4. CÁC HÀM ĐỊNH DẠNG NGÀY THÁNG CHUẨN START.GG
    // =========================================================================
    function getOrdinalSuffix(day) {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }

    function formatShortDateRange(startStr, endStr) {
        const s = new Date(startStr);
        const e = new Date(endStr);
        if (Number.isNaN(s.getTime())) return 'Oct 15th — 16th, 2026';

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const sMonth = months[s.getMonth()];
        const sDay = `${s.getDate()}${getOrdinalSuffix(s.getDate())}`;
        const sYear = s.getFullYear();

        if (Number.isNaN(e.getTime())) {
            return `${sMonth} ${sDay}, ${sYear}`;
        }

        const eMonth = months[e.getMonth()];
        const eDay = `${e.getDate()}${getOrdinalSuffix(e.getDate())}`;
        const eYear = e.getFullYear();

        if (sYear === eYear && s.getMonth() === e.getMonth()) {
            if (s.getDate() === e.getDate()) {
                return `${sMonth} ${sDay}, ${sYear}`;
            }
            return `${sMonth} ${sDay} — ${eDay}, ${sYear}`;
        }
        return `${sMonth} ${sDay}, ${sYear} — ${eMonth} ${eDay}, ${eYear}`;
    }

    function formatFullSingleDate(dateStr) {
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return 'October 15th 2026';
        const fullMonths = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const m = fullMonths[d.getMonth()];
        const day = `${d.getDate()}${getOrdinalSuffix(d.getDate())}`;
        const yr = d.getFullYear();
        return `${m} ${day} ${yr}`;
    }

    function formatFullDateTime(dateStr) {
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return 'October 15, 2026 at 12:00 AM GMT+7';
        return d.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        }) + ' GMT+7';
    }
});

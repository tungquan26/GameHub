import { CONTACT_ICONS } from '../../common/icons.js';
import { showToast } from '../../common/toast.js';
import { renderMarkdownToHtml, syncActiveTournamentToList } from '../../common/utils.js';
import { syncSidebarIdentity } from '../../layouts/tournament-layout.js';

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
        'Super Smash Bros': '/images/game2.png'
    };

    const FORMAT_LABELS = {
        'SINGLE_ELIMINATION': 'Loại trực tiếp',
        'DOUBLE_ELIMINATION': 'Nhánh thắng - Nhánh thua',
        'ROUND_ROBIN': 'Vòng tròn tính điểm',
        'SWISS': 'Thể thức Thụy Sĩ'
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

    // 1. Đọc dữ liệu từ sessionStorage
    const rawDetails = sessionStorage.getItem('btp_tournament_data');
    const details = rawDetails ? JSON.parse(rawDetails) : {};

    const profileImg = sessionStorage.getItem('btp_tournament_profile_img') || '';
    const bannerImg = sessionStorage.getItem('btp_tournament_banner_img') || '';

    const rawGameInfo = sessionStorage.getItem('btp_tournament_game_info');
    const gameInfo = rawGameInfo ? JSON.parse(rawGameInfo) : {};

    const defaultRulesMarkdown = `# Hệ thống quản lý giải đấu — Quy định chung\n## 1. Quy định tài khoản & Đội tuyển tham gia\n**Nội dung chính**\n- Quản lý tài khoản người dùng và phân quyền ban tổ chức.\n- Đảm bảo mọi thành viên tham gia tuân thủ đúng quy định chung của giải đấu.\n- Nghiêm cấm sử dụng phần mềm thứ 3 can thiệp vào trò chơi.`;
    const rulesMarkdown = sessionStorage.getItem('btp_tournament_rules') || defaultRulesMarkdown;

    const tourneyName = details.name || 'Giải đấu mới';
    const startDate = details.startDate || '2026-10-15T00:00';
    const endDate = details.endDate || '2026-10-16T23:59';
    const venueAddress = (details.venueAddress || '').trim();
    const venueLat = details.venueLat || null;
    const venueLon = details.venueLon || null;
    const contactType = (details.contactType === 'DISCORD' || details.contactType === 'Discord') ? 'DISCORD' : 'EMAIL';
    const contactValue = details.contact || 'quannguyen041026@gmail.com';

    const selectedGame = gameInfo.game || 'Liên Minh Huyền Thoại';
    const selectedFormat = FORMAT_LABELS[gameInfo.format] || 'Loại trực tiếp';

    syncSidebarIdentity(tourneyName, profileImg, bannerImg);

    // 2. Render Ảnh bìa (Banner) & Ảnh đại diện (Profile)
    const homeBannerImg = document.getElementById('homeBannerImg');
    const homeBannerFallback = document.getElementById('homeBannerFallback');
    if (bannerImg) {
        homeBannerImg.src = bannerImg;
        homeBannerImg.style.display = 'block';
        homeBannerFallback.style.display = 'none';
    }

    const homeProfileImg = document.getElementById('homeProfileImg');
    const homeProfileFallback = document.getElementById('homeProfileFallback');
    if (profileImg) {
        homeProfileImg.src = profileImg;
        homeProfileImg.style.display = 'block';
        homeProfileFallback.style.display = 'none';
    } else {
        homeProfileFallback.textContent = tourneyName.trim().charAt(0).toUpperCase() || 'G';
    }

    // 3. Render Thông tin Header
    document.getElementById('homeTourneyName').textContent = tourneyName;
    document.getElementById('homeDateRange').textContent = formatShortDateRange(startDate, endDate);
    document.getElementById('homeVenueText').textContent = venueAddress || 'Chưa cập nhật địa điểm';

    const contactIconSvg = CONTACT_ICONS[contactType] || CONTACT_ICONS.EMAIL;
    document.getElementById('homeMetaContactIcon').innerHTML = contactIconSvg;

    const homeContactLink = document.getElementById('homeContactLink');
    homeContactLink.textContent = contactValue;
    homeContactLink.href = contactType === 'EMAIL' ? `mailto:${contactValue}` : contactValue;

    // 4. HỆ THỐNG CHỈNH SỬA TRANG CHỦ (SECTIONS, COLUMN LAYOUTS & WIDGETS)
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

    const WIDGET_META = {
        MARKDOWN: { label: 'Văn bản / Markdown', configUrl: null },
        IMAGE: { label: 'Hình ảnh', configUrl: null },
        GAME_INFO: { label: 'Thông tin bộ môn', configUrl: '/tournament/game-info' },
        LOCATION: { label: 'Địa điểm', configUrl: '/tournament/details' },
        CONTACT: { label: 'Thông tin liên hệ', configUrl: '/tournament/details' },
        RULES: { label: 'Điều lệ', configUrl: '/tournament/details#rulesCard' }
    };

    function cloneLayout(data) {
        return JSON.parse(JSON.stringify(data));
    }

    function loadSavedLayout() {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY_LAYOUT);
            if (!raw) return cloneLayout(DEFAULT_HOMEPAGE_LAYOUT);
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
            console.warn('Failed to parse saved homepage layout:', e);
        }
        return cloneLayout(DEFAULT_HOMEPAGE_LAYOUT);
    }

    let savedSections = loadSavedLayout();
    let workingSections = cloneLayout(savedSections);
    let isEditingPage = false;

    const pageWrapper = document.querySelector('.th-page-wrapper');
    const sectionsContainer = document.getElementById('thSectionsContainer');
    const bottomAddSectionWrap = document.getElementById('bottomAddSectionWrap');
    const bottomAddSectionBtn = document.getElementById('bottomAddSectionBtn');

    const floatingBox = document.getElementById('floatingHomepageBox');
    const floatingToggleCollapseBtn = document.getElementById('floatingToggleCollapseBtn');
    const floatingBoxTitle = document.getElementById('floatingBoxTitle');
    const floatingStatsText = document.getElementById('floatingStatsText');
    const floatingViewActions = document.getElementById('floatingViewActions');
    const floatingEditActions = document.getElementById('floatingEditActions');
    const startEditPageBtn = document.getElementById('startEditPageBtn');
    const floatingAddSectionBtn = document.getElementById('floatingAddSectionBtn');
    const floatingResetLayoutBtn = document.getElementById('floatingResetLayoutBtn');
    const cancelEditPageBtn = document.getElementById('cancelEditPageBtn');
    const saveEditPageBtn = document.getElementById('saveEditPageBtn');

    const widgetPickerModal = document.getElementById('widgetPickerModal');
    const closeWidgetPickerBtn = document.getElementById('closeWidgetPickerBtn');
    const widgetPickerGrid = document.getElementById('widgetPickerGrid');
    let pendingTargetLocation = null;

    const markdownWidgetModal = document.getElementById('markdownWidgetModal');
    const closeMarkdownModalBtn = document.getElementById('closeMarkdownModalBtn');
    const cancelMarkdownModalBtn = document.getElementById('cancelMarkdownModalBtn');
    const saveMarkdownModalBtn = document.getElementById('saveMarkdownModalBtn');
    const mdWidgetTitleInput = document.getElementById('mdWidgetTitleInput');
    const mdWidgetContentInput = document.getElementById('mdWidgetContentInput');
    let editingMarkdownTarget = null;

    const imageWidgetModal = document.getElementById('imageWidgetModal');
    const closeImageModalBtn = document.getElementById('closeImageModalBtn');
    const cancelImageModalBtn = document.getElementById('cancelImageModalBtn');
    const saveImageModalBtn = document.getElementById('saveImageModalBtn');
    const imgWidgetTitleInput = document.getElementById('imgWidgetTitleInput');
    const imgWidgetFileInput = document.getElementById('imgWidgetFileInput');
    const selectImgWidgetFileBtn = document.getElementById('selectImgWidgetFileBtn');
    const imgWidgetEmptyState = document.getElementById('imgWidgetEmptyState');
    const imgWidgetPreviewState = document.getElementById('imgWidgetPreviewState');
    const imgWidgetPreviewTag = document.getElementById('imgWidgetPreviewTag');
    const removeImgWidgetFileBtn = document.getElementById('removeImgWidgetFileBtn');
    const imgWidgetUrlInput = document.getElementById('imgWidgetUrlInput');
    const imgWidgetCaptionInput = document.getElementById('imgWidgetCaptionInput');
    const imgWidgetLinkInput = document.getElementById('imgWidgetLinkInput');
    const imgWidgetErrorMsg = document.getElementById('imgWidgetErrorMsg');
    let editingImageTarget = null;
    let currentImageWidgetDataUrl = '';

    function updateFloatingStats(sectionsList) {
        const secCount = sectionsList.length;
        let widCount = 0;
        sectionsList.forEach(sec => {
            (sec.columns || []).forEach(col => {
                widCount += col.length;
            });
        });
        floatingStatsText.textContent = `${secCount} khu vực · ${widCount} tiện ích`;
    }

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
                    ${mdHtml || '<p style="color:#94a3b8;">(Tiện ích văn bản trống — nhấn Sửa nội dung để thêm chữ)</p>'}
                </div>
            `;
        }

        if (widget.type === 'IMAGE') {
            const imgSrc = (widget.imageUrl || '').trim();
            const caption = (widget.caption || '').trim();
            const linkUrl = (widget.linkUrl || '').trim();

            if (!imgSrc) {
                return `
                    ${headingHtml}
                    <div class="th-card th-image-card">
                        <div class="th-image-widget-empty">
                            Chưa có ảnh — Nhấn <strong>Sửa hình ảnh</strong> trên thanh công cụ để tải ảnh lên hoặc dán URL ảnh.
                        </div>
                    </div>
                `;
            }

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
                    <img src="${gamePosterUrl}" alt="Ảnh bộ môn" class="th-game-poster">
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

    function normalizeSectionColumns(section) {
        const isTwoCol = section.layout !== '1col';
        if (!Array.isArray(section.columns) || section.columns.length === 0) {
            section.columns = [[]];
        }
        if (isTwoCol && section.columns.length < 2) {
            section.columns.push([]);
        } else if (!isTwoCol && section.columns.length > 1) {
            const merged = [...section.columns[0], ...section.columns.slice(1).flat()];
            section.columns = [merged];
        }
    }

    function renderHomepageSections() {
        const activeList = isEditingPage ? workingSections : savedSections;
        pageWrapper.classList.toggle('is-editing', isEditingPage);
        bottomAddSectionWrap.style.display = isEditingPage ? 'block' : 'none';
        updateFloatingStats(activeList);

        sectionsContainer.innerHTML = activeList.map((sec, secIdx) => {
            normalizeSectionColumns(sec);
            const isTwoCol = sec.layout !== '1col';
            const displaySecTitle = localizeTitle(sec.title);

            const sectionEditorHeader = isEditingPage ? `
                <div class="th-section-editor-bar">
                    <div class="th-sec-title-edit">
                        <span class="th-sec-badge">Khu vực ${secIdx + 1}</span>
                        <input type="text"
                               class="th-sec-title-input js-sec-title-input"
                               data-sec-idx="${secIdx}"
                               value="${escapeHtml(displaySecTitle)}"
                               placeholder="Tiêu đề khu vực (không bắt buộc)...">
                    </div>

                    <div class="th-sec-controls">
                        <div class="th-layout-picker" title="Chọn bố cục cột cho khu vực">
                            <span class="th-layout-label">Bố cục:</span>
                            <button type="button" class="th-layout-btn js-layout-btn ${sec.layout === '1col' ? 'active' : ''}" data-sec-idx="${secIdx}" data-layout="1col" title="1 Cột (100%)">
                                <span class="th-layout-icon"><span style="width:100%"></span></span>
                                <span>100%</span>
                            </button>
                            <button type="button" class="th-layout-btn js-layout-btn ${sec.layout === '2col-50-50' ? 'active' : ''}" data-sec-idx="${secIdx}" data-layout="2col-50-50" title="2 Cột (50% / 50%)">
                                <span class="th-layout-icon"><span style="width:50%"></span><span style="width:50%"></span></span>
                                <span>50/50</span>
                            </button>
                            <button type="button" class="th-layout-btn js-layout-btn ${sec.layout === '2col-66-33' ? 'active' : ''}" data-sec-idx="${secIdx}" data-layout="2col-66-33" title="2 Cột (66% / 33%)">
                                <span class="th-layout-icon"><span style="width:66%"></span><span style="width:34%"></span></span>
                                <span>66/33</span>
                            </button>
                            <button type="button" class="th-layout-btn js-layout-btn ${sec.layout === '2col-33-66' ? 'active' : ''}" data-sec-idx="${secIdx}" data-layout="2col-33-66" title="2 Cột (33% / 66%)">
                                <span class="th-layout-icon"><span style="width:34%"></span><span style="width:66%"></span></span>
                                <span>33/66</span>
                            </button>
                        </div>

                        <div class="th-sec-actions">
                            <button type="button" class="th-icon-btn js-move-sec-up" data-sec-idx="${secIdx}" ${secIdx === 0 ? 'disabled' : ''} title="Di chuyển khu vực lên">
                                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clip-rule="evenodd"/></svg>
                            </button>
                            <button type="button" class="th-icon-btn js-move-sec-down" data-sec-idx="${secIdx}" ${secIdx === activeList.length - 1 ? 'disabled' : ''} title="Di chuyển khu vực xuống">
                                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clip-rule="evenodd"/></svg>
                            </button>
                            <button type="button" class="th-icon-btn danger js-delete-sec" data-sec-idx="${secIdx}" title="Xóa khu vực">
                                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            ` : '';

            const viewSectionTitle = (!isEditingPage && displaySecTitle)
                ? `<h2 class="th-section-title">${escapeHtml(displaySecTitle)}</h2>`
                : '';

            const columnsHtml = sec.columns.map((colWidgets, colIdx) => {
                const widgetsHtml = colWidgets.map((wid, widIdx) => {
                    const meta = WIDGET_META[wid.type] || { label: wid.type, configUrl: null };
                    let editActionBtn = '';
                    if (wid.type === 'MARKDOWN') {
                        editActionBtn = `<button type="button" class="th-widget-edit-btn js-edit-markdown-wid" data-sec-idx="${secIdx}" data-col-idx="${colIdx}" data-wid-idx="${widIdx}">Sửa nội dung</button>`;
                    } else if (wid.type === 'IMAGE') {
                        editActionBtn = `<button type="button" class="th-widget-edit-btn js-edit-image-wid" data-sec-idx="${secIdx}" data-col-idx="${colIdx}" data-wid-idx="${widIdx}">Sửa hình ảnh</button>`;
                    } else {
                        editActionBtn = `<a href="${meta.configUrl}" class="th-widget-edit-btn">Thiết lập</a>`;
                    }

                    const switchColBtn = isTwoCol ? `
                        <button type="button" class="th-icon-btn js-switch-wid-col" data-sec-idx="${secIdx}" data-col-idx="${colIdx}" data-wid-idx="${widIdx}" title="Chuyển sang cột bên cạnh">
                            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M13.2 2.24a.75.75 0 00.04 1.06l2.1 1.95H6.75a.75.75 0 000 1.5h8.59l-2.1 1.95a.75.75 0 101.02 1.1l3.5-3.25a.75.75 0 000-1.1l-3.5-3.25a.75.75 0 00-1.06.04zm-6.4 8a.75.75 0 00-1.06-.04l-3.5 3.25a.75.75 0 000 1.1l3.5 3.25a.75.75 0 101.02-1.1l-2.1-1.95h8.59a.75.75 0 000-1.5H4.66l2.1-1.95a.75.75 0 00.04-1.06z" clip-rule="evenodd"/></svg>
                        </button>
                    ` : '';

                    const widgetToolbar = isEditingPage ? `
                        <div class="th-widget-editor-bar">
                            <div class="th-widget-type-tag">
                                <span class="dot"></span>
                                <span>${meta.label}</span>
                            </div>
                            <div class="th-widget-actions">
                                ${editActionBtn}
                                ${switchColBtn}
                                <button type="button" class="th-icon-btn js-move-wid-up" data-sec-idx="${secIdx}" data-col-idx="${colIdx}" data-wid-idx="${widIdx}" ${widIdx === 0 ? 'disabled' : ''} title="Di chuyển tiện ích lên">
                                    <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clip-rule="evenodd"/></svg>
                                </button>
                                <button type="button" class="th-icon-btn js-move-wid-down" data-sec-idx="${secIdx}" data-col-idx="${colIdx}" data-wid-idx="${widIdx}" ${widIdx === colWidgets.length - 1 ? 'disabled' : ''} title="Di chuyển tiện ích xuống">
                                    <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clip-rule="evenodd"/></svg>
                                </button>
                                <button type="button" class="th-icon-btn danger js-delete-wid" data-sec-idx="${secIdx}" data-col-idx="${colIdx}" data-wid-idx="${widIdx}" title="Xóa tiện ích">
                                    <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd"/></svg>
                                </button>
                            </div>
                        </div>
                    ` : '';

                    return `
                        <div class="th-widget-wrap" data-widget-id="${wid.id}">
                            ${widgetToolbar}
                            ${buildWidgetContentHtml(wid)}
                        </div>
                    `;
                }).join('');

                const addWidgetBtnHtml = isEditingPage ? `
                    <button type="button" class="th-add-widget-btn js-open-widget-picker" data-sec-idx="${secIdx}" data-col-idx="${colIdx}">
                        <svg viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/>
                        </svg>
                        <span>Thêm tiện ích</span>
                    </button>
                ` : '';

                return `
                    <div class="th-section-col" data-col-idx="${colIdx}">
                        ${widgetsHtml}
                        ${addWidgetBtnHtml}
                    </div>
                `;
            }).join('');

            return `
                <section class="th-section" data-section-id="${sec.id}">
                    ${sectionEditorHeader}
                    ${viewSectionTitle}
                    <div class="th-section-grid layout-${sec.layout}">
                        ${columnsHtml}
                    </div>
                </section>
            `;
        }).join('');

        bindDynamicSectionEvents();
    }

    function openImageWidgetModal(secIndex, colIndex, widIndex) {
        const widget = workingSections[secIndex]?.columns?.[colIndex]?.[widIndex];
        if (!widget) return;

        editingImageTarget = { secIndex, colIndex, widIndex };
        imgWidgetErrorMsg.style.display = 'none';
        imgWidgetTitleInput.value = localizeTitle(widget.title);
        imgWidgetCaptionInput.value = widget.caption || '';
        imgWidgetLinkInput.value = widget.linkUrl || '';

        const existingImg = widget.imageUrl || '';
        if (existingImg.startsWith('data:image/')) {
            currentImageWidgetDataUrl = existingImg;
            imgWidgetUrlInput.value = '';
            updateImageWidgetModalPreview(existingImg);
        } else {
            currentImageWidgetDataUrl = '';
            imgWidgetUrlInput.value = existingImg;
            updateImageWidgetModalPreview(existingImg);
        }

        imageWidgetModal.style.display = 'flex';
    }

    function updateImageWidgetModalPreview(src) {
        if (src) {
            imgWidgetPreviewTag.src = src;
            imgWidgetEmptyState.style.display = 'none';
            imgWidgetPreviewState.style.display = 'flex';
        } else {
            imgWidgetPreviewTag.src = '';
            imgWidgetPreviewState.style.display = 'none';
            imgWidgetEmptyState.style.display = 'flex';
        }
    }

    function bindDynamicSectionEvents() {
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

        if (!isEditingPage) return;

        sectionsContainer.querySelectorAll('.js-sec-title-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = Number(input.getAttribute('data-sec-idx'));
                if (workingSections[idx]) {
                    workingSections[idx].title = e.target.value;
                }
            });
        });

        sectionsContainer.querySelectorAll('.js-layout-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-sec-idx'));
                const newLayout = btn.getAttribute('data-layout');
                if (workingSections[idx] && newLayout) {
                    workingSections[idx].layout = newLayout;
                    normalizeSectionColumns(workingSections[idx]);
                    renderHomepageSections();
                }
            });
        });

        sectionsContainer.querySelectorAll('.js-move-sec-up').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-sec-idx'));
                if (idx > 0) {
                    const temp = workingSections[idx - 1];
                    workingSections[idx - 1] = workingSections[idx];
                    workingSections[idx] = temp;
                    renderHomepageSections();
                }
            });
        });

        sectionsContainer.querySelectorAll('.js-move-sec-down').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-sec-idx'));
                if (idx < workingSections.length - 1) {
                    const temp = workingSections[idx + 1];
                    workingSections[idx + 1] = workingSections[idx];
                    workingSections[idx] = temp;
                    renderHomepageSections();
                }
            });
        });

        sectionsContainer.querySelectorAll('.js-delete-sec').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-sec-idx'));
                workingSections.splice(idx, 1);
                renderHomepageSections();
            });
        });

        sectionsContainer.querySelectorAll('.js-open-widget-picker').forEach(btn => {
            btn.addEventListener('click', () => {
                const secIndex = Number(btn.getAttribute('data-sec-idx'));
                const colIndex = Number(btn.getAttribute('data-col-idx'));
                pendingTargetLocation = { secIndex, colIndex };
                widgetPickerModal.style.display = 'flex';
            });
        });

        sectionsContainer.querySelectorAll('.js-edit-markdown-wid').forEach(btn => {
            btn.addEventListener('click', () => {
                const secIndex = Number(btn.getAttribute('data-sec-idx'));
                const colIndex = Number(btn.getAttribute('data-col-idx'));
                const widIndex = Number(btn.getAttribute('data-wid-idx'));
                const widget = workingSections[secIndex]?.columns?.[colIndex]?.[widIndex];
                if (!widget) return;

                editingMarkdownTarget = { secIndex, colIndex, widIndex };
                mdWidgetTitleInput.value = localizeTitle(widget.title);
                mdWidgetContentInput.value = widget.content || '';
                markdownWidgetModal.style.display = 'flex';
            });
        });

        sectionsContainer.querySelectorAll('.js-edit-image-wid').forEach(btn => {
            btn.addEventListener('click', () => {
                const secIndex = Number(btn.getAttribute('data-sec-idx'));
                const colIndex = Number(btn.getAttribute('data-col-idx'));
                const widIndex = Number(btn.getAttribute('data-wid-idx'));
                openImageWidgetModal(secIndex, colIndex, widIndex);
            });
        });

        sectionsContainer.querySelectorAll('.js-switch-wid-col').forEach(btn => {
            btn.addEventListener('click', () => {
                const secIndex = Number(btn.getAttribute('data-sec-idx'));
                const colIndex = Number(btn.getAttribute('data-col-idx'));
                const widIndex = Number(btn.getAttribute('data-wid-idx'));
                const sec = workingSections[secIndex];
                if (!sec || sec.columns.length < 2) return;

                const targetCol = colIndex === 0 ? 1 : 0;
                const [movedWidget] = sec.columns[colIndex].splice(widIndex, 1);
                if (movedWidget) {
                    sec.columns[targetCol].push(movedWidget);
                    renderHomepageSections();
                }
            });
        });

        sectionsContainer.querySelectorAll('.js-move-wid-up').forEach(btn => {
            btn.addEventListener('click', () => {
                const secIndex = Number(btn.getAttribute('data-sec-idx'));
                const colIndex = Number(btn.getAttribute('data-col-idx'));
                const widIndex = Number(btn.getAttribute('data-wid-idx'));
                const col = workingSections[secIndex]?.columns?.[colIndex];
                if (col && widIndex > 0) {
                    const temp = col[widIndex - 1];
                    col[widIndex - 1] = col[widIndex];
                    col[widIndex] = temp;
                    renderHomepageSections();
                }
            });
        });

        sectionsContainer.querySelectorAll('.js-move-wid-down').forEach(btn => {
            btn.addEventListener('click', () => {
                const secIndex = Number(btn.getAttribute('data-sec-idx'));
                const colIndex = Number(btn.getAttribute('data-col-idx'));
                const widIndex = Number(btn.getAttribute('data-wid-idx'));
                const col = workingSections[secIndex]?.columns?.[colIndex];
                if (col && widIndex < col.length - 1) {
                    const temp = col[widIndex + 1];
                    col[widIndex + 1] = col[widIndex];
                    col[widIndex] = temp;
                    renderHomepageSections();
                }
            });
        });

        sectionsContainer.querySelectorAll('.js-delete-wid').forEach(btn => {
            btn.addEventListener('click', () => {
                const secIndex = Number(btn.getAttribute('data-sec-idx'));
                const colIndex = Number(btn.getAttribute('data-col-idx'));
                const widIndex = Number(btn.getAttribute('data-wid-idx'));
                workingSections[secIndex]?.columns?.[colIndex]?.splice(widIndex, 1);
                renderHomepageSections();
            });
        });
    }

    function setEditPageMode(editing) {
        isEditingPage = editing;
        floatingBox.classList.remove('is-collapsed');
        floatingBox.classList.toggle('is-editing-mode', editing);
        floatingBoxTitle.textContent = editing ? 'Đang chỉnh sửa trang chủ' : 'Trang chủ';
        floatingViewActions.style.display = editing ? 'none' : 'block';
        floatingEditActions.style.display = editing ? 'flex' : 'none';
        renderHomepageSections();
    }

    startEditPageBtn.addEventListener('click', () => {
        workingSections = cloneLayout(savedSections);
        setEditPageMode(true);
    });

    cancelEditPageBtn.addEventListener('click', () => {
        workingSections = cloneLayout(savedSections);
        setEditPageMode(false);
        showToast('Đã hủy các thay đổi.');
    });

    saveEditPageBtn.addEventListener('click', () => {
        savedSections = cloneLayout(workingSections);
        sessionStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(savedSections));
        syncActiveTournamentToList();
        setEditPageMode(false);
        showToast('Đã lưu bố cục trang chủ thành công.');
    });

    function handleAddNewSection() {
        const newSec = {
            id: 'sec_' + Date.now(),
            title: 'Khu vực mới',
            layout: '1col',
            columns: [[]]
        };
        workingSections.push(newSec);
        renderHomepageSections();
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }

    floatingAddSectionBtn.addEventListener('click', handleAddNewSection);
    bottomAddSectionBtn.addEventListener('click', handleAddNewSection);

    floatingResetLayoutBtn.addEventListener('click', () => {
        workingSections = cloneLayout(DEFAULT_HOMEPAGE_LAYOUT);
        renderHomepageSections();
        showToast('Đã khôi phục bố cục mặc định. Nhấn Lưu để áp dụng.');
    });

    floatingToggleCollapseBtn.addEventListener('click', () => {
        floatingBox.classList.toggle('is-collapsed');
    });

    widgetPickerGrid.querySelectorAll('.th-widget-option').forEach(optBtn => {
        optBtn.addEventListener('click', () => {
            const type = optBtn.getAttribute('data-widget-type');
            if (!pendingTargetLocation || !type) return;

            const { secIndex, colIndex } = pendingTargetLocation;
            const targetCol = workingSections[secIndex]?.columns?.[colIndex];
            if (!targetCol) return;

            const newWidget = {
                id: 'wid_' + Date.now(),
                type,
                title: type === 'MARKDOWN' ? 'Nội dung tùy chỉnh' : '',
                content: type === 'MARKDOWN' ? 'Nhập nội dung thông báo hoặc giới thiệu tại đây...' : '',
                imageUrl: '',
                caption: '',
                linkUrl: ''
            };

            targetCol.push(newWidget);
            widgetPickerModal.style.display = 'none';
            pendingTargetLocation = null;
            renderHomepageSections();

            const newWidIdx = targetCol.length - 1;

            if (type === 'MARKDOWN') {
                editingMarkdownTarget = { secIndex, colIndex, widIndex: newWidIdx };
                mdWidgetTitleInput.value = newWidget.title;
                mdWidgetContentInput.value = newWidget.content;
                markdownWidgetModal.style.display = 'flex';
            } else if (type === 'IMAGE') {
                openImageWidgetModal(secIndex, colIndex, newWidIdx);
            }
        });
    });

    closeWidgetPickerBtn.addEventListener('click', () => {
        widgetPickerModal.style.display = 'none';
        pendingTargetLocation = null;
    });

    widgetPickerModal.addEventListener('click', (e) => {
        if (e.target === widgetPickerModal) {
            widgetPickerModal.style.display = 'none';
            pendingTargetLocation = null;
        }
    });

    function closeMarkdownModal() {
        markdownWidgetModal.style.display = 'none';
        editingMarkdownTarget = null;
    }

    closeMarkdownModalBtn.addEventListener('click', closeMarkdownModal);
    cancelMarkdownModalBtn.addEventListener('click', closeMarkdownModal);

    saveMarkdownModalBtn.addEventListener('click', () => {
        if (!editingMarkdownTarget) return;
        const { secIndex, colIndex, widIndex } = editingMarkdownTarget;
        const widget = workingSections[secIndex]?.columns?.[colIndex]?.[widIndex];
        if (widget) {
            widget.title = mdWidgetTitleInput.value.trim();
            widget.content = mdWidgetContentInput.value;
            renderHomepageSections();
        }
        closeMarkdownModal();
    });

    function closeImageModal() {
        imageWidgetModal.style.display = 'none';
        editingImageTarget = null;
        imgWidgetErrorMsg.style.display = 'none';
    }

    closeImageModalBtn.addEventListener('click', closeImageModal);
    cancelImageModalBtn.addEventListener('click', closeImageModal);

    imageWidgetModal.addEventListener('click', (e) => {
        if (e.target === imageWidgetModal) {
            closeImageModal();
        }
    });

    selectImgWidgetFileBtn.addEventListener('click', () => {
        imgWidgetFileInput.click();
    });

    imgWidgetFileInput.addEventListener('change', (e) => {
        imgWidgetErrorMsg.style.display = 'none';
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSizeBytes = 4 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            imgWidgetErrorMsg.textContent = 'Dung lượng ảnh vượt quá giới hạn tối đa 4MB.';
            imgWidgetErrorMsg.style.display = 'block';
            imgWidgetFileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            currentImageWidgetDataUrl = ev.target.result;
            imgWidgetUrlInput.value = '';
            updateImageWidgetModalPreview(currentImageWidgetDataUrl);
        };
        reader.readAsDataURL(file);
        imgWidgetFileInput.value = '';
    });

    removeImgWidgetFileBtn.addEventListener('click', () => {
        currentImageWidgetDataUrl = '';
        imgWidgetUrlInput.value = '';
        updateImageWidgetModalPreview('');
    });

    imgWidgetUrlInput.addEventListener('input', () => {
        const typedUrl = imgWidgetUrlInput.value.trim();
        if (typedUrl) {
            currentImageWidgetDataUrl = '';
            updateImageWidgetModalPreview(typedUrl);
        } else if (!currentImageWidgetDataUrl) {
            updateImageWidgetModalPreview('');
        }
    });

    saveImageModalBtn.addEventListener('click', () => {
        if (!editingImageTarget) return;
        const { secIndex, colIndex, widIndex } = editingImageTarget;
        const widget = workingSections[secIndex]?.columns?.[colIndex]?.[widIndex];
        if (!widget) return;

        const finalImgSrc = currentImageWidgetDataUrl || imgWidgetUrlInput.value.trim();
        if (!finalImgSrc) {
            imgWidgetErrorMsg.textContent = 'Vui lòng tải ảnh lên hoặc nhập đường dẫn URL hình ảnh.';
            imgWidgetErrorMsg.style.display = 'block';
            return;
        }

        widget.title = imgWidgetTitleInput.value.trim();
        widget.imageUrl = finalImgSrc;
        widget.caption = imgWidgetCaptionInput.value.trim();
        widget.linkUrl = imgWidgetLinkInput.value.trim();

        renderHomepageSections();
        closeImageModal();
    });

    renderHomepageSections();
});

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatShortDateRange(startStr, endStr) {
    const s = new Date(startStr);
    const e = new Date(endStr);
    if (Number.isNaN(s.getTime())) return '15/10 — 16/10/2026';

    const sDay = String(s.getDate()).padStart(2, '0');
    const sMonth = String(s.getMonth() + 1).padStart(2, '0');
    const sYear = s.getFullYear();

    if (Number.isNaN(e.getTime())) return `${sDay}/${sMonth}/${sYear}`;

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

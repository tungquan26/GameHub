document.addEventListener('DOMContentLoaded', () => {
    // ===== 1. XỬ LÝ MOBILE SIDEBAR (Giữ nguyên & đồng bộ thêm tournamentSidebar) =====
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const tournamentSidebar = document.getElementById('tournamentSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (mobileMenuBtn && sidebar && sidebarOverlay) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            if (tournamentSidebar) tournamentSidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('active');
        });
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            if (tournamentSidebar) tournamentSidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        });
    }

    // ===== 2. BIỂU TƯỢNG LIÊN HỆ & HÀM TOAST =====
    const CONTACT_ICONS = {
        EMAIL: `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z"/><path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z"/></svg>`,
        DISCORD: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028z"/></svg>`
    };

    function showToast(message, isError = false) {
        const container = document.getElementById('toastContainer');
        const item = document.createElement('div');
        item.className = `toast-msg ${isError ? 'error' : ''}`;
        item.textContent = message;
        container.appendChild(item);
        setTimeout(() => item.remove(), 3000);
    }

    // ===== PHẦN BỔ SUNG: ĐỒNG BỘ GIAO DIỆN & ĐIỀU HƯỚNG TOURNAMENT SIDEBAR =====
    const sidebarTourneyName = document.getElementById('sidebarTourneyName');
    const sidebarAvatarImg = document.getElementById('sidebarAvatarImg');
    const sidebarAvatarFallback = document.getElementById('sidebarAvatarFallback');
    const tsHeaderBanner = document.getElementById('tsHeaderBanner');
    const tsNavItems = document.querySelectorAll('.ts-nav .ts-nav-item');

    function syncSidebarIdentity(name, profileUrl, bannerUrl) {
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

    // Điều hướng các mục trên Sidebar cài đặt giải đấu (Details mặc định được chọn)
    // Điều hướng các mục trên Sidebar cài đặt giải đấu
    tsNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const href = item.getAttribute('href') || '';
            if (href.startsWith('/')) return;

            e.preventDefault();
            tsNavItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Nếu bấm vào "Chi tiết", cuộn lên sát mép trên cùng (chỗ thanh tiêu đề Chi tiết)
            if (item.dataset.nav === 'details' || href === '#settingsTopbar') {
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

    // ===== 3. NẠP DỮ LIỆU ĐÃ NHẬP TỪ TRANG CREATE PAGE =====
    const detailsForm = document.getElementById('detailsForm');
    const nameInput = document.getElementById('tournamentName');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const venueInput = document.getElementById('venueAddress');
    const contactTypeSelect = document.getElementById('contactType');
    const contactValueInput = document.getElementById('contactValue');
    const contactTypeIcon = document.getElementById('contactTypeIcon');
    const contactValueIcon = document.getElementById('contactValueIcon');
    const detailsErrorMsg = document.getElementById('detailsErrorMsg');
    const saveDetailsBtn = document.getElementById('saveDetailsBtn');

    // Đọc từ sessionStorage (hoặc URL query params / giá trị render sẵn từ Thymeleaf)
    const rawStored = sessionStorage.getItem('btp_tournament_data');
    const parsedStored = rawStored ? JSON.parse(rawStored) : null;
    const urlParams = new URLSearchParams(window.location.search);

    const savedDetailsState = {
        name: parsedStored?.name || urlParams.get('name') || nameInput.value || 'Nguyễn Quân',
        startDate: parsedStored?.startDate || urlParams.get('startDate') || startDateInput.value || '2026-10-16T11:00',
        endDate: parsedStored?.endDate || urlParams.get('endDate') || endDateInput.value || '2026-10-18T00:30',
        venueAddress: parsedStored?.venueAddress || venueInput.value || '',
        contactType: (parsedStored?.contactType === 'DISCORD' || parsedStored?.contactType === 'Discord') ? 'DISCORD' : 'EMAIL',
        contact: parsedStored?.contact || urlParams.get('contact') || contactValueInput.value || 'quannguyen041026@gmail.com'
    };

    function updateContactUI() {
        const type = contactTypeSelect.value;
        const svg = CONTACT_ICONS[type] || CONTACT_ICONS.EMAIL;
        contactTypeIcon.innerHTML = svg;
        contactValueIcon.innerHTML = svg;
        contactValueInput.placeholder = type === 'EMAIL' ? 'hello@start.gg' : 'https://discord.gg/yourserver';
    }

    function initDetailsFields() {
        nameInput.value = savedDetailsState.name;
        startDateInput.value = savedDetailsState.startDate;
        endDateInput.value = savedDetailsState.endDate;
        venueInput.value = savedDetailsState.venueAddress;
        contactTypeSelect.value = savedDetailsState.contactType;
        contactValueInput.value = savedDetailsState.contact;
        updateContactUI();
    }

    initDetailsFields();

    // Kiểm tra thay đổi & tính hợp lệ của Card Details
    function checkDetailsState() {
        detailsErrorMsg.style.display = 'none';

        const currentName = nameInput.value.trim();
        const currentStart = startDateInput.value;
        const currentEnd = endDateInput.value;
        const currentVenue = venueInput.value.trim();
        const currentType = contactTypeSelect.value;
        const currentContact = contactValueInput.value.trim();

        const isDirty =
            currentName !== savedDetailsState.name ||
            currentStart !== savedDetailsState.startDate ||
            currentEnd !== savedDetailsState.endDate ||
            currentVenue !== savedDetailsState.venueAddress ||
            currentType !== savedDetailsState.contactType ||
            currentContact !== savedDetailsState.contact;

        // Kiểm tra các trường bắt buộc
        if (!currentName || !currentStart || !currentEnd || !currentContact) {
            saveDetailsBtn.disabled = true;
            return false;
        }

        // Kiểm tra ngày kết thúc sau ngày bắt đầu
        if (new Date(currentEnd) <= new Date(currentStart)) {
            detailsErrorMsg.textContent = 'End Date must be after Start Date.';
            detailsErrorMsg.style.display = 'block';
            saveDetailsBtn.disabled = true;
            return false;
        }

        // Kiểm tra định dạng Email nếu chọn Email
        if (currentType === 'EMAIL') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(currentContact)) {
                detailsErrorMsg.textContent = 'Please enter a valid email address.';
                detailsErrorMsg.style.display = 'block';
                saveDetailsBtn.disabled = true;
                return false;
            }
        }

        saveDetailsBtn.disabled = !isDirty;
        return true;
    }

    [nameInput, startDateInput, endDateInput, venueInput, contactValueInput].forEach(el => {
        el.addEventListener('input', checkDetailsState);
        el.addEventListener('change', checkDetailsState);
    });

    contactTypeSelect.addEventListener('change', () => {
        updateContactUI();
        checkDetailsState();
    });

    detailsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!checkDetailsState()) return;

        saveDetailsBtn.disabled = true;
        saveDetailsBtn.textContent = 'Saving...';

        setTimeout(() => {
            savedDetailsState.name = nameInput.value.trim();
            savedDetailsState.startDate = startDateInput.value;
            savedDetailsState.endDate = endDateInput.value;
            savedDetailsState.venueAddress = venueInput.value.trim();
            savedDetailsState.contactType = contactTypeSelect.value;
            savedDetailsState.contact = contactValueInput.value.trim();

            sessionStorage.setItem('btp_tournament_data', JSON.stringify(savedDetailsState));
            syncSidebarIdentity(savedDetailsState.name, savedImagesState.profile, savedImagesState.banner);

            saveDetailsBtn.textContent = 'Save changes';
            checkDetailsState();
            showToast('Tournament details saved successfully.');
        }, 300);
    });

    // ===== 4. XỬ LÝ PHẦN 3.2: IMAGES (PROFILE & BANNER) =====
    const profileInput = document.getElementById('profileInput');
    const selectProfileBtn = document.getElementById('selectProfileBtn');
    const profileEmpty = document.getElementById('profileEmpty');
    const profilePreview = document.getElementById('profilePreview');
    const profileImgTag = document.getElementById('profileImgTag');
    const removeProfileBtn = document.getElementById('removeProfileBtn');
    const profileErrorMsg = document.getElementById('profileErrorMsg');

    const bannerInput = document.getElementById('bannerInput');
    const selectBannerBtn = document.getElementById('selectBannerBtn');
    const bannerEmpty = document.getElementById('bannerEmpty');
    const bannerPreview = document.getElementById('bannerPreview');
    const bannerImgTag = document.getElementById('bannerImgTag');
    const removeBannerBtn = document.getElementById('removeBannerBtn');
    const bannerErrorMsg = document.getElementById('bannerErrorMsg');
    const saveImagesBtn = document.getElementById('saveImagesBtn');

    const savedImagesState = {
        profile: sessionStorage.getItem('btp_tournament_profile_img') || '',
        banner: sessionStorage.getItem('btp_tournament_banner_img') || ''
    };

    let currentProfileData = savedImagesState.profile;
    let currentBannerData = savedImagesState.banner;

    // Đồng bộ tên & ảnh lên Sidebar khi vừa tải trang
    syncSidebarIdentity(savedDetailsState.name, savedImagesState.profile, savedImagesState.banner);

    function updateImageBoxUI(type, dataUrl) {
        if (type === 'profile') {
            currentProfileData = dataUrl;
            if (dataUrl) {
                profileImgTag.src = dataUrl;
                profileEmpty.style.display = 'none';
                profilePreview.style.display = 'flex';
            } else {
                profileImgTag.src = '';
                profilePreview.style.display = 'none';
                profileEmpty.style.display = 'block';
            }
        } else {
            currentBannerData = dataUrl;
            if (dataUrl) {
                bannerImgTag.src = dataUrl;
                bannerEmpty.style.display = 'none';
                bannerPreview.style.display = 'flex';
            } else {
                bannerImgTag.src = '';
                bannerPreview.style.display = 'none';
                bannerEmpty.style.display = 'block';
            }
        }
        checkImagesDirty();
    }

    function checkImagesDirty() {
        const isDirty =
            currentProfileData !== savedImagesState.profile ||
            currentBannerData !== savedImagesState.banner;
        saveImagesBtn.disabled = !isDirty;
    }

    function handleFileSelect(file, type, errorEl) {
        errorEl.style.display = 'none';
        if (!file) return;

        const maxSizeBytes = 4 * 1024 * 1024; // 4 MB
        if (file.size > maxSizeBytes) {
            errorEl.textContent = 'File size exceeds the maximum 4MB limit.';
            errorEl.style.display = 'block';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            const img = new Image();
            img.onload = () => {
                const w = img.width;
                const h = img.height;

                if (type === 'profile') {
                    if (w < 280 || h < 280 || w > 4800 || h > 4800) {
                        errorEl.textContent = `Image size (${w}x${h}) is outside the recommended 280x280 - 4800x4800 range.`;
                        errorEl.style.display = 'block';
                    }
                } else {
                    if (w < 1600 || h < 800 || w > 4800 || h > 2400) {
                        errorEl.textContent = `Image size (${w}x${h}) is outside the recommended 1600x800 - 4800x2400 range.`;
                        errorEl.style.display = 'block';
                    }
                }
                updateImageBoxUI(type, dataUrl);
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    }

    // Khởi tạo trạng thái ảnh ban đầu
    updateImageBoxUI('profile', savedImagesState.profile);
    updateImageBoxUI('banner', savedImagesState.banner);

    selectProfileBtn.addEventListener('click', () => profileInput.click());
    selectBannerBtn.addEventListener('click', () => bannerInput.click());

    profileInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files[0], 'profile', profileErrorMsg);
        profileInput.value = '';
    });

    bannerInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files[0], 'banner', bannerErrorMsg);
        bannerInput.value = '';
    });

    removeProfileBtn.addEventListener('click', () => {
        profileErrorMsg.style.display = 'none';
        updateImageBoxUI('profile', '');
    });

    removeBannerBtn.addEventListener('click', () => {
        bannerErrorMsg.style.display = 'none';
        updateImageBoxUI('banner', '');
    });

    saveImagesBtn.addEventListener('click', () => {
        saveImagesBtn.disabled = true;
        saveImagesBtn.textContent = 'Saving...';

        setTimeout(() => {
            savedImagesState.profile = currentProfileData;
            savedImagesState.banner = currentBannerData;
            sessionStorage.setItem('btp_tournament_profile_img', currentProfileData);
            sessionStorage.setItem('btp_tournament_banner_img', currentBannerData);

            syncSidebarIdentity(savedDetailsState.name, savedImagesState.profile, savedImagesState.banner);

            saveImagesBtn.textContent = 'Save changes';
            checkImagesDirty();
            showToast('Tournament images saved successfully.');
        }, 300);
    });

    // ===== 5. XỬ LÝ PHẦN 3.3: RULES & MARKDOWN PREVIEW =====
    const rulesInput = document.getElementById('rulesInput');
    const rulesEditorWrap = document.getElementById('rulesEditorWrap');
    const rulesPreviewWrap = document.getElementById('rulesPreviewWrap');
    const previewMarkdownBtn = document.getElementById('previewMarkdownBtn');
    const helpFormattingBtn = document.getElementById('helpFormattingBtn');
    const helpFormattingBox = document.getElementById('helpFormattingBox');
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    const saveRulesBtn = document.getElementById('saveRulesBtn');

    let savedRulesText = sessionStorage.getItem('btp_tournament_rules') || '';
    rulesInput.value = savedRulesText;

    let isPreviewing = false;

    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function parseInlineMarkdown(text) {
        let out = escapeHtml(text);
        out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
        out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        return out;
    }

    function renderMarkdownToHtml(markdown) {
        if (!markdown.trim()) {
            return '<p style="color:#9ca3af;font-style:italic;">No rules entered yet.</p>';
        }

        const lines = markdown.replace(/\r\n/g, '\n').split('\n');
        let html = '';
        let i = 0;

        while (i < lines.length) {
            const line = lines[i].trim();
            if (!line) {
                i++;
                continue;
            }

            // Hỗ trợ bảng Markdown
            if (line.startsWith('|') && i + 1 < lines.length && /^\|?[\s:-]+\|[\s|:-]*$/.test(lines[i + 1].trim())) {
                const headers = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(h => parseInlineMarkdown(h.trim()));
                html += '<table><thead><tr>';
                headers.forEach(h => { html += `<th>${h}</th>`; });
                html += '</tr></thead><tbody>';
                i += 2;

                while (i < lines.length && lines[i].trim().startsWith('|')) {
                    const cells = lines[i].trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => parseInlineMarkdown(c.trim()));
                    html += '<tr>';
                    cells.forEach(c => { html += `<td>${c}</td>`; });
                    html += '</tr>';
                    i++;
                }
                html += '</tbody></table>';
                continue;
            }

            // Hỗ trợ tiêu đề H1, H2, H3
            if (line.startsWith('### ')) {
                html += `<h3>${parseInlineMarkdown(line.slice(4))}</h3>`;
                i++;
                continue;
            }
            if (line.startsWith('## ')) {
                html += `<h2>${parseInlineMarkdown(line.slice(3))}</h2>`;
                i++;
                continue;
            }
            if (line.startsWith('# ')) {
                html += `<h1>${parseInlineMarkdown(line.slice(2))}</h1>`;
                i++;
                continue;
            }

            // Hỗ trợ danh sách
            if (line.startsWith('- ') || line.startsWith('* ')) {
                html += '<ul>';
                while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
                    html += `<li>${parseInlineMarkdown(lines[i].trim().slice(2))}</li>`;
                    i++;
                }
                html += '</ul>';
                continue;
            }

            html += `<p>${parseInlineMarkdown(line)}</p>`;
            i++;
        }

        return html;
    }

    function checkRulesDirty() {
        saveRulesBtn.disabled = (rulesInput.value === savedRulesText);
    }

    rulesInput.addEventListener('input', checkRulesDirty);

    previewMarkdownBtn.addEventListener('click', () => {
        isPreviewing = !isPreviewing;
        if (isPreviewing) {
            rulesPreviewWrap.innerHTML = renderMarkdownToHtml(rulesInput.value);
            rulesEditorWrap.style.display = 'none';
            rulesPreviewWrap.style.display = 'block';
            previewMarkdownBtn.textContent = 'Edit Markdown';
        } else {
            rulesPreviewWrap.style.display = 'none';
            rulesEditorWrap.style.display = 'block';
            previewMarkdownBtn.textContent = 'Preview Markdown';
        }
    });

    helpFormattingBtn.addEventListener('click', () => {
        const isHidden = helpFormattingBox.style.display === 'none';
        helpFormattingBox.style.display = isHidden ? 'block' : 'none';
    });

    closeHelpBtn.addEventListener('click', () => {
        helpFormattingBox.style.display = 'none';
    });

    saveRulesBtn.addEventListener('click', () => {
        saveRulesBtn.disabled = true;
        saveRulesBtn.textContent = 'Saving...';

        setTimeout(() => {
            savedRulesText = rulesInput.value;
            sessionStorage.setItem('btp_tournament_rules', savedRulesText);
            saveRulesBtn.textContent = 'Save changes';
            checkRulesDirty();
            showToast('Tournament rules saved successfully.');
        }, 300);
    });
});
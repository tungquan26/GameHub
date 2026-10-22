export function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function parseInlineMarkdown(text) {
    let out = escapeHtml(text);
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return out;
}

export function renderMarkdownToHtml(markdown) {
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

        // Hỗ trợ H1, H2, H3
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

// =========================================================================
// QUẢN LÝ DANH SÁCH NHIỀU GIẢI ĐẤU DO NGƯỜI DÙNG TẠO (MULTI-TOURNAMENT STORE)
// =========================================================================
const CREATED_TOURNAMENTS_KEY = 'btp_created_tournaments';
const ACTIVE_TOURNAMENT_ID_KEY = 'btp_active_tournament_id';

function readJsonFromSession(key, fallback = null) {
    try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function normalizeEntry(entry) {
    if (!entry || typeof entry !== 'object') return null;
    const d = entry.details || {};
    const name = entry.name || d.name || '';
    const contactType = entry.contactType || d.contactType || 'EMAIL';
    const contact = entry.contact || d.contact || 'quannguyen041026@gmail.com';
    const startDate = entry.startDate || d.startDate || '';
    const endDate = entry.endDate || d.endDate || '';
    const venueAddress = entry.venueAddress ?? d.venueAddress ?? '';
    const venueLat = entry.venueLat ?? d.venueLat ?? null;
    const venueLon = entry.venueLon ?? d.venueLon ?? null;
    const id = entry.id || d.id || ('tourney_' + Date.now());

    return {
        ...entry,
        id,
        name,
        contactType,
        contact,
        startDate,
        endDate,
        venueAddress,
        venueLat,
        venueLon,
        details: {
            id,
            name,
            contactType,
            contact,
            startDate,
            endDate,
            venueAddress,
            venueLat,
            venueLon
        }
    };
}

export function getCreatedTournaments() {
    let rawList = readJsonFromSession(CREATED_TOURNAMENTS_KEY, []);
    if (!Array.isArray(rawList)) rawList = [];

    let list = rawList.map(normalizeEntry).filter(Boolean);

    // Tự động đồng bộ giải đấu đang lưu trong btp_tournament_data
    const currentData = readJsonFromSession('btp_tournament_data', null);
    if (currentData && currentData.name) {
        const currentId = currentData.id || sessionStorage.getItem(ACTIVE_TOURNAMENT_ID_KEY) || ('tourney_' + Date.now());
        const existsIdx = list.findIndex(item =>
            (item.id && item.id === currentId) ||
            (item.name && item.name.trim().toLowerCase() === currentData.name.trim().toLowerCase())
        );

        const snapshot = buildSnapshotFromWorkingSession(currentId, currentData);
        if (existsIdx === -1) {
            list.unshift(snapshot);
        } else {
            list[existsIdx] = snapshot;
        }
        sessionStorage.setItem(CREATED_TOURNAMENTS_KEY, JSON.stringify(list));
        sessionStorage.setItem(ACTIVE_TOURNAMENT_ID_KEY, snapshot.id);
    }

    return list;
}

function buildSnapshotFromWorkingSession(id, detailsObj) {
    const details = detailsObj || readJsonFromSession('btp_tournament_data', {}) || {};
    const gameInfo = readJsonFromSession('btp_tournament_game_info', null);
    const regSettings = readJsonFromSession('btp_tournament_reg_settings', null);
    const homepageLayout = readJsonFromSession('btp_tournament_homepage_layout', null);
    const profileImg = sessionStorage.getItem('btp_tournament_profile_img') || '';
    const bannerImg = sessionStorage.getItem('btp_tournament_banner_img') || '';
    const rules = sessionStorage.getItem('btp_tournament_rules') || '';

    const resolvedId = id || details.id || ('tourney_' + Date.now());
    const resolvedName = details.name || 'Nguyễn Quân';
    const resolvedContactType = details.contactType || 'EMAIL';
    const resolvedContact = details.contact || 'quannguyen041026@gmail.com';
    const resolvedStartDate = details.startDate || '';
    const resolvedEndDate = details.endDate || '';
    const resolvedVenueAddress = details.venueAddress || '';
    const resolvedVenueLat = details.venueLat || null;
    const resolvedVenueLon = details.venueLon || null;

    return {
        id: resolvedId,
        name: resolvedName,
        contactType: resolvedContactType,
        contact: resolvedContact,
        startDate: resolvedStartDate,
        endDate: resolvedEndDate,
        venueAddress: resolvedVenueAddress,
        venueLat: resolvedVenueLat,
        venueLon: resolvedVenueLon,
        details: {
            id: resolvedId,
            name: resolvedName,
            contactType: resolvedContactType,
            contact: resolvedContact,
            startDate: resolvedStartDate,
            endDate: resolvedEndDate,
            venueAddress: resolvedVenueAddress,
            venueLat: resolvedVenueLat,
            venueLon: resolvedVenueLon
        },
        profileImg,
        bannerImg,
        rules,
        gameInfo: gameInfo || {
            game: 'Liên Minh Huyền Thoại',
            stageType: 'SINGLE_STAGE',
            format: 'SINGLE_ELIMINATION'
        },
        regSettings: regSettings || null,
        homepageLayout: homepageLayout || null
    };
}

export function createNewTournamentInStore(payload) {
    const newId = 'tourney_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const cleanDetails = {
        id: newId,
        name: payload.name,
        contactType: payload.contactType,
        contact: payload.contact,
        startDate: payload.startDate,
        endDate: payload.endDate,
        venueAddress: '',
        venueLat: null,
        venueLon: null
    };

    // Reset các khóa làm việc của giải trước để giải đấu mới khởi tạo sạch sẽ
    sessionStorage.setItem(ACTIVE_TOURNAMENT_ID_KEY, newId);
    sessionStorage.setItem('btp_tournament_data', JSON.stringify(cleanDetails));
    sessionStorage.removeItem('btp_tournament_profile_img');
    sessionStorage.removeItem('btp_tournament_banner_img');
    sessionStorage.removeItem('btp_tournament_rules');
    sessionStorage.removeItem('btp_tournament_game_info');
    sessionStorage.removeItem('btp_tournament_reg_settings');
    sessionStorage.removeItem('btp_tournament_homepage_layout');

    let list = readJsonFromSession(CREATED_TOURNAMENTS_KEY, []);
    if (!Array.isArray(list)) list = [];
    list = list.map(normalizeEntry).filter(Boolean);

    const snapshot = buildSnapshotFromWorkingSession(newId, cleanDetails);
    list.unshift(snapshot);
    sessionStorage.setItem(CREATED_TOURNAMENTS_KEY, JSON.stringify(list));
    return snapshot;
}

export function syncActiveTournamentToList() {
    const details = readJsonFromSession('btp_tournament_data', null);
    if (!details || !details.name) return;

    let list = readJsonFromSession(CREATED_TOURNAMENTS_KEY, []);
    if (!Array.isArray(list)) list = [];
    list = list.map(normalizeEntry).filter(Boolean);

    const activeId = details.id || sessionStorage.getItem(ACTIVE_TOURNAMENT_ID_KEY) || ('tourney_' + Date.now());
    details.id = activeId;
    sessionStorage.setItem('btp_tournament_data', JSON.stringify(details));
    sessionStorage.setItem(ACTIVE_TOURNAMENT_ID_KEY, activeId);

    const snapshot = buildSnapshotFromWorkingSession(activeId, details);
    const idx = list.findIndex(item => item.id === activeId);

    if (idx !== -1) {
        list[idx] = snapshot;
    } else {
        list.unshift(snapshot);
    }

    sessionStorage.setItem(CREATED_TOURNAMENTS_KEY, JSON.stringify(list));
}

export function setActiveTournamentById(tourneyIdOrName) {
    if (!tourneyIdOrName) return null;
    const list = getCreatedTournaments();
    const norm = String(tourneyIdOrName).trim().toLowerCase();
    const target = list.find(item =>
        String(item.id).toLowerCase() === norm ||
        ((item.name || item.details?.name || '').trim().toLowerCase() === norm)
    );

    if (!target) return null;

    const d = target.details || target;
    sessionStorage.setItem(ACTIVE_TOURNAMENT_ID_KEY, target.id);
    sessionStorage.setItem('btp_tournament_data', JSON.stringify({
        id: target.id,
        name: target.name || d.name || '',
        contactType: target.contactType || d.contactType || 'EMAIL',
        contact: target.contact || d.contact || 'quannguyen041026@gmail.com',
        startDate: target.startDate || d.startDate || '',
        endDate: target.endDate || d.endDate || '',
        venueAddress: target.venueAddress ?? d.venueAddress ?? '',
        venueLat: target.venueLat ?? d.venueLat ?? null,
        venueLon: target.venueLon ?? d.venueLon ?? null
    }));

    if (target.profileImg) {
        sessionStorage.setItem('btp_tournament_profile_img', target.profileImg);
    } else {
        sessionStorage.removeItem('btp_tournament_profile_img');
    }

    if (target.bannerImg) {
        sessionStorage.setItem('btp_tournament_banner_img', target.bannerImg);
    } else {
        sessionStorage.removeItem('btp_tournament_banner_img');
    }

    if (target.rules) {
        sessionStorage.setItem('btp_tournament_rules', target.rules);
    } else {
        sessionStorage.removeItem('btp_tournament_rules');
    }

    if (target.gameInfo) {
        sessionStorage.setItem('btp_tournament_game_info', JSON.stringify(target.gameInfo));
    } else {
        sessionStorage.removeItem('btp_tournament_game_info');
    }

    if (target.regSettings) {
        sessionStorage.setItem('btp_tournament_reg_settings', JSON.stringify(target.regSettings));
    } else {
        sessionStorage.removeItem('btp_tournament_reg_settings');
    }

    if (target.homepageLayout) {
        sessionStorage.setItem('btp_tournament_homepage_layout', JSON.stringify(target.homepageLayout));
    } else {
        sessionStorage.removeItem('btp_tournament_homepage_layout');
    }

    return target;
}

// =========================================================================
// TIỆN ÍCH RENDER PHÂN TRANG NÚT TRÒN (1 2 3 >) CHUẨN THIẾT KẾ START.GG
// =========================================================================
export function renderCirclePagination(containerEl, currentPage, totalPages, onPageChange) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    const maxDisplayPages = Math.max(totalPages, 1);

    for (let p = 1; p <= Math.min(maxDisplayPages, 5); p++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'page-circle-btn' + (p === currentPage ? ' active' : '');
        btn.textContent = p;
        btn.addEventListener('click', () => {
            if (p !== currentPage) onPageChange(p);
        });
        containerEl.appendChild(btn);
    }

    if (maxDisplayPages > 5) {
        const dots = document.createElement('span');
        dots.className = 'page-dots';
        dots.textContent = '...';
        containerEl.appendChild(dots);

        const lastBtn = document.createElement('button');
        lastBtn.type = 'button';
        lastBtn.className = 'page-circle-btn' + (currentPage === maxDisplayPages ? ' active' : '');
        lastBtn.textContent = maxDisplayPages;
        lastBtn.addEventListener('click', () => {
            if (currentPage !== maxDisplayPages) onPageChange(maxDisplayPages);
        });
        containerEl.appendChild(lastBtn);
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
            onPageChange(currentPage + 1);
        }
    });
    containerEl.appendChild(nextBtn);
}

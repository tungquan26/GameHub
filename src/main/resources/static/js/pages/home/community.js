import { showToast } from '../../common/toast.js';
import { escapeHtml } from '../../common/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY_COMMUNITY = 'btp_community_teams';
    const STORAGE_KEY_TOURNEY_TEAMS = 'btp_tournament_teams';

    // Lấy tên người dùng hiện tại (đồng bộ từ thông tin giải đấu hoặc mặc định)
    const storedTourneyRaw = sessionStorage.getItem('btp_tournament_data');
    const storedTourney = storedTourneyRaw ? JSON.parse(storedTourneyRaw) : null;
    const currentUser = (storedTourney?.name || 'Nguyễn Quân').trim();

    // Dữ liệu mẫu ban đầu của Cộng đồng (nếu chưa có trong sessionStorage)
    const INITIAL_TEAMS = [
        {
            id: 101,
            name: 'BTP Esports',
            tag: 'BTP',
            game: 'Liên Minh Huyền Thoại',
            captain: currentUser,
            members: [currentUser, 'Minh Tuấn', 'Hoàng Long', 'Đức Anh', 'Quốc Bảo'],
            description: 'Đội tuyển chính thức của cộng đồng BTP Tournament. Sẵn sàng giao lưu và chinh phục mọi giải đấu Sinh viên & Bán chuyên.',
            recruiting: true,
            color: '#4f78ff',
            logo: ''
        },
        {
            id: 102,
            name: 'Saigon Phantoms Academy',
            tag: 'SGP',
            game: 'Valorant',
            captain: 'Lê Hoàng',
            members: ['Lê Hoàng', 'Trần Khoa', currentUser, 'Hải Đăng'],
            description: 'Team tập luyện Valorant mỗi tối 20h00 - 23h00, ưu tiên tinh thần đồng đội và giao tiếp tốt.',
            recruiting: true,
            color: '#e11d48',
            logo: ''
        },
        {
            id: 103,
            name: 'Hanoi Dragons CS2',
            tag: 'HND',
            game: 'CS2',
            captain: 'Vũ Phong',
            members: ['Vũ Phong', 'Thành Đạt', 'Tuấn Kiệt'],
            description: 'Đang tìm thêm 2 Rifler/AWPer khu vực miền Bắc để chuẩn bị cho giải CS2 Major Vietnam.',
            recruiting: true,
            color: '#f59e0b',
            logo: ''
        },
        {
            id: 104,
            name: 'Vikings Pro Gaming',
            tag: 'VKE',
            game: 'Liên Minh Huyền Thoại',
            captain: 'Hoàng Việt',
            members: ['Hoàng Việt', 'Gia Huy', 'Bảo Nam', 'Thanh Tùng', 'Đình Duy'],
            description: 'Đội hình 5 thành viên cố định tham gia hệ thống giải đấu LCK Open Qualifiers.',
            recruiting: false,
            color: '#8b5cf6',
            logo: ''
        },
        {
            id: 105,
            name: 'Cerberus PUBG Squad',
            tag: 'CES',
            game: 'PUBG',
            captain: 'Nhật Minh',
            members: ['Nhật Minh', 'Anh Khôi', 'Mạnh Hùng'],
            description: 'Tuyển thêm 1 vị trí Scout/IGL bắn giải PUBG Mobile & PC cuối tuần.',
            recruiting: true,
            color: '#10b981',
            logo: ''
        }
    ];

    function loadCommunityTeams() {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY_COMMUNITY);
            if (!raw) {
                sessionStorage.setItem(STORAGE_KEY_COMMUNITY, JSON.stringify(INITIAL_TEAMS));
                return [...INITIAL_TEAMS];
            }
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [...INITIAL_TEAMS];
        } catch (e) {
            return [...INITIAL_TEAMS];
        }
    }

    function saveCommunityTeams(list) {
        sessionStorage.setItem(STORAGE_KEY_COMMUNITY, JSON.stringify(list));
        // Đồng bộ các team sang btp_tournament_teams để trang Teams của giải đấu cũng có thể dùng
        const simplified = list.map(t => ({
            id: t.id,
            name: `[${t.tag}] ${t.name}`,
            members: t.members
        }));
        sessionStorage.setItem(STORAGE_KEY_TOURNEY_TEAMS, JSON.stringify(simplified));
    }

    let teamsList = loadCommunityTeams();
    let editingTeamId = null;
    let selectedLogoDataUrl = '';
    let selectedTeamColor = '#4f78ff';

    // Tham chiếu DOM
    const cmCurrentUserAvatar = document.getElementById('cmCurrentUserAvatar');
    const cmCurrentUserName = document.getElementById('cmCurrentUserName');
    const statMyTeamsCount = document.getElementById('statMyTeamsCount');
    const statCaptainCount = document.getElementById('statCaptainCount');
    const cmUserTeamBadges = document.getElementById('cmUserTeamBadges');

    const myTeamsBadgeCount = document.getElementById('myTeamsBadgeCount');
    const myTeamsGrid = document.getElementById('myTeamsGrid');
    const myTeamsEmptyState = document.getElementById('myTeamsEmptyState');

    const communitySearchInput = document.getElementById('communitySearchInput');
    const communityGameFilter = document.getElementById('communityGameFilter');
    const communityStatusFilter = document.getElementById('communityStatusFilter');
    const communityTeamsGrid = document.getElementById('communityTeamsGrid');
    const communityEmptyState = document.getElementById('communityEmptyState');

    // Modal DOM
    const teamFormModal = document.getElementById('teamFormModal');
    const teamModalTitle = document.getElementById('teamModalTitle');
    const teamModalForm = document.getElementById('teamModalForm');
    const teamNameInput = document.getElementById('teamNameInput');
    const teamTagInput = document.getElementById('teamTagInput');
    const teamGameInput = document.getElementById('teamGameInput');
    const teamRecruitingInput = document.getElementById('teamRecruitingInput');
    const teamLogoFileInput = document.getElementById('teamLogoFileInput');
    const teamLogoPreviewBox = document.getElementById('teamLogoPreviewBox');
    const uploadTeamLogoBtn = document.getElementById('uploadTeamLogoBtn');
    const removeTeamLogoBtn = document.getElementById('removeTeamLogoBtn');
    const teamColorSwatches = document.getElementById('teamColorSwatches');
    const teamMembersInput = document.getElementById('teamMembersInput');
    const teamDescInput = document.getElementById('teamDescInput');
    const modalCaptainNameHint = document.getElementById('modalCaptainNameHint');
    const teamModalErrorMsg = document.getElementById('teamModalErrorMsg');

    // Khởi tạo thông tin người dùng trên Hero Card
    cmCurrentUserName.textContent = currentUser;
    cmCurrentUserAvatar.textContent = (currentUser.charAt(0) || 'U').toUpperCase();
    modalCaptainNameHint.textContent = currentUser;

    // Kiểm tra người dùng có thuộc team không
    function isUserInTeam(team) {
        const lowerMe = currentUser.toLowerCase();
        return (
            (team.captain && team.captain.toLowerCase() === lowerMe) ||
            (team.members || []).some(m => m.toLowerCase() === lowerMe)
        );
    }

    function isUserCaptain(team) {
        return team.captain && team.captain.toLowerCase() === currentUser.toLowerCase();
    }

    // Sinh HTML cho 1 thẻ Team
    function createTeamCardHtml(team, isMyTeamCard) {
        const isCap = isUserCaptain(team);
        const inTeam = isUserInTeam(team);
        const accentColor = team.color || '#4f78ff';
        const safeTag = escapeHtml((team.tag || team.name.slice(0, 3)).toUpperCase());

        const avatarInner = team.logo
            ? `<img src="${escapeHtml(team.logo)}" alt="${escapeHtml(team.name)}">`
            : safeTag;

        let roleBadgeHtml = '';
        if (isCap) {
            roleBadgeHtml = `<span class="cm-role-badge captain">👑 Đội trưởng</span>`;
        } else if (inTeam) {
            roleBadgeHtml = `<span class="cm-role-badge member">🛡️ Thành viên</span>`;
        }

        const rosterChipsHtml = (team.members || []).map(member => {
            const isMe = member.toLowerCase() === currentUser.toLowerCase();
            const isMemberCap = team.captain && member.toLowerCase() === team.captain.toLowerCase();
            return `
                <span class="cm-member-chip ${isMe ? 'is-me' : ''}">
                    ${isMemberCap ? '<span class="cap-crown" title="Đội trưởng">★</span>' : ''}
                    <span>${escapeHtml(member)}</span>
                </span>
            `;
        }).join('');

        const recruitingHtml = team.recruiting
            ? `<span class="cm-recruiting-tag"><span class="dot"></span>Đang tuyển thành viên</span>`
            : `<span class="cm-recruiting-tag closed"><span class="dot"></span>Đã chốt đội hình</span>`;

        let actionButtonsHtml = '';
        if (isCap) {
            actionButtonsHtml = `
                <button type="button" class="cm-btn-sm js-edit-team-btn" data-id="${team.id}">Chỉnh sửa Team</button>
                <button type="button" class="cm-btn-sm danger js-delete-team-btn" data-id="${team.id}">Giải tán</button>
            `;
        } else if (inTeam) {
            actionButtonsHtml = `
                <button type="button" class="cm-btn-sm danger js-leave-team-btn" data-id="${team.id}">Rời đội</button>
            `;
        } else if (team.recruiting) {
            actionButtonsHtml = `
                <button type="button" class="cm-btn-sm primary js-join-team-btn" data-id="${team.id}">+ Tham gia Team</button>
            `;
        } else {
            actionButtonsHtml = `<span style="font-size:12px;color:#94a3b8;font-weight:600;">Đội đã đủ người</span>`;
        }

        const cardClass = isMyTeamCard
            ? `cm-my-team-card ${isCap ? 'is-captain' : ''}`
            : `cm-community-card`;

        return `
            <article class="${cardClass}" data-team-id="${team.id}">
                <div class="cm-team-top-strip" style="background:${accentColor};"></div>
                <div class="cm-team-card-body">
                    <div class="cm-team-identity-row">
                        <div class="cm-team-id-left">
                            <div class="cm-team-avatar" style="background:${accentColor};">
                                ${avatarInner}
                            </div>
                            <div class="cm-team-title-wrap">
                                <div class="cm-team-name-line">
                                    <span class="cm-team-tag">[${safeTag}]</span>
                                    <h3 class="cm-team-name">${escapeHtml(team.name)}</h3>
                                </div>
                                <span class="cm-team-game-badge">${escapeHtml(team.game)}</span>
                            </div>
                        </div>
                        ${roleBadgeHtml}
                    </div>

                    <p class="cm-team-desc">${escapeHtml(team.description || 'Chưa có mô tả đội tuyển.')}</p>

                    <div class="cm-roster-box">
                        <div class="cm-roster-header">
                            <span>Đội hình · ${(team.members || []).length} thành viên</span>
                            <span>Đội trưởng: ${escapeHtml(team.captain)}</span>
                        </div>
                        <div class="cm-roster-chips">
                            ${rosterChipsHtml}
                        </div>
                    </div>
                </div>

                <div class="cm-team-card-footer">
                    ${recruitingHtml}
                    <div class="cm-card-actions">
                        ${actionButtonsHtml}
                    </div>
                </div>
            </article>
        `;
    }

    // Render toàn bộ trang Cộng đồng
    function renderAll() {
        const myTeams = teamsList.filter(isUserInTeam);
        const captainTeams = myTeams.filter(isUserCaptain);

        // 1. Cập nhật thẻ trạng thái cá nhân trên Hero
        statMyTeamsCount.textContent = String(myTeams.length);
        statCaptainCount.textContent = String(captainTeams.length);
        myTeamsBadgeCount.textContent = `${myTeams.length} đội`;

        if (myTeams.length > 0) {
            cmUserTeamBadges.innerHTML = myTeams.map(t => `
                <span class="cm-mini-team-chip">
                    <span class="role-dot"></span>
                    <span>[${escapeHtml(t.tag)}] ${escapeHtml(t.name)} · ${isUserCaptain(t) ? 'Đội trưởng' : 'Thành viên'}</span>
                </span>
            `).join('');
        } else {
            cmUserTeamBadges.innerHTML = `<span style="font-size:12.5px;color:rgba(255,255,255,0.6);">Bạn chưa tham gia đội tuyển nào</span>`;
        }

        // 2. Render Khu vực "Đội tuyển của tôi"
        if (myTeams.length === 0) {
            myTeamsGrid.style.display = 'none';
            myTeamsEmptyState.style.display = 'flex';
        } else {
            myTeamsEmptyState.style.display = 'none';
            myTeamsGrid.style.display = 'grid';
            myTeamsGrid.innerHTML = myTeams.map(t => createTeamCardHtml(t, true)).join('');
        }

        // 3. Render Khu vực "Khám phá Cộng đồng"
        const keyword = (communitySearchInput.value || '').trim().toLowerCase();
        const gameVal = communityGameFilter.value;
        const statusVal = communityStatusFilter.value;

        const filteredCommunity = teamsList.filter(team => {
            const matchKeyword =
                !keyword ||
                team.name.toLowerCase().includes(keyword) ||
                (team.tag || '').toLowerCase().includes(keyword) ||
                (team.members || []).some(m => m.toLowerCase().includes(keyword));

            const matchGame = !gameVal || team.game === gameVal;

            let matchStatus = true;
            if (statusVal === 'RECRUITING') matchStatus = Boolean(team.recruiting);
            if (statusVal === 'MY_TEAM') matchStatus = isUserInTeam(team);

            return matchKeyword && matchGame && matchStatus;
        });

        if (filteredCommunity.length === 0) {
            communityTeamsGrid.style.display = 'none';
            communityEmptyState.style.display = 'flex';
        } else {
            communityEmptyState.style.display = 'none';
            communityTeamsGrid.style.display = 'grid';
            communityTeamsGrid.innerHTML = filteredCommunity.map(t => createTeamCardHtml(t, false)).join('');
        }

        bindCardActions();
    }

    // Gắn sự kiện cho các nút trên từng thẻ Team
    function bindCardActions() {
        // Tham gia đội
        document.querySelectorAll('.js-join-team-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.getAttribute('data-id'));
                const team = teamsList.find(t => t.id === id);
                if (!team) return;

                if (!isUserInTeam(team)) {
                    team.members.push(currentUser);
                    saveCommunityTeams(teamsList);
                    renderAll();
                    showToast(`Bạn đã gia nhập đội "[${team.tag}] ${team.name}" thành công!`);
                }
            });
        });

        // Rời đội
        document.querySelectorAll('.js-leave-team-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.getAttribute('data-id'));
                const team = teamsList.find(t => t.id === id);
                if (!team) return;

                team.members = (team.members || []).filter(m => m.toLowerCase() !== currentUser.toLowerCase());
                saveCommunityTeams(teamsList);
                renderAll();
                showToast(`Bạn đã rời khỏi đội "[${team.tag}] ${team.name}".`);
            });
        });

        // Giải tán đội
        document.querySelectorAll('.js-delete-team-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.getAttribute('data-id'));
                const idx = teamsList.findIndex(t => t.id === id);
                if (idx === -1) return;

                const removedName = teamsList[idx].name;
                teamsList.splice(idx, 1);
                saveCommunityTeams(teamsList);
                renderAll();
                showToast(`Đã giải tán đội tuyển "${removedName}".`);
            });
        });

        // Chỉnh sửa đội
        document.querySelectorAll('.js-edit-team-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.getAttribute('data-id'));
                const team = teamsList.find(t => t.id === id);
                if (!team) return;
                openTeamModal(team);
            });
        });
    }

    // ===== XỬ LÝ MODAL TẠO / CHỈNH SỬA TEAM =====
    function updateLogoPreviewBox() {
        teamLogoPreviewBox.style.background = selectedTeamColor;
        const tagText = (teamTagInput.value.trim() || teamNameInput.value.trim().slice(0, 3) || 'BTP').toUpperCase();
        if (selectedLogoDataUrl) {
            teamLogoPreviewBox.innerHTML = `<img src="${escapeHtml(selectedLogoDataUrl)}" alt="Logo">`;
            removeTeamLogoBtn.style.display = 'inline-block';
        } else {
            teamLogoPreviewBox.textContent = tagText;
            removeTeamLogoBtn.style.display = 'none';
        }
    }

    function openTeamModal(teamToEdit = null) {
        teamModalErrorMsg.style.display = 'none';
        if (teamToEdit) {
            editingTeamId = teamToEdit.id;
            teamModalTitle.textContent = `Quản lý Đội Tuyển: [${teamToEdit.tag}] ${teamToEdit.name}`;
            teamNameInput.value = teamToEdit.name;
            teamTagInput.value = teamToEdit.tag;
            teamGameInput.value = teamToEdit.game;
            teamRecruitingInput.value = String(Boolean(teamToEdit.recruiting));
            selectedLogoDataUrl = teamToEdit.logo || '';
            selectedTeamColor = teamToEdit.color || '#4f78ff';

            const otherMembers = (teamToEdit.members || []).filter(
                m => m.toLowerCase() !== currentUser.toLowerCase()
            );
            teamMembersInput.value = otherMembers.join(', ');
            teamDescInput.value = teamToEdit.description || '';
        } else {
            editingTeamId = null;
            teamModalTitle.textContent = 'Tạo Đội Tuyển Mới';
            teamModalForm.reset();
            selectedLogoDataUrl = '';
            selectedTeamColor = '#4f78ff';
        }

        teamColorSwatches.querySelectorAll('.cm-color-swatch').forEach(sw => {
            sw.classList.toggle('active', sw.getAttribute('data-color') === selectedTeamColor);
        });

        updateLogoPreviewBox();
        teamFormModal.style.display = 'flex';
        teamNameInput.focus();
    }

    function closeTeamModal() {
        teamFormModal.style.display = 'none';
        editingTeamId = null;
    }

    ['openCreateTeamBtn', 'openCreateTeamTopBtn', 'emptyCreateTeamBtn'].forEach(btnId => {
        const el = document.getElementById(btnId);
        if (el) el.addEventListener('click', () => openTeamModal(null));
    });

    document.getElementById('closeTeamModalBtn').addEventListener('click', closeTeamModal);
    document.getElementById('cancelTeamModalBtn').addEventListener('click', closeTeamModal);

    teamFormModal.addEventListener('click', (e) => {
        if (e.target === teamFormModal) closeTeamModal();
    });

    teamNameInput.addEventListener('input', updateLogoPreviewBox);
    teamTagInput.addEventListener('input', updateLogoPreviewBox);

    // Chọn màu đội
    teamColorSwatches.querySelectorAll('.cm-color-swatch').forEach(sw => {
        sw.addEventListener('click', () => {
            selectedTeamColor = sw.getAttribute('data-color') || '#4f78ff';
            teamColorSwatches.querySelectorAll('.cm-color-swatch').forEach(b => b.classList.remove('active'));
            sw.classList.add('active');
            updateLogoPreviewBox();
        });
    });

    // Tải ảnh Logo đội
    uploadTeamLogoBtn.addEventListener('click', () => teamLogoFileInput.click());

    teamLogoFileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 4 * 1024 * 1024) {
            teamModalErrorMsg.textContent = 'Kích thước ảnh tối đa là 4MB.';
            teamModalErrorMsg.style.display = 'block';
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            selectedLogoDataUrl = ev.target.result;
            updateLogoPreviewBox();
        };
        reader.readAsDataURL(file);
        teamLogoFileInput.value = '';
    });

    removeTeamLogoBtn.addEventListener('click', () => {
        selectedLogoDataUrl = '';
        updateLogoPreviewBox();
    });

    // Lưu Team mới hoặc cập nhật Team
    teamModalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        teamModalErrorMsg.style.display = 'none';

        const name = teamNameInput.value.trim();
        const tag = teamTagInput.value.trim().toUpperCase();
        const game = teamGameInput.value;
        const recruiting = teamRecruitingInput.value === 'true';
        const desc = teamDescInput.value.trim();

        if (!name || !tag) {
            teamModalErrorMsg.textContent = 'Vui lòng nhập đầy đủ Tên Đội Tuyển và Tag viết tắt.';
            teamModalErrorMsg.style.display = 'block';
            return;
        }

        const extraMembers = teamMembersInput.value
            .split(/[\/,]+/)
            .map(m => m.trim())
            .filter(m => m && m.toLowerCase() !== currentUser.toLowerCase());

        const fullMembers = [currentUser, ...extraMembers];

        if (editingTeamId) {
            const target = teamsList.find(t => t.id === editingTeamId);
            if (target) {
                target.name = name;
                target.tag = tag;
                target.game = game;
                target.recruiting = recruiting;
                target.description = desc;
                target.color = selectedTeamColor;
                target.logo = selectedLogoDataUrl;
                target.members = fullMembers;
            }
            showToast(`Đã cập nhật đội tuyển "[${tag}] ${name}".`);
        } else {
            const newTeam = {
                id: Date.now(),
                name,
                tag,
                game,
                captain: currentUser,
                members: fullMembers,
                description: desc || `Đội tuyển ${name} bộ môn ${game}.`,
                recruiting,
                color: selectedTeamColor,
                logo: selectedLogoDataUrl
            };
            teamsList.unshift(newTeam);
            showToast(`Đã tạo đội tuyển "[${tag}] ${name}" thành công!`);
        }

        saveCommunityTeams(teamsList);
        closeTeamModal();
        renderAll();
    });

    // Bộ lọc & tìm kiếm Cộng đồng
    communitySearchInput.addEventListener('input', renderAll);
    communityGameFilter.addEventListener('change', renderAll);
    communityStatusFilter.addEventListener('change', renderAll);

    // Khởi tạo lần đầu
    renderAll();
});

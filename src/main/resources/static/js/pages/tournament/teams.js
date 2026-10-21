import { showToast } from '../../common/toast.js';
import { escapeHtml } from '../../common/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'btp_tournament_teams';

    const searchInput = document.getElementById('teamSearchInput');
    const emptyState = document.getElementById('teamsEmptyState');
    const tableCard = document.getElementById('teamsTableCard');
    const tableBody = document.getElementById('teamsTableBody');

    const openModalBtn = document.getElementById('openAddTeamModalBtn');
    const closeModalBtn = document.getElementById('closeAddTeamModalBtn');
    const cancelModalBtn = document.getElementById('cancelAddTeamBtn');
    const modal = document.getElementById('addTeamModal');
    const form = document.getElementById('addTeamForm');
    const teamNameInput = document.getElementById('newTeamName');
    const teamMembersInput = document.getElementById('newTeamMembers');
    const errorMsg = document.getElementById('addTeamErrorMsg');

    // Icon 2 người ở cột Members giống thiết kế
    const MEMBERS_SVG = `
        <svg class="team-members-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 11a4 4 0 100-8 4 4 0 000 8zm0 2c-3.31 0-6 2.02-6 4.5V19h12v-1.5c0-2.48-2.69-4.5-6-4.5zm7.5-2a3 3 0 100-6 3 3 0 000 6zm0 2c-.73 0-1.41.13-2.01.35 1.21.96 2.01 2.27 2.01 3.9V19H21v-1.25c0-2.07-2.02-3.75-4.5-3.75z"/>
        </svg>
    `;

    function loadTeams() {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function saveTeams(list) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    let teamsList = loadTeams();

    function renderTeams() {
        const keyword = (searchInput.value || '').trim().toLowerCase();

        const filtered = teamsList.filter(t => {
            const nameMatch = t.name.toLowerCase().includes(keyword);
            const membersStr = t.members.join(' / ').toLowerCase();
            return !keyword || nameMatch || membersStr.includes(keyword);
        });

        if (filtered.length === 0) {
            tableCard.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';
        tableCard.style.display = 'block';

        tableBody.innerHTML = filtered.map(team => {
            const initial = escapeHtml((team.name.trim().charAt(0) || 'T').toUpperCase());
            const safeName = escapeHtml(team.name);
            const safeMembers = team.members.map(m => escapeHtml(m)).join(' / ');

            return `
                <div class="team-row" data-id="${team.id}">
                    <div class="team-info-cell">
                        <div class="team-initial-avatar">${initial}</div>
                        <span class="team-name-text">${safeName}</span>
                    </div>
                    <div class="team-members-cell">
                        ${MEMBERS_SVG}
                        <span class="team-members-text">${safeMembers}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Tìm kiếm realtime
    searchInput.addEventListener('input', renderTeams);

    // Đóng / Mở Modal Add Team
    function openModal() {
        errorMsg.style.display = 'none';
        form.reset();
        modal.style.display = 'flex';
        teamNameInput.focus();
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    openModalBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Lưu Team mới khi đăng ký
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        errorMsg.style.display = 'none';

        const name = teamNameInput.value.trim();
        const rawMembers = teamMembersInput.value.trim();

        if (!name || !rawMembers) {
            errorMsg.textContent = 'Vui lòng nhập đầy đủ tên Team và danh sách thành viên.';
            errorMsg.style.display = 'block';
            return;
        }

        const members = rawMembers
            .split(/[\/,]+/)
            .map(m => m.trim())
            .filter(Boolean);

        if (members.length === 0) {
            errorMsg.textContent = 'Vui lòng nhập ít nhất 1 thành viên.';
            errorMsg.style.display = 'block';
            return;
        }

        teamsList.push({
            id: Date.now(),
            name: name,
            members: members
        });

        saveTeams(teamsList);
        renderTeams();
        closeModal();
        showToast(`Đã thêm đội "${name}" vào danh sách.`);
    });

    // Khởi tạo giao diện ban đầu
    renderTeams();
});
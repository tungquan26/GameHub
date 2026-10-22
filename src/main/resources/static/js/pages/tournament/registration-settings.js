import { showToast } from '../../common/toast.js';
import { syncActiveTournamentToList } from '../../common/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationSettingsForm');
    const regStartDateInput = document.getElementById('registrationStartDate');
    const regEndDateInput = document.getElementById('registrationEndDate');
    const minTeamSizeInput = document.getElementById('minTeamSize');
    const maxTeamSizeInput = document.getElementById('maxTeamSize');
    const maxTeamsInput = document.getElementById('maxTeams');
    const errorMsg = document.getElementById('regSettingsErrorMsg');
    const saveBtn = document.getElementById('saveRegSettingsBtn');

    const STORAGE_KEY = 'btp_tournament_reg_settings';
    const rawStored = sessionStorage.getItem(STORAGE_KEY);
    const parsedStored = rawStored ? JSON.parse(rawStored) : null;

    const FIXED_MIN_TEAM_SIZE = 4;
    const FIXED_MAX_TEAMS = 16;

    const savedState = {
        registrationStartDate: parsedStored?.registrationStartDate || '',
        registrationEndDate: parsedStored?.registrationEndDate || '',
        feeType: 'FREE',
        minTeamSize: FIXED_MIN_TEAM_SIZE,
        maxTeamSize: parsedStored?.maxTeamSize ?? '',
        maxTeams: FIXED_MAX_TEAMS
    };

    function initFields() {
        regStartDateInput.value = savedState.registrationStartDate;
        regEndDateInput.value = savedState.registrationEndDate;
        if (minTeamSizeInput) {
            minTeamSizeInput.value = FIXED_MIN_TEAM_SIZE;
        }
        maxTeamSizeInput.value = savedState.maxTeamSize;
        if (maxTeamsInput) {
            maxTeamsInput.value = FIXED_MAX_TEAMS;
        }
    }

    initFields();

    function checkState() {
        errorMsg.style.display = 'none';

        const currentStartDate = regStartDateInput.value;
        const currentEndDate = regEndDateInput.value;
        const rawMax = maxTeamSizeInput.value.trim();
        const currentMax = parseInt(rawMax, 10);

        if (!currentStartDate || !currentEndDate || !rawMax || Number.isNaN(currentMax)) {
            saveBtn.disabled = true;
            return false;
        }

        if (new Date(currentEndDate) <= new Date(currentStartDate)) {
            errorMsg.textContent = 'Thời gian đóng đăng ký phải sau thời gian mở đăng ký.';
            errorMsg.style.display = 'block';
            saveBtn.disabled = true;
            return false;
        }

        if (currentMax < FIXED_MIN_TEAM_SIZE) {
            errorMsg.textContent = `Số thành viên tối đa mỗi đội phải lớn hơn hoặc bằng số thành viên tối thiểu (${FIXED_MIN_TEAM_SIZE}).`;
            errorMsg.style.display = 'block';
            saveBtn.disabled = true;
            return false;
        }

        const isDirty =
            currentStartDate !== savedState.registrationStartDate ||
            currentEndDate !== savedState.registrationEndDate ||
            String(currentMax) !== String(savedState.maxTeamSize);

        saveBtn.disabled = !isDirty;
        return true;
    }

    [regStartDateInput, regEndDateInput, maxTeamSizeInput].forEach(el => {
        el.addEventListener('input', checkState);
        el.addEventListener('change', checkState);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!checkState()) return;

        saveBtn.disabled = true;
        saveBtn.textContent = 'Đang lưu...';

        setTimeout(() => {
            savedState.registrationStartDate = regStartDateInput.value;
            savedState.registrationEndDate = regEndDateInput.value;
            savedState.minTeamSize = FIXED_MIN_TEAM_SIZE;
            savedState.maxTeamSize = parseInt(maxTeamSizeInput.value, 10);
            savedState.maxTeams = FIXED_MAX_TEAMS;

            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
            syncActiveTournamentToList();

            saveBtn.textContent = 'Lưu thay đổi';
            checkState();
            showToast('Đã lưu cài đặt đăng ký thành công.');
        }, 300);
    });
});

import { showToast } from '../../common/toast.js';
import { syncActiveTournamentToList } from '../../common/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'btp_tournament_game_info';

    const form = document.getElementById('gameInfoForm');
    const gameSelect = document.getElementById('gameSelect');
    const stageRadios = Array.from(document.querySelectorAll('input[name="stageType"]'));
    const formatSelect = document.getElementById('formatSelect');
    const errorMsg = document.getElementById('gameInfoErrorMsg');
    const saveBtn = document.getElementById('saveGameInfoBtn');

    const rawStored = sessionStorage.getItem(STORAGE_KEY);
    const parsedStored = rawStored ? JSON.parse(rawStored) : null;

    const savedState = {
        game: parsedStored?.game || 'Liên Minh Huyền Thoại',
        stageType: parsedStored?.stageType || 'SINGLE_STAGE',
        format: parsedStored?.format || 'SINGLE_ELIMINATION'
    };

    function getSelectedStageType() {
        const checked = stageRadios.find(r => r.checked);
        return checked ? checked.value : 'SINGLE_STAGE';
    }

    function initFields() {
        gameSelect.value = savedState.game;
        stageRadios.forEach(r => {
            r.checked = (r.value === savedState.stageType);
        });
        formatSelect.value = savedState.format;
    }

    initFields();

    function checkState() {
        errorMsg.style.display = 'none';

        const currentGame = gameSelect.value;
        const currentStage = getSelectedStageType();
        const currentFormat = formatSelect.value;

        if (!currentGame) {
            errorMsg.textContent = 'Vui lòng chọn một tựa game trong hệ thống.';
            errorMsg.style.display = 'block';
            saveBtn.disabled = true;
            return false;
        }

        const isDirty =
            currentGame !== savedState.game ||
            currentStage !== savedState.stageType ||
            currentFormat !== savedState.format;

        saveBtn.disabled = !isDirty;
        return true;
    }

    gameSelect.addEventListener('change', checkState);
    formatSelect.addEventListener('change', checkState);
    stageRadios.forEach(r => r.addEventListener('change', checkState));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!checkState()) return;

        saveBtn.disabled = true;
        saveBtn.textContent = 'Đang lưu...';

        setTimeout(() => {
            savedState.game = gameSelect.value;
            savedState.stageType = getSelectedStageType();
            savedState.format = formatSelect.value;

            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
            syncActiveTournamentToList();

            saveBtn.textContent = 'Lưu thay đổi';
            checkState();
            showToast('Đã lưu thông tin game thành công.');
        }, 300);
    });
});

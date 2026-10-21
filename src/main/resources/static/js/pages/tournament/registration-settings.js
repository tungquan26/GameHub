import { showToast } from '../../common/toast.js';

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

    const rawTourney = sessionStorage.getItem('btp_tournament_data');
    const parsedTourney = rawTourney ? JSON.parse(rawTourney) : null;

    const savedState = {
        registrationStartDate: parsedStored?.registrationStartDate || '2026-10-10T09:00',
        registrationEndDate: parsedStored?.registrationEndDate || parsedTourney?.startDate || '2026-10-15T23:59',
        feeType: 'FREE',
        minTeamSize: parsedStored?.minTeamSize ?? 5,
        maxTeamSize: parsedStored?.maxTeamSize ?? 6,
        maxTeams: parsedStored?.maxTeams ?? 16
    };

    function initFields() {
        regStartDateInput.value = savedState.registrationStartDate;
        regEndDateInput.value = savedState.registrationEndDate;
        minTeamSizeInput.value = savedState.minTeamSize;
        maxTeamSizeInput.value = savedState.maxTeamSize;
        maxTeamsInput.value = savedState.maxTeams;
    }

    initFields();

    function checkState() {
        errorMsg.style.display = 'none';

        const currentStartDate = regStartDateInput.value;
        const currentEndDate = regEndDateInput.value;
        const currentMin = parseInt(minTeamSizeInput.value, 10);
        const currentMax = parseInt(maxTeamSizeInput.value, 10);
        const currentMaxTeams = parseInt(maxTeamsInput.value, 10);

        if (!currentStartDate || !currentEndDate || Number.isNaN(currentMin) || Number.isNaN(currentMax) || Number.isNaN(currentMaxTeams)) {
            saveBtn.disabled = true;
            return false;
        }

        if (new Date(currentEndDate) <= new Date(currentStartDate)) {
            errorMsg.textContent = 'Registration End Date must be after Registration Start Date.';
            errorMsg.style.display = 'block';
            saveBtn.disabled = true;
            return false;
        }

        if (currentMin < 1) {
            errorMsg.textContent = 'Minimum Team Size must be at least 1.';
            errorMsg.style.display = 'block';
            saveBtn.disabled = true;
            return false;
        }

        if (currentMax < currentMin) {
            errorMsg.textContent = 'Maximum Team Size must be greater than or equal to Minimum Team Size.';
            errorMsg.style.display = 'block';
            saveBtn.disabled = true;
            return false;
        }

        if (currentMaxTeams < 2) {
            errorMsg.textContent = 'Maximum Teams must be at least 2.';
            errorMsg.style.display = 'block';
            saveBtn.disabled = true;
            return false;
        }

        const isDirty =
            currentStartDate !== savedState.registrationStartDate ||
            currentEndDate !== savedState.registrationEndDate ||
            currentMin !== Number(savedState.minTeamSize) ||
            currentMax !== Number(savedState.maxTeamSize) ||
            currentMaxTeams !== Number(savedState.maxTeams);

        saveBtn.disabled = !isDirty;
        return true;
    }

    [regStartDateInput, regEndDateInput, minTeamSizeInput, maxTeamSizeInput, maxTeamsInput].forEach(el => {
        el.addEventListener('input', checkState);
        el.addEventListener('change', checkState);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!checkState()) return;

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        setTimeout(() => {
            savedState.registrationStartDate = regStartDateInput.value;
            savedState.registrationEndDate = regEndDateInput.value;
            savedState.minTeamSize = parseInt(minTeamSizeInput.value, 10);
            savedState.maxTeamSize = parseInt(maxTeamSizeInput.value, 10);
            savedState.maxTeams = parseInt(maxTeamsInput.value, 10);

            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

            saveBtn.textContent = 'Save changes';
            checkState();
            showToast('Registration settings saved successfully.');
        }, 300);
    });
});
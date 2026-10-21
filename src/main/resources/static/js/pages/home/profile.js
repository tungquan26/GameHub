import { showToast } from '../../common/toast.js';
import { escapeHtml } from '../../common/utils.js';
import { getStoredUserProfile, syncGlobalUserProfile } from '../../layouts/app-layout.js';

document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY_PROFILE = 'btp_user_profile';
    let userProfile = getStoredUserProfile();

    function saveUserProfile(updated) {
        userProfile = { ...userProfile, ...updated };
        sessionStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(userProfile));
        syncGlobalUserProfile();
    }

    // =========================================================================
    // A. LOGIC TRANG HỒ SƠ CÔNG KHAI (/profile)
    // =========================================================================
    const publicProfileTagName = document.getElementById('publicProfileTagName');
    if (publicProfileTagName) {
        renderPublicProfile();
    }

    function renderPublicProfile() {
        const initial = (userProfile.tagName.charAt(0) || 'T').toUpperCase();
        const avatarImg = document.getElementById('publicProfileAvatarImg');
        const avatarInitial = document.getElementById('publicProfileAvatarInitial');
        const userCodeEl = document.getElementById('publicProfileUserCode');
        const pronounsEl = document.getElementById('publicProfilePronouns');
        const bioEl = document.getElementById('publicProfileBio');
        const joinedEl = document.getElementById('publicProfileJoined');
        const locationEl = document.getElementById('publicProfileLocation');
        const organizedList = document.getElementById('organizedTournamentsList');

        publicProfileTagName.textContent = userProfile.tagName;
        if (userCodeEl) userCodeEl.textContent = userProfile.userCode;
        if (joinedEl) joinedEl.textContent = userProfile.joinedDate;

        // Avatar
        if (avatarImg && avatarInitial) {
            avatarInitial.textContent = initial;
            if (userProfile.avatarUrl) {
                avatarImg.src = userProfile.avatarUrl;
                avatarImg.style.display = 'block';
                avatarInitial.style.display = 'none';
            } else {
                avatarImg.src = '';
                avatarImg.style.display = 'none';
                avatarInitial.style.display = 'block';
            }
        }

        // Pronouns
        if (pronounsEl) {
            if (userProfile.displayPronouns && userProfile.pronouns.trim()) {
                pronounsEl.textContent = userProfile.pronouns.trim();
                pronounsEl.style.display = 'inline-block';
            } else {
                pronounsEl.style.display = 'none';
            }
        }

        // Bio
        if (bioEl) {
            if (userProfile.bio.trim()) {
                bioEl.textContent = userProfile.bio.trim();
                bioEl.style.display = 'block';
            } else {
                bioEl.style.display = 'none';
            }
        }

        // Location (City + Country hoặc chỉ Country)
        if (locationEl) {
            const showCity = userProfile.displayCityMode === 'Display city' && userProfile.city.trim();
            locationEl.textContent = showCity
                ? `${userProfile.city.trim()}, ${userProfile.country}`
                : userProfile.country;
        }

        // Danh sách giải đấu đã tổ chức (TOURNAMENTS ORGANIZED)
        if (organizedList) {
            const rawTourney = sessionStorage.getItem('btp_tournament_data');
            let tourney = null;
            try {
                tourney = rawTourney ? JSON.parse(rawTourney) : null;
            } catch {
                tourney = null;
            }
            const tourneyImg = sessionStorage.getItem('btp_tournament_profile_img') || '/images/logo.png';
            const tourneyName = tourney?.name || 'Nguyễn Quân';
            const tourneyAddress = tourney?.venueAddress || 'Hà Nội, VN';
            const dateRangeText = formatTourneyDateRange(tourney?.startDate, tourney?.endDate);

            organizedList.innerHTML = `
                <a href="/tournament/home" class="pf-tourney-item">
                    <img src="${escapeHtml(tourneyImg)}" alt="${escapeHtml(tourneyName)}" class="pf-tourney-thumb">
                    <div class="pf-tourney-info">
                        <span class="pf-tourney-date">${escapeHtml(dateRangeText)}</span>
                        <strong class="pf-tourney-name">${escapeHtml(tourneyName)}</strong>
                        <span class="pf-tourney-loc">${escapeHtml(tourneyAddress)}</span>
                    </div>
                </a>
            `;
        }
    }

    function formatTourneyDateRange(startIso, endIso) {
        if (!startIso && !endIso) return 'Oct 15th, 2026 - Oct 16th, 2026';
        const fmt = (iso) => {
            if (!iso) return '';
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) return '';
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const day = d.getDate();
            const suffix = (day % 10 === 1 && day !== 11) ? 'st'
                : (day % 10 === 2 && day !== 12) ? 'nd'
                : (day % 10 === 3 && day !== 13) ? 'rd' : 'th';
            return `${months[d.getMonth()]} ${day}${suffix}, ${d.getFullYear()}`;
        };
        const s = fmt(startIso);
        const e = fmt(endIso);
        if (s && e) return `${s} - ${e}`;
        return s || e || 'Oct 15th, 2026 - Oct 16th, 2026';
    }

    // =========================================================================
    // B. LOGIC TRANG PROFILE SETTINGS & ACCOUNT SETTINGS (/profile/settings)
    // =========================================================================
    const profileSettingsForm = document.getElementById('profileSettingsForm');
    if (!profileSettingsForm) return;

    const tabBtnProfile = document.getElementById('tabBtnProfile');
    const tabBtnAccount = document.getElementById('tabBtnAccount');
    const panelProfileSettings = document.getElementById('panelProfileSettings');
    const panelAccountSettings = document.getElementById('panelAccountSettings');

    // Mini card bên cột trái
    const settingsMiniAvatarImg = document.getElementById('settingsMiniAvatarImg');
    const settingsMiniAvatarInitial = document.getElementById('settingsMiniAvatarInitial');
    const settingsMiniTagName = document.getElementById('settingsMiniTagName');

    // Các trường trong Profile Settings
    const settingsAvatarImg = document.getElementById('settingsAvatarImg');
    const settingsAvatarInitial = document.getElementById('settingsAvatarInitial');
    const settingsAvatarInput = document.getElementById('settingsAvatarInput');
    const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
    const removeAvatarBtn = document.getElementById('removeAvatarBtn');

    const inputGamerTag = document.getElementById('inputGamerTag');
    const inputBio = document.getElementById('inputBio');
    const checkDisplayPronouns = document.getElementById('checkDisplayPronouns');
    const pronounsInputWrap = document.getElementById('pronounsInputWrap');
    const inputPronouns = document.getElementById('inputPronouns');
    const selectCountry = document.getElementById('selectCountry');
    const inputCity = document.getElementById('inputCity');
    const inputZipCode = document.getElementById('inputZipCode');
    const inputPhone = document.getElementById('inputPhone');
    const displayCityBtn = document.getElementById('displayCityBtn');
    const displayCityText = document.getElementById('displayCityText');
    const displayCityMenu = document.getElementById('displayCityMenu');
    const updateAccountBtn = document.getElementById('updateAccountBtn');

    let draftAvatarUrl = userProfile.avatarUrl;
    let draftDisplayCityMode = userProfile.displayCityMode || 'Display city';

    // Chuyển tab dựa theo query ?tab=profile hoặc ?tab=account
    function switchSettingsTab(tabName) {
        const isAccount = tabName === 'account';
        tabBtnProfile.classList.toggle('active', !isAccount);
        tabBtnAccount.classList.toggle('active', isAccount);
        panelProfileSettings.style.display = isAccount ? 'none' : 'block';
        panelAccountSettings.style.display = isAccount ? 'block' : 'none';

        const url = new URL(window.location.href);
        url.searchParams.set('tab', isAccount ? 'account' : 'profile');
        window.history.replaceState({}, '', url);
    }

    const initialTab = new URLSearchParams(window.location.search).get('tab') || 'profile';
    switchSettingsTab(initialTab);

    tabBtnProfile.addEventListener('click', () => switchSettingsTab('profile'));
    tabBtnAccount.addEventListener('click', () => switchSettingsTab('account'));

    // Nạp dữ liệu vào form Profile Settings
    function populateSettingsUI() {
        const initial = (userProfile.tagName.charAt(0) || 'T').toUpperCase();
        settingsMiniTagName.textContent = userProfile.tagName;
        settingsMiniAvatarInitial.textContent = initial;
        settingsAvatarInitial.textContent = initial;

        if (draftAvatarUrl) {
            settingsMiniAvatarImg.src = draftAvatarUrl;
            settingsMiniAvatarImg.style.display = 'block';
            settingsMiniAvatarInitial.style.display = 'none';

            settingsAvatarImg.src = draftAvatarUrl;
            settingsAvatarImg.style.display = 'block';
            settingsAvatarInitial.style.display = 'none';
            removeAvatarBtn.style.display = 'inline-block';
        } else {
            settingsMiniAvatarImg.src = '';
            settingsMiniAvatarImg.style.display = 'none';
            settingsMiniAvatarInitial.style.display = 'block';

            settingsAvatarImg.src = '';
            settingsAvatarImg.style.display = 'none';
            settingsAvatarInitial.style.display = 'block';
            removeAvatarBtn.style.display = 'none';
        }

        inputGamerTag.value = userProfile.tagName;
        inputBio.value = userProfile.bio;
        checkDisplayPronouns.checked = Boolean(userProfile.displayPronouns);
        pronounsInputWrap.style.display = checkDisplayPronouns.checked ? 'block' : 'none';
        inputPronouns.value = userProfile.pronouns || '';
        selectCountry.value = userProfile.country || 'Vietnam';
        inputCity.value = userProfile.city || '';
        inputZipCode.value = userProfile.zipCode || '';
        inputPhone.value = userProfile.phone || '';
        displayCityText.textContent = draftDisplayCityMode;
    }

    populateSettingsUI();

    function markProfileDirty() {
        updateAccountBtn.disabled = false;
        updateAccountBtn.classList.add('active');
    }

    [inputGamerTag, inputBio, inputPronouns, selectCountry, inputCity, inputZipCode, inputPhone].forEach(el => {
        el.addEventListener('input', markProfileDirty);
        el.addEventListener('change', markProfileDirty);
    });

    inputGamerTag.addEventListener('input', () => {
        const ch = (inputGamerTag.value.trim().charAt(0) || 'T').toUpperCase();
        settingsAvatarInitial.textContent = ch;
    });

    checkDisplayPronouns.addEventListener('change', () => {
        pronounsInputWrap.style.display = checkDisplayPronouns.checked ? 'block' : 'none';
        markProfileDirty();
    });

    // Tải ảnh đại diện mới
    uploadAvatarBtn.addEventListener('click', () => settingsAvatarInput.click());
    settingsAvatarInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 4 * 1024 * 1024) {
            showToast('Ảnh đại diện không được vượt quá 4MB', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            draftAvatarUrl = reader.result;
            settingsAvatarImg.src = draftAvatarUrl;
            settingsAvatarImg.style.display = 'block';
            settingsAvatarInitial.style.display = 'none';
            removeAvatarBtn.style.display = 'inline-block';
            markProfileDirty();
        };
        reader.readAsDataURL(file);
    });

    removeAvatarBtn.addEventListener('click', () => {
        draftAvatarUrl = '';
        settingsAvatarInput.value = '';
        settingsAvatarImg.src = '';
        settingsAvatarImg.style.display = 'none';
        settingsAvatarInitial.style.display = 'block';
        removeAvatarBtn.style.display = 'none';
        markProfileDirty();
    });

    // Dropdown Display city
    displayCityBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = displayCityMenu.style.display === 'none';
        displayCityMenu.style.display = isHidden ? 'block' : 'none';
    });

    displayCityMenu.querySelectorAll('.pfs-city-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            draftDisplayCityMode = opt.dataset.val;
            displayCityText.textContent = draftDisplayCityMode;
            displayCityMenu.style.display = 'none';
            markProfileDirty();
        });
    });

    document.addEventListener('click', () => {
        if (displayCityMenu) displayCityMenu.style.display = 'none';
    });

    // Lưu Profile Settings khi bấm Update Account
    profileSettingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newTag = inputGamerTag.value.trim();
        if (!newTag) {
            showToast('GamerTag không được để trống', 'error');
            inputGamerTag.focus();
            return;
        }

        saveUserProfile({
            tagName: newTag,
            bio: inputBio.value.trim(),
            displayPronouns: checkDisplayPronouns.checked,
            pronouns: inputPronouns.value.trim(),
            country: selectCountry.value,
            city: inputCity.value.trim(),
            zipCode: inputZipCode.value.trim(),
            phone: inputPhone.value.trim(),
            displayCityMode: draftDisplayCityMode,
            avatarUrl: draftAvatarUrl
        });

        populateSettingsUI();
        updateAccountBtn.disabled = true;
        updateAccountBtn.classList.remove('active');
        showToast('Account profile updated successfully!', 'success');
    });

    // =========================================================================
    // C. LOGIC ACCOUNT SETTINGS (Email, Password, Delete Account)
    // =========================================================================
    const currentEmailDisplay = document.getElementById('currentEmailDisplay');
    const toggleChangeEmailBtn = document.getElementById('toggleChangeEmailBtn');
    const changeEmailBox = document.getElementById('changeEmailBox');
    const inputNewEmail = document.getElementById('inputNewEmail');
    const saveNewEmailBtn = document.getElementById('saveNewEmailBtn');
    const cancelNewEmailBtn = document.getElementById('cancelNewEmailBtn');

    if (currentEmailDisplay) {
        currentEmailDisplay.textContent = userProfile.email;
    }

    toggleChangeEmailBtn.addEventListener('click', () => {
        const isHidden = changeEmailBox.style.display === 'none';
        changeEmailBox.style.display = isHidden ? 'flex' : 'none';
        if (isHidden) {
            inputNewEmail.value = userProfile.email;
            inputNewEmail.focus();
        }
    });

    cancelNewEmailBtn.addEventListener('click', () => {
        changeEmailBox.style.display = 'none';
    });

    saveNewEmailBtn.addEventListener('click', () => {
        const nextEmail = inputNewEmail.value.trim();
        if (!nextEmail || !nextEmail.includes('@')) {
            showToast('Please enter a valid email address.', 'error');
            return;
        }
        saveUserProfile({ email: nextEmail });
        currentEmailDisplay.textContent = nextEmail;
        changeEmailBox.style.display = 'none';
        showToast('Email updated successfully!', 'success');
    });

    // Password form
    const passwordSettingsForm = document.getElementById('passwordSettingsForm');
    const inputOldPassword = document.getElementById('inputOldPassword');
    const inputNewPassword = document.getElementById('inputNewPassword');
    const toggleNewPasswordEye = document.getElementById('toggleNewPasswordEye');
    const savePasswordBtn = document.getElementById('savePasswordBtn');

    function checkPasswordReady() {
        const ready = inputOldPassword.value.trim().length > 0 && inputNewPassword.value.trim().length > 0;
        savePasswordBtn.disabled = !ready;
        savePasswordBtn.classList.toggle('active', ready);
    }

    inputOldPassword.addEventListener('input', checkPasswordReady);
    inputNewPassword.addEventListener('input', checkPasswordReady);

    toggleNewPasswordEye.addEventListener('click', () => {
        const isPassword = inputNewPassword.type === 'password';
        inputNewPassword.type = isPassword ? 'text' : 'password';
    });

    passwordSettingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!inputOldPassword.value.trim() || !inputNewPassword.value.trim()) return;
        if (inputNewPassword.value.trim().length < 6) {
            showToast('New password must be at least 6 characters.', 'error');
            return;
        }
        inputOldPassword.value = '';
        inputNewPassword.value = '';
        checkPasswordReady();
        showToast('Password updated successfully!', 'success');
    });

    // Delete Account
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    deleteAccountBtn.addEventListener('click', () => {
        const confirmed = window.confirm('Are you sure you want to permanently delete your account? This cannot be undone.');
        if (!confirmed) return;
        sessionStorage.removeItem(STORAGE_KEY_PROFILE);
        window.location.href = '/login';
    });
});

import { showToast } from '../../common/toast.js';
import {
    escapeHtml,
    getCreatedTournaments,
    setActiveTournamentById,
    renderCirclePagination
} from '../../common/utils.js';
import { getStoredUserProfile, syncGlobalUserProfile } from '../../layouts/app-layout.js';

document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY_PROFILE = 'btp_user_profile';
    let userProfile = getStoredUserProfile();

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
        'Super Smash Bros. Ultimate': '/images/game2.png'
    };

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
        const organizedPagination = document.getElementById('organizedPagination');

        publicProfileTagName.textContent = userProfile.tagName;
        if (userCodeEl) userCodeEl.textContent = userProfile.userCode;
        if (joinedEl) {
            const joined = userProfile.joinedDate === 'October 2026' ? 'Tháng 10, 2026' : userProfile.joinedDate;
            joinedEl.textContent = joined;
        }

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

        // Đại từ nhân xưng
        if (pronounsEl) {
            if (userProfile.displayPronouns && userProfile.pronouns.trim()) {
                pronounsEl.textContent = userProfile.pronouns.trim();
                pronounsEl.style.display = 'inline-block';
            } else {
                pronounsEl.style.display = 'none';
            }
        }

        // Tiểu sử
        if (bioEl) {
            if (userProfile.bio.trim()) {
                bioEl.textContent = userProfile.bio.trim();
                bioEl.style.display = 'block';
            } else {
                bioEl.style.display = 'none';
            }
        }

        // Địa điểm (Thành phố + Quốc gia hoặc chỉ Quốc gia)
        if (locationEl) {
            const countryLabel = userProfile.country === 'Vietnam' ? 'Việt Nam' : userProfile.country;
            const showCity = (userProfile.displayCityMode === 'Hiển thị thành phố' || userProfile.displayCityMode === 'Display city') && userProfile.city.trim();
            locationEl.textContent = showCity
                ? `${userProfile.city.trim()}, ${countryLabel}`
                : countryLabel;
        }

        // Danh sách giải đấu đã tổ chức (GIẢI ĐẤU ĐÃ TỔ CHỨC) + Phân trang (3 giải đấu/trang)
        if (organizedList) {
            const createdList = getCreatedTournaments();
            const items = createdList.length > 0
                ? createdList.map(entry => {
                    const d = entry?.details || entry || {};
                    const g = entry?.gameInfo || {};
                    const gameName = g.game || 'Liên Minh Huyền Thoại';
                    const resolvedName = entry?.name || d.name || 'Nguyễn Quân';
                    const resolvedAddress = (entry?.venueAddress ?? d.venueAddress ?? '').trim() || 'Hà Nội, Việt Nam';
                    const resolvedStart = entry?.startDate || d.startDate || '';
                    const resolvedEnd = entry?.endDate || d.endDate || '';
                    return {
                        id: entry?.id || resolvedName || 'default',
                        name: resolvedName,
                        address: resolvedAddress,
                        dateRangeText: formatTourneyDateRange(resolvedStart, resolvedEnd),
                        img: entry?.profileImg || GAME_IMAGES[gameName] || '/images/logo.png'
                    };
                })
                : [
                    {
                        id: 'default',
                        name: 'Nguyễn Quân',
                        address: 'Hà Nội, Việt Nam',
                        dateRangeText: '15 Thg 10, 2026 - 16 Thg 10, 2026',
                        img: '/images/logo.png'
                    }
                ];

            const ITEMS_PER_PAGE = 3;
            let currentOrgPage = 1;

            function renderOrganizedPage() {
                const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
                if (currentOrgPage > totalPages) currentOrgPage = totalPages;

                const startIdx = (currentOrgPage - 1) * ITEMS_PER_PAGE;
                const pagedItems = items.slice(startIdx, startIdx + ITEMS_PER_PAGE);

                organizedList.innerHTML = pagedItems.map(item => `
                    <a href="/tournament/home" class="pf-tourney-item" data-tourney-id="${escapeHtml(item.id)}">
                        <img src="${escapeHtml(item.img)}" alt="${escapeHtml(item.name)}" class="pf-tourney-thumb">
                        <div class="pf-tourney-info">
                            <span class="pf-tourney-date">${escapeHtml(item.dateRangeText)}</span>
                            <strong class="pf-tourney-name">${escapeHtml(item.name)}</strong>
                            <span class="pf-tourney-loc">${escapeHtml(item.address)}</span>
                        </div>
                    </a>
                `).join('');

                organizedList.querySelectorAll('.pf-tourney-item').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const targetId = link.getAttribute('data-tourney-id');
                        if (targetId && targetId !== 'default') {
                            setActiveTournamentById(targetId);
                        }
                        window.location.href = '/tournament/home';
                    });
                });

                renderCirclePagination(organizedPagination, currentOrgPage, totalPages, (nextPage) => {
                    currentOrgPage = nextPage;
                    renderOrganizedPage();
                });
            }

            renderOrganizedPage();
        }
    }

    function formatTourneyDateRange(startIso, endIso) {
        if (!startIso && !endIso) return '15 Thg 10, 2026 - 16 Thg 10, 2026';
        const fmt = (iso) => {
            if (!iso) return '';
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) return '';
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            return `${day} Thg ${month}, ${d.getFullYear()}`;
        };
        const s = fmt(startIso);
        const e = fmt(endIso);
        if (s && e) return `${s} - ${e}`;
        return s || e || '15 Thg 10, 2026 - 16 Thg 10, 2026';
    }

    // =========================================================================
    // B. LOGIC TRANG CÀI ĐẶT HỒ SƠ & TÀI KHOẢN (/profile/settings)
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

    // Các trường trong Cài đặt hồ sơ
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
    let draftDisplayCityMode = (userProfile.displayCityMode === 'Hide city')
        ? 'Ẩn thành phố'
        : 'Hiển thị thành phố';

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

    // Nạp dữ liệu vào form Cài đặt hồ sơ
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
        selectCountry.value = (userProfile.country === 'Vietnam') ? 'Việt Nam' : (userProfile.country || 'Việt Nam');
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
            showToast('Ảnh đại diện không được vượt quá 4MB.', 'error');
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

    // Dropdown Hiển thị thành phố
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

    // Lưu Cài đặt hồ sơ khi bấm Cập nhật hồ sơ
    profileSettingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newTag = inputGamerTag.value.trim();
        if (!newTag) {
            showToast('Tên hiển thị (GamerTag) không được để trống.', 'error');
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
        showToast('Đã cập nhật hồ sơ cá nhân thành công!', 'success');
    });

    // =========================================================================
    // C. LOGIC CÀI ĐẶT TÀI KHOẢN (Email, Mật khẩu, Xóa tài khoản)
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
            showToast('Vui lòng nhập địa chỉ email hợp lệ.', 'error');
            return;
        }
        saveUserProfile({ email: nextEmail });
        currentEmailDisplay.textContent = nextEmail;
        changeEmailBox.style.display = 'none';
        showToast('Đã cập nhật địa chỉ email thành công!', 'success');
    });

    // Đổi mật khẩu
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
            showToast('Mật khẩu mới phải có ít nhất 6 ký tự.', 'error');
            return;
        }
        inputOldPassword.value = '';
        inputNewPassword.value = '';
        checkPasswordReady();
        showToast('Đã cập nhật mật khẩu thành công!', 'success');
    });

    // Xóa tài khoản
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    deleteAccountBtn.addEventListener('click', () => {
        const confirmed = window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản của mình? Hành động này không thể hoàn tác.');
        if (!confirmed) return;
        sessionStorage.removeItem(STORAGE_KEY_PROFILE);
        window.location.href = '/login';
    });
});

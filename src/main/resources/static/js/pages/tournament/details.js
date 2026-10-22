import { CONTACT_ICONS } from '../../common/icons.js';
import { showToast } from '../../common/toast.js';
import { renderMarkdownToHtml, syncActiveTournamentToList } from '../../common/utils.js';
import { syncSidebarIdentity } from '../../layouts/tournament-layout.js';

document.addEventListener('DOMContentLoaded', () => {
    // ===== 1. NẠP DỮ LIỆU & XỬ LÝ CARD DETAILS =====
    const detailsForm = document.getElementById('detailsForm');
    const nameInput = document.getElementById('tournamentName');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const venueInput = document.getElementById('venueAddress');
    const locateMeBtn = document.getElementById('locateMeBtn');
    const venueSuggestions = document.getElementById('venueSuggestions');
    const venueAutocompleteWrap = document.getElementById('venueAutocompleteWrap');
    const venueMapPreviewWrap = document.getElementById('venueMapPreviewWrap');
    const venueMapPreviewIframe = document.getElementById('venueMapPreviewIframe');
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
        name: parsedStored?.name || urlParams.get('name') || nameInput.value || 'Giải đấu mới',
        startDate: parsedStored?.startDate || urlParams.get('startDate') || startDateInput.value || '2026-10-16T11:00',
        endDate: parsedStored?.endDate || urlParams.get('endDate') || endDateInput.value || '2026-10-18T00:30',
        venueAddress: parsedStored?.venueAddress || venueInput.value || '',
        venueLat: parsedStored?.venueLat || null,
        venueLon: parsedStored?.venueLon || null,
        contactType: (parsedStored?.contactType === 'DISCORD' || parsedStored?.contactType === 'Discord') ? 'DISCORD' : 'EMAIL',
        contact: parsedStored?.contact || urlParams.get('contact') || contactValueInput.value || 'quannguyen041026@gmail.com'
    };

    let currentVenueLat = savedDetailsState.venueLat;
    let currentVenueLon = savedDetailsState.venueLon;

    // Danh sách gợi ý địa điểm phổ biến hỗ trợ tìm nhanh tức thì
    const POPULAR_VENUES = [
        { main: 'Nhà thi đấu Cầu Giấy', sub: '35 Trần Quý Kiên, Dịch Vọng, Cầu Giấy, Hà Nội, Việt Nam', lat: 21.0368, lon: 105.7905 },
        { main: 'Trung tâm Hội nghị Quốc gia', sub: 'Đại lộ Thăng Long, Mễ Trì, Nam Từ Liêm, Hà Nội, Việt Nam', lat: 21.0056, lon: 105.7894 },
        { main: 'Đại học Bách Khoa Hà Nội', sub: 'Số 1 Đại Cồ Việt, Bách Khoa, Hai Bà Trưng, Hà Nội, Việt Nam', lat: 21.0071, lon: 105.8432 },
        { main: 'Nhà thi đấu Quân khu 7', sub: '202 Hoàng Văn Thụ, Phường 9, Phú Nhuận, TP. Hồ Chí Minh, Việt Nam', lat: 10.7998, lon: 106.6703 },
        { main: 'Nhà thi đấu Phú Thọ', sub: '219 Lý Thường Kiệt, Phường 15, Quận 11, TP. Hồ Chí Minh, Việt Nam', lat: 10.7695, lon: 106.6584 },
        { main: 'Cung Thể thao Tiên Sơn', sub: 'Phan Đăng Lưu, Hòa Cường Bắc, Hải Châu, Đà Nẵng, Việt Nam', lat: 16.0365, lon: 108.2256 },
        { main: 'Vikings Esports Arena', sub: 'Tầng 5, MAC Plaza, 10 Trần Phú, Hà Đông, Hà Nội, Việt Nam', lat: 20.9806, lon: 105.7876 }
    ];

    function updateVenueMapPreview(address, lat = null, lon = null) {
        const cleanAddress = (address || '').trim();
        if (!cleanAddress) {
            venueMapPreviewWrap.style.display = 'none';
            venueMapPreviewIframe.src = '';
            return;
        }
        const query = (lat && lon) ? `${lat},${lon}` : cleanAddress;
        const encoded = encodeURIComponent(query);
        venueMapPreviewIframe.src = `https://maps.google.com/maps?q=${encoded}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        venueMapPreviewWrap.style.display = 'block';
    }

    // Đồng bộ trực tiếp địa điểm sang sessionStorage để trang Home luôn lấy đúng địa chỉ gốc từ Details
    function syncVenueToSession(address, lat = null, lon = null) {
        const currentStoredRaw = sessionStorage.getItem('btp_tournament_data');
        const currentStored = currentStoredRaw ? JSON.parse(currentStoredRaw) : { ...savedDetailsState };
        currentStored.venueAddress = (address || '').trim();
        currentStored.venueLat = lat;
        currentStored.venueLon = lon;
        sessionStorage.setItem('btp_tournament_data', JSON.stringify(currentStored));
        syncActiveTournamentToList();
    }

    function updateContactUI() {
        const type = contactTypeSelect.value;
        const svg = CONTACT_ICONS[type] || CONTACT_ICONS.EMAIL;
        contactTypeIcon.innerHTML = svg;
        contactValueIcon.innerHTML = svg;
        contactValueInput.placeholder = type === 'EMAIL' ? 'hello@btp.vn' : 'https://discord.gg/yourserver';
    }

    function initDetailsFields() {
        nameInput.value = savedDetailsState.name;
        startDateInput.value = savedDetailsState.startDate;
        endDateInput.value = savedDetailsState.endDate;
        venueInput.value = savedDetailsState.venueAddress;
        contactTypeSelect.value = savedDetailsState.contactType;
        contactValueInput.value = savedDetailsState.contact;
        updateContactUI();
        updateVenueMapPreview(savedDetailsState.venueAddress, savedDetailsState.venueLat, savedDetailsState.venueLon);
    }

    initDetailsFields();

    // ===== XỬ LÝ GỢI Ý ĐỊA CHỈ (AUTOCOMPLETE) & ĐỊNH VỊ GPS =====
    let debounceTimer = null;
    let activeAbortController = null;

    const PIN_SVG = `<svg class="venue-suggestion-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clip-rule="evenodd"/>
    </svg>`;

    function renderSuggestionsList(items) {
        if (!items || items.length === 0) {
            venueSuggestions.innerHTML = `<div class="venue-suggestion-status">Không tìm thấy địa điểm phù hợp. Bạn vẫn có thể nhập trực tiếp địa chỉ.</div>`;
            venueSuggestions.style.display = 'block';
            return;
        }

        venueSuggestions.innerHTML = items.map((item, idx) => `
            <div class="venue-suggestion-item" data-index="${idx}">
                ${PIN_SVG}
                <div class="venue-suggestion-text">
                    <span class="venue-suggestion-main">${item.main}</span>
                    <span class="venue-suggestion-sub">${item.sub}</span>
                </div>
            </div>
        `).join('');

        venueSuggestions.querySelectorAll('.venue-suggestion-item').forEach(el => {
            el.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const idx = Number(el.getAttribute('data-index'));
                const chosen = items[idx];
                if (!chosen) return;

                const fullAddress = chosen.fullAddress || `${chosen.main}, ${chosen.sub}`;
                venueInput.value = fullAddress;
                currentVenueLat = chosen.lat || null;
                currentVenueLon = chosen.lon || null;
                venueSuggestions.style.display = 'none';

                updateVenueMapPreview(fullAddress, currentVenueLat, currentVenueLon);
                syncVenueToSession(fullAddress, currentVenueLat, currentVenueLon);
                checkDetailsState();
            });
        });

        venueSuggestions.style.display = 'block';
    }

    async function fetchAddressSuggestions(query) {
        const cleanQuery = query.trim();

        const lowerQ = cleanQuery.toLowerCase();
        const localMatches = POPULAR_VENUES.filter(v =>
            !cleanQuery ||
            v.main.toLowerCase().includes(lowerQ) ||
            v.sub.toLowerCase().includes(lowerQ)
        ).slice(0, 4).map(v => ({
            main: v.main,
            sub: v.sub,
            fullAddress: `${v.main}, ${v.sub}`,
            lat: v.lat,
            lon: v.lon
        }));

        if (cleanQuery.length < 2) {
            renderSuggestionsList(localMatches);
            return;
        }

        if (localMatches.length > 0) {
            renderSuggestionsList(localMatches);
        } else {
            venueSuggestions.innerHTML = `<div class="venue-suggestion-status">Đang định vị và tìm gợi ý địa chỉ...</div>`;
            venueSuggestions.style.display = 'block';
        }

        if (activeAbortController) {
            activeAbortController.abort();
        }
        activeAbortController = new AbortController();

        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&accept-language=vi&q=${encodeURIComponent(cleanQuery)}`;
            const res = await fetch(url, {
                signal: activeAbortController.signal,
                headers: { 'Accept': 'application/json' }
            });
            if (!res.ok) throw new Error('Geocoding error');
            const data = await res.json();

            const apiItems = data.map(place => {
                const parts = (place.display_name || '').split(',').map(s => s.trim());
                const main = place.name || parts[0] || cleanQuery;
                const sub = parts.slice(1).join(', ') || place.display_name;
                return {
                    main,
                    sub,
                    fullAddress: place.display_name,
                    lat: place.lat ? parseFloat(place.lat) : null,
                    lon: place.lon ? parseFloat(place.lon) : null
                };
            });

            const merged = [...apiItems];
            localMatches.forEach(loc => {
                if (!merged.some(m => m.fullAddress === loc.fullAddress)) {
                    merged.push(loc);
                }
            });

            renderSuggestionsList(merged.slice(0, 6));
        } catch (err) {
            if (err.name === 'AbortError') return;
            renderSuggestionsList(localMatches);
        }
    }

    venueInput.addEventListener('focus', () => {
        fetchAddressSuggestions(venueInput.value);
    });

    venueInput.addEventListener('input', () => {
        currentVenueLat = null;
        currentVenueLon = null;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            fetchAddressSuggestions(venueInput.value);
            updateVenueMapPreview(venueInput.value);
            syncVenueToSession(venueInput.value, null, null);
        }, 280);
    });

    document.addEventListener('click', (e) => {
        if (venueAutocompleteWrap && !venueAutocompleteWrap.contains(e.target)) {
            venueSuggestions.style.display = 'none';
        }
    });

    locateMeBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            showToast('Trình duyệt của bạn không hỗ trợ định vị GPS.');
            return;
        }

        locateMeBtn.disabled = true;
        const originalHtml = locateMeBtn.innerHTML;
        locateMeBtn.innerHTML = `<span>Đang định vị...</span>`;

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                currentVenueLat = latitude;
                currentVenueLon = longitude;

                try {
                    const url = `https://nominatim.openstreetmap.org/reverse?format=json&accept-language=vi&lat=${latitude}&lon=${longitude}`;
                    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
                    const data = await res.json();
                    const detectedAddress = data?.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

                    venueInput.value = detectedAddress;
                    venueSuggestions.style.display = 'none';
                    updateVenueMapPreview(detectedAddress, latitude, longitude);
                    syncVenueToSession(detectedAddress, latitude, longitude);
                    checkDetailsState();
                    showToast('Đã định vị địa chỉ hiện tại thành công.');
                } catch (err) {
                    const fallbackCoord = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                    venueInput.value = fallbackCoord;
                    updateVenueMapPreview(fallbackCoord, latitude, longitude);
                    syncVenueToSession(fallbackCoord, latitude, longitude);
                    checkDetailsState();
                } finally {
                    locateMeBtn.disabled = false;
                    locateMeBtn.innerHTML = originalHtml;
                }
            },
            () => {
                locateMeBtn.disabled = false;
                locateMeBtn.innerHTML = originalHtml;
                showToast('Không thể truy cập vị trí. Vui lòng cấp quyền định vị cho trình duyệt.');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });

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

        if (!currentName || !currentStart || !currentEnd || !currentContact) {
            saveDetailsBtn.disabled = true;
            return false;
        }

        if (new Date(currentEnd) <= new Date(currentStart)) {
            detailsErrorMsg.textContent = 'Thời gian kết thúc phải sau thời gian bắt đầu.';
            detailsErrorMsg.style.display = 'block';
            saveDetailsBtn.disabled = true;
            return false;
        }

        if (currentType === 'EMAIL') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(currentContact)) {
                detailsErrorMsg.textContent = 'Vui lòng nhập địa chỉ email hợp lệ.';
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
        saveDetailsBtn.textContent = 'Đang lưu...';

        setTimeout(() => {
            savedDetailsState.name = nameInput.value.trim();
            savedDetailsState.startDate = startDateInput.value;
            savedDetailsState.endDate = endDateInput.value;
            savedDetailsState.venueAddress = venueInput.value.trim();
            savedDetailsState.venueLat = currentVenueLat;
            savedDetailsState.venueLon = currentVenueLon;
            savedDetailsState.contactType = contactTypeSelect.value;
            savedDetailsState.contact = contactValueInput.value.trim();

            sessionStorage.setItem('btp_tournament_data', JSON.stringify(savedDetailsState));
            syncActiveTournamentToList();
            syncSidebarIdentity(savedDetailsState.name, savedImagesState.profile, savedImagesState.banner);
            updateVenueMapPreview(savedDetailsState.venueAddress, savedDetailsState.venueLat, savedDetailsState.venueLon);

            saveDetailsBtn.textContent = 'Lưu thay đổi';
            checkDetailsState();
            showToast('Đã lưu thông tin chi tiết giải đấu thành công.');
        }, 300);
    });

    // ===== 2. XỬ LÝ PHẦN IMAGES (PROFILE & BANNER) =====
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

        const maxSizeBytes = 4 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            errorEl.textContent = 'Dung lượng ảnh vượt quá giới hạn tối đa 4MB.';
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
                        errorEl.textContent = `Kích thước ảnh (${w}x${h}) nằm ngoài khoảng khuyến nghị 280x280 - 4800x4800.`;
                        errorEl.style.display = 'block';
                    }
                } else {
                    if (w < 1600 || h < 800 || w > 4800 || h > 2400) {
                        errorEl.textContent = `Kích thước ảnh (${w}x${h}) nằm ngoài khoảng khuyến nghị 1600x800 - 4800x2400.`;
                        errorEl.style.display = 'block';
                    }
                }
                updateImageBoxUI(type, dataUrl);
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    }

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
        saveImagesBtn.textContent = 'Đang lưu...';

        setTimeout(() => {
            savedImagesState.profile = currentProfileData;
            savedImagesState.banner = currentBannerData;
            sessionStorage.setItem('btp_tournament_profile_img', currentProfileData);
            sessionStorage.setItem('btp_tournament_banner_img', currentBannerData);
            syncActiveTournamentToList();

            syncSidebarIdentity(savedDetailsState.name, savedImagesState.profile, savedImagesState.banner);

            saveImagesBtn.textContent = 'Lưu thay đổi';
            checkImagesDirty();
            showToast('Đã lưu hình ảnh giải đấu thành công.');
        }, 300);
    });

    // ===== 3. XỬ LÝ PHẦN RULES & MARKDOWN PREVIEW =====
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
            previewMarkdownBtn.textContent = 'Chỉnh sửa Markdown';
        } else {
            rulesPreviewWrap.style.display = 'none';
            rulesEditorWrap.style.display = 'block';
            previewMarkdownBtn.textContent = 'Xem trước Markdown';
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
        saveRulesBtn.textContent = 'Đang lưu...';

        setTimeout(() => {
            savedRulesText = rulesInput.value;
            sessionStorage.setItem('btp_tournament_rules', savedRulesText);
            syncActiveTournamentToList();
            saveRulesBtn.textContent = 'Lưu thay đổi';
            checkRulesDirty();
            showToast('Đã lưu điều lệ giải đấu thành công.');
        }, 300);
    });
});

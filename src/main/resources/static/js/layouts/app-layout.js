export function getStoredUserProfile() {
    const raw = sessionStorage.getItem('btp_user_profile');
    let parsed = null;
    try {
        parsed = raw ? JSON.parse(raw) : null;
    } catch {
        parsed = null;
    }
    return {
        tagName: (parsed?.tagName || 'tungquan').trim(),
        userCode: parsed?.userCode || 'f4c0f609',
        joinedDate: parsed?.joinedDate || 'October 2026',
        prefix: parsed?.prefix || '',
        bio: parsed?.bio || '',
        displayPronouns: Boolean(parsed?.displayPronouns),
        pronouns: parsed?.pronouns || '',
        country: parsed?.country || 'Vietnam',
        city: parsed?.city || '',
        zipCode: parsed?.zipCode || '',
        phone: parsed?.phone || '',
        displayCityMode: parsed?.displayCityMode || 'Display city',
        birthday: parsed?.birthday || '2002-01-10',
        email: parsed?.email || 'quanquan4101990@gmail.com',
        avatarUrl: parsed?.avatarUrl || '',
        bannerUrl: parsed?.bannerUrl || ''
    };
}

export function syncGlobalUserProfile() {
    const profile = getStoredUserProfile();
    const initial = (profile.tagName.charAt(0) || 'T').toUpperCase();

    const sidebarImg = document.getElementById('sidebarUserAvatarImg');
    const sidebarInitial = document.getElementById('sidebarUserAvatarInitial');
    const popoverImg = document.getElementById('popoverUserAvatarImg');
    const popoverInitial = document.getElementById('popoverUserAvatarInitial');
    const popoverTag = document.getElementById('popoverUserTagName');

    if (sidebarInitial) sidebarInitial.textContent = initial;
    if (popoverInitial) popoverInitial.textContent = initial;
    if (popoverTag) popoverTag.textContent = profile.tagName;

    if (sidebarImg && sidebarInitial) {
        if (profile.avatarUrl) {
            sidebarImg.src = profile.avatarUrl;
            sidebarImg.style.display = 'block';
            sidebarInitial.style.display = 'none';
        } else {
            sidebarImg.src = '';
            sidebarImg.style.display = 'none';
            sidebarInitial.style.display = 'block';
        }
    }

    if (popoverImg && popoverInitial) {
        if (profile.avatarUrl) {
            popoverImg.src = profile.avatarUrl;
            popoverImg.style.display = 'block';
            popoverInitial.style.display = 'none';
        } else {
            popoverImg.src = '';
            popoverImg.style.display = 'none';
            popoverInitial.style.display = 'block';
        }
    }
}

export function initAppSidebar() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const tournamentSidebar = document.getElementById('tournamentSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const logoutBtn = document.getElementById('logoutBtn');
    const sidebarProfileBtn = document.getElementById('sidebarProfileBtn');
    const sidebarProfilePopover = document.getElementById('sidebarProfilePopover');

    syncGlobalUserProfile();

    if (mobileMenuBtn && sidebar && sidebarOverlay && !mobileMenuBtn.dataset.bound) {
        mobileMenuBtn.dataset.bound = 'true';
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

    if (sidebarProfileBtn && sidebarProfilePopover && !sidebarProfileBtn.dataset.bound) {
        sidebarProfileBtn.dataset.bound = 'true';
        sidebarProfileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = sidebarProfilePopover.style.display === 'none' || !sidebarProfilePopover.style.display;
            sidebarProfilePopover.style.display = isHidden ? 'block' : 'none';
        });

        document.addEventListener('click', (e) => {
            if (
                sidebarProfilePopover.style.display === 'block' &&
                !sidebarProfilePopover.contains(e.target) &&
                !sidebarProfileBtn.contains(e.target)
            ) {
                sidebarProfilePopover.style.display = 'none';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebarProfilePopover.style.display === 'block') {
                sidebarProfilePopover.style.display = 'none';
            }
        });
    }

    if (logoutBtn && !logoutBtn.dataset.bound) {
        logoutBtn.dataset.bound = 'true';
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/login';
        });
    }
}

document.addEventListener('DOMContentLoaded', initAppSidebar);

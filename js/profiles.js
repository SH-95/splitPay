// 프로필 관리 전용 JavaScript (고유 ID 시스템)
let confirmCallback = null;
let editingProfileId = null;

// LocalStorage 키
const STORAGE_KEYS = {
    CURRENT_USER: 'dutchpay_current_user',
    USER_DATA: 'dutchpay_user_data',
    PROFILES: 'dutchpay_profiles'
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeProfiles();
    loadProfiles();
    setupEventListeners();
});

// 프로필 시스템 초기화
function initializeProfiles() {
    let profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '{}');
    
    // 기본 guest 프로필이 없으면 생성
    if (!profiles['guest_001']) {
        profiles['guest_001'] = {
            id: 'guest_001',
            name: 'guest',
            created: Date.now()
        };
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    document.getElementById('newProfileName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addProfile();
        }
    });
}

// 뒤로 가기
function goBack() {
    window.location.href = 'index.html';
}

// 고유 ID 생성
function generateProfileId(name) {
    const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '{}');
    let counter = 1;
    let baseId = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!baseId) baseId = 'profile';
    
    let newId = `${baseId}_${String(counter).padStart(3, '0')}`;
    
    while (profiles[newId]) {
        counter++;
        newId = `${baseId}_${String(counter).padStart(3, '0')}`;
    }
    
    return newId;
}

// 프로필 추가
function addProfile() {
    const nameInput = document.getElementById('newProfileName');
    const profileName = nameInput.value.trim();
    
    if (profileName === '') {
        showToast(t('enterProfileName'));
        return;
    }
    
    // 기존 프로필 이름 중복 확인
    const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '{}');
    const existingNames = Object.values(profiles).map(p => p.name);
    if (existingNames.includes(profileName)) {
        showToast(t('profileExists'));
        return;
    }
    
    // 새 프로필 생성
    const newProfileId = generateProfileId(profileName);
    profiles[newProfileId] = {
        id: newProfileId,
        name: profileName,
        created: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    
    // 새 프로필용 빈 데이터 초기화
    const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
    userData[newProfileId] = {
        'default': {
            participants: [],
            expenses: [],
            lastUpdated: Date.now()
        }
    };
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    
    // 입력 필드 초기화 및 목록 새로고침
    nameInput.value = '';
    loadProfiles();
    
    showToast(`"${profileName}" ${t('profileAdded')}`);
}

// 프로필 삭제
function deleteProfile(profileId) {
    const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '{}');
    const profile = profiles[profileId];
    
    if (!profile) return;
    
    showConfirm(
        t('confirm'),
        `"${profile.name}" ${t('deleteProfileConfirm')}`,
        () => {
            // 프로필 삭제
            delete profiles[profileId];
            localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
            
            // 관련 사용자 데이터 삭제
            const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
            delete userData[profileId];
            localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
            
            // 현재 사용자가 삭제된 프로필인 경우 guest로 변경
            const currentUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
            if (currentUserId === profileId) {
                localStorage.setItem(STORAGE_KEYS.CURRENT_USER, 'guest_001');
            }
            
            loadProfiles();
            showToast(`"${profile.name}" ${t('profileDeleted')}`);
        }
    );
}

// 프로필 편집 시작
function editProfile(profileId) {
    const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '{}');
    const profile = profiles[profileId];
    
    if (!profile) return;
    
    editingProfileId = profileId;
    
    const profileCard = document.querySelector(`[data-profile-id="${profileId}"]`);
    const nameElement = profileCard.querySelector('.profile-name-text');
    const currentName = profile.name;
    
    // 편집 모드로 전환
    nameElement.innerHTML = `
        <input type="text" id="editProfileInput" value="${currentName}" class="profile-edit-input" maxlength="20">
        <div class="profile-edit-actions">
            <button onclick="saveProfileEdit()" class="btn-save" title="${t('save')}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            <button onclick="cancelProfileEdit()" class="btn-cancel" title="${t('cancel')}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        </div>
    `;
    
    // 입력 필드에 포커스
    document.getElementById('editProfileInput').focus();
    document.getElementById('editProfileInput').select();
    
    // 엔터 키 이벤트 추가
    document.getElementById('editProfileInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveProfileEdit();
        } else if (e.key === 'Escape') {
            cancelProfileEdit();
        }
    });
}

// 프로필 편집 저장
function saveProfileEdit() {
    if (!editingProfileId) return;
    
    const input = document.getElementById('editProfileInput');
    const newName = input.value.trim();
    
    if (newName === '') {
        showToast(t('enterProfileName'));
        return;
    }
    
    const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '{}');
    const currentProfile = profiles[editingProfileId];
    
    if (!currentProfile) {
        cancelProfileEdit();
        return;
    }
    
    // 기존 이름과 같으면 취소
    if (newName === currentProfile.name) {
        cancelProfileEdit();
        return;
    }
    
    // 다른 프로필과 이름 중복 확인
    const existingNames = Object.values(profiles)
        .filter(p => p.id !== editingProfileId)
        .map(p => p.name);
    
    if (existingNames.includes(newName)) {
        showToast(t('profileExists'));
        return;
    }
    
    // 프로필 이름 업데이트
    profiles[editingProfileId].name = newName;
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    
    editingProfileId = null;
    loadProfiles();
    showToast(`"${newName}" ${t('profileUpdated')}`);
}

// 프로필 편집 취소
function cancelProfileEdit() {
    editingProfileId = null;
    loadProfiles();
}

// 프로필 목록 로드
function loadProfiles() {
    const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '{}');
    const currentUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'guest_001';
    const container = document.getElementById('profilesList');
    
    const profileList = Object.values(profiles).sort((a, b) => {
        // 현재 사용중인 프로필을 맨 위로
        if (a.id === currentUserId) return -1;
        if (b.id === currentUserId) return 1;
        // guest를 그 다음으로
        if (a.name === 'guest') return -1;
        if (b.name === 'guest') return 1;
        // 나머지는 생성일 순
        return b.created - a.created;
    });
    
    if (profileList.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                <p>${t('noProfiles')}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = profileList.map(profile => {
        const isCurrentUser = profile.id === currentUserId;
        const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
        const categoryCount = userData[profile.id] ? Object.keys(userData[profile.id]).length : 0;
        
        return `
            <div class="profile-card ${isCurrentUser ? 'current-profile' : ''}" data-profile-id="${profile.id}">
                <div class="profile-info">
                    <div class="profile-name">
                        <div class="profile-name-text">
                            ${profile.name}
                            ${isCurrentUser ? `<span class="current-badge" data-i18n="currentlyUsing">${t('currentlyUsing')}</span>` : ''}
                        </div>
                    </div>
                    <div class="profile-stats">
                        <span data-i18n="categories">${t('categories')}</span> ${categoryCount}<span data-i18n="people">${t('people')}</span>
                    </div>
                </div>
                <div class="profile-actions">
                    ${!isCurrentUser ? `<button onclick="switchProfile('${profile.id}')" class="btn-switch" data-i18n="select">${t('select')}</button>` : ''}
                    <button onclick="editProfile('${profile.id}')" class="btn-edit" data-i18n-title="edit" title="${t('edit')}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button onclick="deleteProfile('${profile.id}')" class="btn-delete" data-i18n-title="delete" title="${t('delete')}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// 프로필 전환
function switchProfile(profileId) {
    const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '{}');
    const profile = profiles[profileId];
    
    if (!profile) return;
    
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, profileId);
    loadProfiles();
    showToast(`"${profile.name}" ${t('profileSwitched')}`);
}

// 성공 메시지 표시
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 2000);
    }, 100);
}

// 확인 모달 표시
function showConfirm(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    
    // \\n을 실제 줄바꿈으로 변환
    const messageElement = document.getElementById('confirmMessage');
    messageElement.innerHTML = message.replace(/\\n/g, '<br>');
    
    confirmCallback = callback;
    document.getElementById('confirmModal').style.display = 'flex';
}

// 확인 액션 실행
function confirmAction() {
    if (confirmCallback) {
        confirmCallback();
        confirmCallback = null;
    }
    closeConfirmModal();
}

// 확인 모달 닫기
function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    confirmCallback = null;
}
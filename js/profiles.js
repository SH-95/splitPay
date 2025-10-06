// 프로필 관리 전용 JavaScript
let confirmCallback = null;

// LocalStorage 키
const STORAGE_KEYS = {
    CURRENT_USER: 'dutchpay_current_user',
    USER_DATA: 'dutchpay_user_data'
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    loadProfiles();
    setupEventListeners();
});

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

// 프로필 추가
function addProfile() {
    const nameInput = document.getElementById('newProfileName');
    const profileName = nameInput.value.trim();
    
    if (profileName === '') {
        alert('프로필 이름을 입력해주세요.');
        return;
    }
    
    if (profileName === 'guest') {
        alert('게스트는 기본 프로필입니다. 다른 이름을 사용해주세요.');
        return;
    }
    
    // 기존 프로필 중복 확인
    const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
    if (userData[profileName]) {
        alert('이미 존재하는 프로필입니다.');
        return;
    }
    
    // 새 프로필 생성 (빈 데이터로 초기화)
    userData[profileName] = {
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
    
    // 성공 메시지
    showSuccessMessage(`"${profileName}" 프로필이 추가되었습니다.`);
}

// 프로필 삭제
function deleteProfile(profileName) {
    if (profileName === 'guest') {
        alert('게스트 프로필은 삭제할 수 없습니다.');
        return;
    }
    
    showConfirm(
        '프로필 삭제',
        `"${profileName}" 프로필을 삭제하시겠습니까?\\n모든 카테고리와 데이터가 완전히 삭제되며, 이 작업은 되돌릴 수 없습니다.`,
        () => {
            const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
            delete userData[profileName];
            localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
            
            // 현재 사용자가 삭제된 프로필인 경우 guest로 변경
            const currentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
            if (currentUser === profileName) {
                localStorage.setItem(STORAGE_KEYS.CURRENT_USER, 'guest');
            }
            
            loadProfiles();
            showSuccessMessage(`"${profileName}" 프로필이 삭제되었습니다.`);
        }
    );
}

// 프로필 목록 로드
function loadProfiles() {
    const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
    const currentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'guest';
    const container = document.getElementById('profilesList');
    
    // 모든 프로필 목록 (guest 포함)
    const allProfiles = ['guest', ...Object.keys(userData)];
    
    if (allProfiles.length === 1) {
        container.innerHTML = `
            <div class="empty-message">
                <p>추가된 프로필이 없습니다.</p>
                <p>위에서 새 프로필을 추가해보세요.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = allProfiles.map(profile => {
        const isCurrentUser = profile === currentUser;
        const isGuest = profile === 'guest';
        const categoryCount = isGuest ? 0 : Object.keys(userData[profile] || {}).length;
        
        return `
            <div class="profile-card ${isCurrentUser ? 'current-profile' : ''}">
                <div class="profile-info">
                    <div class="profile-name">
                        ${profile}
                        ${isCurrentUser ? '<span class="current-badge">현재 사용중</span>' : ''}
                    </div>
                    <div class="profile-stats">
                        카테고리 ${categoryCount}개
                    </div>
                </div>
                <div class="profile-actions">
                    ${!isCurrentUser ? `<button onclick="switchProfile('${profile}')" class="btn-switch">선택</button>` : ''}
                    ${!isGuest ? `<button onclick="deleteProfile('${profile}')" class="btn-delete">삭제</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// 프로필 전환
function switchProfile(profileName) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, profileName);
    loadProfiles();
    showSuccessMessage(`"${profileName}" 프로필로 전환되었습니다.`);
}

// 성공 메시지 표시
function showSuccessMessage(message) {
    // 간단한 토스트 메시지
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 애니메이션 후 제거
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }, 100);
}

// 확인 모달 표시
function showConfirm(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
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
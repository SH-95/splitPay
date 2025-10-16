// 전역 변수 및 설정
let currentUser = 'guest';
let currentUserId = 'guest_001'; // 고유 ID 추가
let currentCategory = 'default';
let participants = [];
let expenses = [];
let editingExpenseId = null;
let confirmCallback = null;

// LocalStorage 키
const STORAGE_KEYS = {
    CURRENT_USER: 'dutchpay_current_user',
    USER_DATA: 'dutchpay_user_data',
    PROFILES: 'dutchpay_profiles'
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeProfiles();
    initializeApp();
    setupEventListeners();
    loadUserData();
    updateDisplay();
});

// 프로필 시스템 초기화 (고유 ID 시스템)
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

// 앱 초기화
function initializeApp() {
    // 저장된 사용자 정보 로드
    const savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (savedUserId) {
        currentUserId = savedUserId;
        const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '{}');
        currentUser = profiles[currentUserId]?.name || 'guest';
    }
    
    // 프로필 선택 드롭다운 업데이트
    updateProfileSelect();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 엔터 키 이벤트
    document.getElementById('participantName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addParticipant();
    });
    
    document.getElementById('expenseName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') document.getElementById('expenseAmount').focus();
    });
    
    document.getElementById('expenseAmount').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') document.getElementById('expensePayer').focus();
    });
    
    document.getElementById('newCategoryName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addCategory();
    });
    
    document.getElementById('editCategoryName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') saveEditCategory();
    });
}

// 프로필 관리 페이지로 이동
function goToProfileManagement() {
    window.location.href = 'profiles.html';
}

// 프로필 선택 드롭다운 업데이트
function updateProfileSelect() {
    const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '{}');
    const select = document.getElementById('profileSelect');
    
    select.innerHTML = Object.values(profiles).map(profile => 
        `<option value="${profile.id}" ${profile.id === currentUserId ? 'selected' : ''}>${profile.name}</option>`
    ).join('');
}

// 프로필 변경 (드롭다운에서)
function changeProfile() {
    const select = document.getElementById('profileSelect');
    const newUserId = select.value;
    
    if (newUserId !== currentUserId) {
        currentUserId = newUserId;
        const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '{}');
        currentUser = profiles[currentUserId]?.name || 'guest';
        
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, currentUserId);
        currentCategory = 'default';
        loadUserData();
        updateDisplay();
        showToast(`"${currentUser}" ${t('profileSwitched')}`);
    }
}

// 사용자 데이터 저장/로드
function saveUserData() {
    const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
    
    if (!userData[currentUserId]) {
        userData[currentUserId] = {};
    }
    
    userData[currentUserId][currentCategory] = {
        participants: participants,
        expenses: expenses,
        lastUpdated: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
}

function loadUserData() {
    const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
    
    if (userData[currentUserId] && userData[currentUserId][currentCategory]) {
        const data = userData[currentUserId][currentCategory];
        participants = data.participants || [];
        expenses = data.expenses || [];
    } else {
        participants = [];
        expenses = [];
    }
    
    // 카테고리 목록 업데이트
    updateCategorySelect();
}

// 금액 포맷팅 (일본 엔으로 고정)
function formatCurrency(amount) {
    const roundedAmount = Math.round(amount);
    return `${t('yen')}${roundedAmount.toLocaleString()}`;
}

// 참가자 추가
function addParticipant() {
    const nameInput = document.getElementById('participantName');
    const name = nameInput.value.trim();
    
    if (name === '') {
        showToast(t('enterParticipantName'));
        return;
    }
    
    if (participants.includes(name)) {
        showToast(t('participantExists'));
        return;
    }
    
    participants.push(name);
    nameInput.value = '';
    saveUserData();
    updateDisplay();
    showToast(`${name}${t('participantAdded')}`);
}

// 참가자 제거 (확인 단계 포함)
function removeParticipant(name) {
    showConfirm(
        t('confirm'),
        `${name}${t('deleteParticipantConfirm')}`,
        () => {
            participants = participants.filter(participant => participant !== name);
            expenses = expenses.filter(expense => expense.payer !== name);
            saveUserData();
            updateDisplay();
            showToast(`${name}${t('participantRemoved')}`);
        }
    );
}

// 지출 추가
function addExpense() {
    const nameInput = document.getElementById('expenseName');
    const amountInput = document.getElementById('expenseAmount');
    const payerSelect = document.getElementById('expensePayer');
    const memoInput = document.getElementById('expenseMemo');
    
    const name = nameInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const payer = payerSelect.value;
    const memo = memoInput.value.trim();
    
    if (name === '') {
        showToast(t('enterExpenseName'));
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        showToast(t('enterValidAmount'));
        return;
    }
    
    if (payer === '') {
        showToast(t('selectPayer'));
        return;
    }
    
    const expense = {
        id: Date.now(),
        name: name,
        amount: amount,
        payer: payer,
        memo: memo,
        created: new Date().toISOString()
    };
    
    expenses.push(expense);
    
    // 입력 필드 초기화
    nameInput.value = '';
    amountInput.value = '';
    payerSelect.value = '';
    memoInput.value = '';
    
    saveUserData();
    updateDisplay();
    showToast(t('expenseAdded'));
}

// 지출 상세 보기/수정
function showExpenseDetail(id) {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;
    
    editingExpenseId = id;
    
    // 모달에 데이터 채우기
    document.getElementById('editExpenseName').value = expense.name;
    document.getElementById('editExpenseAmount').value = expense.amount;
    document.getElementById('editExpenseMemo').value = expense.memo || '';
    
    // 지불자 선택 옵션 업데이트
    const payerSelect = document.getElementById('editExpensePayer');
    payerSelect.innerHTML = participants.map(participant => 
        `<option value="${participant}" ${participant === expense.payer ? 'selected' : ''}>${participant}</option>`
    ).join('');
    
    // 모달 표시
    document.getElementById('expenseModal').style.display = 'flex';
}

// 지출 수정 저장
function saveExpenseChanges() {
    if (!editingExpenseId) return;
    
    const name = document.getElementById('editExpenseName').value.trim();
    const amount = parseFloat(document.getElementById('editExpenseAmount').value);
    const payer = document.getElementById('editExpensePayer').value;
    const memo = document.getElementById('editExpenseMemo').value.trim();
    
    if (name === '') {
        showToast(t('enterExpenseName'));
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        showToast(t('enterValidAmount'));
        return;
    }
    
    if (payer === '') {
        showToast(t('selectPayer'));
        return;
    }
    
    // 지출 내역 업데이트
    const expenseIndex = expenses.findIndex(e => e.id === editingExpenseId);
    if (expenseIndex !== -1) {
        expenses[expenseIndex] = {
            ...expenses[expenseIndex],
            name: name,
            amount: amount,
            payer: payer,
            memo: memo,
            modified: new Date().toISOString()
        };
        
        saveUserData();
        updateDisplay();
        closeExpenseModal();
        showToast(t('expenseUpdated'));
    }
}

// 모달 닫기
function closeExpenseModal() {
    document.getElementById('expenseModal').style.display = 'none';
    editingExpenseId = null;
}

// 지출 제거 (확인 단계 포함)
function removeExpense(id) {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;
    
    showConfirm(
        t('confirm'),
        `"${expense.name}" ${t('deleteExpenseConfirm')}`,
        () => {
            expenses = expenses.filter(expense => expense.id !== id);
            saveUserData();
            updateDisplay();
            showToast(t('expenseDeleted'));
        }
    );
}

// 카테고리 관리
function updateCategorySelect() {
    const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
    const userCategories = userData[currentUserId] || {};
    const categories = Object.keys(userCategories);
    
    const select = document.getElementById('categorySelect');
    const defaultOption = select.querySelector('option[value="default"]');
    
    // 기존 옵션들 제거 (default 제외)
    Array.from(select.children).forEach(option => {
        if (option.value !== 'default') {
            select.removeChild(option);
        }
    });
    
    // 새 카테고리들 추가
    categories.forEach(category => {
        if (category !== 'default') {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            if (category === currentCategory) {
                option.selected = true;
            }
            select.appendChild(option);
        }
    });
    
    // 현재 카테고리가 선택되도록 설정
    select.value = currentCategory;
}

function showAddCategory() {
    document.getElementById('addCategoryForm').style.display = 'flex';
    document.getElementById('newCategoryName').focus();
}

function hideAddCategory() {
    document.getElementById('addCategoryForm').style.display = 'none';
    document.getElementById('newCategoryName').value = '';
}

function addCategory() {
    const input = document.getElementById('newCategoryName');
    const categoryName = input.value.trim();
    
    if (categoryName === '') {
        showToast(t('enterCategoryName'));
        return;
    }
    
    if (categoryName === 'default') {
        showToast(t('defaultCategoryReserved'));
        return;
    }
    
    // 기존 카테고리 중복 확인
    const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
    if (userData[currentUserId] && userData[currentUserId][categoryName]) {
        showToast(t('categoryExists'));
        return;
    }
    
    // 새 카테고리로 전환 (빈 데이터로 시작)
    currentCategory = categoryName;
    participants = [];
    expenses = [];
    saveUserData();
    updateDisplay();
    hideAddCategory();
    showToast(`"${categoryName}" ${t('categoryCreated')}`);
}

function changeCategory() {
    const select = document.getElementById('categorySelect');
    currentCategory = select.value;
    loadUserData();
    updateDisplay();
}

// 현재 카테고리 편집
function editCurrentCategory() {
    if (currentCategory === 'default') {
        showToast(t('defaultCategoryReserved'));
        return;
    }
    
    document.getElementById('editCategoryForm').style.display = 'flex';
    document.getElementById('editCategoryName').value = currentCategory;
    document.getElementById('editCategoryName').focus();
}

function hideEditCategory() {
    document.getElementById('editCategoryForm').style.display = 'none';
    document.getElementById('editCategoryName').value = '';
}

function saveEditCategory() {
    const input = document.getElementById('editCategoryName');
    const newCategoryName = input.value.trim();
    
    if (newCategoryName === '') {
        showToast(t('enterCategoryName'));
        return;
    }
    
    if (newCategoryName === 'default') {
        showToast(t('defaultCategoryReserved'));
        return;
    }
    
    if (newCategoryName === currentCategory) {
        hideEditCategory();
        return;
    }
    
    // 기존 카테고리 중복 확인
    const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
    if (userData[currentUserId] && userData[currentUserId][newCategoryName]) {
        showToast(t('categoryExists'));
        return;
    }
    
    // 카테고리 이름 변경
    const oldCategoryName = currentCategory;
    if (userData[currentUserId] && userData[currentUserId][oldCategoryName]) {
        userData[currentUserId][newCategoryName] = userData[currentUserId][oldCategoryName];
        delete userData[currentUserId][oldCategoryName];
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    }
    
    currentCategory = newCategoryName;
    updateDisplay();
    hideEditCategory();
    showToast(`"${newCategoryName}" ${t('categoryUpdated')}`);
}

// 현재 카테고리 삭제
function deleteCurrentCategory() {
    if (currentCategory === 'default') {
        showToast(t('defaultCategoryReserved'));
        return;
    }
    
    showConfirm(
        t('confirm'),
        `"${currentCategory}" ${t('deleteCategoryConfirm')}`,
        () => {
            const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
            if (userData[currentUserId] && userData[currentUserId][currentCategory]) {
                delete userData[currentUserId][currentCategory];
                localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
            }
            
            currentCategory = 'default';
            loadUserData();
            updateDisplay();
            showToast(`${t('categoryDeleted')}`);
        }
    );
}

// 현재 카테고리 초기화
function resetCurrentCategory() {
    showConfirm(
        t('confirm'),
        t('resetCategoryConfirm'),
        () => {
            participants = [];
            expenses = [];
            saveUserData();
            updateDisplay();
            showToast(t('categoryReset'));
        }
    );
}

// PayPay 앱 실행
function openPayPay() {
    // PayPay 앱 스킴 시도
    const payPayScheme = 'paypay://';
    const payPayWebsite = 'https://paypay.ne.jp/';
    
    // 모바일에서 앱 실행 시도
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // 앱 실행 시도
        window.location.href = payPayScheme;
        
        // 앱이 설치되지 않은 경우 웹사이트로 리다이렉트
        setTimeout(() => {
            if (!document.hidden) {
                window.open(payPayWebsite, '_blank');
            }
        }, 1500);
    } else {
        // PC에서는 바로 웹사이트로 이동
        window.open(payPayWebsite, '_blank');
    }
    
    showToast('PayPay 앱을 실행합니다...');
}

// 토스트 메시지 표시
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
        }, 2500);
    }, 100);
}

// 확인 모달 표시 (줄바꿈 처리 개선)
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

// 화면 업데이트 함수들
function updateDisplay() {
    updateParticipantsList();
    updatePayerSelects();
    updateExpensesList();
    updateSummary();
    updateSettlement();
    updateProfileSelect();
    updateCategorySelect();
}

function updateParticipantsList() {
    const container = document.getElementById('participantsList');
    
    if (participants.length === 0) {
        container.innerHTML = `<div class="empty-message">${t('addParticipantFirst')}</div>`;
        return;
    }
    
    container.innerHTML = participants.map(participant => `
        <div class="tag">
            <span>${participant}</span>
            <button onclick="removeParticipant('${participant}')" class="tag-remove" title="${t('delete')}">×</button>
        </div>
    `).join('');
}

function updatePayerSelects() {
    // 지출 추가 폼의 선택박스
    const select = document.getElementById('expensePayer');
    const currentValue = select.value;
    
    select.innerHTML = `<option value="">${t('payer')}</option>` +
        participants.map(participant => 
            `<option value="${participant}" ${participant === currentValue ? 'selected' : ''}>${participant}</option>`
        ).join('');
}

function updateExpensesList() {
    const container = document.getElementById('expensesList');
    
    if (expenses.length === 0) {
        container.innerHTML = `<div class="empty-message">${t('noExpenses')}</div>`;
        return;
    }
    
    container.innerHTML = expenses.map(expense => `
        <div class="expense-item" onclick="showExpenseDetail(${expense.id})">
            <div class="expense-info">
                <div class="expense-name">${expense.name}</div>
                <div class="expense-details">${expense.payer}${expense.memo ? ' • ' + expense.memo : ''}</div>
            </div>
            <div class="expense-actions">
                <div class="expense-amount">${formatCurrency(expense.amount)}</div>
                <button onclick="event.stopPropagation(); removeExpense(${expense.id})" class="btn-delete" title="${t('delete')}">×</button>
            </div>
        </div>
    `).join('');
}

function updateSummary() {
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const participantCount = participants.length;
    const perPersonAmount = participantCount > 0 ? totalAmount / participantCount : 0;
    
    document.getElementById('totalAmount').textContent = formatCurrency(totalAmount);
    document.getElementById('participantCountText').innerHTML = `${participantCount}<span data-i18n="people">${t('people')}</span>`;
    document.getElementById('perPersonAmount').textContent = formatCurrency(perPersonAmount);
}

function updateSettlement() {
    const container = document.getElementById('settlementResults');
    const paypaySection = document.getElementById('paypayActions');
    
    if (participants.length < 2 || expenses.length === 0) {
        container.innerHTML = `<div class="empty-message">${t('noSettlement')}</div>`;
        paypaySection.style.display = 'none';
        return;
    }
    
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const perPersonAmount = totalAmount / participants.length;
    
    // 각 참가자별 지불 금액 계산
    const paymentsByParticipant = {};
    participants.forEach(participant => {
        paymentsByParticipant[participant] = 0;
    });
    
    expenses.forEach(expense => {
        if (paymentsByParticipant.hasOwnProperty(expense.payer)) {
            paymentsByParticipant[expense.payer] += expense.amount;
        }
    });
    
    // 각 참가자별 정산 금액 계산
    const balances = {};
    participants.forEach(participant => {
        balances[participant] = perPersonAmount - paymentsByParticipant[participant];
    });
    
    // 채무자와 채권자 분리
    const debtors = [];
    const creditors = [];
    
    Object.entries(balances).forEach(([participant, balance]) => {
        if (balance > 0.5) {
            creditors.push({ name: participant, amount: balance });
        } else if (balance < -0.5) {
            debtors.push({ name: participant, amount: -balance });
        }
    });
    
    // 정산 결과 계산
    const settlements = [];
    const sortedCreditors = [...creditors].sort((a, b) => b.amount - a.amount);
    const sortedDebtors = [...debtors].sort((a, b) => b.amount - a.amount);
    
    let debtorIndex = 0;
    let creditorIndex = 0;
    
    while (debtorIndex < sortedDebtors.length && creditorIndex < sortedCreditors.length) {
        const debtor = sortedDebtors[debtorIndex];
        const creditor = sortedCreditors[creditorIndex];
        
        const settlementAmount = Math.min(debtor.amount, creditor.amount);
        
        settlements.push({
            from: creditor.name,
            to: debtor.name,
            amount: settlementAmount
        });
        
        debtor.amount -= settlementAmount;
        creditor.amount -= settlementAmount;
        
        if (debtor.amount < 0.5) {
            debtorIndex++;
        }
        if (creditor.amount < 0.5) {
            creditorIndex++;
        }
    }
    
    // 정산 결과 표시
    if (settlements.length === 0) {
        container.innerHTML = `<div class="empty-message">${t('allSettled')}</div>`;
        paypaySection.style.display = 'none';
    } else {
        container.innerHTML = settlements.map(settlement => `
            <div class="settlement-item">
                <div class="settlement-text">
                    <strong>${settlement.from}</strong> → <strong>${settlement.to}</strong>
                </div>
                <div class="settlement-amount">${formatCurrency(settlement.amount)}</div>
            </div>
        `).join('');
        paypaySection.style.display = 'block';
    }
}
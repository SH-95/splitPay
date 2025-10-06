// 전역 변수 및 설정
let currentUser = 'guest';
let currentCategory = 'default';
let participants = [];
let expenses = [];
let editingExpenseId = null;
let confirmCallback = null;

// LocalStorage 키
const STORAGE_KEYS = {
    CURRENT_USER: 'dutchpay_current_user',
    USER_DATA: 'dutchpay_user_data'
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadUserData();
    updateDisplay();
});

// 앱 초기화
function initializeApp() {
    // 저장된 사용자 정보 로드
    const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (savedUser) {
        currentUser = savedUser;
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
}

// 프로필 관리 페이지로 이동
function goToProfileManagement() {
    window.location.href = 'profiles.html';
}

// 프로필 선택 드롭다운 업데이트
function updateProfileSelect() {
    const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
    const profiles = ['guest', ...Object.keys(userData)];
    const select = document.getElementById('profileSelect');
    
    select.innerHTML = profiles.map(profile => 
        `<option value="${profile}" ${profile === currentUser ? 'selected' : ''}>${profile}</option>`
    ).join('');
}

// 프로필 변경 (드롭다운에서)
function changeProfile() {
    const select = document.getElementById('profileSelect');
    const newProfile = select.value;
    
    if (newProfile !== currentUser) {
        currentUser = newProfile;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, currentUser);
        currentCategory = 'default';
        loadUserData();
        updateDisplay();
        showToast(`"${currentUser}" 프로필로 전환되었습니다.`);
    }
}

// 사용자 데이터 저장/로드
function saveUserData() {
    const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
    
    if (!userData[currentUser]) {
        userData[currentUser] = {};
    }
    
    userData[currentUser][currentCategory] = {
        participants: participants,
        expenses: expenses,
        lastUpdated: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
}

function loadUserData() {
    const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
    
    if (userData[currentUser] && userData[currentUser][currentCategory]) {
        const data = userData[currentUser][currentCategory];
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
    return `¥${roundedAmount.toLocaleString()}`;
}

// 참가자 추가
function addParticipant() {
    const nameInput = document.getElementById('participantName');
    const name = nameInput.value.trim();
    
    if (name === '') {
        showToast('참가자 이름을 입력해주세요.');
        return;
    }
    
    if (participants.includes(name)) {
        showToast('이미 등록된 참가자입니다.');
        return;
    }
    
    participants.push(name);
    nameInput.value = '';
    saveUserData();
    updateDisplay();
    showToast(`${name}님이 추가되었습니다.`);
}

// 참가자 제거 (확인 단계 포함)
function removeParticipant(name) {
    showConfirm(
        '참가자 삭제',
        `${name}님을 참가자 목록에서 제거하시겠습니까?\\n해당 참가자가 지불한 모든 내역도 함께 삭제됩니다.`,
        () => {
            participants = participants.filter(participant => participant !== name);
            expenses = expenses.filter(expense => expense.payer !== name);
            saveUserData();
            updateDisplay();
            showToast(`${name}님이 제거되었습니다.`);
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
        showToast('항목 이름을 입력해주세요.');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        showToast('올바른 금액을 입력해주세요.');
        return;
    }
    
    if (payer === '') {
        showToast('지불한 사람을 선택해주세요.');
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
    showToast('지출이 추가되었습니다.');
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
        showToast('항목 이름을 입력해주세요.');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        showToast('올바른 금액을 입력해주세요.');
        return;
    }
    
    if (payer === '') {
        showToast('지불한 사람을 선택해주세요.');
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
        showToast('지출 내역이 수정되었습니다.');
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
        '지출 내역 삭제',
        `"${expense.name}" 내역을 삭제하시겠습니까?`,
        () => {
            expenses = expenses.filter(expense => expense.id !== id);
            saveUserData();
            updateDisplay();
            showToast('지출 내역이 삭제되었습니다.');
        }
    );
}

// 카테고리 관리
function updateCategorySelect() {
    const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
    const userCategories = userData[currentUser] || {};
    const categories = Object.keys(userCategories);
    
    const select = document.getElementById('categorySelect');
    select.innerHTML = '<option value="default">기본 카테고리</option>';
    
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
        showToast('카테고리 이름을 입력해주세요.');
        return;
    }
    
    if (categoryName === 'default') {
        showToast('"default"는 사용할 수 없는 이름입니다.');
        return;
    }
    
    // 기존 카테고리 중복 확인
    const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
    if (userData[currentUser] && userData[currentUser][categoryName]) {
        showToast('이미 존재하는 카테고리입니다.');
        return;
    }
    
    // 새 카테고리로 전환 (빈 데이터로 시작)
    currentCategory = categoryName;
    participants = [];
    expenses = [];
    saveUserData();
    updateDisplay();
    hideAddCategory();
    showToast(`"${categoryName}" 카테고리가 생성되었습니다.`);
}

function changeCategory() {
    const select = document.getElementById('categorySelect');
    currentCategory = select.value;
    loadUserData();
    updateDisplay();
}

// 현재 카테고리 초기화
function resetCurrentCategory() {
    showConfirm(
        '카테고리 초기화',
        `현재 카테고리의 모든 데이터가 삭제됩니다.\\n이 작업은 되돌릴 수 없습니다.\\n정말로 초기화하시겠습니까?`,
        () => {
            participants = [];
            expenses = [];
            saveUserData();
            updateDisplay();
            showToast('카테고리가 초기화되었습니다.');
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
        container.innerHTML = '<div class="empty-message">참가자를 추가해주세요.</div>';
        return;
    }
    
    container.innerHTML = participants.map(participant => `
        <div class="tag">
            <span>${participant}</span>
            <button onclick="removeParticipant('${participant}')" class="tag-remove" title="제거">×</button>
        </div>
    `).join('');
}

function updatePayerSelects() {
    // 지출 추가 폼의 선택박스
    const select = document.getElementById('expensePayer');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">지불한 사람</option>' +
        participants.map(participant => 
            `<option value="${participant}" ${participant === currentValue ? 'selected' : ''}>${participant}</option>`
        ).join('');
}

function updateExpensesList() {
    const container = document.getElementById('expensesList');
    
    if (expenses.length === 0) {
        container.innerHTML = '<div class="empty-message">지출 내역이 없습니다.</div>';
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
                <button onclick="event.stopPropagation(); removeExpense(${expense.id})" class="btn-delete" title="삭제">×</button>
            </div>
        </div>
    `).join('');
}

function updateSummary() {
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const participantCount = participants.length;
    const perPersonAmount = participantCount > 0 ? totalAmount / participantCount : 0;
    
    document.getElementById('totalAmount').textContent = formatCurrency(totalAmount);
    document.getElementById('participantCount').textContent = participantCount + '명';
    document.getElementById('perPersonAmount').textContent = formatCurrency(perPersonAmount);
}

function updateSettlement() {
    const container = document.getElementById('settlementResults');
    const paypaySection = document.getElementById('paypayActions');
    
    if (participants.length < 2 || expenses.length === 0) {
        container.innerHTML = '<div class="empty-message">정산할 내역이 없습니다.</div>';
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
        container.innerHTML = '<div class="empty-message">모든 참가자가 정확히 정산되었습니다! 🎉</div>';
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
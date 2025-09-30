// 전역 변수
let participants = [];
let expenses = [];

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    updateDisplay();
    
    // 엔터 키 이벤트 리스너
    document.getElementById('participantName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addParticipant();
        }
    });
    
    document.getElementById('expenseName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('expenseAmount').focus();
        }
    });
    
    document.getElementById('expenseAmount').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('expensePayer').focus();
        }
    });
});

// 참가자 추가 함수
function addParticipant() {
    const nameInput = document.getElementById('participantName');
    const name = nameInput.value.trim();
    
    if (name === '') {
        alert('참가자 이름을 입력해주세요.');
        return;
    }
    
    if (participants.includes(name)) {
        alert('이미 등록된 참가자입니다.');
        return;
    }
    
    participants.push(name);
    nameInput.value = '';
    updateDisplay();
}

// 참가자 제거 함수
function removeParticipant(name) {
    if (confirm(`${name}님을 참가자 목록에서 제거하시겠습니까?`)) {
        participants = participants.filter(participant => participant !== name);
        // 해당 참가자가 지불한 내역들도 제거
        expenses = expenses.filter(expense => expense.payer !== name);
        updateDisplay();
    }
}

// 지출 추가 함수
function addExpense() {
    const nameInput = document.getElementById('expenseName');
    const amountInput = document.getElementById('expenseAmount');
    const payerSelect = document.getElementById('expensePayer');
    
    const name = nameInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const payer = payerSelect.value;
    
    if (name === '') {
        alert('항목 이름을 입력해주세요.');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        alert('올바른 금액을 입력해주세요.');
        return;
    }
    
    if (payer === '') {
        alert('지불한 사람을 선택해주세요.');
        return;
    }
    
    const expense = {
        id: Date.now(), // 간단한 ID 생성
        name: name,
        amount: amount,
        payer: payer
    };
    
    expenses.push(expense);
    
    // 입력 필드 초기화
    nameInput.value = '';
    amountInput.value = '';
    payerSelect.value = '';
    
    updateDisplay();
}

// 지출 제거 함수
function removeExpense(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    updateDisplay();
}

// 화면 업데이트 함수
function updateDisplay() {
    updateParticipantsList();
    updatePayerSelect();
    updateExpensesList();
    updateSummary();
    updateSettlement();
}

// 참가자 목록 업데이트
function updateParticipantsList() {
    const container = document.getElementById('participantsList');
    
    if (participants.length === 0) {
        container.innerHTML = '<div class="empty-message">등록된 참가자가 없습니다.</div>';
        return;
    }
    
    container.innerHTML = participants.map(participant => `
        <div class="participant-tag">
            <span>${participant}</span>
            <button onclick="removeParticipant('${participant}')" title="제거">×</button>
        </div>
    `).join('');
}

// 지불자 선택 드롭다운 업데이트
function updatePayerSelect() {
    const select = document.getElementById('expensePayer');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">지불한 사람 선택</option>' +
        participants.map(participant => 
            `<option value="${participant}" ${participant === currentValue ? 'selected' : ''}>${participant}</option>`
        ).join('');
}

// 지출 목록 업데이트
function updateExpensesList() {
    const container = document.getElementById('expensesList');
    
    if (expenses.length === 0) {
        container.innerHTML = '<div class="empty-message">등록된 지출 내역이 없습니다.</div>';
        return;
    }
    
    container.innerHTML = expenses.map(expense => `
        <div class="expense-item">
            <div class="expense-info">
                <div class="expense-name">${expense.name}</div>
                <div class="expense-details">${expense.payer}님이 지불</div>
            </div>
            <div class="expense-amount">${expense.amount.toLocaleString()}원</div>
            <button onclick="removeExpense(${expense.id})" class="btn-danger">삭제</button>
        </div>
    `).join('');
}

// 요약 정보 업데이트
function updateSummary() {
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const participantCount = participants.length;
    const perPersonAmount = participantCount > 0 ? totalAmount / participantCount : 0;
    
    document.getElementById('totalAmount').textContent = totalAmount.toLocaleString() + '원';
    document.getElementById('participantCount').textContent = participantCount + '명';
    document.getElementById('perPersonAmount').textContent = perPersonAmount.toLocaleString() + '원';
}

// 정산 결과 계산 및 업데이트
function updateSettlement() {
    const container = document.getElementById('settlementResults');
    
    if (participants.length < 2 || expenses.length === 0) {
        container.innerHTML = '<div class="empty-message">정산할 내역이 없습니다.</div>';
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
    
    // 각 참가자별 정산 금액 계산 (지불해야 할 금액 - 이미 지불한 금액)
    const balances = {};
    participants.forEach(participant => {
        balances[participant] = perPersonAmount - paymentsByParticipant[participant];
    });
    
    // 채무자와 채권자 분리
    const debtors = []; // 돈을 받을 사람들 (음수)
    const creditors = []; // 돈을 줄 사람들 (양수)
    
    Object.entries(balances).forEach(([participant, balance]) => {
        if (balance > 0.01) { // 소수점 오차 처리
            creditors.push({ name: participant, amount: balance });
        } else if (balance < -0.01) { // 소수점 오차 처리
            debtors.push({ name: participant, amount: -balance });
        }
    });
    
    // 정산 결과 계산
    const settlements = [];
    let debtorIndex = 0;
    let creditorIndex = 0;
    
    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
        const debtor = debtors[debtorIndex];
        const creditor = creditors[creditorIndex];
        
        const settlementAmount = Math.min(debtor.amount, creditor.amount);
        
        settlements.push({
            from: creditor.name,
            to: debtor.name,
            amount: settlementAmount
        });
        
        debtor.amount -= settlementAmount;
        creditor.amount -= settlementAmount;
        
        if (debtor.amount === 0) {
            debtorIndex++;
        }
        if (creditor.amount === 0) {
            creditorIndex++;
        }
    }
    
    // 정산 결과 표시
    if (settlements.length === 0) {
        container.innerHTML = '<div class="empty-message">모든 참가자가 정확히 정산되었습니다.</div>';
    } else {
        container.innerHTML = settlements.map(settlement => `
            <div class="settlement-item">
                <div class="settlement-text">
                    <strong>${settlement.from}</strong>님이 <strong>${settlement.to}</strong>님에게
                </div>
                <div class="settlement-amount">${Math.round(settlement.amount).toLocaleString()}원</div>
            </div>
        `).join('');
    }
}
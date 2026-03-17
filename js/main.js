// =========================================
// Global State
// =========================================
let currentUser = 'guest';
let currentUserId = 'guest_001';
let currentCategory = 'default';
let participants = [];
let expenses = [];
let editingExpenseId = null;
let confirmCallback = null;
let activeTab = 'participants';

// LocalStorage keys
const STORAGE_KEYS = {
    CURRENT_USER: 'dutchpay_current_user',
    USER_DATA: 'dutchpay_user_data',
    PROFILES: 'dutchpay_profiles'
};

// =========================================
// Init
// =========================================
document.addEventListener('DOMContentLoaded', function () {
    initializeProfiles();
    initializeApp();
    setupEventListeners();
    loadUserData();
    updateDisplay();
    switchTab('participants');
});

function initializeProfiles() {
    let profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '{}');
    if (!profiles['guest_001']) {
        profiles['guest_001'] = { id: 'guest_001', name: 'guest', created: Date.now() };
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    }
}

function initializeApp() {
    const savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (savedUserId) {
        currentUserId = savedUserId;
        const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '{}');
        currentUser = profiles[currentUserId]?.name || 'guest';
    }
    updateProfileSelect();
}

function setupEventListeners() {
    const participantName = document.getElementById('participantName');
    if (participantName) {
        participantName.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') addParticipant();
        });
    }

    const expenseName = document.getElementById('expenseName');
    if (expenseName) {
        expenseName.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') document.getElementById('expenseAmount').focus();
        });
    }

    const expenseAmount = document.getElementById('expenseAmount');
    if (expenseAmount) {
        expenseAmount.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') document.getElementById('expensePayer').focus();
        });
    }

    const newCategoryName = document.getElementById('newCategoryName');
    if (newCategoryName) {
        newCategoryName.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') addCategory();
        });
    }

    const editCategoryName = document.getElementById('editCategoryName');
    if (editCategoryName) {
        editCategoryName.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') saveEditCategory();
        });
    }
}

// =========================================
// Tab Navigation
// =========================================
function switchTab(tabName) {
    activeTab = tabName;

    // Update panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    const targetPanel = document.getElementById('tab-' + tabName);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const targetBtn = document.getElementById('tabBtn-' + tabName);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }

    // Update badges after switching
    updateTabBadges();
}

function updateTabBadges() {
    // Participants badge
    const participantBadge = document.getElementById('badge-participants');
    if (participantBadge) {
        if (participants.length > 0) {
            participantBadge.textContent = participants.length;
            participantBadge.style.display = 'flex';
        } else {
            participantBadge.style.display = 'none';
        }
    }

    // Expenses badge
    const expenseBadge = document.getElementById('badge-expenses');
    if (expenseBadge) {
        if (expenses.length > 0) {
            expenseBadge.textContent = expenses.length;
            expenseBadge.style.display = 'flex';
        } else {
            expenseBadge.style.display = 'none';
        }
    }

    // Settlement badge — show count of settlement transactions needed
    const settlementBadge = document.getElementById('badge-settlement');
    if (settlementBadge) {
        if (participants.length >= 2 && expenses.length > 0) {
            const count = calculateSettlementCount();
            if (count > 0) {
                settlementBadge.textContent = count;
                settlementBadge.style.display = 'flex';
            } else {
                settlementBadge.style.display = 'none';
            }
        } else {
            settlementBadge.style.display = 'none';
        }
    }
}

function calculateSettlementCount() {
    if (participants.length < 2 || expenses.length === 0) return 0;

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const perPerson = totalAmount / participants.length;
    const paid = {};
    participants.forEach(p => { paid[p] = 0; });
    expenses.forEach(e => {
        if (paid.hasOwnProperty(e.payer)) paid[e.payer] += e.amount;
    });

    const balances = {};
    participants.forEach(p => { balances[p] = perPerson - paid[p]; });

    const debtors = Object.entries(balances).filter(([, b]) => b > 0.5).length;
    return debtors; // approximate: one transaction per debtor at minimum
}

// =========================================
// Profile management
// =========================================
function goToProfileManagement() {
    window.location.href = 'profiles.html';
}

function updateProfileSelect() {
    const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '{}');
    const select = document.getElementById('profileSelect');
    if (!select) return;

    select.innerHTML = Object.values(profiles).map(profile =>
        `<option value="${profile.id}" ${profile.id === currentUserId ? 'selected' : ''}>${profile.name}</option>`
    ).join('');
}

function changeProfile() {
    const select = document.getElementById('profileSelect');
    if (!select) return;
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

// =========================================
// Data persistence
// =========================================
function saveUserData() {
    const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
    if (!userData[currentUserId]) userData[currentUserId] = {};
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
    updateCategorySelect();
}

// =========================================
// Currency formatting
// =========================================
function formatCurrency(amount) {
    const rounded = Math.round(amount);
    return `${t('yen')}${rounded.toLocaleString()}`;
}

// =========================================
// Participants
// =========================================
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

function removeParticipant(name) {
    showConfirm(
        t('confirm'),
        `${name}${t('deleteParticipantConfirm')}`,
        () => {
            participants = participants.filter(p => p !== name);
            expenses = expenses.filter(e => e.payer !== name);
            saveUserData();
            updateDisplay();
            showToast(`${name}${t('participantRemoved')}`);
        }
    );
}

// =========================================
// Expenses
// =========================================
function addExpense() {
    const nameInput = document.getElementById('expenseName');
    const amountInput = document.getElementById('expenseAmount');
    const payerSelect = document.getElementById('expensePayer');
    const memoInput = document.getElementById('expenseMemo');

    const name = nameInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const payer = payerSelect.value;
    const memo = memoInput.value.trim();

    if (name === '') { showToast(t('enterExpenseName')); return; }
    if (isNaN(amount) || amount <= 0) { showToast(t('enterValidAmount')); return; }
    if (payer === '') { showToast(t('selectPayer')); return; }

    expenses.push({
        id: Date.now(),
        name: name,
        amount: amount,
        payer: payer,
        memo: memo,
        created: new Date().toISOString()
    });

    nameInput.value = '';
    amountInput.value = '';
    payerSelect.value = '';
    memoInput.value = '';

    saveUserData();
    updateDisplay();
    showToast(t('expenseAdded'));
}

function showExpenseDetail(id) {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    editingExpenseId = id;

    document.getElementById('editExpenseName').value = expense.name;
    document.getElementById('editExpenseAmount').value = expense.amount;
    document.getElementById('editExpenseMemo').value = expense.memo || '';

    const payerSelect = document.getElementById('editExpensePayer');
    payerSelect.innerHTML = participants.map(p =>
        `<option value="${p}" ${p === expense.payer ? 'selected' : ''}>${p}</option>`
    ).join('');

    document.getElementById('expenseModal').style.display = 'flex';
}

function saveExpenseChanges() {
    if (!editingExpenseId) return;

    const name = document.getElementById('editExpenseName').value.trim();
    const amount = parseFloat(document.getElementById('editExpenseAmount').value);
    const payer = document.getElementById('editExpensePayer').value;
    const memo = document.getElementById('editExpenseMemo').value.trim();

    if (name === '') { showToast(t('enterExpenseName')); return; }
    if (isNaN(amount) || amount <= 0) { showToast(t('enterValidAmount')); return; }
    if (payer === '') { showToast(t('selectPayer')); return; }

    const idx = expenses.findIndex(e => e.id === editingExpenseId);
    if (idx !== -1) {
        expenses[idx] = {
            ...expenses[idx],
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

function closeExpenseModal() {
    document.getElementById('expenseModal').style.display = 'none';
    editingExpenseId = null;
}

function removeExpense(id) {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    showConfirm(
        t('confirm'),
        `"${expense.name}" ${t('deleteExpenseConfirm')}`,
        () => {
            expenses = expenses.filter(e => e.id !== id);
            saveUserData();
            updateDisplay();
            showToast(t('expenseDeleted'));
        }
    );
}

// =========================================
// Category management
// =========================================
function updateCategorySelect() {
    const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
    const userCategories = userData[currentUserId] || {};
    const categories = Object.keys(userCategories);

    const select = document.getElementById('categorySelect');
    if (!select) return;

    // Remove all non-default options
    Array.from(select.children).forEach(opt => {
        if (opt.value !== 'default') select.removeChild(opt);
    });

    // Add user categories
    categories.forEach(category => {
        if (category !== 'default') {
            const opt = document.createElement('option');
            opt.value = category;
            opt.textContent = category;
            if (category === currentCategory) opt.selected = true;
            select.appendChild(opt);
        }
    });

    select.value = currentCategory;
}

function showAddCategory() {
    const form = document.getElementById('addCategoryForm');
    if (form) {
        form.style.display = 'flex';
        document.getElementById('newCategoryName').focus();
    }
}

function hideAddCategory() {
    const form = document.getElementById('addCategoryForm');
    if (form) form.style.display = 'none';
    document.getElementById('newCategoryName').value = '';
}

function addCategory() {
    const input = document.getElementById('newCategoryName');
    const categoryName = input.value.trim();

    if (categoryName === '') { showToast(t('enterCategoryName')); return; }
    if (categoryName === 'default') { showToast(t('defaultCategoryReserved')); return; }

    const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
    if (userData[currentUserId] && userData[currentUserId][categoryName]) {
        showToast(t('categoryExists'));
        return;
    }

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
    if (!select) return;
    currentCategory = select.value;
    loadUserData();
    updateDisplay();
}

function editCurrentCategory() {
    if (currentCategory === 'default') {
        showToast(t('defaultCategoryReserved'));
        return;
    }
    const form = document.getElementById('editCategoryForm');
    if (form) {
        form.style.display = 'flex';
        document.getElementById('editCategoryName').value = currentCategory;
        document.getElementById('editCategoryName').focus();
    }
}

function hideEditCategory() {
    const form = document.getElementById('editCategoryForm');
    if (form) form.style.display = 'none';
    document.getElementById('editCategoryName').value = '';
}

function saveEditCategory() {
    const input = document.getElementById('editCategoryName');
    const newName = input.value.trim();

    if (newName === '') { showToast(t('enterCategoryName')); return; }
    if (newName === 'default') { showToast(t('defaultCategoryReserved')); return; }
    if (newName === currentCategory) { hideEditCategory(); return; }

    const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
    if (userData[currentUserId] && userData[currentUserId][newName]) {
        showToast(t('categoryExists'));
        return;
    }

    const oldName = currentCategory;
    if (userData[currentUserId] && userData[currentUserId][oldName]) {
        userData[currentUserId][newName] = userData[currentUserId][oldName];
        delete userData[currentUserId][oldName];
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    }

    currentCategory = newName;
    updateDisplay();
    hideEditCategory();
    showToast(`"${newName}" ${t('categoryUpdated')}`);
}

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
            showToast(t('categoryDeleted'));
        }
    );
}

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

// =========================================
// PayPay
// =========================================
function openPayPay() {
    const payPayScheme = 'paypay://';
    const payPayWebsite = 'https://paypay.ne.jp/';

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        window.location.href = payPayScheme;
        setTimeout(() => {
            if (!document.hidden) window.open(payPayWebsite, '_blank');
        }, 1500);
    } else {
        window.open(payPayWebsite, '_blank');
    }

    showToast(t('payPayLaunching'));
}

// =========================================
// Modals
// =========================================
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
                if (document.body.contains(toast)) document.body.removeChild(toast);
            }, 300);
        }, 2500);
    }, 50);
}

function showConfirm(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    const msgEl = document.getElementById('confirmMessage');
    msgEl.innerHTML = message.replace(/\\n/g, '<br>');
    confirmCallback = callback;
    document.getElementById('confirmModal').style.display = 'flex';
}

function confirmAction() {
    if (confirmCallback) {
        confirmCallback();
        confirmCallback = null;
    }
    closeConfirmModal();
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    confirmCallback = null;
}

// =========================================
// Display / Render
// =========================================
function updateDisplay() {
    updateParticipantsList();
    updatePayerSelects();
    updateExpensesList();
    updateSummary();
    updateSettlement();
    updateProfileSelect();
    updateCategorySelect();
    updateTabBadges();
}

function updateParticipantsList() {
    const container = document.getElementById('participantsList');
    if (!container) return;

    if (participants.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <div class="empty-state-text">${t('addParticipantFirst')}</div>
            </div>`;
        return;
    }

    container.innerHTML = participants.map(participant => `
        <div class="participant-chip">
            <span>${escapeHtml(participant)}</span>
            <button onclick="removeParticipant('${escapeAttr(participant)}')" class="chip-remove" title="${t('delete')}">×</button>
        </div>
    `).join('');
}

function updatePayerSelects() {
    const select = document.getElementById('expensePayer');
    if (!select) return;
    const currentValue = select.value;

    select.innerHTML = `<option value="">${t('payer')}</option>` +
        participants.map(p =>
            `<option value="${escapeAttr(p)}" ${p === currentValue ? 'selected' : ''}>${escapeHtml(p)}</option>`
        ).join('');
}

function updateExpensesList() {
    const container = document.getElementById('expensesList');
    if (!container) return;

    if (expenses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💸</div>
                <div class="empty-state-text">${t('noExpenses')}</div>
                <div class="empty-state-hint">${participants.length === 0 ? t('addParticipantFirst') : ''}</div>
            </div>`;
        return;
    }

    container.innerHTML = expenses.map(expense => `
        <div class="expense-card" onclick="showExpenseDetail(${expense.id})">
            <div class="expense-card-left">
                <div class="expense-card-name">${escapeHtml(expense.name)}</div>
                <div class="expense-card-meta">
                    <span class="expense-payer-badge">${escapeHtml(expense.payer)}</span>
                    ${expense.memo ? `<span>· ${escapeHtml(expense.memo)}</span>` : ''}
                </div>
            </div>
            <div class="expense-card-right">
                <div class="expense-card-amount">${formatCurrency(expense.amount)}</div>
                <button
                    onclick="event.stopPropagation(); removeExpense(${expense.id})"
                    class="btn-expense-delete"
                    title="${t('delete')}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

function updateSummary() {
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const count = participants.length;
    const perPerson = count > 0 ? totalAmount / count : 0;

    const totalEl = document.getElementById('totalAmount');
    const countEl = document.getElementById('participantCountText');
    const perPersonEl = document.getElementById('perPersonAmount');

    if (totalEl) totalEl.textContent = formatCurrency(totalAmount);
    if (countEl) countEl.innerHTML = `${count}<span data-i18n="people">${t('people')}</span>`;
    if (perPersonEl) perPersonEl.textContent = formatCurrency(perPerson);
}

function updateSettlement() {
    const container = document.getElementById('settlementResults');
    const paypaySection = document.getElementById('paypayActions');
    if (!container) return;

    if (participants.length < 2 || expenses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <div class="empty-state-text">${t('noSettlement')}</div>
                <div class="empty-state-hint">${participants.length < 2 ? t('addParticipantFirst') : t('noExpenses')}</div>
            </div>`;
        if (paypaySection) paypaySection.style.display = 'none';
        return;
    }

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const perPerson = totalAmount / participants.length;

    // Calculate payments per person
    const paid = {};
    participants.forEach(p => { paid[p] = 0; });
    expenses.forEach(e => {
        if (paid.hasOwnProperty(e.payer)) paid[e.payer] += e.amount;
    });

    // Balances: positive = owes money, negative = is owed money
    const balances = {};
    participants.forEach(p => { balances[p] = perPerson - paid[p]; });

    const debtors = [];   // people who owe (balance > 0)
    const creditors = []; // people who are owed (balance < 0)

    Object.entries(balances).forEach(([name, balance]) => {
        if (balance > 0.5)       debtors.push({ name, amount: balance });
        else if (balance < -0.5) creditors.push({ name, amount: -balance });
    });

    // Minimize transactions
    const settlements = [];
    const sortedDebtors = [...debtors].sort((a, b) => b.amount - a.amount);
    const sortedCreditors = [...creditors].sort((a, b) => b.amount - a.amount);

    let di = 0, ci = 0;
    while (di < sortedDebtors.length && ci < sortedCreditors.length) {
        const debtor = sortedDebtors[di];
        const creditor = sortedCreditors[ci];
        const amt = Math.min(debtor.amount, creditor.amount);

        settlements.push({ from: debtor.name, to: creditor.name, amount: amt });

        debtor.amount -= amt;
        creditor.amount -= amt;

        if (debtor.amount < 0.5) di++;
        if (creditor.amount < 0.5) ci++;
    }

    if (settlements.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎉</div>
                <div class="empty-state-text">${t('allSettled')}</div>
            </div>`;
        if (paypaySection) paypaySection.style.display = 'none';
    } else {
        container.innerHTML = settlements.map(s => `
            <div class="settlement-card">
                <div class="settlement-from">${escapeHtml(s.from)}</div>
                <div class="settlement-arrow">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                    </svg>
                </div>
                <div class="settlement-to">${escapeHtml(s.to)}</div>
                <div class="settlement-amount-badge">${formatCurrency(s.amount)}</div>
            </div>
        `).join('');
        if (paypaySection) paypaySection.style.display = 'block';
    }
}

// =========================================
// Utility
// =========================================
function escapeHtml(str) {
    if (typeof str !== 'string') return String(str);
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
    if (typeof str !== 'string') return String(str);
    return str.replace(/'/g, "\\'");
}

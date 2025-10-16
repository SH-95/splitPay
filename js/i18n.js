// 다국어 지원 시스템
const translations = {
    ko: {
        // 헤더 및 네비게이션
        appTitle: "더치페이",
        profileManagement: "프로필 관리",
        
        // 카테고리
        defaultCategory: "기본 카테고리",
        newCategory: "+ 새 카테고리",
        categoryName: "카테고리 이름",
        addCategory: "추가",
        cancel: "취소",
        
        // 참가자
        participants: "참가자",
        addParticipant: "이름을 입력하세요",
        addButton: "추가",
        
        // 지출
        addExpense: "지출 추가",
        expenseName: "항목 이름",
        amount: "금액",
        payer: "지불한 사람",
        memo: "메모 (선택사항)",
        addExpenseButton: "지출 추가",
        
        // 지출 목록
        expenseList: "지출 내역",
        reset: "초기화",
        noExpenses: "지출 내역이 없습니다",
        
        // 계산 결과
        totalAmount: "총 금액",
        participantCount: "참가자",
        perPersonAmount: "1인당 부담",
        settlementResults: "정산 결과",
        noSettlement: "정산할 내역이 없습니다",
        allSettled: "모든 참가자가 정확히 정산되었습니다! 🎉",
        sendWithPayPay: "PayPay로 보내기",
        
        // 모달
        editExpense: "지출 수정",
        save: "저장",
        close: "닫기",
        confirm: "확인",
        
        // 프로필 관리
        profileManagementTitle: "프로필 관리",
        addNewProfile: "새 프로필 추가",
        profileNamePlaceholder: "프로필 이름을 입력하세요",
        existingProfiles: "기존 프로필",
        currentlyUsing: "현재 사용중",
        categories: "카테고리",
        select: "선택",
        delete: "삭제",
        edit: "수정",
        
        // 알림 메시지
        participantAdded: "님이 추가되었습니다",
        participantRemoved: "님이 제거되었습니다",
        expenseAdded: "지출이 추가되었습니다",
        expenseUpdated: "지출 내역이 수정되었습니다",
        expenseDeleted: "지출 내역이 삭제되었습니다",
        categoryCreated: "카테고리가 생성되었습니다",
        categoryDeleted: "카테고리가 삭제되었습니다",
        categoryUpdated: "카테고리명이 변경되었습니다",
        categoryReset: "카테고리가 초기화되었습니다",
        profileSwitched: "프로필로 전환되었습니다",
        profileAdded: "프로필이 추가되었습니다",
        profileDeleted: "프로필이 삭제되었습니다",
        profileUpdated: "프로필명이 변경되었습니다",
        payPayLaunching: "PayPay 앱을 실행합니다...",
        
        // 오류 메시지
        enterParticipantName: "참가자 이름을 입력해주세요",
        participantExists: "이미 등록된 참가자입니다",
        enterExpenseName: "항목 이름을 입력해주세요",
        enterValidAmount: "올바른 금액을 입력해주세요",
        selectPayer: "지불한 사람을 선택해주세요",
        enterCategoryName: "카테고리 이름을 입력해주세요",
        categoryExists: "이미 존재하는 카테고리입니다",
        defaultCategoryReserved: '"default"는 사용할 수 없는 이름입니다',
        enterProfileName: "프로필 이름을 입력해주세요",
        profileExists: "이미 존재하는 프로필입니다",
        guestProfileReserved: "게스트는 기본 프로필입니다. 다른 이름을 사용해주세요",
        cannotDeleteGuest: "게스트 프로필은 삭제할 수 없습니다",
        
        // 확인 메시지
        deleteParticipantConfirm: "님을 참가자 목록에서 제거하시겠습니까?\\n해당 참가자가 지불한 모든 내역도 함께 삭제됩니다.",
        deleteExpenseConfirm: "내역을 삭제하시겠습니까?",
        resetCategoryConfirm: "현재 카테고리의 모든 데이터가 삭제됩니다.\\n이 작업은 되돌릴 수 없습니다.\\n정말로 초기화하시겠습니까?",
        deleteCategoryConfirm: "카테고리를 삭제하시겠습니까?\\n모든 데이터가 완전히 삭제되며, 이 작업은 되돌릴 수 없습니다.",
        deleteProfileConfirm: "프로필을 삭제하시겠습니까?\\n모든 카테고리와 데이터가 완전히 삭제되며, 이 작업은 되돌릴 수 없습니다.",
        
        // 기타
        addParticipantFirst: "참가자를 추가해주세요",
        people: "명",
        yen: "¥"
    },
    
    ja: {
        // ヘッダーとナビゲーション
        appTitle: "割り勘アプリ",
        profileManagement: "プロフィール管理",
        
        // カテゴリー
        defaultCategory: "-",
        newCategory: "+ カテゴリー追加",
        categoryName: "カテゴリー名",
        addCategory: "追加",
        cancel: "キャンセル",
        
        // 参加者
        participants: "参加者",
        addParticipant: "名前を入力してください",
        addButton: "追加",
        
        // 支出
        addExpense: "支払い",
        expenseName: "項目名",
        amount: "金額",
        payer: "支払った人",
        memo: "メモ（任意）",
        addExpenseButton: "追加",
        
        // 支出リスト
        expenseList: "支払い履歴",
        reset: "リセット",
        noExpenses: "履歴がありません",
        
        // 計算結果
        totalAmount: "合計金額",
        participantCount: "参加者",
        perPersonAmount: "一人当たり",
        settlementResults: "精算結果",
        noSettlement: "精算する内容がありません",
        allSettled: "すべての参加者が正常に精算されました！🎉",
        sendWithPayPay: "PayPayで送る",
        
        // モーダル
        editExpense: "編集",
        save: "保存",
        close: "閉じる",
        confirm: "確認",
        
        // プロフィール管理
        profileManagementTitle: "プロフィール管理",
        addNewProfile: "プロフィール追加",
        profileNamePlaceholder: "プロフィール名を入力してください",
        existingProfiles: "既存のプロフィール",
        currentlyUsing: "現在使用中",
        categories: "カテゴリー",
        select: "選択",
        delete: "削除",
        edit: "編集",
        
        // 通知メッセージ
        participantAdded: "さんが追加されました",
        participantRemoved: "さんが削除されました",
        expenseAdded: "追加されました",
        expenseUpdated: "支払い内容が更新されました",
        expenseDeleted: "履歴が削除されました",
        categoryCreated: "カテゴリーが作成されました",
        categoryDeleted: "カテゴリーが削除されました",
        categoryUpdated: "カテゴリー名が変更されました",
        categoryReset: "カテゴリーがリセットされました",
        profileSwitched: "に切り替わりました",
        profileAdded: "プロフィールが追加されました",
        profileDeleted: "プロフィールが削除されました",
        profileUpdated: "プロフィール名が変更されました",
        payPayLaunching: "PayPayアプリを起動しています...",
        
        // エラーメッセージ
        enterParticipantName: "参加者名を入力してください",
        participantExists: "すでに登録されている参加者です",
        enterExpenseName: "項目名を入力してください",
        enterValidAmount: "正しい金額を入力してください",
        selectPayer: "払った人を選択してください",
        enterCategoryName: "カテゴリー名を入力してください",
        categoryExists: "すでに存在するカテゴリーです",
        defaultCategoryReserved: '"default"は使用できない名前です',
        enterProfileName: "プロフィール名を入力してください",
        profileExists: "すでに存在するプロフィールです",
        guestProfileReserved: "ゲストはデフォルトプロフィールです。他の名前を使用してください",
        cannotDeleteGuest: "ゲストプロフィールは削除できません",
        
        // 確認メッセージ
        deleteParticipantConfirm: "さんを参加者リストから削除しますか？\\nその参加者が支払ったすべての履歴も一緒に削除されます。",
        deleteExpenseConfirm: "の履歴を削除しますか？",
        resetCategoryConfirm: "現在のカテゴリーのすべてのデータが削除されます。\\nこの操作は元に戻せません。\\n本当にリセットしますか？",
        deleteCategoryConfirm: "カテゴリーを削除しますか？\\nすべてのデータが完全に削除され、この操作は元に戻せません。",
        deleteProfileConfirm: "プロフィールを削除しますか？\\nすべてのカテゴリーとデータが完全に削除され、この操作は元に戻せません。",
        
        // その他
        addParticipantFirst: "参加者を追加してください",
        people: "人",
        yen: "¥"
    }
};

// 현재 언어 설정
let currentLang = 'ko';

// 언어 설정 로드
function loadLanguageSetting() {
    const savedLang = localStorage.getItem('dutchpay_language');
    if (savedLang && translations[savedLang]) {
        currentLang = savedLang;
    }
}

// 언어 설정 저장
function saveLanguageSetting(lang) {
    currentLang = lang;
    localStorage.setItem('dutchpay_language', lang);
}

// 번역 함수
function t(key) {
    return translations[currentLang][key] || translations.ko[key] || key;
}

// 언어 변경
function changeLanguage(lang) {
    if (translations[lang]) {
        saveLanguageSetting(lang);
        updateAllTexts();
        // 언어 변경 시 일부 동적 요소들 다시 업데이트
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        }
    }
}

// 모든 텍스트 업데이트
function updateAllTexts() {
    // data-i18n 속성을 가진 모든 요소 업데이트
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.placeholder = t(key);
        } else {
            element.textContent = t(key);
        }
    });
    
    // 언어 버튼 상태 업데이트
    updateLanguageButtons();
}

// 언어 버튼 상태 업데이트
function updateLanguageButtons() {
    const koBtn = document.getElementById('langKo');
    const jaBtn = document.getElementById('langJa');
    
    if (koBtn && jaBtn) {
        koBtn.classList.toggle('active', currentLang === 'ko');
        jaBtn.classList.toggle('active', currentLang === 'ja');
    }
}

// 페이지 로드 시 언어 설정 초기화
document.addEventListener('DOMContentLoaded', function() {
    loadLanguageSetting();
    updateAllTexts();
});
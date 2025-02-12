document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('toggleButton');
    const status = document.getElementById('status');

    // 저장된 상태 불러오기
    chrome.storage.local.get(['isEnabled'], function(result) {
        toggleButton.checked = result.isEnabled || false;
        status.textContent = toggleButton.checked ? '활성화' : '비활성화';
    });

    toggleButton.addEventListener('change', function() {
        const isEnabled = toggleButton.checked;
        status.textContent = isEnabled ? '활성화' : '비활성화';

        // 상태 저장
        chrome.storage.local.set({ isEnabled: isEnabled });

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (!tabs[0]?.id) return;
            
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'toggle',
                enabled: isEnabled
            }).catch(() => {
                // 오류 무시 (페이지 새로고침이 필요한 경우)
                console.log('페이지를 새로고침하면 정상 작동합니다.');
            });
        });
    });

    // 현재 탭의 상태 확인
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs[0]?.id) return;
        
        chrome.tabs.sendMessage(tabs[0].id, {
            action: 'getState'
        }).catch(() => {
            // 오류 발생 시 상태 유지 (저장된 상태 사용)
        });
    });
}); 
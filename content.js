let isEnabled = false;
let isDrawing = false;
let startX, startY;
let selectionBox = null;
let selectedLinks = new Set();

// 초기 상태 로드
chrome.storage.local.get(['isEnabled'], function(result) {
    isEnabled = result.isEnabled || false;
});

// 메시지 수신
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggle') {
        isEnabled = request.enabled;
        // 상태 저장
        chrome.storage.local.set({ isEnabled: isEnabled });
        sendResponse({success: true});
    } else if (request.action === 'getState') {
        sendResponse({enabled: isEnabled});
    }
    return true; // 비동기 응답을 위해 필요
});

// 선택 영역 스타일
const styles = `
    .selection-box {
        position: fixed;
        border: 2px solid #2196F3;
        background-color: rgba(33, 150, 243, 0.1);
        pointer-events: none;
        z-index: 10000;
    }
    .selected-link {
        background-color: yellow !important;
        outline: 2px solid orange !important;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// 마우스 이벤트 핸들러
document.addEventListener('mousedown', (e) => {
    if (!isEnabled) return;
    isDrawing = true;
    startX = e.clientX;
    startY = e.clientY;

    // 선택 박스 생성
    selectionBox = document.createElement('div');
    selectionBox.className = 'selection-box';
    document.body.appendChild(selectionBox);
});

document.addEventListener('mousemove', (e) => {
    if (!isEnabled || !isDrawing) return;

    const rect = {
        left: Math.min(startX, e.clientX),
        top: Math.min(startY, e.clientY),
        width: Math.abs(e.clientX - startX),
        height: Math.abs(e.clientY - startY)
    };

    selectionBox.style.left = rect.left + 'px';
    selectionBox.style.top = rect.top + 'px';
    selectionBox.style.width = rect.width + 'px';
    selectionBox.style.height = rect.height + 'px';

    // 링크 선택
    document.querySelectorAll('a').forEach(link => {
        const linkRect = link.getBoundingClientRect();
        const isInside = !(rect.left > linkRect.right || 
                          rect.left + rect.width < linkRect.left || 
                          rect.top > linkRect.bottom || 
                          rect.top + rect.height < linkRect.top);

        if (isInside) {
            link.classList.add('selected-link');
            selectedLinks.add(link.href);
        } else {
            link.classList.remove('selected-link');
            selectedLinks.delete(link.href);
        }
    });
});

document.addEventListener('mouseup', () => {
    if (!isEnabled || !isDrawing) return;
    isDrawing = false;

    if (selectionBox) {
        selectionBox.remove();
        selectionBox = null;
    }

    if (selectedLinks.size > 0) {
        if (confirm(`${selectedLinks.size}개의 링크를 새 탭에서 여시겠습니까?`)) {
            selectedLinks.forEach(url => {
                if (url && !url.startsWith('javascript:')) {
                    window.open(url, '_blank');
                }
            });
        }
    }

    // 선택 표시 제거
    document.querySelectorAll('.selected-link').forEach(link => {
        link.classList.remove('selected-link');
    });
    selectedLinks.clear();
}); 
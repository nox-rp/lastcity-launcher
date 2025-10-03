// 탭 전환
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;
    
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(t => t.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    if (tabName === 'news') {
      loadAnnouncements();
    }
  });
});

// 윈도우 컨트롤
document.getElementById('minimizeBtn').addEventListener('click', () => {
  window.electronAPI.minimizeWindow();
});

document.getElementById('closeBtn').addEventListener('click', () => {
  window.electronAPI.closeWindow();
});

// FiveM 실행 (서버 링크는 여기에 직접 입력)
document.getElementById('launchBtn').addEventListener('click', async () => {
  const btn = document.getElementById('launchBtn');
  const originalHTML = btn.innerHTML;
  
  btn.disabled = true;
  btn.innerHTML = '<span>⏳</span><span>실행 중...</span>';
  
  // 여기에 서버 링크를 직접 입력하세요
  const serverLink = 'cfx.re/join/plgg67';
  
  const result = await window.electronAPI.launchFiveM(serverLink);
  
  if (result.success) {
    btn.innerHTML = '<span>✓</span><span>실행됨!</span>';
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }, 2000);
  } else {
    alert(result.error || 'FiveM 실행에 실패했습니다.');
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
});

// 최근 소식 로드 (홈 탭)
async function loadNews() {
  const newsGrid = document.getElementById('newsGrid');
  const result = await window.electronAPI.fetchAnnouncements();
  
  if (result.success && result.data.length > 0) {
    // 최신 4개만 표시
    const recentNews = result.data.slice(0, 4);
    
    newsGrid.innerHTML = recentNews.map(news => `
      <div class="news-card">
        <div class="news-card-image">
          <span>LC</span>
          ${news.important ? '<div class="news-card-badge">중요</div>' : ''}
        </div>
        <div class="news-card-content">
          <div class="news-card-title">${news.title}</div>
          <div class="news-card-date">${new Date(news.date).toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
          })}</div>
        </div>
      </div>
    `).join('');
  } else {
    newsGrid.innerHTML = '<div class="loading">최근 소식이 없습니다.</div>';
  }
}

// 공지사항 로드
async function loadAnnouncements() {
  const container = document.getElementById('announcementsList');
  container.innerHTML = '<div class="loading">공지사항을 불러오는 중...</div>';
  
  const result = await window.electronAPI.fetchAnnouncements();
  
  if (result.success && result.data.length > 0) {
    container.innerHTML = result.data.map(announcement => `
      <div class="announcement-item ${announcement.important ? 'important' : ''}">
        <div class="announcement-header">
          <div class="announcement-title">${announcement.title}</div>
          <div class="announcement-date">${new Date(announcement.date).toLocaleDateString('ko-KR')}</div>
        </div>
        <div class="announcement-content">${announcement.content}</div>
        <div class="announcement-author">작성자: ${announcement.author}</div>
      </div>
    `).join('');
  } else {
    container.innerHTML = '<div class="loading">공지사항이 없습니다.</div>';
  }
}

// 외부 링크
document.getElementById('discordBtn').addEventListener('click', () => {
  window.electronAPI.openExternal('https://discord.gg/n2nRVU2wgM');
});

document.getElementById('guideBtn').addEventListener('click', () => {
  window.electronAPI.openExternal('http://localhost:3000');
});

// 자동 업데이트 이벤트 리스너
window.electronAPI.onUpdateAvailable((info) => {
  showUpdateNotification(`새 버전 ${info.version}이 있습니다!`, true);
});

window.electronAPI.onDownloadProgress((progress) => {
  const percent = Math.round(progress.percent);
  showUpdateNotification(`업데이트 다운로드 중... ${percent}%`, false);
});

window.electronAPI.onUpdateStatus((text) => {
  console.log('업데이트 상태:', text);
});

// 업데이트 알림 표시
function showUpdateNotification(message, showDownloadBtn) {
  // 기존 알림 제거
  const existingNotif = document.querySelector('.update-notification');
  if (existingNotif) {
    existingNotif.remove();
  }

  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <div class="update-message">${message}</div>
    ${showDownloadBtn ? '<button class="update-btn" onclick="downloadUpdate()">다운로드</button>' : ''}
  `;
  
  document.body.appendChild(notification);
  
  // 다운로드 버튼이 없으면 5초 후 자동 제거
  if (!showDownloadBtn) {
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
}

// 업데이트 다운로드 함수
window.downloadUpdate = function() {
  window.electronAPI.downloadUpdate();
  const notification = document.querySelector('.update-notification');
  if (notification) {
    notification.querySelector('.update-message').textContent = '업데이트 다운로드 중...';
    const btn = notification.querySelector('.update-btn');
    if (btn) btn.remove();
  }
};

// 앱 버전 표시
async function displayVersion() {
  const version = await window.electronAPI.getAppVersion();
  console.log('런처 버전:', version);
}

// 초기 로드
loadNews();
displayVersion();

// 5분마다 공지사항 자동 새로고침
setInterval(() => {
  const newsTab = document.getElementById('home-tab');
  if (newsTab.classList.contains('active')) {
    loadNews();
  }
}, 5 * 60 * 1000);
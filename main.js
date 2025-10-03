const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');
const { autoUpdater } = require('electron-updater');

let mainWindow;

// 자동 업데이트 설정
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// 윈도우 생성
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    resizable: false,
    frame: false,
    transparent: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'build', 'icon.ico')
  });

  mainWindow.loadFile('renderer/index.html');

  // 개발 모드에서만 DevTools 열기
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // 앱 시작 시 업데이트 확인
  if (!process.argv.includes('--dev')) {
    setTimeout(() => {
      autoUpdater.checkForUpdates();
    }, 3000);
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 자동 업데이트 이벤트 핸들러
autoUpdater.on('checking-for-update', () => {
  console.log('업데이트 확인 중...');
  sendStatusToWindow('업데이트 확인 중...');
});

autoUpdater.on('update-available', (info) => {
  console.log('업데이트 사용 가능:', info.version);
  sendStatusToWindow(`새 버전 ${info.version} 발견!`);
  
  // 사용자에게 알림
  mainWindow.webContents.send('update-available', info);
});

autoUpdater.on('update-not-available', () => {
  console.log('최신 버전입니다.');
  sendStatusToWindow('최신 버전입니다.');
});

autoUpdater.on('error', (err) => {
  console.error('업데이트 오류:', err);
  sendStatusToWindow('업데이트 오류: ' + err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let message = `다운로드 속도: ${progressObj.bytesPerSecond} - ${progressObj.percent}% 완료`;
  console.log(message);
  mainWindow.webContents.send('download-progress', progressObj);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('업데이트 다운로드 완료');
  sendStatusToWindow('업데이트 다운로드 완료. 재시작 중...');
  
  // 3초 후 자동으로 재시작하여 업데이트 적용
  setTimeout(() => {
    autoUpdater.quitAndInstall();
  }, 3000);
});

function sendStatusToWindow(text) {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', text);
  }
}

// IPC 핸들러들

// 윈도우 컨트롤
ipcMain.on('window-minimize', () => {
  mainWindow.minimize();
});

ipcMain.on('window-close', () => {
  mainWindow.close();
});

// 업데이트 다운로드 시작
ipcMain.on('download-update', () => {
  autoUpdater.downloadUpdate();
});

// 수동 업데이트 확인
ipcMain.on('check-for-updates', () => {
  autoUpdater.checkForUpdates();
});

// FiveM 실행
ipcMain.handle('launch-fivem', async (event, serverLink) => {
  try {
    // FiveM 프로토콜로 실행
    const command = serverLink 
      ? `start fivem://connect/${serverLink}`
      : `start fivem://`;

    exec(command, { shell: true }, (error) => {
      if (error) {
        console.error('FiveM 실행 오류:', error);
      }
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 공지사항 가져오기
ipcMain.handle('fetch-announcements', async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/announcements');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('공지사항 로드 실패:', error);
    return { 
      success: false, 
      error: '공지사항을 불러올 수 없습니다.',
      data: []
    };
  }
});

// 외부 링크 열기
ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url);
});

// 앱 버전 가져오기
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});
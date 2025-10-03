const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 윈도우 컨트롤
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  
  // FiveM 실행
  launchFiveM: (serverLink) => ipcRenderer.invoke('launch-fivem', serverLink),
  
  // 공지사항
  fetchAnnouncements: () => ipcRenderer.invoke('fetch-announcements'),
  
  // 외부 링크
  openExternal: (url) => ipcRenderer.send('open-external', url),
  
  // 업데이트 관련
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  downloadUpdate: () => ipcRenderer.send('download-update'),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (event, info) => callback(info)),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, progress) => callback(progress)),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, text) => callback(text)),
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
});
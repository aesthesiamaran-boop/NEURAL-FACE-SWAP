const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

let win, lastOutput = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 1000, minHeight: 680,
    title: 'Neural Face Swap by Scientific Tamil Nadu',
    backgroundColor: '#0d0f14', autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  win.loadFile('index.html');
}

function engineCommand() {
  if (app.isPackaged) {
    return { cmd: path.join(process.resourcesPath, 'engine', 'swap_engine.exe'), pre: [], models: path.join(process.resourcesPath, 'models') };
  }
  return { cmd: process.platform === 'win32' ? 'python' : 'python3', pre: [path.join(__dirname, 'engine', 'swap.py')], models: path.join(__dirname, 'models') };
}

ipcMain.handle('pick-image', async (_e, title) => {
  const r = await dialog.showOpenDialog(win, {
    title, properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'webp', 'tif', 'tiff'] }]
  });
  if (r.canceled || !r.filePaths[0]) return null;
  return { path: r.filePaths[0], url: pathToFileURL(r.filePaths[0]).href };
});

ipcMain.handle('swap', async (_e, { target, source, mode, restore }) => {
  const out = path.join(os.tmpdir(), `nfs_${Date.now()}.png`);
  const { cmd, pre, models } = engineCommand();
  const args = [...pre, '--target', target, '--source', source, '--out', out, '--models', models, '--faces', mode, '--restore', restore ? '1' : '0'];
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { windowsHide: true });
    let err = '';
    p.stdout.on('data', d => String(d).split(/\r?\n/).forEach(l => {
      if (l.startsWith('PROGRESS|')) win.webContents.send('progress', l.slice(9));
    }));
    p.stderr.on('data', d => { err += d; });
    p.on('error', e => resolve({ ok: false, error: 'Could not start engine: ' + e.message }));
    p.on('close', code => {
      if (code === 0 && fs.existsSync(out)) { lastOutput = out; resolve({ ok: true, url: pathToFileURL(out).href + '?t=' + Date.now() }); }
      else { const m = /ERROR\|(.*)/.exec(err + ''); resolve({ ok: false, error: m ? m[1] : (err.trim().split('\n').pop() || 'Engine failed') }); }
    });
  });
});

ipcMain.handle('save-png', async () => {
  if (!lastOutput) return { ok: false };
  const r = await dialog.showSaveDialog(win, { title: 'Save as PNG', defaultPath: 'neural-face-swap.png', filters: [{ name: 'PNG', extensions: ['png'] }] });
  if (r.canceled || !r.filePath) return { ok: false };
  fs.copyFileSync(lastOutput, r.filePath);
  return { ok: true, path: r.filePath };
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

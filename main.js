// Avion Messager : un petit avion traverse l'écran en tirant une banderole
// avec le rappel de la prochaine réunion.

// Certains terminaux (VS Code notamment) définissent ELECTRON_RUN_AS_NODE,
// ce qui prive Electron de sa partie graphique : on relance alors proprement.
if (process.env.ELECTRON_RUN_AS_NODE) {
  const { spawnSync } = require('child_process');
  delete process.env.ELECTRON_RUN_AS_NODE;
  const result = spawnSync(process.execPath, process.argv.slice(1), {
    stdio: 'inherit',
    env: process.env,
  });
  process.exit(result.status === null ? 1 : result.status);
}

const { app, BrowserWindow, ipcMain, Menu, screen, shell, Tray } = require('electron');
const path = require('path');
const fs = require('fs');
const { startWatch, countEvents, bannerText } = require('./calendar');

const isDemo = process.argv.includes('--demo');

// Une fois installée (version .exe ou .dmg), l'application ne peut plus écrire
// dans son propre dossier : la configuration vit alors dans le dossier
// utilisateur prévu par le système.
const configFile = app.isPackaged
  ? path.join(app.getPath('userData'), 'config.json')
  : path.join(__dirname, 'config.json');

let tray = null;
let settingsWin = null;
let stopWatch = null;
let flying = false;
const queue = [];
const config = loadConfig();

function loadConfig() {
  if (!fs.existsSync(configFile)) {
    fs.mkdirSync(path.dirname(configFile), { recursive: true });
    fs.copyFileSync(path.join(__dirname, 'config.example.json'), configFile);
  }
  return JSON.parse(fs.readFileSync(configFile, 'utf8'));
}

function saveConfig() {
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
}

function startWatching() {
  if (stopWatch) stopWatch();
  console.log(`[avion-messager] En vol. Agenda vérifié toutes les ${config.checkEverySeconds || 60} secondes.`);
  stopWatch = startWatch(config, fly);
}

// Fait traverser l'écran à l'avion avec son message.
// Si un vol est déjà en cours, le suivant attend son tour dans la file.
function fly(message) {
  if (flying) {
    queue.push(message);
    return;
  }
  flying = true;

  const zone = screen.getPrimaryDisplay().workArea;
  const win = new BrowserWindow({
    x: zone.x,
    y: zone.y,
    width: zone.width,
    height: zone.height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: false,
    hasShadow: false,
    show: false,
  });
  // Les clics passent au travers de la fenêtre : l'avion ne gêne jamais le travail.
  win.setIgnoreMouseEvents(true);
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.webContents.once('did-finish-load', () => win.showInactive());
  win.loadFile(path.join(__dirname, 'fly.html'), {
    query: { msg: message, duration: String(config.durationSeconds || 12) },
  });

  setTimeout(() => {
    if (!win.isDestroyed()) win.close();
    flying = false;
    if (queue.length > 0) {
      fly(queue.shift());
    } else if (isDemo) {
      app.quit();
    }
  }, ((config.durationSeconds || 12) + 2) * 1000);
}

// Petite fenêtre de réglages : c'est ici qu'on colle l'adresse secrète iCal.
function openSettings() {
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.focus();
    return;
  }
  settingsWin = new BrowserWindow({
    width: 600,
    height: 730,
    resizable: false,
    autoHideMenuBar: true,
    title: 'Avion Messager',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  settingsWin.loadFile(path.join(__dirname, 'settings.html'), {
    query: { current: config.icsUrl || '' },
  });
}

ipcMain.handle('open-google-calendar', () => shell.openExternal('https://calendar.google.com'));

ipcMain.handle('open-outlook-calendar', () => shell.openExternal('https://outlook.office.com/calendar'));

ipcMain.handle('test-flight', () => fly(bannerText('Essai', 5)));

ipcMain.handle('save-ics-url', async (event, rawUrl) => {
  const url = String(rawUrl || '').trim().replace(/^["']+|["']+$/g, '');
  if (!/^https:\/\//.test(url)) {
    return {
      ok: false,
      message: "Ça ne ressemble pas à une adresse complète : elle doit commencer par https://",
    };
  }
  const check = await countEvents(url);
  if (!check.ok) {
    return { ok: false, message: 'Connexion impossible : ' + check.error };
  }
  config.icsUrl = url;
  saveConfig();
  startWatching();
  return {
    ok: true,
    message: `Agenda connecté : ${check.total} événement(s) trouvé(s). L'avion décollera ${config.minutesBefore || 5} minutes avant chaque réunion.`,
  };
});

app.whenReady().then(() => {
  if (process.platform === 'darwin' && app.dock) app.dock.hide();

  if (isDemo) {
    console.log('[avion-messager] Vol de démonstration...');
    fly(bannerText('Adrien', 5));
    // Filet de sécurité : on quitte quoi qu'il arrive au bout d'une minute.
    setTimeout(() => app.quit(), 60000);
    return;
  }

  const menu = [
    { label: "Connecter ou changer d'agenda...", click: openSettings },
    { label: "Vol d'essai", click: () => fly(bannerText('Essai', 5)) },
  ];
  // En mode développement, le lancement automatique enregistrerait le mauvais
  // programme : l'option n'existe que dans la version installée.
  if (app.isPackaged) {
    menu.push({
      label: "Lancer au démarrage de l'ordinateur",
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }),
    });
  }
  menu.push({ type: 'separator' }, { label: 'Quitter', click: () => app.quit() });

  tray = new Tray(path.join(__dirname, 'icon.png'));
  tray.setToolTip('Avion Messager');
  tray.setContextMenu(Menu.buildFromTemplate(menu));
  tray.on('double-click', openSettings);

  if (config.icsUrl) {
    startWatching();
  } else {
    // Premier lancement : on guide tout de suite vers la connexion de l'agenda.
    openSettings();
  }
});

// L'application vit dans la barre des tâches : elle ne doit pas quitter
// quand la fenêtre d'un vol ou des réglages se ferme.
app.on('window-all-closed', () => {});

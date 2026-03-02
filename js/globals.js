// ============================================================
// GLOBALS — Canvas, global game state variables, SKINS list, utility functions
// ============================================================

const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
const scoreEl = document.getElementById('score'), infinityScoreEl = document.getElementById('infinity-score');
const normalScoreBox = document.getElementById('normal-score-box'), infinityScoreBox = document.getElementById('infinity-score-box');
const highScoreEl = document.getElementById('high-score'), infinityHighScoreEl = document.getElementById('infinity-high-score');
const normalBestBox = document.getElementById('normal-best-box'), infinityBestBox = document.getElementById('infinity-best-box');
const finalScoreEl = document.getElementById('final-score'), gameOverScreen = document.getElementById('game-over-screen');
const winScreen = document.getElementById('win-screen'), startScreen = document.getElementById('start-screen');
const onlineScreen = document.getElementById('online-screen'), fpsCounter = document.getElementById('fps-counter');
const diffLabel = document.getElementById('diff-label'), npcDialog = document.getElementById('npc-dialog');
const hudOrange = document.getElementById('hud-orange'), hudBlue = document.getElementById('hud-blue'), hudGold = document.getElementById('hud-gold');
const menuOrange = document.getElementById('menu-orange'), menuBlue = document.getElementById('menu-blue'), menuGold = document.getElementById('menu-gold');
const p1SkinLabel = document.getElementById('p1-skin-name'), p2SkinLabel = document.getElementById('p2-skin-name');
const p1Status = document.getElementById('p1-status'), p2Status = document.getElementById('p2-status');
const p1Action = document.getElementById('p1-action'), p2Action = document.getElementById('p2-action');
const btnEasy = document.getElementById('btn-easy'), btnHard = document.getElementById('btn-hard');
const btnMega = document.getElementById('btn-mega'), btnInfinity = document.getElementById('btn-infinity');
const btnMode = document.getElementById('btn-mode'), p2Area = document.getElementById('p2-area');
const hintP1 = document.getElementById('hint-p1'), hintP2 = document.getElementById('hint-p2');
const unlockMsg = document.getElementById('unlock-msg'), btnNextLevel = document.getElementById('btn-next-level');
const p1PreviewCanvas = document.getElementById('p1-preview'), p1PreviewCtx = p1PreviewCanvas.getContext('2d');
const p2PreviewCanvas = document.getElementById('p2-preview'), p2PreviewCtx = p2PreviewCanvas.getContext('2d');
const onlineSkinCanvas = document.getElementById('online-skin-preview'), onlineSkinCtx = onlineSkinCanvas.getContext('2d');
const onlineSkinLabel = document.getElementById('online-skin-name');

let zoomFactor = 1.0, isMobile = false, forceMobile = false;

// Render caches — declared here so resizeCanvas() can access them safely
let _bgGrad = null, _bgGradDiff = null, _bgGradH = 0, _bgGradOff = null;
let _sunCaches = {};
let _rainbowCache = null, _rainbowCacheW = 0, _rainbowCacheH = 0;
let _behelitCache = null, _behelitCacheR = 0;
let _forestCache = null, _forestCacheH = 0;

function toggleMobileMode() {
    forceMobile = !forceMobile;
    const btn = document.getElementById('btn-mobile-toggle');
    if (forceMobile) { btn.innerText = t('mobileOn'); btn.classList.remove('btn-dark'); btn.classList.add('btn-green'); }
    else { btn.innerText = t('mobileAuto'); btn.classList.add('btn-dark'); btn.classList.remove('btn-green'); }
    resizeCanvas(); updatePlayerModeUI();
}

// Track whether mobile controls should be visible (only during gameplay or settings)
let _mobileCtrlsActive = false;

function _showMobileControls() {
    _mobileCtrlsActive = true;
    if (isMobile) {
        const layer = document.getElementById('mobile-controls-layer');
        if (layer) layer.style.display = 'block';
    }
}
function _hideMobileControls() {
    _mobileCtrlsActive = false;
    const layer = document.getElementById('mobile-controls-layer');
    if (layer) layer.style.display = 'none';
}

function checkMobile() {
    if (forceMobile) isMobile = true;
    else isMobile = ('ontouchstart' in window) || (window.innerWidth <= 900);
    const controlsLayer = document.getElementById('mobile-controls-layer');
    if (isMobile) {
        // Уменьшаем зум сильнее — больше мира видно на экране
        zoomFactor = Math.min(1.0, window.innerWidth / 1500);
        if (zoomFactor < 0.5) zoomFactor = 0.5;
        // Only show controls if they were active before resize (e.g. during gameplay or settings)
        if (controlsLayer) controlsLayer.style.display = _mobileCtrlsActive ? 'block' : 'none';
    } else {
        zoomFactor = 1.0;
        if (controlsLayer) controlsLayer.style.display = 'none';
    }
    // Mobile: yellow fullscreen button + prompt if not in fullscreen
    const fsBtn = document.getElementById('btn-fullscreen');
    const fsPrompt = document.getElementById('fullscreen-prompt');
    if (fsBtn) {
        if (isMobile) {
            fsBtn.style.background = '#b8860b';
            fsBtn.style.borderColor = '#ffd700';
            fsBtn.style.color = '#ffd700';
            if (fsPrompt && !document.fullscreenElement && !document.webkitFullscreenElement) {
                fsPrompt.style.display = 'block';
            }
        } else {
            fsBtn.style.background = '';
            fsBtn.style.borderColor = '';
            fsBtn.style.color = '';
            if (fsPrompt) fsPrompt.style.display = 'none';
        }
    }
}

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; checkMobile();
    // Invalidate screen-size-dependent caches
    _bgGrad = null; _rainbowCache = null; _forestCache = null; }
window.addEventListener('resize', resizeCanvas); resizeCanvas();

let gameTime = 0, score = 0, isGameOver = false, isPlaying = false, isWin = false;
let animationId, menuAnimationId, currentDifficulty = 'easy', lastTime = 0, fpsDisplayTime = 0, fpsFrames = 0, numPlayers = 1, frameCount = 0;
const camera = { x: 0, y: 0 }, gravity = 0.6, jumpStrength = -14, moveSpeed = 6, blockSize = 50;
const CASTLE_SCORE = 250, CASTLE_START_X = CASTLE_SCORE * blockSize;
let castleGenerated = false, inCastle = false;
let highScore = parseInt(localStorage.getItem('pixelCatsDiffScore')) || 0;
let infinityHighScore = parseInt(localStorage.getItem('pixelCatsInfinityHighScore')) || 0;
let hardUnlocked = localStorage.getItem('pixelCatsHardUnlocked') === 'true';
let megaHardUnlocked = localStorage.getItem('pixelCatsMegaHardUnlocked') === 'true';
let infinityUnlocked = localStorage.getItem('pixelCatsInfinityUnlocked') === 'true';
let unlockedSkins = JSON.parse(localStorage.getItem('pixelCatsUnlockedSkins')) || ['white', 'orange', 'black', 'calico'];
let fishWallet = { orange: parseInt(localStorage.getItem('pixelCatsOrange')) || 0, blue: parseInt(localStorage.getItem('pixelCatsBlueFish')) || 0, gold: parseInt(localStorage.getItem('pixelCatsGold')) || 0 };
const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

// Возвращает Y-координату поверхности земли в мировых координатах.
// В онлайне используем значение хоста, чтобы ландшафт был одинаковым
// на обоих экранах независимо от их разрешения.
function getWorldGround() {
    return (net.isOnline && net.worldGroundBase > 0)
        ? net.worldGroundBase
        : (canvas.height - 100);
}

// ============================================
// ONLINE MULTIPLAYER SYSTEM
// Система онлайн мультиплеера с двумя режимами:
// 1. PeerJS (P2P) - работает напрямую между браузерами
// 2. WebSocket - более надежное подключение через сервер
// ============================================
// ============================================
// SEEDED RNG — одинаковый на обоих устройствах
// ============================================
let _rngState = 1;
function seedRng(seed) { _rngState = (seed >>> 0) || 1; }
function rng() {
    _rngState ^= _rngState << 13;
    _rngState ^= _rngState >>> 17;
    _rngState ^= _rngState << 5;
    return (_rngState >>> 0) / 0x100000000;
}

const net = {
    peer: null,
    conn: null,
    isHost: false,
    isOnline: false,
    myId: null,
    worldSeed: 0,         // Общий seed для генерации карты
    remoteSkin: 0,        // Скин удалённого игрока

    // Последнее известное состояние удалённого кота (для интерполяции)
    remote: { x: 160, y: 100, vx: 0, vy: 0, dir: true, lastTime: 0 },

    lastSentTime: 0,
    gameStartTime: 0,  // время последнего старта — для фильтрации устаревших DEAD/WIN
    tickRate: 14,         // ~70fps отправка позиции

    ping: 0,
    lastPingTime: 0,

    // ============================================
    // БАГ #1 FIX: синхронизация высоты земли
    // canvas.height у разных игроков разный (разные экраны),
    // поэтому Y-координаты ландшафта не совпадают.
    // Хост передаёт свою базовую высоту земли, гость использует её
    // для генерации ландшафта + добавляет вертикальный сдвиг рендера.
    // ============================================
    worldGroundBase: 0,   // canvas.height - 100 хоста (в пикселях)

    // ── Онлайн битва с боссом ──────────────────────────────────
    bossOnline: false,        // идёт онлайн-бой с боссом
    bossRemote: { x: 0, y: 0, dir: true, alive: true, inv: 0 }, // позиция гостя (для хоста)
    bossLastStateSent: 0,     // timestamp последней отправки BOSS_STATE
};
function toggleFullscreen() {
    let elem = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const p = elem.requestFullscreen ? elem.requestFullscreen() :
                  elem.webkitRequestFullscreen ? (elem.webkitRequestFullscreen(), Promise.resolve()) :
                  Promise.resolve();
        p.catch(err => console.log("Fullscreen error: " + err.message));
        const fsPrompt = document.getElementById('fullscreen-prompt');
        if (fsPrompt) fsPrompt.style.display = 'none';
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
    }
}

// NOTE: updateFishUI() is called in main.js after all modules are loaded

const SKINS = [
    { id: 'white', nameKey: 'skins.white', body: '#fff', nose: '#ffafcc', eye: 'black', type: 'solid' },
    { id: 'orange', nameKey: 'skins.orange', body: '#e67e22', nose: '#ffafcc', eye: 'black', type: 'solid' },
    { id: 'black', nameKey: 'skins.black', body: '#2c3e50', nose: '#bdc3c7', eye: '#2ecc71', type: 'solid' },
    { id: 'calico', nameKey: 'skins.calico', body: '#fff', nose: '#ffafcc', eye: 'black', type: 'calico' },
    { id: 'pink', nameKey: 'skins.pink', body: '#ffc0cb', nose: '#ff1493', eye: 'black', type: 'solid', cost: 10, currency: 'blue' },
    { id: 'witch', nameKey: 'skins.witch', body: '#2c3e50', nose: '#bdc3c7', eye: '#e74c3c', type: 'solid', hat: 'witch', reqScore: 200 },
    { id: 'cyber', nameKey: 'skins.cyber', body: '#2d3436', nose: '#00cec9', eye: '#00cec9', type: 'cyber', cost: 20, currency: 'blue' },
    { id: 'froggy', nameKey: 'skins.froggy', body: '#57606f', nose: '#ffafcc', eye: 'black', type: 'tabby', hat: 'frog', cost: 20, currency: 'gold' },
    { id: 'sims', nameKey: 'skins.sims', body: '#dfe6e9', nose: '#ffafcc', eye: 'black', type: 'solid', hat: 'plumbob', cost: 50, currency: 'orange' },
    { id: 'newyear', nameKey: 'skins.newyear', body: '#ffeaa7', nose: '#ff9ff3', eye: '#63421d', type: 'tabby', hat: 'santa', acc: 'garland' },
    { id: 'angel', nameKey: 'skins.angel', body: '#ffffff', nose: '#ffafcc', eye: '#3498db', type: 'solid', hat: 'halo', acc: 'wings', reqInfinityScore: 300 },
    { id: 'samurai', nameKey: 'skins.samurai', body: '#1a1a1a', nose: '#8b0000', eye: '#ff0000', type: 'samurai', hat: 'samurai', acc: 'katana', secret: true },
    { id: 'foxcoat', nameKey: 'skins.foxcoat', body: '#f1c40f', nose: '#ffafcc', eye: '#f39c12', type: 'foxcoat', cost: 30, currency: 'orange' }
];

let p1SkinIndex = 0, p2SkinIndex = 1;
// Скин, который гость выбрал в онлайн-лобби; сбрасывается после INIT.
// Нужен чтобы INIT от хоста не перезаписал выбор гостя если SKIN-сообщение
// пришло с задержкой (Firebase latency).
let _pendingGuestSkin = null;
// Собственный скин гостя — сохраняется при изменении скина и при старте INIT,
// восстанавливается при возврате в лобби (чтобы INIT не затирал выбор гостя).
let _guestOwnSkin = null;

// ============================================
// OPEN ONLINE MENU - Show lobby screen
// ============================================
// Текущий активный режим подключения: 'p2p' | 'firebase'
let connMode = 'p2p';

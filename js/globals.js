// ============================================================
// GLOBALS — Canvas, global game state variables, SKINS list, utility functions
// ============================================================

// ── ГЛОБАЛЬНЫЙ ФИК БЛОКИРОВКИ ПАМЯТИ (Яндекс iframe) ────────────────────────
// SafeStorage (safestorage.js) уже обрабатывает недоступный localStorage —
// дополнительная подмена через defineProperty не нужна и ломает Яндекс-среду.
// ─────────────────────────────────────────────────────────────────────────────

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
let _forestCache = null, _forestCacheH = 0, _forestCacheGround = 0;

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
    _bgGrad = null; _rainbowCache = null; _forestCache = null; _forestCacheGround = 0; }
window.addEventListener('resize', resizeCanvas); resizeCanvas();

let gameTime = 0, score = 0, isGameOver = false, isPlaying = false, isWin = false;
let animationId, menuAnimationId, currentDifficulty = 'easy', lastTime = 0, fpsDisplayTime = 0, fpsFrames = 0, numPlayers = 1, frameCount = 0;
const camera = { x: 0, y: 0 }, moveSpeed = 6, blockSize = 50;
// gravity и jumpStrength объявлены как let, чтобы init() мог переключать
// лунную физику (megahard) и земную (остальные уровни) без отдельного множителя
let gravity = 0.6, jumpStrength = -14;
const CASTLE_SCORE = 250, CASTLE_START_X = CASTLE_SCORE * blockSize;
let castleGenerated = false, inCastle = false;
let highScore = SafeStorage.getInt('pixelCatsDiffScore');
let infinityHighScore = SafeStorage.getInt('pixelCatsInfinityHighScore');
let hardUnlocked = SafeStorage.getBool('pixelCatsHardUnlocked');
let megaHardUnlocked = SafeStorage.getBool('pixelCatsMegaHardUnlocked');
let infinityUnlocked = SafeStorage.getBool('pixelCatsInfinityUnlocked');
let unlockedSkins = SafeStorage.getJSON('pixelCatsUnlockedSkins') || ['white', 'orange', 'black', 'calico'];
let fishWallet = { orange: SafeStorage.getInt('pixelCatsOrange'), blue: SafeStorage.getInt('pixelCatsBlueFish'), gold: SafeStorage.getInt('pixelCatsGold') };
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
    worldSeed: 0,
    remoteSkin: 0,
    remote: { x: 160, y: 100, vx: 0, vy: 0, dir: true, lastTime: 0 },
    lastSentTime: 0,
    gameStartTime: 0,
    tickRate: 14,
    ping: 0,
    lastPingTime: 0,
    worldGroundBase: 0,
    bossOnline: false,
    bossRemote: { x: 0, y: 0, dir: true, alive: true, inv: 0 },
    bossLastStateSent: 0,
    forceRelay: false,
    selectedBossIndex: undefined,
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
let _pendingGuestSkin = null;
let _guestOwnSkin = null;

let connMode = 'p2p';

const IconGenerator = (() => {
    const cache = {};

    function create(name, scale, drawFn) {
        try {
            const c = document.createElement('canvas');
            c.width = 16 * scale; c.height = 16 * scale;
            const ctx = c.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.scale(scale, scale);
            drawFn(ctx);
            return c.toDataURL();
        } catch (e) {
            console.warn('IconGenerator.create error for', name, e);
            return ''; // возвращаем пустую строку, чтобы не ломало остальное
        }
    }
    function rects(ctx, rList, color) {
        ctx.fillStyle = color;
        for (const r of rList) ctx.fillRect(r[0], r[1], r[2], r[3]);
    }

    const ICONS = {
        // ★ Звезда / очки
        star(ctx) {
            rects(ctx, [[7,1,2,3],[2,5,12,2],[4,7,8,3],[3,10,3,4],[10,10,3,4],[6,8,4,2]], '#f1c40f');
            rects(ctx, [[7,2,2,2],[4,5,8,1]], '#fff');
        },
        // 🔒 Замок
        lock(ctx) {
            rects(ctx, [[5,3,6,2],[4,4,2,4],[10,4,2,4]], '#bdc3c7');
            rects(ctx, [[3,8,10,7]], '#f1c40f');
            rects(ctx, [[7,11,2,2]], '#222');
        },
        // 🔥 Огонь
        fire(ctx) {
            rects(ctx, [[7,2,2,12],[4,6,8,8],[2,9,12,5]], '#e74c3c');
            rects(ctx, [[6,7,4,7],[5,10,6,4]], '#f1c40f');
            rects(ctx, [[7,11,2,3]], '#fff');
        },
        // ❄️ Лёд
        ice(ctx) {
            rects(ctx, [[7,2,2,12],[2,7,12,2],[4,4,2,2],[10,4,2,2],[4,10,2,2],[10,10,2,2]], '#3498db');
            rects(ctx, [[6,6,4,4]], '#e0f7fa');
        },
        // ⚗️ Зелье
        potion(ctx) {
            rects(ctx, [[7,2,2,4],[6,6,4,2],[4,8,8,6],[5,14,6,2]], '#95a5a6');
            rects(ctx, [[5,9,6,5]], '#2ecc71');
            rects(ctx, [[6,10,2,2]], '#a8ff78');
        },
        // 🌑 Тень
        shadow(ctx) {
            rects(ctx, [[4,2,8,12],[2,4,12,8]], '#8e44ad');
            rects(ctx, [[6,5,4,2],[5,8,2,2],[9,8,2,2]], '#000');
            rects(ctx, [[6,4,1,1],[10,4,1,1]], '#c39bd3');
        },
        // 🏅 Медали
        medal1(ctx) {
            rects(ctx, [[6,1,4,4]], '#e74c3c');
            rects(ctx, [[3,5,10,10]], '#f1c40f');
            rects(ctx, [[5,7,6,6]], '#e67e22');
            rects(ctx, [[7,8,2,4]], '#fff');
            rects(ctx, [[6,9,4,2]], '#fff');
        },
        medal2(ctx) {
            rects(ctx, [[6,1,4,4]], '#2980b9');
            rects(ctx, [[3,5,10,10]], '#bdc3c7');
            rects(ctx, [[5,7,6,6]], '#95a5a6');
            rects(ctx, [[6,8,4,2],[6,10,4,2],[6,8,2,4]], '#fff');
        },
        medal3(ctx) {
            rects(ctx, [[6,1,4,4]], '#27ae60');
            rects(ctx, [[3,5,10,10]], '#d35400');
            rects(ctx, [[5,7,6,6]], '#e67e22');
            rects(ctx, [[6,8,4,2],[6,10,4,2],[8,8,2,4]], '#fff');
        },
        // ⚔️ Мечи
        swords(ctx) {
            rects(ctx, [[1,13,2,2],[2,11,2,2],[4,9,2,2],[6,7,2,2],[8,5,2,2],[10,3,2,2],[12,1,2,2]], '#d0d0d0');
            rects(ctx, [[2,13,1,1],[3,11,1,1],[5,9,1,1],[7,7,1,1],[9,5,1,1],[11,3,1,1],[13,1,1,1]], '#fff');
            rects(ctx, [[0,12,3,3]], '#8b0000');
            rects(ctx, [[0,11,4,1],[0,14,4,1]], '#c0392b');
            rects(ctx, [[13,13,2,2],[11,11,2,2],[9,9,2,2],[7,7,2,2],[5,5,2,2],[3,3,2,2],[1,1,2,2]], '#d0d0d0');
            rects(ctx, [[14,14,1,1],[12,12,1,1],[10,10,1,1],[8,8,1,1],[6,6,1,1],[4,4,1,1],[2,2,1,1]], '#fff');
            rects(ctx, [[13,12,3,3]], '#8b0000');
            rects(ctx, [[12,11,4,1],[12,14,4,1]], '#c0392b');
        },

        // ════════════════════════════════════════════════════
        // 🐟 РЫБКИ — точная копия стиля из игры (drawWorld)
        // В игре: body fillRect(x,fy,20,12), tail fillRect(x-5,fy+2,5,8),
        //         eye white 4x4, pupil black 2x2
        // Масштабировано на 16×16 иконку
        // ════════════════════════════════════════════════════
        fish_orange(ctx) {
            rects(ctx, [[1,5,3,5]], '#d35400');   // хвост (левый, темнее тела)
            rects(ctx, [[4,4,11,7]], '#ffa726');  // тело (цвет из игры)
            rects(ctx, [[13,5,2,2]], '#ffffff');  // глаз белый
            rects(ctx, [[14,6,1,1]], '#000000');  // зрачок
        },
        fish_blue(ctx) {
            rects(ctx, [[1,5,3,5]], '#0277bd');   // хвост
            rects(ctx, [[4,4,11,7]], '#29b6f6');  // тело
            rects(ctx, [[13,5,2,2]], '#ffffff');  // глаз
            rects(ctx, [[14,6,1,1]], '#000000');  // зрачок
        },
        fish_gold(ctx) {
            rects(ctx, [[1,5,3,5]], '#b7950b');   // хвост
            rects(ctx, [[4,4,11,7]], '#ffd700');  // тело
            rects(ctx, [[13,5,2,2]], '#ffffff');  // глаз
            rects(ctx, [[14,6,1,1]], '#000000');  // зрачок
        },

        // 🌐 Глобус
        globe(ctx) {
            rects(ctx, [[4,1,8,2],[2,3,12,2],[1,5,14,6],[2,11,12,2],[4,13,8,2]], '#2471a3');
            rects(ctx, [[3,3,10,10],[2,5,12,6]], '#2471a3');
            rects(ctx, [[3,4,5,3],[3,6,4,2]], '#27ae60');
            rects(ctx, [[9,3,4,3],[10,5,3,3]], '#27ae60');
            rects(ctx, [[5,9,3,3],[9,10,3,2]], '#27ae60');
            rects(ctx, [[2,7,12,2]], '#1a6ea8');
            rects(ctx, [[7,1,2,14]], '#1a6ea8');
            rects(ctx, [[4,2,3,2],[3,3,2,2]], '#85c1e9');
        },
        // ⚙️ Шестерёнка
        gear(ctx) {
            rects(ctx, [[6,0,4,2],[6,14,4,2],[0,6,2,4],[14,6,2,4]], '#95a5a6');
            rects(ctx, [[2,2,2,2],[12,2,2,2],[2,12,2,2],[12,12,2,2]], '#95a5a6');
            rects(ctx, [[3,3,10,10]], '#7f8c8d');
            rects(ctx, [[5,5,6,6]], '#2c3e50');
            rects(ctx, [[6,6,4,4]], '#95a5a6');
        },
        // 🛒 Корзина
        cart(ctx) {
            rects(ctx, [[1,3,2,2],[3,4,10,2],[2,3,1,8]], '#f1c40f');
            rects(ctx, [[3,5,10,5]], '#f1c40f');
            rects(ctx, [[4,6,8,3]], '#f39c12');
            rects(ctx, [[3,10,3,2],[3,11,9,1]], '#95a5a6');
            rects(ctx, [[5,12,3,3],[10,12,3,3]], '#7f8c8d');
            rects(ctx, [[6,13,1,1],[11,13,1,1]], '#fff');
        },
        // 🏆 Кубок
        trophy(ctx) {
            rects(ctx, [[6,11,4,2],[4,13,8,2]], '#bdc3c7');
            rects(ctx, [[1,2,3,6],[12,2,3,6]], '#f1c40f');
            rects(ctx, [[3,1,10,10]], '#f1c40f');
            rects(ctx, [[4,10,8,2]], '#f1c40f');
            rects(ctx, [[4,2,8,8]], '#f39c12');
            rects(ctx, [[4,2,2,5]], '#fffde7');
            rects(ctx, [[5,2,3,2]], '#fffde7');
            rects(ctx, [[7,4,2,4],[6,5,4,2]], '#ffd700');
        },
        // 🎵 Нота
        music(ctx) {
            rects(ctx, [[7,1,4,2],[7,2,2,7]], '#fff');
            rects(ctx, [[4,8,4,3],[4,9,4,1]], '#fff');
            rects(ctx, [[3,10,2,2]], '#bdc3c7');
            rects(ctx, [[5,10,6,3],[10,7,2,4]], '#fff');
        },
        // 🔊 Динамик
        speaker(ctx) {
            rects(ctx, [[2,5,4,6]], '#bdc3c7');
            rects(ctx, [[6,4,2,8],[7,3,1,10],[8,2,3,12]], '#95a5a6');
            rects(ctx, [[11,5,2,2],[12,4,1,1]], '#3498db');
            rects(ctx, [[12,5,2,6]], '#3498db');
            rects(ctx, [[13,8,2,2],[13,6,1,4]], '#2980b9');
        },
        // 🕹️ Джойстик
        joystick(ctx) {
            rects(ctx, [[5,10,6,4]], '#7f8c8d');
            rects(ctx, [[4,11,8,4],[3,12,10,2]], '#95a5a6');
            rects(ctx, [[7,4,2,6]], '#bdc3c7');
            rects(ctx, [[5,2,6,4],[4,3,8,4]], '#95a5a6');
            rects(ctx, [[7,3,2,2]], '#e74c3c');
        },
        // 🎮 Геймпад
        gamepad(ctx) {
            rects(ctx, [[2,4,12,8],[1,6,14,4]], '#3d3d3d');
            rects(ctx, [[3,6,3,1],[3,8,3,1],[3,7,1,3],[4,7,3,1]], '#555');
            rects(ctx, [[5,7,1,1]], '#95a5a6');
            rects(ctx, [[10,6,2,2],[12,8,2,2]], '#e74c3c');
            rects(ctx, [[12,6,2,2]], '#f1c40f');
            rects(ctx, [[10,8,2,2]], '#2ecc71');
            rects(ctx, [[6,5,4,2]], '#555');
        },
        // ☁️ Облако
        cloud(ctx) {
            rects(ctx, [[4,7,8,5],[2,9,12,3]], '#bdc3c7');
            rects(ctx, [[5,5,4,3],[9,6,3,2]], '#ecf0f1');
            rects(ctx, [[5,5,6,6],[3,8,10,4]], '#ecf0f1');
            rects(ctx, [[6,4,3,2]], '#bdc3c7');
        },
        // 🚪 Дверь / выход
        door(ctx) {
            rects(ctx, [[3,1,10,14]], '#8b4513');
            rects(ctx, [[4,2,8,12]], '#a0522d');
            rects(ctx, [[5,3,6,10]], '#c68642');
            rects(ctx, [[10,8,2,2]], '#ffd700');
        },
        // ✅ Чекмарк
        check(ctx) {
            rects(ctx, [[2,7,2,2],[4,9,2,2],[6,7,2,2],[8,5,2,2],[10,3,2,2]], '#2ecc71');
            rects(ctx, [[2,8,2,2],[4,10,2,2],[6,8,2,2],[8,6,2,2]], '#2ecc71');
            rects(ctx, [[10,4,2,1],[3,8,2,1]], '#27ae60');
        },
        // ✏️ Карандаш
        pencil(ctx) {
            rects(ctx, [[2,10,2,4],[3,9,2,1],[4,8,2,1]], '#f1c40f');
            rects(ctx, [[5,7,2,2],[6,5,2,3],[7,3,2,3],[8,2,2,2]], '#f39c12');
            rects(ctx, [[9,1,4,4]], '#3498db');
            rects(ctx, [[2,13,2,1],[3,13,1,1]], '#f5cba7');
            rects(ctx, [[9,2,2,2]], '#5dade2');
        },
        // ⚠️ Предупреждение
        warning(ctx) {
            rects(ctx, [[7,1,2,2],[5,3,2,2],[9,3,2,2],[3,5,2,2],[11,5,2,2],[1,7,14,6]], '#f39c12');
            rects(ctx, [[3,7,10,4]], '#f1c40f');
            rects(ctx, [[7,8,2,2],[7,11,2,2]], '#000');
        },
        // ⚡ Молния
        lightning(ctx) {
            rects(ctx, [[8,1,4,6],[5,6,6,1],[5,7,8,1],[4,8,5,6]], '#f1c40f');
            rects(ctx, [[9,2,2,4],[6,7,4,1],[5,8,3,4]], '#fff8b0');
        },
        // ⏳ Песочные часы
        hourglass(ctx) {
            rects(ctx, [[3,1,10,2],[3,13,10,2]], '#bdc3c7');
            rects(ctx, [[4,3,8,4],[5,4,6,2]], '#f1c40f');
            rects(ctx, [[4,9,8,4],[5,10,6,2]], '#e67e22');
            rects(ctx, [[7,6,2,4]], '#95a5a6');
        },
        // 🔗 Соединение/цепь
        link(ctx) {
            rects(ctx, [[1,5,2,6],[3,4,2,2],[3,11,2,2],[5,5,1,6]], '#3498db');
            rects(ctx, [[2,6,2,4]], '#2980b9');
            rects(ctx, [[10,5,2,6],[11,4,2,2],[11,11,2,2],[13,5,2,6]], '#3498db');
            rects(ctx, [[11,6,2,4]], '#2980b9');
            rects(ctx, [[5,7,6,2]], '#3498db');
            rects(ctx, [[5,6,2,4],[9,6,2,4]], '#2471a3');
        },
        // 👤 Профиль
        person(ctx) {
            rects(ctx, [[5,1,6,5],[4,3,8,5]], '#f5cba7');
            rects(ctx, [[6,2,4,2]], '#c9a96e');
            rects(ctx, [[7,5,2,2]], '#000');
            rects(ctx, [[3,9,10,6],[2,11,12,4]], '#3498db');
            rects(ctx, [[5,6,6,4]], '#f5cba7');
        },
        // 🏃 Бегун
        runner(ctx) {
            rects(ctx, [[7,1,4,3]], '#f5cba7');
            rects(ctx, [[5,4,6,5]], '#e74c3c');
            rects(ctx, [[4,9,3,4],[8,9,4,3]], '#2980b9');
            rects(ctx, [[3,4,3,3],[9,5,3,3]], '#f5cba7');
            rects(ctx, [[3,7,3,2],[10,7,2,2]], '#f5cba7');
        },
        // 💀 Череп
        skull(ctx) {
            rects(ctx, [[4,2,8,8],[3,4,10,6],[3,10,4,2],[9,10,4,2]], '#ecf0f1');
            rects(ctx, [[4,4,3,3],[9,4,3,3]], '#2c3e50');
            rects(ctx, [[5,5,1,1],[10,5,1,1]], '#fff');
            rects(ctx, [[5,11,6,4],[6,10,4,5]], '#ecf0f1');
            rects(ctx, [[6,12,1,2],[8,12,1,2],[10,12,1,2]], '#2c3e50');
        },
        // ♾️ Бесконечность
        infinity(ctx) {
            rects(ctx, [[1,5,4,6],[2,4,2,1],[2,11,2,1]], '#3498db');
            rects(ctx, [[11,5,4,6],[13,4,2,1],[13,11,2,1]], '#3498db');
            rects(ctx, [[5,4,6,2],[5,10,6,2],[4,5,2,2],[10,5,2,2],[4,9,2,2],[10,9,2,2]], '#3498db');
            rects(ctx, [[6,5,4,6]], '#3498db');
            rects(ctx, [[6,6,4,4]], '#1a5276');
        },
        // 📡 Антенна P2P
        antenna(ctx) {
            rects(ctx, [[7,8,2,6]], '#95a5a6');
            rects(ctx, [[5,12,6,2]], '#7f8c8d');
            rects(ctx, [[3,5,2,4],[11,5,2,4]], '#e67e22');
            rects(ctx, [[1,3,2,4],[13,3,2,4]], '#e67e22');
            rects(ctx, [[7,6,2,2]], '#f39c12');
            rects(ctx, [[6,4,4,3]], '#ffd700');
        },
        // 🟢 Зелёный круг (online)
        dot_green(ctx) {
            rects(ctx, [[5,2,6,2],[3,4,10,8],[5,12,6,2],[2,5,12,6]], '#2ecc71');
            rects(ctx, [[5,3,4,2]], '#a9dfbf');
        },
        // 🔴 Красный круг (offline)
        dot_red(ctx) {
            rects(ctx, [[5,2,6,2],[3,4,10,8],[5,12,6,2],[2,5,12,6]], '#e74c3c');
            rects(ctx, [[5,3,4,2]], '#f1948a');
        },
        // ▶ Треугольник играть
        play(ctx) {
            rects(ctx, [[3,2,2,12],[5,4,2,8],[7,6,2,4],[9,7,2,2]], '#2ecc71');
            rects(ctx, [[5,5,2,1],[5,10,2,1]], '#27ae60');
        },
        // 📱 Телефон
        phone(ctx) {
            rects(ctx, [[4,1,8,14]], '#2c3e50');
            rects(ctx, [[5,2,6,10]], '#3498db');
            rects(ctx, [[6,13,4,1]], '#555');
            rects(ctx, [[7,2,2,1]], '#555');
            rects(ctx, [[5,3,6,8]], '#5dade2');
        },
        // ✋ Рука
        hand(ctx) {
            rects(ctx, [[3,7,2,7],[5,5,2,9],[7,3,2,11],[9,4,2,10],[11,6,2,8]], '#f5cba7');
            rects(ctx, [[3,13,10,2]], '#f5cba7');
            rects(ctx, [[4,8,1,5],[6,6,1,7],[8,4,1,8],[10,5,1,8],[12,7,1,6]], '#c9a96e');
        },
        // ↻ Поворот
        rotate(ctx) {
            rects(ctx, [[6,1,4,2],[10,2,2,2],[11,4,2,6],[9,10,2,2],[6,11,4,2],[4,9,2,2],[3,6,2,4],[4,4,2,2]], '#3498db');
            rects(ctx, [[10,1,4,4]], '#3498db');
            rects(ctx, [[11,2,2,2]], '#2980b9');
        },
        // ← Назад
        back(ctx) {
            rects(ctx, [[1,7,6,2],[3,5,2,2],[3,9,2,2],[5,3,2,2],[5,11,2,2]], '#bdc3c7');
            rects(ctx, [[7,4,6,8]], '#95a5a6');
            rects(ctx, [[7,6,6,4]], '#bdc3c7');
        },
        // ↩ Возврат
        back_curved(ctx) {
            rects(ctx, [[2,6,4,2],[3,4,2,2],[4,3,2,2],[6,2,6,2],[12,3,2,4],[11,7,2,2],[5,8,7,2],[5,9,2,2],[4,10,2,2],[2,10,4,4]], '#3498db');
            rects(ctx, [[1,5,2,4]], '#2980b9');
        },
        // ⏱ Таймер
        timer(ctx) {
            rects(ctx, [[6,1,4,2]], '#95a5a6');
            rects(ctx, [[3,4,10,10],[2,6,12,6]], '#bdc3c7');
            rects(ctx, [[4,5,8,8],[3,7,10,4]], '#ecf0f1');
            rects(ctx, [[8,7,2,4],[8,8,3,2]], '#e74c3c');
            rects(ctx, [[7,6,2,1]], '#555');
        },
        // ✖ Крест
        cross(ctx) {
            ctx.fillStyle = '#e74c3c';
            for (let i = 0; i < 14; i += 2) { ctx.fillRect(i, i, 3, 3); }
            for (let i = 0; i < 14; i += 2) { ctx.fillRect(13-i, i, 3, 3); }
            ctx.fillStyle = '#ff7675';
            ctx.fillRect(0, 0, 3, 3); ctx.fillRect(13, 0, 3, 3);
        },
        // ⚙ Настройки (простой вариант)
        settings_gear(ctx) {
            rects(ctx, [[6,0,4,2],[6,14,4,2],[0,6,2,4],[14,6,2,4],[2,2,2,2],[12,2,2,2],[2,12,2,2],[12,12,2,2]], '#8e44ad');
            rects(ctx, [[3,3,10,10]], '#8e44ad');
            rects(ctx, [[5,5,6,6]], '#1a0033');
            rects(ctx, [[6,6,4,4]], '#8e44ad');
        },
        // 🌐 Онлайн-соединение
        online(ctx) {
            rects(ctx, [[4,1,8,2],[2,3,12,2],[1,5,14,6],[2,11,12,2],[4,13,8,2]], '#27ae60');
            rects(ctx, [[7,1,2,14]], '#1e8449');
            rects(ctx, [[1,8,14,2]], '#1e8449');
            rects(ctx, [[4,3,8,1],[4,12,8,1]], '#52be80');
        },
        // 💡 Подсказка
        hint(ctx) {
            rects(ctx, [[5,1,6,6],[4,3,8,6]], '#ffd700');
            rects(ctx, [[6,7,4,2]], '#f39c12');
            rects(ctx, [[5,9,6,2],[5,11,6,2]], '#bdc3c7');
            rects(ctx, [[6,13,4,2]], '#95a5a6');
        },
    };

    function drawCross(ctx) {
        rects(ctx, [[2,2,4,4],[10,2,4,4],[2,10,4,4],[10,10,4,4]], '#e74c3c');
        ctx.fillStyle = '#e74c3c';
        for (let i=0;i<16;i++) { ctx.fillRect(i,i,2,2); ctx.fillRect(14-i,i,2,2); }
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(0,0,3,3); ctx.fillRect(13,0,3,3);
        ctx.fillRect(0,13,3,3); ctx.fillRect(13,13,3,3);
    }

    return {
        getIcon(name) {
            if (cache[name]) return cache[name];
            let url = '';
            if (name === 'cross') {
                url = create(name, 2, drawCross);
            } else if (ICONS[name]) {
                url = create(name, 2, ICONS[name]);
            } else {
                url = create(name, 2, ctx => rects(ctx, [[4,4,8,8]], '#555'));
            }
            cache[name] = url;
            return url;
        },
        getCatIcon(skin) {
            const key = 'cat_' + skin.id;
            if (cache[key]) return cache[key];
            const CW = 120, CH = 80;
            const c = document.createElement('canvas');
            c.width = CW; c.height = CH;
            const ctx = c.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            if (typeof drawPixelCat === 'function') {
                let catY = skin.hat ? 35 : 20;
                if (skin.hat === 'plumbob') catY = 40;
                if (skin.hat === 'samurai') catY = 55;
                drawPixelCat(ctx, 50, catY, skin, true, null, true, false, false);
            }
            const url = c.toDataURL();
            cache[key] = url;
            return url;
        },
        drawIcon(ctx, name, x, y, size) {
            const src = this.getIcon(name);
            const img = new Image();
            img.src = src;
            if (img.complete) {
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(img, x, y, size, size);
            } else {
                img.onload = () => { ctx.imageSmoothingEnabled = false; ctx.drawImage(img, x, y, size, size); };
            }
        },
        html(name, size) {
            const s = typeof size === 'number' ? size + 'px' : (size || '16px');
            return `<img src="${this.getIcon(name)}" style="width:${s};height:${s};max-width:${s};max-height:${s};vertical-align:middle;image-rendering:pixelated;display:inline-block;flex-shrink:0;">`;
        },
        setBtn(el, iconName, text) {
            if (!el) return;
            el.innerHTML = `${this.html(iconName,'14px')} ${text}`;
        },
    };
})();

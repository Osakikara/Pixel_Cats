// ============================================================
// BOSS BATTLE — Boss definitions (BOSSES), battle logic, boss drawing, win/lose
// ============================================================

const BOSSES = [
    { 
        id: 'fireGolem', 
        icon: '🔥',
        iconName: 'fire',
        hp: 100, 
        duration: 40, 
        projectileSpeed: 4, 
        projectileSize: 20, 
        spawnRate: 40, 
        color: '#ff6600',
        bodyColor: '#8b0000',
        attackPattern: 'single'
    },
    { 
        id: 'iceDragon', 
        icon: '❄️',
        iconName: 'ice',
        hp: 150, 
        duration: 30, 
        projectileSpeed: 6, 
        projectileSize: 15, 
        spawnRate: 25, 
        color: '#00ffff',
        bodyColor: '#0066cc',
        attackPattern: 'triple'
    },
    { 
        id: 'alchemist', 
        icon: '⚗️',
        iconName: 'potion',
        hp: 120, 
        duration: 30, 
        projectileSpeed: 11.0, 
        projectileSize: 14, 
        spawnRate: 999,          // not used — alchemist has custom attack logic
        color: '#00ff44',
        bodyColor: '#2a4a1a',
        attackPattern: 'alchemist'
    },
    { 
        id: 'shadowLord', 
        icon: '🌑',
        iconName: 'shadow',
        hp: 200, 
        duration: 999, 
        projectileSpeed: 8, 
        projectileSize: 12, 
        spawnRate: 15, 
        color: '#9400d3',
        bodyColor: '#2d004d',
        attackPattern: 'spread'
    }
];

// ============================================
// BOSS BATTLE STATE VARIABLES
// ============================================
let defeatedBosses = JSON.parse(localStorage.getItem('pixelCatsDefeatedBosses')) || [];

// Виртуальное пространство координат арены босса — 4× увеличено,
// одинаковое на всех устройствах, масштабируется под экран.
const BOSS_VW = 2133;
const BOSS_VH = 1200;
let currentBoss = null;
let bossProjectiles = [];
let bossBattleActive = false;
let bossBattlePaused = false;
let bossBattleSuspended = false; // paused via ESC, can be resumed
let bossBattleTime = 0;
let bossHp = 100;
let bossAnimationId = null;
let bossPlayerCat = null;
let bossPlayerCat2 = null;
let bossEntity = null;
let bossCamera = { x: 0 };
let bossDodgeCount = 0;
let bossHintVisible = true;
let bossHintTimer = null;
let shadowLordPhase = 1; // 1 = normal, 2 = grid, 3 = taunt, 4 = final
let shadowLordLastSlot = -1;
let shadowLordTauntTimer = 0;
let shadowLordFinalTimer = 0;
let shadowLordEvaporating = false;
let shadowLordEvaporateProgress = 0;

// ─── Alchemist state ─────────────────────────────────────────
let alchemistWarnings = [];      // [{x,y,timer,bombSpawned}] — ground markers
let alchemistAcid     = [];      // [{x,y,timer,maxTimer,radius}] — lingering pools
let alchemistLaserAngle = 0;     // radians, phase 3
let alchemistLaser2Active = false;
let alchemistLaserChargeTimer = 0;
let alchemistLaserCharged = false;
let alchemistAttackTimer2 = 99;  // seconds between phase 1/2 attacks (start high = attack immediately)
let alchemistLastPhase = 0;      // tracks phase changes for hint messages

function isBossUnlocked(bossId) {
    if (bossId === 'fireGolem') return true;
    if (bossId === 'iceDragon') return defeatedBosses.includes('fireGolem');
    if (bossId === 'alchemist') return defeatedBosses.includes('iceDragon');
    if (bossId === 'shadowLord') return defeatedBosses.includes('alchemist');
    return false;
}

function showBossScreen(fromEsc = false) {
    // If called mid-battle via ESC, suspend (don't fully kill the state)
    if (fromEsc && bossBattleActive && !bossBattlePaused) {
        bossBattleSuspended = true;
        bossBattleActive = false;
        if (bossAnimationId) cancelAnimationFrame(bossAnimationId);
    } else if (!fromEsc) {
        // Full open: kill any battle
        bossBattleSuspended = false;
        bossBattleActive = false;
        if (bossAnimationId) cancelAnimationFrame(bossAnimationId);
    }

    startScreen.style.display = 'none';
    onlineScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    winScreen.style.display = 'none';
    document.getElementById('boss-battle-screen').style.display = 'none';
    document.getElementById('boss-win-screen').style.display = 'none';
    document.getElementById('boss-lose-screen').style.display = 'none';
    document.getElementById('boss-screen').style.display = 'block';
    npcDialog.style.display = 'none';
    if (animationId) cancelAnimationFrame(animationId);
    if (menuAnimationId) cancelAnimationFrame(menuAnimationId);
    // Сброс кнопки «Назад» на главное меню (оффлайн по умолчанию)
    const backBtnReset = document.getElementById('btn-boss-back');
    if (backBtnReset) backBtnReset.onclick = showMenu;


    // Show/hide the Continue button
    const resumeBtn = document.getElementById('btn-boss-resume');
    resumeBtn.style.display = bossBattleSuspended ? 'block' : 'none';

    // ── Онлайн режим: показываем статус ─────────────────────────
    const titleEl = document.getElementById('boss-title');
    const hintEl = document.getElementById('boss-select-hint');
    if (net.isOnline && net.isHost) {
        titleEl.innerText = t('bossBattleOnline');
        hintEl.innerText = t('bossHostHint');
        hintEl.style.color = '#2ecc71';
    } else if (net.isOnline && !net.isHost) {
        titleEl.innerText = t('bossBattleOnline');
        hintEl.innerText = t('bossGuestHint');
        hintEl.style.color = '#e67e22';
    } else {
        titleEl.innerText = t('bossBattle');
        hintEl.innerText = t('bossSelectHint');
        hintEl.style.color = '#ccc';
    }

    renderBossList();
    _hideMobileControls();
}

function resumeBossBattle() {
    if (!bossBattleSuspended || !currentBoss) return;
    bossBattleSuspended = false;
    bossBattleActive = true;
    bossBattlePaused = false;
    AudioEngine.startBossMusic(currentBoss.id);
    _showMobileControls();
    document.getElementById('boss-screen').style.display = 'none';
    document.getElementById('boss-battle-screen').style.display = 'block';
    lastTime = performance.now();
    bossLoop(lastTime);
}

// ============================================
// BOSS ICON PIXEL ART — мини-портреты боссов в лобби
// ============================================
let _bossIconAnim = null;
const _bossIconCanvases = [];

function _startBossIconAnim() {
    if (_bossIconAnim) return;
    (function loop() {
        _bossIconCanvases.forEach(item => drawBossIconSmall(item.cv, item.id, item.unlocked));
        _bossIconAnim = requestAnimationFrame(loop);
    })();
}
function _stopBossIconAnim() {
    if (_bossIconAnim) { cancelAnimationFrame(_bossIconAnim); _bossIconAnim = null; }
    _bossIconCanvases.length = 0;
}

function drawBossIconSmall(cv, bossId, unlocked) {
    const C = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    C.clearRect(0, 0, W, H);
    C.save();
    C.translate(W * 0.5, H * 0.5);
    const P = W / 16;
    const t = Date.now() / 1000;
    const ph  = (Math.sin(t*0.10)+1)/2;
    const ph2 = (Math.sin(t*0.17)+1)/2;
    const ph3 = (Math.sin(t*0.24)+1)/2;
    const dp = (gx,gy,c,sw,sh) => { C.fillStyle=c; C.fillRect(gx*P,gy*P,(sw||1)*P,(sh||1)*P); };

    if (!unlocked) {
        C.fillStyle='#111'; C.fillRect(-6*P,-7*P,12*P,14*P);
        C.fillStyle='#222'; C.fillRect(-5*P,-6*P,10*P,12*P);
        C.strokeStyle='#555'; C.lineWidth=P*0.7;
        C.strokeRect(-2*P,-1*P,4*P,4*P);
        C.beginPath(); C.arc(0,-1*P,2.5*P,Math.PI,0); C.stroke();
        C.fillStyle='#555'; C.fillRect(-P*0.4,0,P*0.8,P*0.8);
        C.restore(); return;
    }

    if (bossId === 'fireGolem') {
        const St='#181828', Sm='#282844', Sl='#3c3c5c', Sh='#525270';
        const lv=`rgb(255,${(70+ph*110)|0},0)`, lv2=`rgb(255,${(180+ph*75)|0},${(ph*25)|0})`;
        // Stone head
        dp(-5,-6,St,10,12); dp(-6,-5,St,1,10); dp(5,-5,St,1,10);
        dp(-5,-5,Sm,9,10); dp(-4,-4,Sl,7,8); dp(-3,-3,Sh,5,5);
        // Lava crack eyes
        C.save(); C.shadowColor='#ff6600'; C.shadowBlur=14;
        C.fillStyle=lv; C.fillRect(-4*P,-2*P,3*P,2*P); C.fillRect(1*P,-2*P,3*P,2*P);
        C.fillStyle=lv2; C.fillRect(-4*P,-2*P,2*P,P); C.fillRect(1*P,-2*P,2*P,P);
        C.fillStyle=lv; C.fillRect(-P,-5*P,P,4*P); C.fillRect(2*P,-4*P,P,3*P);
        C.fillStyle=`rgba(255,230,50,${ph*.7})`; C.fillRect(-P,-5*P,P,P); C.fillRect(2*P,-4*P,P,P);
        C.restore();
        // Horns
        dp(-5,-9,Sm,2,4); dp(-6,-8,St,1,3); dp(-4,-9,St,P,4);
        dp(3,-9,Sm,2,4); dp(2,-9,St,P,4); dp(5,-8,St,1,3);
        // Glow
        C.save(); C.shadowColor='#ff4400'; C.shadowBlur=20+ph*10;
        C.fillStyle='rgba(255,60,0,0.01)'; C.fillRect(-8*P,-11*P,16*P,18*P); C.restore();

    } else if (bossId === 'iceDragon') {
        const Bd='#0e1c3c',Bm='#1a3068',Bl='#2a4e9c',Lc='#88c4f0',Ww='#ddeeff';
        const ey=`rgb(${(110+ph*65)|0},${(195+ph*60)|0},255)`;
        dp(-5,-5,Bd,10,10); dp(-6,-4,Bd,1,8); dp(5,-4,Bd,1,8);
        dp(-5,-4,Bm,9,8); dp(-4,-3,Bl,7,6);
        // Snout
        dp(-3,3,Bm,6,4); dp(-3,4,Bl,5,3);
        // Fangs
        C.fillStyle=Ww;
        C.fillRect(-2*P,6*P,P,2*P); C.fillRect(0,6*P,P,2*P); C.fillRect(2*P,6*P,P,2*P);
        // Eyes
        C.save(); C.shadowColor='#00aaff'; C.shadowBlur=16;
        C.fillStyle='#000820'; C.fillRect(-4*P,-3*P,3*P,3*P); C.fillRect(1*P,-3*P,3*P,3*P);
        C.fillStyle=ey; C.fillRect(-4*P,-3*P,3*P,3*P); C.fillRect(1*P,-3*P,3*P,3*P);
        C.fillStyle=Lc; C.fillRect(-4*P,-3*P,2*P,2*P); C.fillRect(1*P,-3*P,2*P,2*P);
        C.fillStyle='rgba(240,250,255,0.95)'; C.fillRect(-4*P,-3*P,P,P); C.fillRect(1*P,-3*P,P,P); C.restore();
        // Horns
        dp(-4,-9,Bd,2,5); dp(-5,-8,Lc,P,3); dp(-3,-10,Bm,P,2);
        dp(2,-9,Bd,2,5); dp(3,-8,Lc,P,3); dp(3,-10,Bm,P,2);
        C.save(); C.shadowColor='#00aaff'; C.shadowBlur=18+ph*10;
        C.fillStyle='rgba(0,80,200,0.01)'; C.fillRect(-8*P,-12*P,16*P,20*P); C.restore();

    } else if (bossId === 'alchemist') {
        // ── АЛХИМИК — иконка: широкий тёмный капюшон, светящиеся глаза ──
        const Hk='#140e02',Hd='#2e2004',Hm='#5c3e08',Hl='#8a5e10',Hb='#b07c18',Hbl='#c89820';
        const Rk='#0c0c04',Rm='#303012',Rl='#484818';
        const Fk='#010402',Fd='#040e08',Fm='#080e0a';
        const eyG=`rgb(0,${(210+ph*45)|0},50)`;
        const eyB=`rgba(80,255,120,${0.9+ph*0.1})`;
        const Vl=`rgb(5,${(148+ph*72)|0},36)`;
        const Vg=`rgba(50,255,85,${0.5+ph2*0.45})`;

        // ── Тело ──
        dp(-4,2,Rk,8,9); dp(-5,3,Rk,1,8); dp(4,3,Rk,1,8);
        dp(-4,2,Rm,7,8); dp(-3,3,Rl,5,6);
        // Золотые канты мантии
        C.fillStyle=Hl; C.fillRect(-5*P,2*P,P,9*P); C.fillRect(4*P,2*P,P,9*P);
        C.fillStyle=Hm; C.fillRect(-5*P,3*P,P,7*P); C.fillRect(4*P,3*P,P,7*P);
        // Пояс
        dp(-3,4,Hd,7,2); dp(-3,4,Hm,6,P);
        C.save(); C.shadowColor='#b09010'; C.shadowBlur=5+ph*3;
        C.fillStyle='#c49818'; C.fillRect(-P,4*P,2*P,2*P);
        C.fillStyle='#e8b828'; C.fillRect(-P,4*P,P,P); C.restore();
        // Мини-зелья
        C.save(); C.shadowColor='#1133ff'; C.shadowBlur=4;
        C.fillStyle='#112288'; C.beginPath(); C.arc(-2.5*P,8*P,1.3*P,0,Math.PI*2); C.fill();
        C.fillStyle='rgba(80,130,255,0.9)'; C.beginPath(); C.arc(-2.5*P,8*P,.8*P,0,Math.PI*2); C.fill(); C.restore();
        C.save(); C.shadowColor='#ff1122'; C.shadowBlur=4;
        C.fillStyle='#881018'; C.beginPath(); C.arc(0,8*P,1.3*P,0,Math.PI*2); C.fill();
        C.fillStyle='rgba(200,50,70,0.9)'; C.beginPath(); C.arc(0,8*P,.8*P,0,Math.PI*2); C.fill(); C.restore();
        C.save(); C.shadowColor='#00ff44'; C.shadowBlur=4;
        C.fillStyle='#004418'; C.beginPath(); C.arc(2.5*P,8*P,1.3*P,0,Math.PI*2); C.fill();
        C.fillStyle=eyG; C.beginPath(); C.arc(2.5*P,8*P,.8*P,0,Math.PI*2); C.fill(); C.restore();
        // Самоцвет
        C.save(); C.shadowColor='#00ff44'; C.shadowBlur=8+ph*5;
        C.fillStyle='#001808';
        C.beginPath(); C.moveTo(0,2.5*P);C.lineTo(1.5*P,3.5*P);C.lineTo(0,4.5*P);C.lineTo(-1.5*P,3.5*P);C.closePath();C.fill();
        C.fillStyle=eyG; C.beginPath(); C.moveTo(0,2.8*P);C.lineTo(P,3.5*P);C.lineTo(0,4.2*P);C.lineTo(-P,3.5*P);C.closePath();C.fill();
        C.restore();
        // Колба
        C.save(); C.shadowColor='#00ff44'; C.shadowBlur=10+ph*7;
        C.fillStyle=Hk; C.fillRect(5*P,-1*P,P*.6,2.5*P);
        C.fillStyle='#000e04'; C.beginPath(); C.arc(5.4*P,2.5*P,2*P,0,Math.PI*2); C.fill();
        C.fillStyle=Vl; C.beginPath(); C.arc(5.4*P,(2.5+ph2*.2)*P,1.5*P,0,Math.PI*2); C.fill();
        C.fillStyle=Vg; C.beginPath(); C.arc(5.4*P,(2.1+ph2*.15)*P,.7*P,0,Math.PI*2); C.fill();
        C.fillStyle='rgba(255,255,255,0.22)'; C.beginPath(); C.arc(4.3*P,1.2*P,.8*P,0,Math.PI*2); C.fill();
        C.restore();
        // Плечи
        dp(-6,1,Rm,2,3); dp(-7,1,Rk,1,3); dp(4,1,Rm,2,3); dp(6,1,Rk,1,3);

        // ── ОПЛЕЧЬЕ капюшона ──
        dp(-7,-1,Hk,14,3); dp(-8,-2,Hk,1,3); dp(7,-2,Hk,1,3);
        dp(-7,-1,Hd,13,2); dp(-6,0,Hm,11,P);
        C.fillStyle=Hl; C.fillRect(-7*P,-1*P,P,4*P); C.fillRect(6*P,-1*P,P,4*P);

        // ── КУПОЛ капюшона — широкий, плотный, немного приплюснутый ──
        // Внешняя тёмная обводка (ступенчатое закругление)
        dp(-6,-7,Hk,12,7); // основной прямоугольник
        C.fillStyle=Hk;
        C.fillRect(-7*P,-6*P,P,6*P); C.fillRect(6*P,-6*P,P,6*P); // стороны
        C.fillRect(-5*P,-8*P,10*P,P); // верхний ряд
        C.fillRect(-4*P,-9*P,8*P,P);  // сужение вверху
        // Цветовые слои
        C.fillStyle=Hd; C.fillRect(-6*P,-6*P,12*P,7*P);
        C.fillRect(-5*P,-7*P,10*P,P); C.fillRect(-4*P,-8*P,8*P,P);
        C.fillStyle=Hm; C.fillRect(-5*P,-6*P,10*P,6*P);
        C.fillRect(-4*P,-7*P,8*P,P); C.fillRect(-3*P,-8*P,6*P,P);
        C.fillStyle=Hl; C.fillRect(-4*P,-6*P,8*P,5*P); C.fillRect(-3*P,-7*P,6*P,P);
        C.fillStyle=Hb; C.fillRect(-3*P,-6*P,6*P,4*P); C.fillRect(-2*P,-7*P,4*P,P);
        C.fillStyle=Hbl; C.fillRect(-2*P,-6*P,4*P,3*P);
        // Складки
        C.fillStyle=Hd;
        C.fillRect(-2*P,-7*P,P,9*P); C.fillRect(1*P,-7*P,P,9*P);
        C.fillStyle=Hm; C.fillRect(-1*P,-6*P,P,8*P);

        // ── Тёмный провал лица ──
        C.fillStyle=Fk; C.fillRect(-4*P,-6*P,8*P,8*P);
        C.fillStyle=Fd; C.fillRect(-3*P,-5*P,6*P,6*P);
        C.fillStyle=Fm; C.fillRect(-3*P,-4*P,5*P,4*P);

        // ── ГЛАЗА — сплошное свечение, без зрачков ──
        C.save(); C.shadowColor='#00ff55'; C.shadowBlur=20+ph*22;
        C.fillStyle='#002208';
        C.fillRect(-4*P,-5*P,3*P,3*P); C.fillRect(1*P,-5*P,3*P,3*P);
        C.fillStyle=eyG;
        C.fillRect(-4*P,-5*P,3*P,3*P); C.fillRect(1*P,-5*P,3*P,3*P);
        C.fillStyle=eyB;
        C.fillRect(-4*P,-5*P,2*P,2*P); C.fillRect(1*P,-5*P,2*P,2*P);
        C.fillStyle=`rgba(210,255,185,${0.92+ph2*.08})`;
        C.fillRect(-4*P,-5*P,1.5*P,1.5*P); C.fillRect(1*P,-5*P,1.5*P,1.5*P);
        // Яркие центры (не зрачки — просто ещё более белые центры глаз)
        C.fillStyle='rgba(240,255,230,0.98)';
        C.fillRect(-4*P,-5*P,P,P); C.fillRect(1*P,-5*P,P,P);
        C.restore();

        // ── Золотые обводки лица (видны по краям) ──
        C.fillStyle=Hl; C.fillRect(-5*P,-6*P,P,8*P); C.fillRect(4*P,-6*P,P,8*P);
        C.fillStyle=Hb; C.fillRect(-5*P,-5*P,P,6*P); C.fillRect(4*P,-5*P,P,6*P);
        C.fillStyle=Hm; C.fillRect(-4*P,1*P,8*P,P);
        C.save(); C.shadowColor='#c09010'; C.shadowBlur=6+ph*4;
        C.fillStyle=`rgba(176,110,14,0.55)`;
        C.fillRect(-5*P,-6*P,P,8*P); C.fillRect(4*P,-6*P,P,8*P);
        C.fillRect(-4*P,1*P,8*P,P); C.restore();

        // ── Рожок ──
        C.fillStyle='#0e2410'; C.fillRect(-2*P,-9*P,2*P,P);
        C.fillStyle='#1c4820'; C.fillRect(-2*P,-10*P,1.5*P,P);
        C.fillStyle='#2e7030'; C.fillRect(-2*P,-11*P,P,P);
        C.save(); C.shadowColor='#44bb22'; C.shadowBlur=5;
        C.fillStyle='rgba(55,168,44,0.4)'; C.fillRect(-3*P,-11*P,2*P,3*P); C.restore();

        // ── Общее тёмное свечение ──
        C.save(); C.shadowColor='#00ff44'; C.shadowBlur=18+ph*12;
        C.fillStyle='rgba(0,60,15,0.01)'; C.fillRect(-8*P,-13*P,16*P,24*P); C.restore();

    } else if (bossId === 'shadowLord') {
        const Bk='#030005',Dk='#08000e',Mp='#2c0050',Lp='#500090',Gp='#7800b8';
        const ey=`rgb(${(155+ph*80)|0},0,${(195+ph2*60)|0})`;
        // Hood
        dp(-5,-7,Bk,10,13); dp(-6,-6,Bk,1,11); dp(5,-6,Bk,1,11);
        dp(-5,-6,Dk,9,11); dp(-4,-5,Mp,7,9);
        C.fillStyle=Dk;
        C.fillRect(-3*P,-5*P,P,9*P); C.fillRect(2*P,-4*P,P,8*P);
        // Face void
        dp(-4,-5,Bk,8,7);
        // Eyes
        C.save(); C.shadowColor='#9900ff'; C.shadowBlur=22+ph*18;
        C.fillStyle='#020002'; C.fillRect(-4*P,-3*P,3*P,3*P); C.fillRect(1*P,-3*P,3*P,3*P);
        C.fillStyle=ey; C.fillRect(-4*P,-3*P,3*P,3*P); C.fillRect(1*P,-3*P,3*P,3*P);
        C.fillStyle=`rgba(200,100,255,${.75+ph*.25})`; C.fillRect(-4*P,-3*P,2*P,2*P); C.fillRect(1*P,-3*P,2*P,2*P);
        C.fillStyle='rgba(240,200,255,0.9)'; C.fillRect(-4*P,-3*P,P,P); C.fillRect(1*P,-3*P,P,P); C.restore();
        // Hood spike
        dp(-P,-9,Dk,2,3); dp(-P,-10,Mp,2,P); dp(0,-11,Lp,P,2);
        // Robe hint
        dp(-4,4,Bk,8,4); dp(-3,4,Dk,6,3); dp(-2,4,Mp,4,2);
        // Staff
        C.save(); C.shadowColor='#8800cc'; C.shadowBlur=14+ph*8;
        C.fillStyle=Mp; C.fillRect(4*P,-8*P,P,10*P);
        C.fillStyle=Lp; C.fillRect(3*P,-9*P,3*P,3*P);
        C.fillStyle=`rgba(150,0,255,${.7+ph*.3})`; C.fillRect(3.5*P,-9*P,2*P,2*P);
        C.fillStyle='rgba(220,150,255,0.85)'; C.fillRect(3.5*P,-9*P,P,P); C.restore();
        // Purple glow
        C.save(); C.shadowColor='#8800cc'; C.shadowBlur=20+ph*12;
        C.fillStyle='rgba(40,0,70,0.01)'; C.fillRect(-8*P,-13*P,16*P,22*P); C.restore();
    }

    C.restore();
}

function renderBossList() {
    const list = document.getElementById('boss-list');
    list.innerHTML = '';
    _bossIconCanvases.length = 0;
    BOSSES.forEach((boss, index) => {
        const unlocked = isBossUnlocked(boss.id);
        const defeated = defeatedBosses.includes(boss.id);
        const bossData = t('bosses.' + boss.id);
        const div = document.createElement('div');
        // Гость в онлайне: все боссы выглядят кликабельными визуально,
        // но клик заблокирован — выбирает только хост
        const guestOnline = net.isOnline && !net.isHost;
        div.className = 'boss-item' + (defeated ? ' defeated' : '') + (!unlocked && !guestOnline ? ' locked' : '');
        const statusIcon = guestOnline ? '👥' : (defeated ? '✓' : (unlocked ? '⚔️' : '🔒'));
        const descText = guestOnline
            ? t('bossGuestDesc')
            : (unlocked ? (bossData.desc || '') : (bossData.locked || 'LOCKED'));

        // Иконка босса — пиксельный рисунок на canvas вместо эмодзи
        const iconDiv = document.createElement('div');
        iconDiv.className = 'boss-icon';
        iconDiv.style.cssText = 'display:flex;align-items:center;justify-content:center;flex-shrink:0;';
        const iconCv = document.createElement('canvas');
        iconCv.width = 72; iconCv.height = 72;
        iconCv.style.cssText = 'display:block;image-rendering:pixelated;image-rendering:crisp-edges;border-radius:8px;width:72px;height:72px;';
        iconDiv.appendChild(iconCv);
        _bossIconCanvases.push({ cv: iconCv, id: boss.id, unlocked: unlocked || guestOnline });

        // Текстовая информация
        const infoDiv = document.createElement('div');
        infoDiv.className = 'boss-info';
        infoDiv.innerHTML = `<div class="boss-name">${bossData.name || boss.id}</div><div class="boss-desc">${descText}</div>`;
        const statusDiv = document.createElement('div');
        statusDiv.className = 'boss-status';
        statusDiv.textContent = statusIcon;

        div.appendChild(iconDiv);
        div.appendChild(infoDiv);
        div.appendChild(statusDiv);

        // Только хост может запустить бой (в онлайне или офлайне если разблокировано)
        if (unlocked && !guestOnline) {
            div.onclick = () => startBossBattle(index);
        }
        list.appendChild(div);
    });
    _startBossIconAnim();
}

// ============================================
// START BOSS BATTLE - Top-down Don't Starve Together arena
// ============================================
function startBossBattle(bossIndex) {
    _stopBossIconAnim();
    currentBoss = BOSSES[bossIndex];
    bossHp = currentBoss.hp;
    bossBattleTime = currentBoss.duration;
    bossProjectiles = [];
    bossBattleActive = true;
    bossBattlePaused = false;
    bossBattleSuspended = false;
    bossDodgeCount = 0;
    shadowLordPhase = 1;
    shadowLordLastSlot = -1;
    shadowLordTauntTimer = 0;
    shadowLordFinalTimer = 0;
    shadowLordEvaporating = false;
    shadowLordEvaporateProgress = 0;
    // Reset alchemist state
    alchemistWarnings = [];
    alchemistAcid = [];
    alchemistLaserAngle = 0;
    alchemistLaser2Active = false;
    alchemistLaserChargeTimer = 0;
    alchemistLaserCharged = false;
    alchemistAttackTimer2 = 99;
    alchemistLastPhase = 0;
    bossHintVisible = true;
    bossCamera = { x: 0 };

    // ── ОНЛАЙН: хост инициирует бой для обоих игроков ──────────
    if (net.isOnline && net.isHost && net.conn && net.conn.open) {
        net.bossOnline = true;
        p2SkinIndex = net.remoteSkin;   // скин гостя
        numPlayers = 2;
        net.bossLastStateSent = 0;
        net.bossRemote = { x: 0, y: 0, dir: true, alive: true, inv: 0 };
        // Сообщаем гостю: начинаем этого босса
        net.conn.send({
            type: 'BOSS_START',
            bossIndex,
            hostSkin:  p1SkinIndex,
            guestSkin: net.remoteSkin
        });
    }

    AudioEngine.startBossMusic(currentBoss.id);
    _showMobileControls();
    
    // UI setup — hide ALL overlay screens first
    document.getElementById('boss-screen').style.display = 'none';
    document.getElementById('boss-win-screen').style.display = 'none';
    document.getElementById('boss-lose-screen').style.display = 'none';
    document.getElementById('boss-battle-screen').style.display = 'block';
    document.getElementById('boss-hp-fill').style.width = '100%';
    document.getElementById('boss-timer').innerText = bossBattleTime;
    // Setup HP bar style per boss
    if (currentBoss.id === 'fireGolem') {
        document.getElementById('boss-hp-fill').style.background = 'linear-gradient(90deg,#cc2200,#ff6600,#ffcc00)';
        document.getElementById('boss-hp-label').innerHTML = IconGenerator.html('fire','13px') + ' ' + t('bosses.' + currentBoss.id + '.name');
    } else if (currentBoss.id === 'iceDragon') {
        document.getElementById('boss-hp-fill').style.background = 'linear-gradient(90deg,#003399,#0088cc,#aaeeff)';
        document.getElementById('boss-hp-label').innerHTML = IconGenerator.html('ice','13px') + ' ' + t('bosses.' + currentBoss.id + '.name');
    } else if (currentBoss.id === 'alchemist') {
        document.getElementById('boss-hp-fill').style.background = 'linear-gradient(90deg,#1a4d00,#00aa22,#88ff44)';
        document.getElementById('boss-hp-label').innerHTML = IconGenerator.html('potion','13px') + ' ' + t('bosses.' + currentBoss.id + '.name');
    } else {
        document.getElementById('boss-hp-fill').style.background = 'linear-gradient(90deg,#1a0033,#6600cc,#cc00ff)';
        document.getElementById('boss-hp-label').innerHTML = IconGenerator.html('shadow','13px') + ' ' + t('bosses.' + currentBoss.id + '.name');
    }
    document.getElementById('dodge-hint').style.display = 'block';
    document.getElementById('dodge-hint').innerText = t('dodgeHint');
    
    const cw = BOSS_VW;
    const ch = BOSS_VH;
    
    // Player 1 starts bottom-left area
    bossPlayerCat = {
        x: cw * 0.35 - 15,
        y: ch * 0.68,
        width: 30, height: 45,
        skin: SKINS[p1SkinIndex],
        facingRight: true,
        invulnerable: 0,
        alive: true
    };

    // Player 2 starts bottom-right area (if 2-player mode)
    bossPlayerCat2 = null;
    if (numPlayers === 2) {
        bossPlayerCat2 = {
            x: cw * 0.65 - 15,
            y: ch * 0.68,
            width: 30, height: 45,
            skin: SKINS[p2SkinIndex],
            facingRight: false,
            invulnerable: 0,
            alive: true
        };
    }
    
    // Boss floats in upper center
    bossEntity = {
        x: cw / 2,
        y: ch * 0.28,
        width: 70,
        height: 70,
        attackTimer: 0,
        animFrame: 0,
        floatAngle: 0,
        moveAngle: 0
    };
    
    if (bossHintTimer) clearTimeout(bossHintTimer);
    bossHintTimer = setTimeout(() => {
        bossHintVisible = false;
        const hintEl = document.getElementById('dodge-hint');
        if (hintEl) hintEl.style.display = 'none';
    }, 3000);
    
    lastTime = performance.now();
    bossLoop(lastTime);
}

// ============================================
// BOSS GAME LOOP - Main update loop
// ============================================
function bossLoop(timestamp) {
    if (!bossBattleActive) return;
    
    // ============================================
    // PAUSE CHECK - Stop updates when paused (messages showing)
    // ПРОВЕРКА ПАУЗЫ - Останавливаем обновления при показе сообщений
    // ============================================
    if (bossBattlePaused) {
        bossAnimationId = requestAnimationFrame(bossLoop);
        // Только рисуем, не обновляем
        drawBossBattle();
        return;
    }
    
    bossAnimationId = requestAnimationFrame(bossLoop);
    
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    if (deltaTime > 100) deltaTime = 100;
    let timeScale = deltaTime / 16.666;
    gameTime += timeScale;
    
    // Update timer
    bossBattleTime -= deltaTime / 1000;
    if (currentBoss.id !== 'shadowLord') {
        if (bossBattleTime <= 0) { bossWin(); return; }
        document.getElementById('boss-timer').innerText = Math.ceil(bossBattleTime);
        // HP bar = time remaining
        const timePct = Math.max(0, bossBattleTime / currentBoss.duration * 100);
        document.getElementById('boss-hp-fill').style.width = timePct + '%';
    } else {
        // ShadowLord: show countdown only during final phase
        if (shadowLordPhase === 4) {
            const left = Math.ceil(10 - shadowLordFinalTimer);
            document.getElementById('boss-timer').innerText = left > 0 ? left : 0;
        } else if (shadowLordPhase === 3) {
            document.getElementById('boss-timer').innerText = '...';
        } else {
            const elapsed = 999 - bossBattleTime;
            document.getElementById('boss-timer').innerText = Math.ceil(elapsed);
        }
    }
    
    // Update player (side-scroller controls)
    updateBossPlayer(timeScale);

    if (net.bossOnline && !net.isHost) {
        // ГОСТЬ: симуляцию боссов не гоняем — состояние приходит от хоста.
        // НО: локально проверяем попадание снарядов в своего кота (P2)
        // и сообщаем хосту — иначе из-за лага хост может не засчитать попадание.
        if (bossPlayerCat2 && bossPlayerCat2.alive && bossPlayerCat2.invulnerable <= 0) {
            for (let p of bossProjectiles) {
                if (rectIntersect(bossPlayerCat2.x, bossPlayerCat2.y,
                                  bossPlayerCat2.width, bossPlayerCat2.height,
                                  p.x - p.size/2, p.y - p.size/2, p.size, p.size)) {
                    bossPlayerCat2.alive = false;
                    bossPlayerCat2.invulnerable = 999;
                    AudioEngine.sfx.bossHit();
                    // Сообщаем хосту что мы (P2) умерли
                    if (net.conn && net.conn.open) {
                        net.conn.send({ type: 'BOSS_P2_DEAD' });
                    }
                    break;
                }
            }
        }
        // Отправляем свою позицию хосту ~60 раз/сек
        if (bossPlayerCat2 && net.conn && net.conn.open) {
            net.conn.send({
                type: 'BOSS_POS',
                x:     bossPlayerCat2.x,
                y:     bossPlayerCat2.y,
                dir:   bossPlayerCat2.facingRight ? 1 : 0,
                alive: bossPlayerCat2.alive ? 1 : 0,
                inv:   bossPlayerCat2.invulnerable > 0 ? 1 : 0
            });
        }
    } else {
        // ХОСТ или одиночная игра — полная симуляция
        updateBossEntity(timeScale, deltaTime);
        updateBossProjectiles(timeScale);
        checkBossCollisions();

        // ХОСТ: отправляем состояние гостю ~20 раз/сек (каждые 50ms)
        if (net.bossOnline && net.isHost) {
            const nowTs = performance.now();
            if (nowTs - net.bossLastStateSent >= 50) {
                net.bossLastStateSent = nowTs;
                _sendBossState();
            }
        }
    }
    
    // Draw everything
    drawBossBattle();
}

// ============================================
// UPDATE BOSS PLAYER - Top-down 4-direction movement
// ============================================
function updateBossPlayer(timeScale) {
    const cw = BOSS_VW;
    const ch = BOSS_VH;
    const moveSpeed = 8;
    const arenaMargin = 40;

    // Analog-aware boss player move: axisSlot = 'p1'|'p2'|null
    const movePlayer = (cat, left, right, up, down, axisSlot) => {
        if (!cat || !cat.alive) return;

        // -- Analog path (joystick) -- true 360° movement at full speed
        if (axisSlot && typeof joystickAxes !== 'undefined') {
            const ax = joystickAxes[axisSlot];
            const DEAD = 0.10;
            const mag = Math.sqrt(ax.x * ax.x + ax.y * ax.y);
            if (mag > DEAD) {
                // ax is already a unit-clamped vector — direction is exact, speed is full
                cat.x += ax.x * moveSpeed * timeScale;
                cat.y += ax.y * moveSpeed * timeScale;
                cat.facingRight = ax.x > 0;
            } else {
                // Boolean fallback for keyboard / dpad
                if (left)  { cat.x -= moveSpeed * timeScale; cat.facingRight = false; }
                if (right) { cat.x += moveSpeed * timeScale; cat.facingRight = true; }
                if (up)    cat.y -= moveSpeed * timeScale;
                if (down)  cat.y += moveSpeed * timeScale;
            }
        } else {
            // -- Boolean path (keyboard / dpad) --
            if (left)  { cat.x -= moveSpeed * timeScale; cat.facingRight = false; }
            if (right) { cat.x += moveSpeed * timeScale; cat.facingRight = true; }
            if (up)    cat.y -= moveSpeed * timeScale;
            if (down)  cat.y += moveSpeed * timeScale;
        }

        if (cat.x < arenaMargin) cat.x = arenaMargin;
        if (cat.x + cat.width  > cw - arenaMargin) cat.x = cw - arenaMargin - cat.width;
        if (cat.y < arenaMargin) cat.y = arenaMargin;
        if (cat.y + cat.height > ch - arenaMargin) cat.y = ch - arenaMargin - cat.height;
        if (cat.invulnerable > 0) cat.invulnerable -= timeScale;
    };

    if (net.bossOnline) {
        if (net.isHost) {
            // ХОСТ: управляет P1 (bossPlayerCat), P2 приходит из сети
            movePlayer(bossPlayerCat,
                keys['KeyA'] || keys['ArrowLeft'],
                keys['KeyD'] || keys['ArrowRight'],
                keys['KeyW'] || keys['ArrowUp'],
                keys['KeyS'] || keys['ArrowDown'], 'p1');
            // Применяем последнюю известную позицию гостя к P2
            if (bossPlayerCat2) {
                if (net.bossRemote.x > 0) {
                    bossPlayerCat2.x = lerp(bossPlayerCat2.x, net.bossRemote.x, 0.35);
                    bossPlayerCat2.y = lerp(bossPlayerCat2.y, net.bossRemote.y, 0.35);
                }
                bossPlayerCat2.facingRight = net.bossRemote.dir;
                // Статус alive приходит из net — но коллизии проверяем локально
                if (bossPlayerCat2.invulnerable > 0) bossPlayerCat2.invulnerable -= timeScale;
            }
        } else {
            // ГОСТЬ: управляет только своим котом P2 (bossPlayerCat2)
            movePlayer(bossPlayerCat2,
                keys['KeyA'] || keys['ArrowLeft'],
                keys['KeyD'] || keys['ArrowRight'],
                keys['KeyW'] || keys['ArrowUp'],
                keys['KeyS'] || keys['ArrowDown'], 'p1');
            // P1 (кот хоста) — позиция пришла через BOSS_STATE, только invulnerable уменьшаем
            if (bossPlayerCat && bossPlayerCat.invulnerable > 0) bossPlayerCat.invulnerable -= timeScale;
        }
    } else if (bossPlayerCat2) {
        // 2P: P1=WASD, P2=arrows (split controls)
        movePlayer(bossPlayerCat,
            keys['KeyA'], keys['KeyD'], keys['KeyW'], keys['KeyS'], 'p1');
        movePlayer(bossPlayerCat2,
            keys['ArrowLeft'], keys['ArrowRight'], keys['ArrowUp'], keys['ArrowDown'], 'p2');
    } else {
        // 1P: both WASD and arrows work
        movePlayer(bossPlayerCat,
            keys['KeyA'] || keys['ArrowLeft'],
            keys['KeyD'] || keys['ArrowRight'],
            keys['KeyW'] || keys['ArrowUp'],
            keys['KeyS'] || keys['ArrowDown'], 'p1');
    }
}

// ============================================
// UPDATE BOSS ENTITY - Boss drifts around arena center
// ============================================
function updateBossEntity(timeScale, deltaTime) {
    bossEntity.attackTimer += timeScale;
    bossEntity.animFrame += timeScale;
    bossEntity.floatAngle += 0.015 * timeScale;
    bossEntity.moveAngle += 0.008 * timeScale;
    
    const cw = BOSS_VW;
    const ch = BOSS_VH;
    // Boss slowly orbits center
    bossEntity.x = cw / 2 + Math.cos(bossEntity.moveAngle) * (cw * 0.12);
    bossEntity.y = ch * 0.3 + Math.sin(bossEntity.moveAngle * 0.7) * (ch * 0.08);

    // ShadowLord phase switches
    if (currentBoss.id === 'shadowLord') {
        const elapsed = 999 - bossBattleTime;

        // Phase 1 → 2 (grid starts at 10s)
        if (shadowLordPhase === 1 && elapsed >= 10) {
            shadowLordPhase = 2;
            bossEntity.attackTimer = currentBoss.spawnRate;
        }

        // Phase 2: track 5s slots (0–3), transition to taunt at elapsed >= 30s
        if (shadowLordPhase === 2) {
            const slot = Math.min(3, Math.floor((elapsed - 10) / 5));
            if (slot !== shadowLordLastSlot) {
                shadowLordLastSlot = slot;
                const slotHints = [t('bossHintLeft'), t('bossHintUp'), t('bossHintRight'), t('bossHintDown')];
                const slotColors = ['#9400d3', '#9400d3', '#ff0055', '#ff0055'];
                const hintEl = document.getElementById('dodge-hint');
                if (hintEl) {
                    hintEl.style.display = 'block';
                    hintEl.innerText = '⚠️ ' + slotHints[slot];
                    hintEl.style.color = slotColors[slot];
                    clearTimeout(bossHintTimer);
                    bossHintTimer = setTimeout(() => { hintEl.style.display = 'none'; }, 2500);
                }
                _sendBossHint('⚠️ ' + slotHints[slot], slotColors[slot], 2500);
            }
            if (elapsed >= 30) {
                // Enter taunt phase
                shadowLordPhase = 3;
                shadowLordTauntTimer = 0;
                // Don't clear — let existing projectiles fly off naturally
                const hintEl = document.getElementById('dodge-hint');
                if (hintEl) {
                    clearTimeout(bossHintTimer);
                    hintEl.style.display = 'block';
                    hintEl.innerText = t('bossHintTalent');
                    hintEl.style.color = '#ffffff';
                    hintEl.style.fontSize = '14px';
                }
                _sendBossHint(t('bossHintTalent'), '#ffffff', 0);
            }
        }

        // Phase 3: taunt — no attacks, count 5s then enter final phase
        if (shadowLordPhase === 3) {
            shadowLordTauntTimer += deltaTime / 1000;
            if (shadowLordTauntTimer >= 5) {
                shadowLordPhase = 4;
                shadowLordFinalTimer = 0;
                bossEntity.attackTimer = currentBoss.spawnRate;
                const hintEl = document.getElementById('dodge-hint');
                if (hintEl) {
                    hintEl.style.display = 'block';
                    hintEl.innerText = t('bossHintLastStage');
                    hintEl.style.color = '#ff0000';
                    hintEl.style.fontSize = '';
                    clearTimeout(bossHintTimer);
                    bossHintTimer = setTimeout(() => { hintEl.style.display = 'none'; }, 2500);
                }
                _sendBossHint(t('bossHintLastStage'), '#ff0000', 2500);
            }
        }

        // Phase 4: final — 10s normal attacks, then evaporate
        if (shadowLordPhase === 4 && !shadowLordEvaporating) {
            shadowLordFinalTimer += deltaTime / 1000;
            if (shadowLordFinalTimer >= 10) {
                shadowLordEvaporating = true;
                shadowLordEvaporateProgress = 0;
                bossProjectiles.length = 0;
            }
        }

        // Evaporation
        if (shadowLordEvaporating) {
            shadowLordEvaporateProgress += deltaTime / 2500; // 2.5s evaporate
            if (shadowLordEvaporateProgress >= 1) {
                bossWin();
                return;
            }
        }
    }
    
    const skipAttack = (currentBoss.id === 'shadowLord' &&
        (shadowLordPhase === 3 || shadowLordEvaporating))
        || currentBoss.id === 'alchemist';
    if (!skipAttack && bossEntity.attackTimer >= currentBoss.spawnRate) {
        bossEntity.attackTimer = 0;
        spawnBossProjectile();
    }
    // Alchemist uses its own phased attack logic
    if (currentBoss.id === 'alchemist') {
        // In phase 3 (laser): lock boss to center
        const alcElapsed = currentBoss.duration - bossBattleTime;
        if (alcElapsed >= 20) {
            const cw2 = BOSS_VW, ch2 = BOSS_VH;
            bossEntity.x += (cw2/2 - bossEntity.x) * 0.05;
            bossEntity.y += (ch2*0.32 - bossEntity.y) * 0.05;
        }
        updateAlchemistAttacks(timeScale, deltaTime);
    }
}

// ============================================
// SPAWN BOSS PROJECTILE - Attacks from all sides of arena
// ============================================
function spawnBossProjectile() {
    const pattern = currentBoss.attackPattern;
    const cw = BOSS_VW;
    const ch = BOSS_VH;
    const speed = currentBoss.projectileSpeed;
    const size = currentBoss.projectileSize;
    
    // Target: pick nearest alive player
    const getTarget = () => {
        if (!bossPlayerCat2 || !bossPlayerCat2.alive) return bossPlayerCat;
        if (!bossPlayerCat.alive) return bossPlayerCat2;
        // Alternate targets each wave for fairness
        return (Math.floor(bossEntity.attackTimer) % 2 === 0) ? bossPlayerCat : bossPlayerCat2;
    };
    const target = getTarget();

    const toBossDir = () => {
        const dx = target.x - bossEntity.x;
        const dy = target.y - bossEntity.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        return { vx: (dx/dist)*speed, vy: (dy/dist)*speed };
    };

    // Helper: spawn from random edge aimed at a player
    const spawnFromEdge = (spreadAngle = 0, tgt = target) => {
        const edge = Math.floor(Math.random() * 4);
        let sx, sy;
        if (edge === 0)      { sx = Math.random() * cw; sy = -size; }
        else if (edge === 1) { sx = cw + size; sy = Math.random() * ch; }
        else if (edge === 2) { sx = Math.random() * cw; sy = ch + size; }
        else                 { sx = -size; sy = Math.random() * ch; }
        const tdx = tgt.x + tgt.width/2 - sx;
        const tdy = tgt.y + tgt.height/2 - sy;
        const dist = Math.sqrt(tdx*tdx + tdy*tdy) || 1;
        const baseAngle = Math.atan2(tdy, tdx);
        const angle = baseAngle + (Math.random() - 0.5) * spreadAngle;
        return { x: sx, y: sy, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, size, type: currentBoss.id };
    };
    
    if (pattern === 'single') {
        const d = toBossDir();
        bossProjectiles.push({ x: bossEntity.x, y: bossEntity.y, vx: d.vx, vy: d.vy, size, type: currentBoss.id });
        bossProjectiles.push(spawnFromEdge(0.4));
        // In 2P: also fire at P2
        if (bossPlayerCat2 && bossPlayerCat2.alive) {
            bossProjectiles.push(spawnFromEdge(0.4, bossPlayerCat2));
        }
    } else if (pattern === 'triple') {
        const d = toBossDir();
        for (let i = -1; i <= 1; i++) {
            const a = Math.atan2(d.vy, d.vx) + i * 0.35;
            bossProjectiles.push({ x: bossEntity.x, y: bossEntity.y, vx: Math.cos(a)*speed, vy: Math.sin(a)*speed, size, type: currentBoss.id });
        }
        if (Math.random() < 0.5) {
            bossProjectiles.push(spawnFromEdge(0.3));
        }
        if (bossPlayerCat2 && bossPlayerCat2.alive && Math.random() < 0.5) {
            bossProjectiles.push(spawnFromEdge(0.3, bossPlayerCat2));
        }
    } else if (pattern === 'spread') {
        if (shadowLordPhase === 1 || shadowLordPhase === 4) {
            // Phase 1 / Phase 4 (final): full speed, no reduction for phase 4, ~22% edge chance, only 2 from boss
            const s1speed = (shadowLordPhase === 4) ? speed : speed / 1.5;
            for (let edge = 0; edge < 4; edge++) {
                if (Math.random() > 0.22) continue;
                let sx, sy;
                const ratio = 0.2 + Math.random() * 0.6;
                if (edge === 0)      { sx = cw * ratio; sy = -size; }
                else if (edge === 1) { sx = cw + size; sy = ch * ratio; }
                else if (edge === 2) { sx = cw * ratio; sy = ch + size; }
                else                 { sx = -size; sy = ch * ratio; }
                const tdx = target.x + target.width/2 - sx;
                const tdy = target.y + target.height/2 - sy;
                const dist = Math.sqrt(tdx*tdx + tdy*tdy) || 1;
                bossProjectiles.push({ x: sx, y: sy, vx: (tdx/dist)*s1speed, vy: (tdy/dist)*s1speed, size, type: currentBoss.id });
            }
            const d = toBossDir();
            const bossShots = (shadowLordPhase === 4) ? 3 : 2;
            for (let i = 0; i < bossShots; i++) {
                const a = Math.atan2(d.vy, d.vx) + (i - (bossShots-1)/2) * 0.4;
                bossProjectiles.push({ x: bossEntity.x, y: bossEntity.y, vx: Math.cos(a)*s1speed, vy: Math.sin(a)*s1speed, size: size*0.8, type: currentBoss.id });
            }
        } else {
            // Grid phase: 4 slots of 5s each
            // 0: left→right  1: bottom→top  2: right→left  3: top→bottom
            const cellSize = 60;
            const cols = Math.floor(cw / cellSize);
            const rows = Math.floor(ch / cellSize);
            const numLines = 2;
            const elapsed = currentBoss.duration - bossBattleTime;
            const slot = Math.min(3, Math.floor((elapsed - 10) / 5));

            for (let i = 0; i < numLines; i++) {
                if (slot === 0) {
                    // left → right
                    const sy = (Math.floor(Math.random() * rows) + 0.5) * cellSize;
                    bossProjectiles.push({ x: -size, y: sy, vx: speed, vy: 0, size, type: currentBoss.id });
                } else if (slot === 1) {
                    // bottom → top
                    const sx = (Math.floor(Math.random() * cols) + 0.5) * cellSize;
                    bossProjectiles.push({ x: sx, y: ch + size, vx: 0, vy: -speed, size, type: currentBoss.id });
                } else if (slot === 2) {
                    // right → left
                    const sy = (Math.floor(Math.random() * rows) + 0.5) * cellSize;
                    bossProjectiles.push({ x: cw + size, y: sy, vx: -speed, vy: 0, size, type: currentBoss.id });
                } else {
                    // top → bottom
                    const sx = (Math.floor(Math.random() * cols) + 0.5) * cellSize;
                    bossProjectiles.push({ x: sx, y: -size, vx: 0, vy: speed, size, type: currentBoss.id });
                }
            }
        }
}}

// ============================================
// UPDATE BOSS PROJECTILES - Move and cleanup
// ============================================
function updateBossProjectiles(timeScale) {
    const canvasWidth = BOSS_VW;
    const canvasHeight = BOSS_VH;
    
    for (let i = bossProjectiles.length - 1; i >= 0; i--) {
        let p = bossProjectiles[i];
        p.x += p.vx * timeScale;
        p.y += p.vy * timeScale;

        // ── Alchemist bomb: arrives at target → create acid pool ──
        if (p._bomb) {
            const dx = p._tx - p.x, dy = p._ty - p.y;
            if (Math.sqrt(dx*dx + dy*dy) < 22) {
                alchemistAcid.push({ x: p._tx, y: p._ty, timer: 2.0, maxTimer: 2.0, radius: 102 });
                bossProjectiles.splice(i, 1);
                continue;
            }
            // Safety timeout: remove if flying too long
            p._travelTimer = (p._travelTimer || 0) + timeScale;
            if (p._travelTimer > 200) {
                alchemistAcid.push({ x: p._tx, y: p._ty, timer: 2.0, maxTimer: 2.0, radius: 102 });
                bossProjectiles.splice(i, 1);
            }
            continue;
        }

        // ── Alchemist splitter: arrives at target → split into 4 diagonals ──
        if (p._splitter) {
            const dx = p._tx - p.x, dy = p._ty - p.y;
            if (Math.sqrt(dx*dx + dy*dy) < 28) {
                const spd = currentBoss.projectileSpeed * 0.85;
                [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx, sy]) => {
                    bossProjectiles.push({
                        x: p.x, y: p.y,
                        vx: sx * spd, vy: sy * spd,
                        size: 11, type: 'alchemist', _shard: true
                    });
                });
                bossProjectiles.splice(i, 1);
                continue;
            }
            p._travelTimer = (p._travelTimer || 0) + timeScale;
            if (p._travelTimer > 220) { bossProjectiles.splice(i, 1); continue; }
        }

        // Remove off-screen projectiles (count as dodge)
        if (p.x < -p.size * 2 || p.x > canvasWidth + p.size * 2 ||
            p.y < -p.size * 2 || p.y > canvasHeight + p.size * 2) {
            bossProjectiles.splice(i, 1);
            bossDodgeCount++;
            // Damage boss every 10 dodges
            if (bossDodgeCount % 10 === 0) {
                bossHp -= 10;
                if (bossHp <= 0) bossHp = 0;
                // shadowLord HP bar = dodge-based HP
                if (currentBoss.id === 'shadowLord') {
                    document.getElementById('boss-hp-fill').style.width = (bossHp / currentBoss.hp * 100) + '%';
                }
            }
        }
    }
}

// ============================================
// CHECK BOSS COLLISIONS - Both players vs projectiles
// ============================================
function checkBossCollisions() {
    const checkCat = (cat) => {
        if (!cat || !cat.alive || cat.invulnerable > 0) return;
        for (let p of bossProjectiles) {
            if (p._bomb) continue; // bombs only damage via acid pool, not in flight
            if (rectIntersect(cat.x, cat.y, cat.width, cat.height,
                              p.x - p.size/2, p.y - p.size/2, p.size, p.size)) {
                cat.alive = false;
                cat.invulnerable = 999;
                AudioEngine.sfx.bossHit();
                // В кооперативном режиме: гибель любого игрока = поражение
                const p2dead = !bossPlayerCat2 || !bossPlayerCat2.alive;
                const p1dead = !bossPlayerCat.alive;
                if (p1dead && p2dead) { bossLose(); }
                return;
            }
        }
    };
    checkCat(bossPlayerCat);
    checkCat(bossPlayerCat2);
    // Alchemist-specific: acid pools + laser
    if (currentBoss.id === 'alchemist') checkAlchemistCollisions();
}

// ============================================
// RECTANGLE INTERSECTION - Collision helper
// ============================================
function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

// ============================================
// DRAW BOSS BATTLE - Pixel art top-down arena
// ============================================
function drawBossBattle() {
    const PS = 8; // pixel size for chunky look

    // Равномерно масштабируем BOSS_VW×BOSS_VH под физический экран.
    // min(scaleX, scaleY) — не обрезаем ничего, letterbox по краям.
    const scrW = canvas.width;
    const scrH = canvas.height;
    const bossScale = Math.min(scrW / BOSS_VW, scrH / BOSS_VH);
    const bossDX   = (scrW - BOSS_VW * bossScale) / 2;
    const bossDY   = (scrH - BOSS_VH * bossScale) / 2;

    // Фон канваса (letterbox)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0a0703';
    ctx.fillRect(0, 0, scrW, scrH);

    // Переходим во виртуальное пространство
    ctx.setTransform(bossScale, 0, 0, bossScale, bossDX, bossDY);

    const cw = BOSS_VW;
    const ch = BOSS_VH;
    
    // === BACKGROUND - chunky pixel tiles ===
    const tileSize = 48;
    for (let ty = 0; ty < Math.ceil(ch / tileSize); ty++) {
        for (let tx = 0; tx < Math.ceil(cw / tileSize); tx++) {
            const checker = (tx + ty) % 2 === 0;
            ctx.fillStyle = checker ? '#1a1208' : '#130e06';
            ctx.fillRect(tx * tileSize, ty * tileSize, tileSize, tileSize);
        }
    }
    // Pixel-grid overlay
    ctx.fillStyle = '#0a0703';
    for (let ty = 0; ty < Math.ceil(ch / tileSize) + 1; ty++) {
        ctx.fillRect(0, ty * tileSize, cw, 2);
    }
    for (let tx = 0; tx < Math.ceil(cw / tileSize) + 1; tx++) {
        ctx.fillRect(tx * tileSize, 0, 2, ch);
    }

    // === ARENA WALLS - thick pixelated border ===
    const margin = 48;
    const wallColor = currentBoss.bodyColor;
    const wallAccent = currentBoss.color;
    // Outer wall blocks (chunky pixels)
    for (let wx = 0; wx < Math.ceil(cw / PS); wx++) {
        const px = wx * PS;
        if (px < margin || px > cw - margin - PS) {
            ctx.fillStyle = wallColor;
            ctx.fillRect(px, 0, PS, ch);
        }
    }
    for (let wy = 0; wy < Math.ceil(ch / PS); wy++) {
        const py = wy * PS;
        if (py < margin || py > ch - margin - PS) {
            ctx.fillStyle = wallColor;
            ctx.fillRect(0, py, cw, PS);
        }
    }
    // Inner wall trim
    ctx.fillStyle = wallAccent;
    ctx.fillRect(margin, margin, cw - margin*2, PS);
    ctx.fillRect(margin, ch - margin - PS, cw - margin*2, PS);
    ctx.fillRect(margin, margin, PS, ch - margin*2);
    ctx.fillRect(cw - margin - PS, margin, PS, ch - margin*2);

    // === CORNER TORCHES ===
    const drawTorch = (tx, ty) => {
        const flicker = Math.sin(gameTime * 0.3 + tx) * 0.3 + 0.7;
        ctx.fillStyle = '#5a3a00'; ctx.fillRect(tx, ty, PS, PS*2);
        ctx.fillStyle = `rgba(255, 140, 0, ${flicker})`;
        ctx.fillRect(tx - PS/2, ty - PS, PS*2, PS);
        ctx.fillStyle = `rgba(255, 220, 0, ${flicker * 0.8})`;
        ctx.fillRect(tx, ty - PS*2, PS, PS);
    };
    drawTorch(margin + PS*2, margin + PS*2);
    drawTorch(cw - margin - PS*3, margin + PS*2);
    drawTorch(margin + PS*2, ch - margin - PS*4);
    drawTorch(cw - margin - PS*3, ch - margin - PS*4);

    // === EVIL EYES watching from the dark border ===
    for (let e = 0; e < 8; e++) {
        const eyePulse = 0.4 + Math.sin(gameTime * 0.05 + e * 1.3) * 0.35;
        // Place eyes only in the wall margin area
        const side = e % 4;
        let ex, ey;
        if (side === 0) { ex = Math.round((e * 37 % (margin - PS*2)) / PS) * PS + PS; ey = Math.round((Math.sin(e*3.7) * 0.5 + 0.5) * (ch / PS)) * PS; }
        else if (side === 1) { ex = cw - margin + Math.round((e * 23 % (margin - PS*2)) / PS) * PS; ey = Math.round((Math.sin(e*2.9) * 0.5 + 0.5) * (ch / PS)) * PS; }
        else if (side === 2) { ex = Math.round((Math.cos(e*4.1) * 0.5 + 0.5) * (cw / PS)) * PS; ey = Math.round((e * 31 % (margin - PS*2)) / PS) * PS + PS; }
        else                 { ex = Math.round((Math.cos(e*5.3) * 0.5 + 0.5) * (cw / PS)) * PS; ey = ch - margin + Math.round((e * 19 % (margin - PS*2)) / PS) * PS; }
        ctx.fillStyle = `rgba(255, 200, 0, ${eyePulse})`;
        ctx.fillRect(ex, ey, PS, PS);
        ctx.fillRect(ex + PS*2, ey, PS, PS);
    }

    // === DRAW PROJECTILES - chunky pixel squares ===
    bossProjectiles.forEach(p => {
        if (p._bomb) {
            // Acid bomb in flight: glowing green orb
            const sz = Math.round(p.size / PS) * PS;
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(Math.round(p.x/PS)*PS + PS/2, Math.round(p.y/PS)*PS + PS/2, sz, sz);
            ctx.fillStyle = '#00cc33';
            ctx.fillRect(Math.round(p.x/PS)*PS, Math.round(p.y/PS)*PS, sz, sz);
            ctx.fillStyle = '#88ff44';
            ctx.fillRect(Math.round(p.x/PS)*PS + PS/2, Math.round(p.y/PS)*PS + PS/2, PS, PS);
            ctx.fillStyle = 'rgba(0,255,60,0.4)';
            ctx.fillRect(Math.round(p.x/PS)*PS - PS, Math.round(p.y/PS)*PS - PS, sz + PS*2, sz + PS*2);
            return;
        }
        const pSize = Math.round(p.size / PS) * PS;
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(Math.round(p.x/PS)*PS + PS/2, Math.round(p.y/PS)*PS + PS/2, pSize, pSize);
        // Main color
        ctx.fillStyle = currentBoss.color;
        ctx.fillRect(Math.round(p.x/PS)*PS, Math.round(p.y/PS)*PS, pSize, pSize);
        // Bright center pixel
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.round(p.x/PS)*PS + PS/2, Math.round(p.y/PS)*PS + PS/2, PS/2, PS/2);
    });

    // === ALCHEMIST SPECIALS (warnings, acid pools, laser) ===
    if (currentBoss.id === 'alchemist') drawAlchemistSpecials(ctx, cw, ch);

    // === DRAW BOSS ===
    if (currentBoss.id === 'shadowLord' && shadowLordEvaporating) {
        ctx.globalAlpha = Math.max(0, 1 - shadowLordEvaporateProgress);
        // Purple particle burst as boss evaporates
        const numP = Math.floor((1 - shadowLordEvaporateProgress) * 20);
        ctx.fillStyle = '#9400d3';
        for (let i = 0; i < numP; i++) {
            const angle = (i / numP) * Math.PI * 2 + gameTime * 0.05;
            const r = shadowLordEvaporateProgress * 80;
            ctx.globalAlpha = Math.max(0, (1 - shadowLordEvaporateProgress) * 0.8);
            ctx.fillRect(
                bossEntity.x + Math.cos(angle) * r - 3,
                bossEntity.y + Math.sin(angle) * r - 3,
                6, 6
            );
        }
        ctx.globalAlpha = Math.max(0, 1 - shadowLordEvaporateProgress);
    }
    drawBossModelTopDown(ctx, bossEntity.x, bossEntity.y, bossEntity.width, bossEntity.height, currentBoss);
    ctx.globalAlpha = 1;

    // Show P1/P2 labels only when both players have the same skin
    const showLabels = bossPlayerCat2 && bossPlayerCat.skin.id === bossPlayerCat2.skin.id;

    // === DRAW PLAYERS using regular drawPixelCat ===
    if (bossPlayerCat) {
        if (bossPlayerCat.alive) {
            if (bossPlayerCat.invulnerable <= 0 || Math.floor(gameTime / 5) % 2 === 0) {
                ctx.save();
                drawPixelCat(ctx, bossPlayerCat.x, bossPlayerCat.y, bossPlayerCat.skin, bossPlayerCat.facingRight, null, true, false);
                ctx.restore();
            }
            if (showLabels) {
                ctx.fillStyle = '#ffffff';
                ctx.font = "6px 'Press Start 2P'";
                ctx.textAlign = 'center';
                ctx.fillText('P1', bossPlayerCat.x + 15, bossPlayerCat.y - 6);
                ctx.textAlign = 'left';
            }
        } else {
            ctx.fillStyle = 'rgba(255,0,0,0.6)';
            ctx.font = "14px 'Press Start 2P'";
            ctx.textAlign = 'center';
            ctx.fillText('✕', bossPlayerCat.x + 15, bossPlayerCat.y + 25);
            ctx.textAlign = 'left';
        }
    }
    if (bossPlayerCat2) {
        if (bossPlayerCat2.alive) {
            if (bossPlayerCat2.invulnerable <= 0 || Math.floor(gameTime / 5) % 2 === 0) {
                ctx.save();
                drawPixelCat(ctx, bossPlayerCat2.x, bossPlayerCat2.y, bossPlayerCat2.skin, bossPlayerCat2.facingRight, null, false, false);
                ctx.restore();
            }
            if (showLabels) {
                ctx.fillStyle = '#ffd700';
                ctx.font = "6px 'Press Start 2P'";
                ctx.textAlign = 'center';
                ctx.fillText('P2', bossPlayerCat2.x + 15, bossPlayerCat2.y - 6);
                ctx.textAlign = 'left';
            }
        } else {
            ctx.fillStyle = 'rgba(255,0,0,0.6)';
            ctx.font = "14px 'Press Start 2P'";
            ctx.textAlign = 'center';
            ctx.fillText('✕', bossPlayerCat2.x + 15, bossPlayerCat2.y + 25);
            ctx.textAlign = 'left';
        }
    }

    // === CONTROLS HINT ===
    if (bossHintVisible) {
        const hintText = bossPlayerCat2
            ? 'P1: WASD   P2: СТРЕЛКИ'
            : 'WASD / СТРЕЛКИ - ДВИЖЕНИЕ';
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(cw/2 - 160, ch - margin + 4, 320, 20);
        ctx.fillStyle = '#ffd700';
        ctx.font = "7px 'Press Start 2P'";
        ctx.textAlign = 'center';
        ctx.fillText(hintText, cw/2, ch - margin + 17);
        ctx.textAlign = 'left';
    }

    // Сбрасываем transform после рендера арены
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ============================================
// DRAW BOSS MODEL TOP-DOWN - Pixel art boss viewed from above
// ============================================
function drawBossModelTopDown(ctx, x, y, w, h, boss) {
    const float = Math.sin(gameTime * 0.06) * 5;
    ctx.save();
    ctx.translate(x, y + float);

    const P = 4; // pixel size matching cat style
    const t = gameTime;
    const dp = (gx,gy,c,sw,sh) => { ctx.fillStyle=c; ctx.fillRect(gx*P,gy*P,(sw||1)*P,(sh||1)*P); };

    if (boss.id === 'alchemist') {
        // ══════════════════════════════════════════════════════════════
        // АЛХИМИК — анатомичная злобная пиксельная модель v4
        // Сапоги → ноги → мантия → пояс+зелья → руки → шея → голова
        // Левая рука держит кипящий флакон; правая поднята с магией.
        // Злобный вайб: запавшее лицо, крючковатый нос, жёлтые зубы,
        // нахмуренные брови, горящие зелёные глаза, костяные декоры.
        // ══════════════════════════════════════════════════════════════
        const ph  = (Math.sin(t*0.10)+1)/2;
        const ph2 = (Math.sin(t*0.17)+1)/2;
        const ph3 = (Math.sin(t*0.24)+1)/2;
        const flk = (Math.sin(t*0.35)*0.5+0.5);

        // ── ПАЛИТРА ──────────────────────────────────────────────────
        // Мантия — иссиня-чёрная оливковая (5 шагов)
        const Rk='#060903', Rd='#0e1408', Rm='#181e10', Rl='#242c16', Rh='#30381e';
        // Капюшон — тёмная охра → янтарь → золото
        const Hk='#100c02', Hd='#231804', Hm='#4a3208', Hl='#7a5610', Hb='#aa7a1a', Hwh='#d0a024';
        // Кожа — мертвенно-бледная зеленоватая
        const Sk='#7c8460', Skd='#5e6648', Skk='#424e32';
        // Сапоги — тёмная потёртая кожа
        const Bk='#0b0706', Bd='#1c1208', Bm='#2e1e10', Bl='#3e2a18';
        // Пояс / манжеты
        const Pk='#080606', Pm='#181210', Ph='#2a2018';
        // Кость / металл — декор
        const Ck='#484840', Cm='#686858', Ch='#909080';
        // Кислота и магия
        const acid  = `rgb(5,${(155+ph*65)|0},38)`;
        const acid2 = `rgba(40,255,78,${0.58+ph2*0.38})`;
        const acidB = `rgba(185,255,168,${ph*0.78})`;
        // Глаза — горящий яд
        const eyG  = `rgb(0,${(220+ph*35)|0},52)`;
        const eyB2 = `rgba(80,255,118,${0.9+ph*0.1})`;
        // Магия правой руки
        const magG = `rgba(0,${(205+ph2*50)|0},45,${0.65+ph3*0.3})`;

        // ════════════════════════════════════════════════════════
        // ТЕНЬ НА ЗЕМЛЕ
        // ════════════════════════════════════════════════════════
        ctx.fillStyle='rgba(0,0,0,0.55)';
        ctx.beginPath(); ctx.ellipse(0,19*P,12*P,3.2*P,0,0,Math.PI*2); ctx.fill();

        // ════════════════════════════════════════════════════════
        // САПОГИ
        // ════════════════════════════════════════════════════════
        // Левый
        dp(-7,12,Bk,6,8); dp(-8,12,Bk,1,8); dp(-2,12,Bk,1,8);
        dp(-7,12,Bd,5,7); dp(-6,12,Bm,4,5); dp(-6,12,Bl,2,1);
        dp(-8,18,Bk,8,2); dp(-7,18,Bd,6,1); dp(-7,19,Bk,6,1);
        ctx.fillStyle=Ch; ctx.fillRect(-5*P,13*P,2*P,P); ctx.fillRect(-5*P,16*P,2*P,P);
        ctx.fillStyle=Cm; ctx.fillRect(-5*P,13*P,P,P); ctx.fillRect(-5*P,16*P,P,P);
        // Правый
        dp(1,12,Bk,6,8); dp(0,12,Bk,1,8); dp(7,12,Bk,1,8);
        dp(1,12,Bd,5,7); dp(2,12,Bm,4,5); dp(3,12,Bl,2,1);
        dp(0,18,Bk,8,2); dp(1,18,Bd,6,1); dp(1,19,Bk,6,1);
        ctx.fillStyle=Ch; ctx.fillRect(3*P,13*P,2*P,P); ctx.fillRect(3*P,16*P,2*P,P);
        ctx.fillStyle=Cm; ctx.fillRect(3*P,13*P,P,P); ctx.fillRect(3*P,16*P,P,P);

        // ════════════════════════════════════════════════════════
        // ПОДОЛ МАНТИИ
        // ════════════════════════════════════════════════════════
        dp(-9,8,Rk,18,5); dp(-10,9,Rk,1,4); dp(9,9,Rk,1,4);
        dp(-9,8,Rd,17,4); dp(-8,8,Rm,15,3); dp(-7,9,Rl,13,2); dp(-6,9,Rh,11,1);
        ctx.fillStyle=Rd;
        ctx.fillRect(-7*P,10*P,P,3*P); ctx.fillRect(-3*P,9*P,P,4*P);
        ctx.fillRect( 2*P,10*P,P,3*P); ctx.fillRect( 6*P,9*P,P,4*P);
        ctx.fillStyle=Rk;
        ctx.fillRect(-6*P,10*P,P,3*P); ctx.fillRect(-2*P,9*P,P,4*P);
        ctx.fillRect( 3*P,10*P,P,3*P); ctx.fillRect( 7*P,9*P,P,4*P);
        ctx.save(); ctx.shadowColor='#846408'; ctx.shadowBlur=5;
        ctx.fillStyle=Hl; ctx.fillRect(-8*P,11*P,16*P,P);
        ctx.fillStyle=Hb; ctx.fillRect(-7*P,11*P,14*P,P*.5);
        ctx.restore();

        // ════════════════════════════════════════════════════════
        // ТЕЛО МАНТИИ
        // ════════════════════════════════════════════════════════
        dp(-8,-8,Rk,16,17); dp(-9,-7,Rk,1,16); dp(8,-7,Rk,1,16);
        dp(-8,-7,Rd,15,15); dp(-7,-6,Rm,13,13); dp(-6,-5,Rl,11,11); dp(-5,-4,Rh,9,9);
        ctx.fillStyle=Hm; ctx.fillRect(-9*P,-7*P,P,16*P); ctx.fillRect(8*P,-7*P,P,16*P);
        ctx.fillStyle=Hl; ctx.fillRect(-9*P,-6*P,P,14*P); ctx.fillRect(8*P,-6*P,P,14*P);
        ctx.fillStyle=Hb; ctx.fillRect(-9*P,-5*P,P,12*P); ctx.fillRect(8*P,-5*P,P,12*P);
        ctx.fillStyle=Rd;
        ctx.fillRect(-5*P,-7*P,P,15*P); ctx.fillRect(-1*P,-6*P,P,14*P);
        ctx.fillRect( 3*P,-6*P,P,14*P); ctx.fillRect( 6*P,-7*P,P,15*P);
        ctx.fillStyle=Rk;
        ctx.fillRect(-6*P,-7*P,P,15*P); ctx.fillRect(0,-6*P,P,14*P);
        ctx.fillRect( 4*P,-6*P,P,14*P); ctx.fillRect( 7*P,-7*P,P,15*P);
        // Рунические символы на мантии (декор)
        ctx.fillStyle=Ck;
        ctx.fillRect(-4*P,2*P,3*P,P); ctx.fillRect(1*P,2*P,3*P,P);
        ctx.fillRect(-3*P,4*P,P,2*P); ctx.fillRect(2*P,5*P,P,2*P);
        ctx.fillStyle=Cm;
        ctx.fillRect(-4*P,2*P,2*P,P*.5); ctx.fillRect(1*P,2*P,2*P,P*.5);
        ctx.fillRect(-3*P,4*P,P,P*.5); ctx.fillRect(2*P,5*P,P,P*.5);

        // ════════════════════════════════════════════════════════
        // ПОЯС + ПРЯЖКА-ЧЕРЕП + ТРИ ЗЕЛЬЯ
        // ════════════════════════════════════════════════════════
        dp(-7,1,Pk,14,3); dp(-8,1,Pk,1,3); dp(7,1,Pk,1,3);
        dp(-7,1,Pm,13,2); dp(-6,1,Ph,11,1);
        // Пряжка — пиксельный череп
        ctx.save(); ctx.shadowColor='#906808'; ctx.shadowBlur=7+ph*5;
        ctx.fillStyle='#1a1208'; ctx.fillRect(-2*P,1*P,4*P,3*P);
        ctx.fillStyle=Hl; ctx.fillRect(-2*P,1*P,4*P,P);
        ctx.fillStyle=Hb; ctx.fillRect(-2*P,1*P,2*P,P*.7);
        ctx.fillStyle='#060402'; ctx.fillRect(-2*P,2*P,P,P); ctx.fillRect(0,2*P,P,P); // глазницы
        ctx.fillStyle='#181208'; ctx.fillRect(-2*P,3*P,4*P,P*.5); // челюсть
        ctx.fillStyle=Cm; ctx.fillRect(-P,3*P,P*.4,P*.5); ctx.fillRect(0,3*P,P*.4,P*.5); // зубы черепа
        ctx.restore();
        // Костяные кнопки пояса
        ctx.fillStyle=Cm; ctx.fillRect(-6*P,1*P,2*P,2*P); ctx.fillRect(4*P,1*P,2*P,2*P);
        ctx.fillStyle=Ch; ctx.fillRect(-6*P,1*P,P,P); ctx.fillRect(4*P,1*P,P,P);
        // Три зелья (покачиваются)
        const mkPotion=(fx,col,colHi,sh,fp)=>{
            const fy=Math.sin(t*0.11+fp)*1.0;
            ctx.fillStyle=Pk; ctx.fillRect((fx-.4)*P,(4.5+fy)*P,.8*P,1.8*P);
            ctx.fillStyle=Pm; ctx.fillRect((fx-.2)*P,(4.5+fy)*P,.4*P,1.8*P);
            ctx.save(); ctx.shadowColor=sh; ctx.shadowBlur=8+ph*4;
            ctx.fillStyle='#020304';
            ctx.fillRect((fx-1.4)*P,(6.1+fy)*P,2.8*P,3.2*P);
            ctx.fillRect((fx-1)*P,(5.8+fy)*P,2*P,P*.5);
            ctx.fillRect((fx-1)*P,(9.1+fy)*P,2*P,P*.5);
            ctx.fillStyle=col;
            ctx.fillRect((fx-1.2)*P,(6.1+fy)*P,2.4*P,3*P);
            ctx.fillRect((fx-.8)*P,(5.8+fy)*P,1.6*P,P*.5);
            ctx.fillRect((fx-.8)*P,(8.9+fy)*P,1.6*P,P*.5);
            ctx.fillStyle=colHi;
            ctx.fillRect((fx-1.2)*P,(6.1+fy)*P,P*.8,P*.8);
            ctx.restore();
        };
        mkPotion(-4.5,'#1a3a8c','#3060cc','#2255ee',ph2*1.8);
        mkPotion( 0,  '#881018','#aa1a22','#dd1828',ph3*1.8);
        mkPotion( 4.5, acid,   `rgb(5,${(200+ph*55)|0},60)`,'#00ff44',ph*1.8);

        // ════════════════════════════════════════════════════════
        // САМОЦВЕТ НА ГРУДИ
        // ════════════════════════════════════════════════════════
        ctx.save(); ctx.shadowColor='#00ff44'; ctx.shadowBlur=14+ph*10;
        ctx.strokeStyle=Hl; ctx.lineWidth=P*.3; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(-2*P,-7*P); ctx.lineTo(0,-5.2*P); ctx.lineTo(2*P,-7*P); ctx.stroke();
        ctx.lineCap='butt';
        ctx.fillStyle='#001204'; ctx.fillRect(-2*P,-5.4*P,4*P,4*P);
        ctx.fillStyle=Hm; ctx.fillRect(-2*P,-5.4*P,4*P,P*.5); ctx.fillRect(-2*P,-2*P,4*P,P*.5);
        ctx.fillStyle=`rgb(0,${(80+ph*80)|0},24)`;
        ctx.fillRect(-P,-5*P,2*P,4*P); ctx.fillRect(-2*P,-4*P,4*P,2*P);
        ctx.fillStyle=eyB2;
        ctx.fillRect(-P,-4.6*P,2*P,3.2*P); ctx.fillRect(-1.6*P,-3.6*P,3.2*P,1.2*P);
        ctx.fillStyle='rgba(200,255,175,0.9)'; ctx.fillRect(-P*.5,-4.8*P,P*.5,P*.5);
        ctx.restore();

        // ════════════════════════════════════════════════════════
        // ЛЕВАЯ РУКА (опущена вниз, держит флакон)
        // ════════════════════════════════════════════════════════
        dp(-12,-7,Rm,4,5); dp(-13,-7,Rd,1,5); dp(-9,-7,Rk,1,5); dp(-12,-7,Rl,3,1);
        dp(-13,-3,Rm,3,7); dp(-14,-3,Rd,1,7); dp(-11,-3,Rk,1,7); dp(-13,-3,Rl,2,1);
        dp(-14,3,Hk,4,2); dp(-14,3,Hd,3,1); dp(-14,3,Hm,2,1);
        // Кисть (костлявая)
        dp(-14,5,Skd,3,3); dp(-15,5,Skk,1,3); dp(-12,5,Skk,1,3);
        ctx.fillStyle=Sk; ctx.fillRect(-14*P,5*P,2*P,2*P);
        ctx.fillStyle=Skk; ctx.fillRect(-15*P,7*P,P,3*P); ctx.fillRect(-12*P,7*P,P,3*P);
        ctx.fillStyle=Skd; ctx.fillRect(-14*P,7*P,P,4*P); ctx.fillRect(-13*P,7*P,P,3*P);
        ctx.fillStyle=Sk; ctx.fillRect(-14*P,7*P,P,2*P);
        ctx.fillStyle=Skk; ctx.fillRect(-14*P,6*P,P,P*.5); ctx.fillRect(-13*P,6*P,P,P*.5);

        // ════════════════════════════════════════════════════════
        // БОЛЬШОЙ ФЛАКОН С КИСЛОТОЙ (пиксельный, у левой руки)
        // ════════════════════════════════════════════════════════
        const lq = Math.sin(t*0.24)*2;
        // Горлышко
        dp(-16,9,Pk,3,5); dp(-17,9,Pk,1,5); dp(-14,9,Pk,1,5);
        dp(-16,9,Pm,2,4); dp(-16,8,Ph,3,1);
        // Тело флакона (полностью пиксельное)
        dp(-19,13,Pk,7,10); dp(-20,14,Pk,1,8); dp(-13,14,Pk,1,8);
        dp(-19,14,Pm,6,8); dp(-18,14,Ph,4,1);
        // Стекло
        ctx.fillStyle='#010802'; ctx.fillRect(-18*P,14*P,5*P,8*P);
        // Кислота (анимированный уровень)
        ctx.save(); ctx.shadowColor='#00ff44'; ctx.shadowBlur=28+ph*18;
        const acidTop = (14 + (2 - lq*.4))|0;
        ctx.fillStyle=acid; ctx.fillRect(-18*P,acidTop*P,5*P,(23-acidTop)*P);
        ctx.fillStyle=acid2; ctx.fillRect(-18*P,acidTop*P,4*P,(21-acidTop)*P*.5);
        ctx.restore();
        // Пузырьки
        ctx.fillStyle=acidB;
        if(Math.floor(t*2.5)%2===0){
            ctx.fillRect(-19*P,15*P,2*P,P); ctx.fillRect(-16*P,16*P,P,P);
        } else {
            ctx.fillRect(-18*P,14*P,P,P); ctx.fillRect(-16*P,17*P,2*P,P);
        }
        // Блик стекла
        ctx.fillStyle='rgba(255,255,255,0.20)'; ctx.fillRect(-19*P,14*P,P,4*P); ctx.fillRect(-19*P,14*P,3*P,P);
        // Капли кислоты снизу
        ctx.save(); ctx.shadowColor='#00ff44'; ctx.shadowBlur=8;
        ctx.fillStyle=acid; ctx.fillRect(-18*P,22*P,P,2*P); ctx.fillRect(-16*P,23*P,P,P);
        ctx.fillStyle=acid2; ctx.fillRect(-18*P,23*P,P*.8,P*.8);
        ctx.restore();

        // ════════════════════════════════════════════════════════
        // ПРАВАЯ РУКА (поднята вверх, магический жест)
        // ════════════════════════════════════════════════════════
        dp(8,-7,Rm,4,5); dp(7,-7,Rk,1,5); dp(12,-7,Rd,1,5); dp(8,-7,Rl,3,1);
        dp(9,-13,Rm,3,8); dp(8,-13,Rk,1,8); dp(12,-13,Rd,1,8); dp(9,-13,Rl,2,1);
        dp(8,-13,Hk,4,2); dp(8,-13,Hd,3,1); dp(8,-13,Hm,2,1);
        // Кисть
        dp(9,-16,Skd,4,4); dp(8,-16,Skk,1,4); dp(13,-16,Skk,1,4);
        ctx.fillStyle=Sk; ctx.fillRect(9*P,-16*P,3*P,3*P);
        // Скрюченные угрожающие пальцы
        ctx.fillStyle=Skk; ctx.fillRect(8*P,-20*P,P,5*P); ctx.fillRect(13*P,-19*P,P,4*P);
        ctx.fillStyle=Skd; ctx.fillRect(9*P,-21*P,P,6*P); ctx.fillRect(11*P,-21*P,P,6*P);
        ctx.fillStyle=Sk;  ctx.fillRect(10*P,-20*P,P,5*P);
        // Суставы
        ctx.fillStyle=Skk;
        ctx.fillRect(9*P,-16*P,P,P*.5); ctx.fillRect(10*P,-16*P,P,P*.5); ctx.fillRect(11*P,-16*P,P,P*.5);
        ctx.fillRect(8*P,-17*P,P,P*.5); ctx.fillRect(13*P,-17*P,P,P*.5);
        // Когти
        ctx.fillStyle=Ch;
        ctx.fillRect(8*P,-21*P,P,P); ctx.fillRect(9*P,-22*P,P,P);
        ctx.fillRect(11*P,-22*P,P,P); ctx.fillRect(13*P,-20*P,P,P);
        // Магическое свечение руки
        ctx.save(); ctx.shadowColor='#00ff44'; ctx.shadowBlur=22+ph*18;
        ctx.fillStyle=magG; ctx.fillRect(8*P,-23*P,7*P,9*P);
        ctx.restore();

        // ════════════════════════════════════════════════════════
        // ШЕЯ
        // ════════════════════════════════════════════════════════
        dp(-3,-9,Rd,6,3); dp(-4,-9,Rk,1,3); dp(3,-9,Rk,1,3);
        ctx.fillStyle=Skd; ctx.fillRect(-2*P,-9*P,4*P,2*P);
        ctx.fillStyle=Skk; ctx.fillRect(-2*P,-9*P,3*P,P);

        // ════════════════════════════════════════════════════════
        // ШИРОКИЙ ВОРОТНИК КАПЮШОНА
        // ════════════════════════════════════════════════════════
        dp(-11,-11,Hk,22,4); dp(-12,-12,Hk,1,4); dp(11,-12,Hk,1,4);
        dp(-11,-11,Hd,21,3); dp(-10,-10,Hm,19,2); dp(-9,-9,Hl,17,1); dp(-8,-9,Hb,15,1);
        dp(-12,-12,Hm,2,5); dp(-13,-11,Hd,1,4); dp(-14,-10,Hk,1,2);
        dp( 11,-12,Hm,2,5); dp( 12,-11,Hd,1,4); dp( 13,-10,Hk,1,2);

        // ════════════════════════════════════════════════════════
        // ТЁМНЫЙ ПРОВАЛ ВНУТРИ КАПЮШОНА
        // ════════════════════════════════════════════════════════
        ctx.fillStyle='#020402'; ctx.fillRect(-8*P,-22*P,16*P,12*P);
        ctx.fillStyle='#010301'; ctx.fillRect(-7*P,-21*P,14*P,11*P);
        ctx.fillStyle='#000200'; ctx.fillRect(-6*P,-20*P,12*P,10*P);

        // ── ЛИЦО ── запавшее, костлявое, злобное ─────────────
        // Подбородок
        ctx.fillStyle=Skk; ctx.fillRect(-3*P,-11*P,6*P,2*P);
        ctx.fillStyle=Skd; ctx.fillRect(-3*P,-11*P,5*P,P);
        ctx.fillStyle=Sk;  ctx.fillRect(-2*P,-11*P,3*P,P*.5);
        // Запавшие скулы
        ctx.fillStyle=Skk; ctx.fillRect(-6*P,-15*P,2*P,3*P); ctx.fillRect(4*P,-15*P,2*P,3*P);
        ctx.fillStyle=Skd; ctx.fillRect(-5*P,-14*P,P,2*P); ctx.fillRect(4*P,-14*P,P,2*P);
        // Крючковатый нос мага
        ctx.fillStyle=Skd; ctx.fillRect(-1*P,-17*P,2*P,5*P);
        ctx.fillStyle=Sk;  ctx.fillRect(-1*P,-17*P,2*P,P);
        ctx.fillStyle=Skk; ctx.fillRect(-2*P,-16*P,P,P); // горбинка
        ctx.fillStyle=Skd; ctx.fillRect(0,-15*P,2*P,2*P); // кончик
        ctx.fillStyle='#040302'; ctx.fillRect(0,-14*P,P,P); // ноздря
        // Злобный рот с жёлтыми зубами
        ctx.fillStyle='#120906'; ctx.fillRect(-4*P,-12*P,8*P,2*P);
        // Зубы — неровные, гнилые
        ctx.fillStyle='#b8a040'; ctx.fillRect(-3*P,-12*P,P,P); ctx.fillRect(-P,-12*P,P,P*.8); ctx.fillRect(P,-12*P,P,P); ctx.fillRect(3*P,-12*P,P,P*.8);
        ctx.fillStyle='#d0b850'; ctx.fillRect(-2*P,-12*P,P,P*.6); ctx.fillRect(2*P,-12*P,P,P*.6);
        ctx.fillStyle='#060402'; ctx.fillRect(-2*P,-12*P,P*.5,P); ctx.fillRect(0,-12*P,P*.5,P); ctx.fillRect(2*P,-12*P,P*.5,P);
        ctx.fillStyle='#281410'; ctx.fillRect(-3*P,-11*P,6*P,P*.5);
        // Кривая ухмылка (правый угол рта приподнят)
        ctx.fillStyle=Skd; ctx.fillRect(3*P,-12*P,P,P*.5);
        ctx.fillStyle='#120906'; ctx.fillRect(-4*P,-12*P,P,P*.5);

        // ── НАХМУРЕННЫЕ БРОВИ (скошены, злобные) ─────────────
        ctx.fillStyle=Hd;
        ctx.fillRect(-5*P,-19*P,4*P,P); ctx.fillRect( 1*P,-19*P,4*P,P);
        ctx.fillStyle=Hk;
        ctx.fillRect(-4*P,-18*P,P,P); ctx.fillRect(-3*P,-18*P,P,P*.5); // левая наклонена внутрь
        ctx.fillRect( 3*P,-18*P,P,P); ctx.fillRect( 2*P,-18*P,P,P*.5); // правая наклонена внутрь
        ctx.fillStyle='#201008'; ctx.fillRect(-1*P,-18*P,2*P,P);
        ctx.fillStyle='#100804'; ctx.fillRect(-P,-17*P,P,P*.5); ctx.fillRect(0,-17*P,P,P*.5);

        // ── ГЛАЗА — ГОРЯЩИЙ ОТРАВЛЕННЫЙ ЯД ──────────────────
        ctx.save(); ctx.shadowColor='#00ff55'; ctx.shadowBlur=38+ph*30;
        ctx.fillStyle='#010501'; ctx.fillRect(-5*P,-19*P,4*P,4*P); ctx.fillRect(1*P,-19*P,4*P,4*P);
        ctx.fillStyle=eyG;
        ctx.fillRect(-5*P,-19*P,4*P,4*P); ctx.fillRect(1*P,-19*P,4*P,4*P);
        ctx.fillStyle=eyB2;
        ctx.fillRect(-5*P,-19*P,3*P,3*P); ctx.fillRect(1*P,-19*P,3*P,3*P);
        ctx.fillStyle='rgba(218,255,198,0.96)';
        ctx.fillRect(-5*P,-19*P,2*P,2*P); ctx.fillRect(1*P,-19*P,2*P,2*P);
        ctx.fillStyle='rgba(255,255,255,0.88)';
        ctx.fillRect(-5*P,-19*P,P,P); ctx.fillRect(1*P,-19*P,P,P);
        ctx.restore();

        // ════════════════════════════════════════════════════════
        // КУПОЛ КАПЮШОНА (высокий, плавно округлый)
        // ════════════════════════════════════════════════════════
        // Основание
        ctx.fillStyle=Hk; ctx.fillRect(-9*P,-29*P,18*P,8*P);
        ctx.fillStyle=Hk; ctx.fillRect(-10*P,-28*P,P,7*P); ctx.fillRect(9*P,-28*P,P,7*P);
        ctx.fillStyle=Hd; ctx.fillRect(-9*P,-28*P,18*P,7*P);
        ctx.fillStyle=Hm; ctx.fillRect(-8*P,-28*P,16*P,7*P);
        ctx.fillStyle=Hl; ctx.fillRect(-7*P,-27*P,14*P,6*P);
        ctx.fillStyle=Hb; ctx.fillRect(-6*P,-27*P,12*P,5*P);
        ctx.fillStyle=Hwh; ctx.fillRect(-5*P,-26*P,10*P,4*P);
        // Ярусы — ровно ±1 каждые 2px (настоящая пиксельная округлость)
        const tiers=[
            [8,-31,2],[7,-33,2],[6,-35,2],[5,-37,2],
            [4,-39,2],[3,-41,1],[2,-42,1],[1,-43,1]
        ];
        tiers.forEach(([hw,yr,ht])=>{
            ctx.fillStyle=Hk;  ctx.fillRect(-(hw+1)*P,yr*P,(hw*2+2)*P,ht*P);
            ctx.fillStyle=Hd;  ctx.fillRect(-hw*P,yr*P,hw*2*P,ht*P);
            if(hw>1){ctx.fillStyle=Hm; ctx.fillRect(-(hw-1)*P,yr*P,(hw-1)*2*P,ht*P);}
            if(hw>3){ctx.fillStyle=Hl; ctx.fillRect(-(hw-2)*P,yr*P,(hw-2)*2*P,ht*P);}
            if(hw>5){ctx.fillStyle=Hb; ctx.fillRect(-(hw-4)*P,yr*P,(hw-4)*2*P,ht*P);}
        });
        // Складки ткани купола
        ctx.fillStyle=Hd;
        ctx.fillRect(-7*P,-42*P,P,20*P); ctx.fillRect(-4*P,-41*P,P,19*P);
        ctx.fillRect( 4*P,-42*P,P,20*P); ctx.fillRect( 6*P,-41*P,P,19*P);
        ctx.fillStyle=Hm;
        ctx.fillRect(-6*P,-41*P,P,19*P); ctx.fillRect(-2*P,-40*P,P,18*P);
        ctx.fillRect( 5*P,-41*P,P,19*P);
        // Блик верхушки
        ctx.fillStyle=Hwh; ctx.fillRect(-2*P,-43*P,4*P,P);
        ctx.fillStyle=Hb;  ctx.fillRect(-3*P,-42*P,6*P,P);
        // Золотые канты боков
        ctx.save(); ctx.shadowColor='#a07810'; ctx.shadowBlur=10+ph*7;
        ctx.fillStyle=Hm;  ctx.fillRect(-10*P,-28*P,P,8*P); ctx.fillRect(9*P,-28*P,P,8*P);
        ctx.fillStyle=Hl;  ctx.fillRect(-10*P,-27*P,P,6*P); ctx.fillRect(9*P,-27*P,P,6*P);
        ctx.fillStyle=Hb;  ctx.fillRect(-10*P,-26*P,P,4*P); ctx.fillRect(9*P,-26*P,P,4*P);
        ctx.fillStyle=Hwh; ctx.fillRect(-10*P,-25*P,P,2*P); ctx.fillRect(9*P,-25*P,P,2*P);
        ctx.fillStyle=Hm;  ctx.fillRect(-9*P,-11*P,18*P,P);
        ctx.fillStyle=Hb;  ctx.fillRect(-8*P,-11*P,16*P,P*.5);
        ctx.restore();

        // ════════════════════════════════════════════════════════
        // РОЖОК НА КАПЮШОНЕ (злобный, зелёный)
        // ════════════════════════════════════════════════════════
        ctx.save(); ctx.shadowColor='#44cc22'; ctx.shadowBlur=8;
        ctx.fillStyle='#0a1c08'; ctx.fillRect(-4*P,-25*P,2*P,2*P);
        ctx.fillStyle='#143816'; ctx.fillRect(-4*P,-27*P,2*P,2*P);
        ctx.fillStyle='#1e5820'; ctx.fillRect(-4*P,-29*P,2*P,2*P);
        ctx.fillStyle='#2c7a2c'; ctx.fillRect(-3*P,-31*P,2*P,2*P);
        ctx.fillStyle='#3a9838'; ctx.fillRect(-3*P,-33*P,P,2*P);
        ctx.fillStyle='#48b044'; ctx.fillRect(-3*P,-34*P,P,P);
        ctx.fillStyle='#2c7a2c'; ctx.fillRect(-2*P,-34*P,P,P);
        ctx.fillStyle='rgba(50,185,45,0.30)'; ctx.fillRect(-5*P,-34*P,3*P,10*P);
        ctx.restore();

        // Искры от пальцев правой руки (только рядом с рукой)
        ctx.save(); ctx.shadowColor='#00ff44'; ctx.shadowBlur=10+ph*8;
        ctx.fillStyle=`rgba(0,${(222+ph*33)|0},55,${0.7+ph2*0.3})`;
        ctx.fillRect( 8*P,-22*P,P,P); ctx.fillRect(11*P,-23*P,P,P);
        ctx.fillRect(13*P,-21*P,P,P); ctx.fillRect(10*P,-24*P,P*.6,P*.6);
        ctx.restore();

        ctx.restore();
        return;
    }

    if (false && boss.id === 'alchemist_OLD_REMOVED') {
        // ═══════════════════════════════════════════════
        // АЛХИМИК — высокий стройный чародей
        // Тёмно-фиолетовая мантия, огромная остроконечная шляпа,
        // зелёные светящиеся глаза, пояс, бурлящая колба
        // ═══════════════════════════════════════════════
        const ph  = (Math.sin(t*0.10)+1)/2;
        const ph2 = (Math.sin(t*0.17)+1)/2;
        const ph3 = (Math.sin(t*0.24)+1)/2;
        const flicker = (Math.sin(t*0.33)*0.5+0.5);

        // Палитра мантии (тёмно-фиолетовая)
        const Mk  = '#0e0818';
        const Md  = '#1a0e32';
        const Mm  = '#2d1a50';
        const Ml  = '#4a2878';
        const Mh  = '#6a3a9a';
        const Mhl = '#8a52b8';
        // Палитра шляпы (ещё темнее)
        const Hk  = '#060310';
        const Hd  = '#0e0820';
        const Hm  = '#1c1238';
        const Hl  = '#2e1e52';
        const Hhl = '#3e2a6e';
        // Пояс
        const Bt  = '#3d2008';
        const Bm  = '#6a3818';
        const Bl  = '#9a5828';
        const Gd  = '#d4af37';
        const Gdl = '#f0d060';
        // Кожа (руки)
        const Sk  = '#c8906a';
        const Skd = '#a07050';
        // Колба/кислота
        const Fk  = '#001a08';
        const Fm  = '#003818';
        const Fl  = `rgb(0,${(210+ph*45)|0},${(50+ph2*30)|0})`;
        const Flg = `rgba(0,${(230+ph*25)|0},60,${0.7+ph3*0.3})`;
        const Fbr = `rgba(180,255,160,${ph*0.9})`;

        // Тень на земле
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.ellipse(0, 17*P, 8*P, 2.5*P, 0, 0, Math.PI*2); ctx.fill();

        // ═══ ПОДОЛ МАНТИИ — широкий, развевающийся ═══════════
        // Самый нижний слой — полы
        dp(-8, 10, Mk, 17, 8);
        dp(-9, 11, Mk,  1, 6);   dp(8, 11, Mk, 1, 6);      // боковые тени
        dp(-7, 10, Md, 15, 7);
        dp(-6, 10, Mm, 12, 6);
        // Складки подола
        ctx.fillStyle = Md;
        ctx.fillRect(-5*P,11*P, 2*P,6*P); ctx.fillRect(-1*P,10*P, P,7*P);
        ctx.fillRect( 2*P,11*P, P,6*P);   ctx.fillRect( 5*P,10*P, 2*P,7*P);
        ctx.fillStyle = Mk;
        ctx.fillRect(-4*P,11*P, P,6*P);   ctx.fillRect( 0,  10*P, P,7*P);
        ctx.fillRect( 3*P,11*P, P,6*P);   ctx.fillRect( 6*P,10*P, P,7*P);
        // Кант подола с кислотным свечением
        ctx.save(); ctx.shadowColor='#00ff44'; ctx.shadowBlur=8;
        ctx.fillStyle=`rgba(0,${(160+ph*70)|0},40,0.55)`;
        ctx.fillRect(-6*P,16*P, 12*P,P);
        ctx.restore();

        // ═══ ТЕЛО — узкий высокий корпус ═════════════════════
        dp(-3, -2, Mk, 7, 13);
        dp(-4, -2, Mk,  1,13);   dp(4,-2, Mk, 1,13);        // боковые тени
        dp(-3, -2, Md,  6,12);
        dp(-2, -1, Mm,  5,11);
        // Центральная нить (застёжка мантии)
        ctx.fillStyle = Ml;
        ctx.fillRect(0,-1*P, P,11*P);
        ctx.fillStyle = Mhl;
        ctx.fillRect(0,-1*P, P, P);   ctx.fillRect(0,3*P, P,P); ctx.fillRect(0,7*P, P,P);
        // Складки груди
        ctx.fillStyle = Md;
        ctx.fillRect(-2*P,0, P,9*P);   ctx.fillRect(2*P,0, P,9*P);
        ctx.fillStyle = Mk;
        ctx.fillRect(-3*P,0, P,9*P);   ctx.fillRect(3*P,0, P,9*P);

        // ═══ ПЛЕЧИ ════════════════════════════════════════════
        dp(-6, -3, Mm, 3, 4);   dp(-7,-3, Md,1,4);   dp(-4,-3, Mk,1,4);
        dp( 4, -3, Mm, 3, 4);   dp( 3,-3, Mk,1,4);   dp( 7,-3, Md,1,4);
        dp(-6, -3, Ml, 3, P);   dp( 4,-3, Ml,3,P);   // блики плеч

        // ═══ ЛЕВАЯ РУКА ═══════════════════════════════════════
        dp(-8, -2, Mm, 2, 8);   dp(-9,-2, Md,1,8);   dp(-7,-2, Mk,1,8);
        dp(-8, -2, Ml, P, 6);                         // блик
        dp(-9,  5, Mm, 3, 3);   dp(-9,5, Mk,1,3);    // манжет
        dp(-9,  7, Sk, 3, 3);   dp(-9,7, Skd,1,3);   // кисть

        // ═══ ПРАВАЯ РУКА ══════════════════════════════════════
        dp( 7, -2, Mm, 2, 8);   dp( 6,-2, Mk,1,8);   dp( 9,-2, Md,1,8);
        dp( 8, -2, Ml, P, 6);
        dp( 7,  5, Mm, 3, 3);   dp(10,5, Mk,1,3);
        dp( 7,  7, Sk, 3, 3);   dp( 10,7, Skd,1,3);

        // ═══ ПОЯС ═════════════════════════════════════════════
        dp(-4,  7, Bt, 9, 3);
        dp(-4,  7, Bm, 9, 2);
        dp(-4,  7, Mk,  1,3);   dp(5,7, Mk,1,3);
        dp(-3,  7, Bl, 7, P);   // блик пояса
        // Пряжка (по центру — золотая)
        dp(-1,  6, Bt, 3, 4);
        dp(-1,  7, Bm, 3, 2);
        ctx.save(); ctx.shadowColor='#ffd700'; ctx.shadowBlur=10+ph*5;
        ctx.fillStyle = Gd;   ctx.fillRect(-P*0.5,7*P, P,2*P);
        ctx.fillStyle = Gdl;  ctx.fillRect(-P*0.5,7*P, P/2,P/2);
        ctx.restore();
        // Маленькие треугольные колбочки на поясе
        const drawMiniFlask = (fx, fphase) => {
            const fy = Math.sin(t*0.09 + fphase)*1.5;
            ctx.fillStyle = Bt;
            ctx.beginPath(); ctx.moveTo((fx-1)*P,(8+fy)*P); ctx.lineTo((fx+1)*P,(8+fy)*P); ctx.lineTo(fx*P,(11+fy)*P); ctx.closePath(); ctx.fill();
            ctx.save(); ctx.shadowColor='#00ff44'; ctx.shadowBlur=7;
            ctx.fillStyle = Fl;
            ctx.beginPath(); ctx.moveTo((fx-0.6)*P,(9+fy)*P); ctx.lineTo((fx+0.6)*P,(9+fy)*P); ctx.lineTo(fx*P,(10.8+fy)*P); ctx.closePath(); ctx.fill();
            ctx.restore();
            ctx.fillStyle = Bm; ctx.fillRect((fx-0.7)*P,(7.5+fy)*P, 1.4*P,P);
        };
        drawMiniFlask(-3, 0);
        drawMiniFlask( 3, 2.1);

        // ═══ ШЕЯ ══════════════════════════════════════════════
        dp(-1, -5, Sk, 3, 4);
        dp(-2, -5, Skd,1,4);   dp(2,-5, Skd,1,4);
        dp(-1, -5, Sk, 3, P);

        // ═══ ГОЛОВА — ТЁМНЫЙ ПРОВАЛ ПОД ПОЛЯМИ ШЛЯПЫ ════════
        dp(-3,-11, Mk, 7, 7);
        dp(-4,-11, Mk,  1,7);   dp(4,-11, Mk,1,7);   dp(-3,-11, Mk,7,1);
        dp(-3,-10, Hd,  6,5);
        dp(-2,-10, Hm,  5,4);   // лицо — скрыто во тьме
        // Тёмное пятно — лица не видно, только глаза
        dp(-3,-10, Mk, 6, 4);

        // ═══ ГЛАЗА — ЗЛОВЕЩИЕ ЗЕЛЁНЫЕ ═══════════════════════
        ctx.save(); ctx.shadowColor='#00ff44'; ctx.shadowBlur=18+ph*10;
        ctx.fillStyle = `rgb(0,${(210+ph*45)|0},50)`;
        dp(-2,-9, `rgb(0,${(210+ph*45)|0},50)`, 2, 2);
        dp( 1,-9, `rgb(0,${(210+ph*45)|0},50)`, 2, 2);
        ctx.fillStyle=`rgba(200,255,180,${0.75+ph*0.25})`;
        ctx.fillRect(-2*P,-9*P, P,P);   ctx.fillRect(1*P,-9*P, P,P);
        ctx.fillStyle=`rgba(255,255,230,${ph3*0.9})`;
        ctx.fillRect(-2*P,-9*P, P/2,P/2); ctx.fillRect(1*P,-9*P, P/2,P/2);
        // Зрачки
        ctx.fillStyle='#001a00';
        ctx.fillRect(-1*P,-9*P, P,2*P);  ctx.fillRect(2*P,-9*P, P,2*P);
        ctx.restore();

        // ═══ ПОЛЯ ШЛЯПЫ — ШИРОКИЕ, НЕМНОГО ИЗОГНУТЫ ════════
        dp(-10,-13, Hk, 21, 4);          // самый нижний слой — тень
        dp(-10,-13, Hk,  1, 4);   dp(11,-13, Hk,1,4);
        dp( -9,-13, Hd, 19, 3);          // основной слой
        dp( -8,-12, Hm, 17, 2);          // светлее к центру
        dp( -7,-12, Hl, 15, P);          // блик поверхности
        // Загнутые края полей
        dp(-11,-12, Hk,  2, 3);   dp(10,-12, Hk,2,3);
        dp(-11,-11, Hd,  2, 2);   dp(10,-11, Hd,2,2);
        // Кант полей (нижний) — зелёное свечение
        ctx.save(); ctx.shadowColor='#00cc33'; ctx.shadowBlur=8;
        ctx.fillStyle=`rgba(0,${(140+ph*80)|0},40,0.6)`;
        ctx.fillRect(-8*P,-10*P, 16*P,P);
        ctx.restore();
        // Верхний кант (там где конус начинается)
        dp(-5,-14, Hd, 11, 2);
        dp(-4,-14, Hm, 9, P);     // блик

        // ═══ КОНУС ШЛЯПЫ — ВЫСОКИЙ, СТРОЙНЫЙ, СКРУЧЕННЫЙ ════
        // Нижняя секция конуса
        dp(-4,-18, Hk, 9, 5);
        dp(-5,-18, Hk,  1,5);   dp(5,-18, Hk,1,5);
        dp(-4,-17, Hd,  8,4);
        dp(-3,-17, Hm,  6,3);   dp(-3,-17, Hl,6,P);    // блик
        dp(-2,-17, Hhl, P,3);   // яркий центр блика
        // Средняя секция (чуть уже, уходит влево)
        dp(-3,-23, Hk, 7, 6);
        dp(-4,-23, Hk,  1,6);   dp(4,-23, Hk,1,6);
        dp(-3,-22, Hd,  6,5);
        dp(-2,-22, Hm,  5,4);   dp(-2,-22, Hl,5,P);
        dp(-1,-21, Hhl, P,3);
        // Верхняя секция (ещё уже, чуть назад)
        dp(-2,-29, Hk, 5, 7);
        dp(-3,-29, Hk,  1,7);   dp(3,-29, Hk,1,7);
        dp(-2,-28, Hd,  4,6);
        dp(-1,-28, Hm,  3,5);   dp(-1,-28, Hl,3,P);
        dp( 0,-27, Hhl, P,3);
        // Самый кончик (острый)
        dp(-1,-33, Hk, 3, 5);
        dp(-2,-33, Hk,  1,5);   dp(2,-33, Hk,1,5);
        dp(-1,-32, Hd,  2,4);
        dp( 0,-32, Hm,  P,3);
        dp( 0,-36, Hk,  P,4);
        dp( 0,-37, Hk,  P,2);   // острый конец
        // Блики рёбер конуса (имитация складок ткани)
        ctx.fillStyle = Hl;
        ctx.fillRect(-3*P,-22*P, P,5*P);   // левое ребро
        ctx.fillRect(-2*P,-28*P, P,6*P);
        ctx.fillStyle = Hhl;
        ctx.fillRect(-3*P,-22*P, P,P);
        ctx.fillRect(-2*P,-28*P, P,P);
        // Лента на шляпе — зелёная, светится
        ctx.save(); ctx.shadowColor='#00dd33'; ctx.shadowBlur=10;
        ctx.fillStyle='#004418';
        ctx.fillRect(-4*P,-15*P, 9*P,2*P);
        ctx.fillStyle=`rgba(0,${(180+ph*70)|0},50,0.88)`;
        ctx.fillRect(-4*P,-15*P, 9*P,P);
        ctx.fillStyle=`rgba(100,255,120,${0.4+ph3*0.35})`;
        ctx.fillRect(-3*P,-15*P, 7*P,P*0.5);
        ctx.restore();

        // ═══ БОЛЬШАЯ КОЛБА В РУКАХ (внизу) ══════════════════
        const liq = Math.sin(t*0.2) * 3;  // волна жидкости
        // Основа стекла (тёмная)
        ctx.fillStyle = Fk;
        ctx.beginPath(); ctx.arc(0, 13*P, 5*P,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = Fm;
        ctx.beginPath(); ctx.arc(0, 13*P, 4.2*P,0,Math.PI*2); ctx.fill();
        // Кислота бурлит
        ctx.save(); ctx.shadowColor='#00ff44'; ctx.shadowBlur=20+ph*10;
        ctx.fillStyle = Fl;
        ctx.beginPath(); ctx.arc(0, (13+liq*0.15)*P, 3.5*P,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = Flg;
        ctx.beginPath(); ctx.arc(0, (12.5+liq*0.1)*P, 2.5*P,0,Math.PI*2); ctx.fill();
        ctx.restore();
        // Пузырьки (анимированные, 2 набора)
        ctx.fillStyle = Fbr;
        if (Math.floor(t*2)%2 === 0) {
            ctx.beginPath(); ctx.arc(-1.5*P,(11.5+liq*0.1)*P, 1.2*P,0,Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc( 2*P,  (12.5+liq*0.1)*P, P,   0,Math.PI*2); ctx.fill();
        } else {
            ctx.beginPath(); ctx.arc( 1*P,  (11+liq*0.1)*P,   1.4*P,0,Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(-2.5*P,(13+liq*0.1)*P,   0.8*P,0,Math.PI*2); ctx.fill();
        }
        // Стеклянный блик
        ctx.fillStyle='rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.arc(-2*P, 10.5*P, 2*P,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.15)';
        ctx.beginPath(); ctx.arc(-1.5*P, 11*P, P,0,Math.PI*2); ctx.fill();
        // Горлышко колбы
        dp(-1, 8, Bm, 2, 3);
        dp(-1, 8, Bt, P, 3);
        dp(-1, 7, Bl, 2, P);   // крышка

        // ═══ ОБЩЕЕ ЗЕЛЁНОЕ СВЕЧЕНИЕ ══════════════════════════
        ctx.save(); ctx.shadowColor='#00ff44'; ctx.shadowBlur=26+ph*12;
        ctx.fillStyle='rgba(0,130,40,0.01)'; ctx.fillRect(-16*P,-40*P,32*P,60*P);
        ctx.restore();

        // Магические частицы
        const tn = Math.sin(t*0.18)*4;
        ctx.save(); ctx.shadowColor='#00cc44'; ctx.shadowBlur=5;
        ctx.fillStyle=`rgba(0,${(190+ph*65)|0},40,${0.45+ph3*0.3})`;
        ctx.fillRect(-13*P,(3+(tn|0))*P, 2*P,P);
        ctx.fillRect( 11*P,(2+((tn*.8)|0))*P, 2*P,P);
        ctx.fillRect(-14*P,(-3+((tn*1.2)|0))*P, P,P);
        ctx.fillRect( 12*P,(-4+((tn*.7)|0))*P, P,P);
        ctx.restore();

        ctx.restore();
        return; // done drawing alchemist
    }

    if (boss.id === 'fireGolem') {
        // ═══════════════════════════════════════════════
        // ОГНЕННЫЙ ГОЛЕМ — большой детализированный голем
        // ═══════════════════════════════════════════════
        const ph  = (Math.sin(t*0.12)+1)/2;
        const ph2 = (Math.sin(t*0.17)+1)/2;
        const flicker = (Math.sin(t*0.35)*0.5+0.5);
        // Цветовая палитра камня
        const St = '#1a1a2e', Sm = '#2e2e4a', Sl = '#444466', Sh = '#606080', Sx = '#8080a8';
        // Цвета лавы — анимированные
        const lv0 = `rgb(255,${(60+ph*100)|0},0)`;
        const lv1 = `rgb(255,${(130+ph*90)|0},${(ph*30)|0})`;
        const lv2 = `rgb(255,${(200+ph*55)|0},${(ph2*60)|0})`;
        const glow = `rgba(255,${(80+ph*100)|0},0,0.35)`;

        // Тень на земле
        ctx.fillStyle='rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.ellipse(0,18*P,13*P,4*P,0,0,Math.PI*2); ctx.fill();

        // ═══ НОГИ ════════════════════════════════════
        // Левая нога
        dp(-10,10,Sm,7,8);  dp(-11,10,St,1,8);  dp(-4,10,St,1,8);
        dp(-9,11,Sl,2,1);   dp(-9,15,Sl,1,1);
        // Левая ступня
        dp(-11,17,Sm,9,3);  dp(-12,18,St,1,2);  dp(-10,19,Sl,7,1);
        ctx.save(); ctx.shadowColor=lv0; ctx.shadowBlur=6;
        ctx.fillStyle=lv1; ctx.fillRect(-8*P,12*P,2*P,P); ctx.fillRect(-7*P,15*P,P,2*P);
        ctx.restore();
        // Правая нога
        dp(3,10,Sm,7,8);   dp(2,10,St,1,8);   dp(9,10,St,1,8);
        dp(4,11,Sl,2,1);   dp(5,15,Sl,1,1);
        // Правая ступня
        dp(2,17,Sm,9,3);   dp(10,18,St,1,2);   dp(2,19,Sl,7,1);
        ctx.save(); ctx.shadowColor=lv0; ctx.shadowBlur=6;
        ctx.fillStyle=lv1; ctx.fillRect(5*P,12*P,2*P,P); ctx.fillRect(4*P,15*P,P,2*P);
        ctx.restore();

        // ═══ ТОРС ════════════════════════════════════
        dp(-9,0,Sm,18,11);
        dp(-10,0,St,1,11); dp(9,0,St,1,11); dp(-9,10,St,18,1);
        dp(-8,0,Sl,5,1); dp(-1,0,Sl,4,1); dp(5,0,Sl,2,1); // блики верхние
        dp(-8,1,Sh,2,1); dp(2,2,Sh,1,1); // отражения
        // Лавовые трещины торса — сетка
        ctx.save(); ctx.shadowColor=lv0; ctx.shadowBlur=10;
        ctx.fillStyle=lv0;
        // Вертикальные трещины
        ctx.fillRect(-2*P,0,P,10*P); ctx.fillRect(4*P,1*P,P,8*P);
        ctx.fillRect(-6*P,2*P,P,6*P);
        // Горизонтальные трещины
        ctx.fillRect(-8*P,4*P,7*P,P); ctx.fillRect(1*P,6*P,7*P,P);
        ctx.fillRect(-5*P,8*P,4*P,P); ctx.fillRect(2*P,3*P,5*P,P);
        ctx.fillStyle=lv2;
        ctx.fillRect(-2*P,0,P,P); ctx.fillRect(4*P,1*P,P,P);
        ctx.fillRect(-8*P,4*P,2*P,P); ctx.fillRect(1*P,6*P,2*P,P);
        ctx.restore();
        // Сердце — центральный лавовый кристалл
        ctx.save(); ctx.shadowColor='#ffaa00'; ctx.shadowBlur=16+flicker*10;
        ctx.fillStyle=lv2; ctx.fillRect(-1*P,4*P,2*P,2*P);
        ctx.fillStyle=`rgba(255,240,80,${0.7+flicker*0.3})`; ctx.fillRect(-1*P,4*P,2*P,P);
        ctx.restore();

        // ═══ ЛЕВАЯ РУКА ═════════════════════════════
        // Плечо
        dp(-16,-2,Sm,7,6); dp(-17,-2,St,1,6); dp(-10,-2,St,1,6);
        dp(-15,-1,Sl,2,1); dp(-15,2,Sl,1,1);
        // Предплечье
        dp(-15,4,Sm,6,5);  dp(-16,4,St,1,5);  dp(-10,4,St,1,5);
        // Лавовые трещины руки
        ctx.fillStyle=lv0; ctx.fillRect(-14*P,0,P,4*P); ctx.fillRect(-13*P,5*P,P,2*P);
        // КУЛАК
        dp(-16,8,Sm,8,5);  dp(-17,8,St,1,5);  dp(-9,8,St,1,5);
        dp(-16,12,St,8,1); dp(-15,9,Sl,3,1);
        ctx.save(); ctx.shadowColor=lv0; ctx.shadowBlur=8;
        ctx.fillStyle=lv1; ctx.fillRect(-15*P,9*P,2*P,P); ctx.fillRect(-12*P,10*P,P,P);
        ctx.fillRect(-15*P,11*P,3*P,P);
        ctx.restore();

        // ═══ ПРАВАЯ РУКА ════════════════════════════
        dp(9,-2,Sm,7,6);  dp(8,-2,St,1,6);  dp(15,-2,St,1,6);
        dp(10,-1,Sl,2,1); dp(11,2,Sl,1,1);
        dp(9,4,Sm,6,5);   dp(8,4,St,1,5);   dp(14,4,St,1,5);
        ctx.fillStyle=lv0; ctx.fillRect(13*P,0,P,4*P); ctx.fillRect(11*P,5*P,P,2*P);
        // КУЛАК
        dp(8,8,Sm,8,5);   dp(7,8,St,1,5);   dp(15,8,St,1,5);
        dp(8,12,St,8,1);  dp(9,9,Sl,3,1);
        ctx.save(); ctx.shadowColor=lv0; ctx.shadowBlur=8;
        ctx.fillStyle=lv1; ctx.fillRect(12*P,9*P,2*P,P); ctx.fillRect(11*P,10*P,P,P);
        ctx.fillRect(11*P,11*P,3*P,P);
        ctx.restore();

        // ═══ ШЕЯ ════════════════════════════════════
        dp(-4,-3,Sm,8,4); dp(-5,-3,St,1,4); dp(4,-3,St,1,4);
        dp(-3,-2,Sl,3,1); dp(1,-2,Sl,1,1);
        ctx.fillStyle=lv0; ctx.fillRect(0,-3*P,P,3*P);

        // ═══ ГОЛОВА ══════════════════════════════════
        dp(-9,-18,Sm,18,16); // основной блок
        dp(-10,-18,St,1,16); dp(9,-18,St,1,16); // боковые тени
        dp(-9,-18,St,18,1);  // тень сверху
        dp(-7,-17,Sl,5,1); dp(0,-17,Sl,4,1); dp(6,-17,Sl,2,1); // блики верх
        dp(-7,-16,Sh,2,1); dp(3,-16,Sh,1,1); // отражения
        dp(-9,-3,St,18,1);  // подбородок
        // Надбровная кость
        dp(-8,-10,St,16,2);
        dp(-8,-9,Sm,2,1);  dp(4,-9,Sm,2,1); // мышцы бровей
        // Нос — каменные плиты
        dp(-2,-8,Sl,4,3); dp(-1,-7,Sh,2,1);
        dp(-3,-8,St,1,3); dp(2,-8,St,1,3);
        // Глаза — большие пылающие
        ctx.save(); ctx.shadowColor='#ff6600'; ctx.shadowBlur=20+flicker*12;
        ctx.fillStyle=lv0; ctx.fillRect(-7*P,-16*P,4*P,3*P); ctx.fillRect(3*P,-16*P,4*P,3*P);
        ctx.fillStyle=lv1; ctx.fillRect(-6*P,-15*P,2*P,2*P); ctx.fillRect(4*P,-15*P,2*P,2*P);
        ctx.fillStyle=lv2; ctx.fillRect(-6*P,-15*P,P,P); ctx.fillRect(4*P,-15*P,P,P);
        ctx.fillStyle=`rgba(255,255,200,${flicker})`; ctx.fillRect(-6*P,-15*P,P,P); ctx.fillRect(4*P,-15*P,P,P);
        ctx.restore();
        // Рот — оскаленные зубы
        dp(-6,-6,St,12,3);
        ctx.fillStyle='#080818';
        for(let i=0;i<5;i++) ctx.fillRect((-5+i*2)*P,-6*P,P,2*P);
        ctx.fillStyle=Sh;
        for(let i=0;i<4;i++) ctx.fillRect((-4+i*2)*P,-6*P,P,2*P); // зубы
        ctx.save(); ctx.shadowColor='#ff2200'; ctx.shadowBlur=5;
        ctx.fillStyle=lv0;
        ctx.fillRect(-3*P,-5*P,P,P); ctx.fillRect(-1*P,-4*P,P,P); ctx.fillRect(1*P,-5*P,P,P); ctx.fillRect(3*P,-4*P,P,P);
        ctx.restore();
        // Лавовые трещины головы
        ctx.save(); ctx.shadowColor='#ff3300'; ctx.shadowBlur=9;
        ctx.fillStyle=lv0;
        ctx.fillRect(0,-18*P,P,4*P); // лоб
        ctx.fillRect(-9*P,-14*P,4*P,P); ctx.fillRect(5*P,-12*P,4*P,P); // бока
        ctx.fillRect(-1*P,-12*P,P,3*P); // между бровями
        ctx.fillRect(-4*P,-7*P,2*P,P); ctx.fillRect(2*P,-7*P,2*P,P); // щёки
        ctx.fillStyle=lv2;
        ctx.fillRect(0,-18*P,P,P); ctx.fillRect(-9*P,-14*P,2*P,P);
        ctx.restore();
        // Рога — каменные
        dp(-8,-22,Sl,3,1); dp(-9,-21,Sm,2,1); dp(-10,-20,Sm,2,1); dp(-11,-19,St,2,2);
        dp( 5,-22,Sl,3,1); dp( 6,-21,Sm,2,1); dp( 7,-20,Sm,2,1); dp( 8,-19,St,2,2);
        ctx.fillStyle=lv1; ctx.fillRect(-8*P,-22*P,P,P); ctx.fillRect(6*P,-22*P,P,P);

        // Глобальное лавовое свечение
        ctx.save(); ctx.shadowColor='#ff3300'; ctx.shadowBlur=30+flicker*15;
        ctx.fillStyle=`rgba(255,60,0,${0.01+flicker*0.01})`; ctx.fillRect(-20*P,-24*P,40*P,44*P);
        ctx.restore();

    } else if (boss.id === 'iceDragon') {
        // ═══════════════════════════════════════════════
        // ЛЕДЯНОЙ ДРАКОН — большой дракон с огромными крыльями
        // ═══════════════════════════════════════════════
        const ph  = (Math.sin(t*0.08)+1)/2;
        const ph2 = (Math.sin(t*0.13)+1)/2;
        // Палитра
        const Bd  = '#040e20'; // очень тёмный
        const Dm  = '#0a2040'; // тёмно-синий
        const Bm  = '#164080'; // средний синий
        const Mb  = '#2060b0'; // основной синий
        const Lb  = '#3a90d8'; // светло-синий
        const Lc  = '#6ab8f0'; // голубой
        const W   = '#b0dcff'; // белый-голубой
        const Ww  = '#e8f4ff'; // почти белый
        const ey  = `rgb(${(180+ph*70)|0},${(235+ph*20)|0},255)`;
        // Цвет крыла — полупрозрачный
        const wc  = `rgba(40,100,200,0.55)`;
        const wl  = `rgba(100,180,255,0.35)`;
        const wv  = `rgba(180,230,255,0.45)`;

        // Тень на земле
        ctx.fillStyle='rgba(0,10,40,0.5)';
        ctx.beginPath(); ctx.ellipse(0,20*P,16*P,4*P,0,0,Math.PI*2); ctx.fill();

        // ═══ КРЫЛЬЯ (рисуем ДО тела — позади) ══════
        const wf = Math.sin(t*0.07) * 2; // мах крыльев
        const wi = wf|0;

        // ─── ЛЕВОЕ КРЫЛО (расширенное) ────────────────
        // Основание крыла (у тела)
        dp(-9,-4+wi,Bm,4,5); dp(-10,-4+wi,Dm,1,5);
        // Главная кость (humerus) — длиннее
        dp(-13,-7+wi,Mb,4,3); dp(-14,-7+wi,Dm,1,3);
        dp(-17,-10+wi,Bm,4,2); dp(-18,-10+wi,Dm,1,2);
        dp(-21,-13+wi,Mb,4,2); dp(-22,-13+wi,Dm,1,2);
        dp(-25,-15+wi,Bm,3,2); dp(-26,-15+wi,Dm,1,2);
        dp(-28,-16+wi,Dm,2,1); dp(-29,-16+wi,Bd,1,1);
        // Нижняя лопасть крыла (finger)
        dp(-20,-3+wi,Mb,3,2); dp(-22,-5+wi,Bm,3,2); dp(-24,-6+wi,Dm,2,1);
        // Мембрана крыла — слои
        ctx.save();
        ctx.shadowColor='#00aaff'; ctx.shadowBlur=16;
        // Внешняя кромка крыла (расширенная)
        ctx.fillStyle=wv;
        ctx.fillRect(-29*P,(-16+wi)*P,2*P,P);
        ctx.fillRect(-30*P,(-14+wi)*P,2*P,2*P);
        ctx.fillRect(-29*P,(-12+wi)*P,2*P,2*P);
        ctx.fillRect(-27*P,(-10+wi)*P,2*P,2*P);
        ctx.fillRect(-25*P,(-8+wi)*P,2*P,2*P);
        ctx.fillRect(-23*P,(-6+wi)*P,2*P,2*P);
        ctx.fillRect(-21*P,(-4+wi)*P,2*P,2*P);
        ctx.fillRect(-19*P,(-2+wi)*P,2*P,2*P);
        // Нижние пальцы крыла (когти)
        ctx.fillStyle=Ww;
        ctx.fillRect(-25*P,(-6+wi)*P,P,3*P);
        ctx.fillRect(-22*P,(-4+wi)*P,P,3*P);
        ctx.fillRect(-19*P,(-2+wi)*P,P,3*P);
        ctx.fillRect(-26*P,(-7+wi)*P,P,P);
        // Средний слой мембраны
        ctx.fillStyle=wc;
        for(let wr=0; wr<8; wr++) {
            const rowX = -28+wr*1.5|0; const rowY = -15+wr*1+wi;
            ctx.fillRect(rowX*P,rowY*P,(10-wr)*P,2*P);
        }
        // Нижняя мембрана (лопасть)
        ctx.fillStyle=`rgba(30,80,180,0.40)`;
        for(let wr=0; wr<4; wr++) {
            ctx.fillRect((-23+wr)*P,(-4+wr+wi)*P,(7-wr)*P,2*P);
        }
        // Прожилки на крыле
        ctx.fillStyle=wl;
        ctx.fillRect(-27*P,(-14+wi)*P,P,7*P);
        ctx.fillRect(-23*P,(-11+wi)*P,P,7*P);
        ctx.fillRect(-19*P,(-8+wi)*P,P,6*P);
        ctx.fillRect(-15*P,(-6+wi)*P,P,5*P);
        // Белые блики
        ctx.fillStyle=`rgba(220,245,255,0.55)`;
        ctx.fillRect(-27*P,(-15+wi)*P,4*P,P);
        ctx.fillRect(-23*P,(-12+wi)*P,3*P,P);
        ctx.fillRect(-19*P,(-10+wi)*P,2*P,P);
        ctx.restore();

        // ─── ПРАВОЕ КРЫЛО (расширенное) ───────────────
        dp(5,-4+wi,Bm,4,5); dp(9,-4+wi,Dm,1,5);
        dp(9,-7+wi,Mb,4,3); dp(13,-7+wi,Dm,1,3);
        dp(13,-10+wi,Bm,4,2); dp(17,-10+wi,Dm,1,2);
        dp(17,-13+wi,Mb,4,2); dp(21,-13+wi,Dm,1,2);
        dp(22,-15+wi,Bm,3,2); dp(25,-15+wi,Dm,1,2);
        dp(26,-16+wi,Dm,2,1); dp(28,-16+wi,Bd,1,1);
        // Нижняя лопасть правого крыла
        dp(17,-3+wi,Mb,3,2); dp(19,-5+wi,Bm,3,2); dp(21,-6+wi,Dm,2,1);
        ctx.save();
        ctx.shadowColor='#00aaff'; ctx.shadowBlur=16;
        ctx.fillStyle=wv;
        ctx.fillRect(27*P,(-16+wi)*P,2*P,P);
        ctx.fillRect(28*P,(-14+wi)*P,2*P,2*P);
        ctx.fillRect(27*P,(-12+wi)*P,2*P,2*P);
        ctx.fillRect(25*P,(-10+wi)*P,2*P,2*P);
        ctx.fillRect(23*P,(-8+wi)*P,2*P,2*P);
        ctx.fillRect(21*P,(-6+wi)*P,2*P,2*P);
        ctx.fillRect(19*P,(-4+wi)*P,2*P,2*P);
        ctx.fillRect(17*P,(-2+wi)*P,2*P,2*P);
        // Нижние когти правого крыла
        ctx.fillStyle=Ww;
        ctx.fillRect(24*P,(-6+wi)*P,P,3*P);
        ctx.fillRect(21*P,(-4+wi)*P,P,3*P);
        ctx.fillRect(18*P,(-2+wi)*P,P,3*P);
        ctx.fillRect(25*P,(-7+wi)*P,P,P);
        ctx.fillStyle=wc;
        for(let wr=0; wr<8; wr++) {
            const rowX = 18-wr*1.5|0; const rowY = -15+wr*1+wi;
            ctx.fillRect(rowX*P,rowY*P,(10-wr)*P,2*P);
        }
        ctx.fillStyle=`rgba(30,80,180,0.40)`;
        for(let wr=0; wr<4; wr++) {
            ctx.fillRect((16-wr)*P,(-4+wr+wi)*P,(7-wr)*P,2*P);
        }
        ctx.fillStyle=wl;
        ctx.fillRect(26*P,(-14+wi)*P,P,7*P);
        ctx.fillRect(22*P,(-11+wi)*P,P,7*P);
        ctx.fillRect(18*P,(-8+wi)*P,P,6*P);
        ctx.fillRect(14*P,(-6+wi)*P,P,5*P);
        ctx.fillStyle=`rgba(220,245,255,0.55)`;
        ctx.fillRect(23*P,(-15+wi)*P,4*P,P);
        ctx.fillRect(20*P,(-12+wi)*P,3*P,P);
        ctx.fillRect(17*P,(-10+wi)*P,2*P,P);
        ctx.restore();

        // ═══ ХВОСТ ════════════════════════════════════
        const tw = (Math.sin(t*0.09)*3)|0;
        dp(7,12,Mb,5,4);  dp(7,12,Lb,2,1);
        dp(11,11+tw,Bm,4,4); dp(14,10+(tw|0),Mb,3,3); dp(16,8+((tw*0.8)|0),Lb,3,3);
        dp(18,6+((tw*0.6)|0),Bm,3,2); dp(20,4+((tw*0.4)|0),Lb,2,2);
        dp(21,2+((tw*0.2)|0),W,2,2);
        // Шипы на хвосте
        dp(13,9+tw,Ww,1,2); dp(16,7+((tw*0.8)|0),Ww,1,2); dp(19,5+((tw*0.5)|0),W,1,2);

        // ═══ ТЕЛО ═════════════════════════════════════
        dp(-8,0,Bm,16,14);
        dp(-9,0,Dm,1,14); dp(8,0,Dm,1,14);
        dp(-8,13,Dm,16,1);
        dp(-6,0,Lb,5,1); dp(0,0,Lc,4,1); dp(5,0,Lb,2,1); // блики верх
        dp(-6,1,W,2,1); dp(1,2,W,1,1);
        // Паттерн чешуи
        ctx.fillStyle=Lb;
        for(let sr=0;sr<5;sr++) for(let sc=0;sc<6;sc++)
            ctx.fillRect((-6+sc*2+(sr%2))*P,(1+sr*2)*P,P,P);
        // Светлые блики чешуи
        ctx.fillStyle=Lc;
        for(let sr=0;sr<5;sr++) for(let sc=0;sc<6;sc++)
            ctx.fillRect((-6+sc*2+(sr%2))*P,(1+sr*2)*P,P/2,P/2);
        // Брюхо — светлое
        dp(-4,1,Lc,8,11); dp(-3,2,W,6,9); dp(-2,3,Ww,4,7);

        // ═══ НОГИ ════════════════════════════════════
        dp(-7,11,Bm,5,5); dp(-8,12,Dm,1,4);
        dp( 2,11,Bm,5,5); dp( 7,12,Dm,1,4);
        // Когти
        ctx.fillStyle=Ww;
        ctx.fillRect(-9*P,14*P,P,2*P); ctx.fillRect(-8*P,15*P,P,2*P); ctx.fillRect(-7*P,14*P,P,2*P); ctx.fillRect(-6*P,15*P,P,P);
        ctx.fillRect(4*P,14*P,P,2*P);  ctx.fillRect(5*P,15*P,P,2*P);  ctx.fillRect(6*P,14*P,P,2*P);  ctx.fillRect(7*P,15*P,P,P);
        // Детали голеней
        ctx.fillStyle=Lc; ctx.fillRect(-6*P,12*P,P,P); ctx.fillRect(3*P,13*P,P,P);

        // ═══ ШЕЯ ════════════════════════════════════
        dp(-3,-10,Mb,6,10); dp(-4,-10,Dm,1,10); dp(3,-10,Dm,1,10);
        dp(-2,-9,Lb,2,1); dp(1,-8,Lb,1,1);
        // Пластины на шее
        ctx.fillStyle=Lc;
        for(let i=0;i<4;i++) ctx.fillRect((-1)*P,(-9+i*2)*P,2*P,P);
        ctx.fillStyle=W;
        for(let i=0;i<4;i++) ctx.fillRect(0*P,(-9+i*2)*P,P,P/2);

        // ═══ ГОЛОВА ══════════════════════════════════
        dp(-7,-23,Bm,14,14);
        dp(-8,-23,Dm,1,14); dp(7,-23,Dm,1,14);
        dp(-7,-23,Dm,14,1);
        dp(-5,-22,Lb,5,1); dp(1,-22,Lc,4,1); // блики верх
        dp(-5,-21,W,2,1); dp(2,-20,W,1,1);
        dp(-7,-10,Dm,14,1); // подбородок

        // Рога — большие ветвистые
        dp(-5,-30,Ww,2,1); dp(-5,-29,Lc,2,2); dp(-6,-28,Lb,2,1); dp(-7,-27,Bm,2,2);  // левый рог
        dp( 3,-30,Ww,2,1); dp( 3,-29,Lc,2,2); dp( 4,-28,Lb,2,1); dp( 5,-27,Bm,2,2);  // правый рог
        // Ветки рогов
        dp(-7,-28,Bm,1,1); dp(-8,-27,Lb,1,2);
        dp(6,-28,Bm,1,1);  dp(7,-27,Lb,1,2);

        // Гребень на голове
        ctx.fillStyle=W;
        ctx.fillRect(-4*P,-25*P,P,2*P); ctx.fillRect(-2*P,-26*P,P,2*P);
        ctx.fillRect(0,-27*P,2*P,2*P); ctx.fillRect(2*P,-26*P,P,2*P); ctx.fillRect(4*P,-25*P,P,2*P);
        ctx.fillStyle=Ww;
        ctx.fillRect(-4*P,-25*P,P,P); ctx.fillRect(0,-27*P,2*P,P);

        // Морда
        dp(-4,-16,Lb,8,4); dp(-5,-16,Dm,1,4); dp(4,-16,Dm,1,4);
        dp(-3,-13,Mb,6,4); dp(-4,-13,Dm,1,4); dp(3,-13,Dm,1,4);
        dp(-2,-10,Bm,4,2); dp(-3,-10,Dm,1,2); dp(2,-10,Dm,1,2);
        // Ноздри
        dp(-2,-11,Bd,2,1); dp(0,-11,Bd,2,1);
        // Глаза
        ctx.save(); ctx.shadowColor='#00ffff'; ctx.shadowBlur=18+ph*10;
        ctx.fillStyle=ey; ctx.fillRect(-6*P,-22*P,3*P,3*P); ctx.fillRect(3*P,-22*P,3*P,3*P);
        ctx.fillStyle=`rgba(180,240,255,0.8)`; ctx.fillRect(-6*P,-22*P,2*P,2*P); ctx.fillRect(3*P,-22*P,2*P,2*P);
        ctx.fillStyle=Ww; ctx.fillRect(-6*P,-22*P,P,P); ctx.fillRect(3*P,-22*P,P,P);
        // Зрачки
        ctx.fillStyle='#002244'; ctx.fillRect(-5*P,-22*P,P,2*P); ctx.fillRect(4*P,-22*P,P,2*P);
        ctx.restore();
        // Зубы
        dp(-4,-12,Bd,8,2);
        ctx.fillStyle=Ww;
        for(let i=0;i<4;i++) ctx.fillRect((-3+i*2)*P,-12*P,P,2*P);
        // Чешуя на голове
        ctx.fillStyle=Lc;
        for(let sr=0;sr<3;sr++) for(let sc=0;sc<5;sc++)
            ctx.fillRect((-4+sc*2+(sr%2))*P,(-21+sr*2)*P,P,P);

        // Ледяное свечение
        ctx.save(); ctx.shadowColor='#00aaff'; ctx.shadowBlur=26+ph*12;
        ctx.fillStyle='rgba(0,120,255,0.01)'; ctx.fillRect(-24*P,-32*P,48*P,54*P);
        ctx.restore();

    } else if (boss.id === 'shadowLord') {
        // ═══════════════════════════════════════════════
        // ТЕНЕВОЙ ЛОРДl — тёмный колдун в капюшоне с посохом
        // ═══════════════════════════════════════════════
        const ph  = (Math.sin(t*0.10)+1)/2;
        const ph2 = (Math.sin(t*0.07)+1)/2;
        const ph3 = (Math.sin(t*0.21)+1)/2;
        // Палитра
        const Bk  = '#050008';
        const Dk  = '#0e0018';
        const Dm  = '#180028';
        const Rp  = '#240040';
        const Mp  = '#400070';
        const Lp  = '#6000aa';
        const Gp  = '#9000dd';
        const Ep  = '#cc22ff';
        const eyC = `rgb(${(200+ph*55)|0},${(ph2*80)|0},255)`;
        const rnC = `rgba(180,0,255,${0.55+ph*0.45})`;
        const rnB = `rgba(230,100,255,${0.7+ph2*0.3})`;

        // Тень на земле
        ctx.fillStyle='rgba(5,0,15,0.7)';
        ctx.beginPath(); ctx.ellipse(0,22*P,12*P,3*P,0,0,Math.PI*2); ctx.fill();

        // ═══ ПОСОХ (левая рука, нарисовать сзади) ════
        dp(-14,8,Mp,2,14);    // древко нижняя часть
        dp(-14,-6,Rp,2,14);   // древко верхняя часть
        dp(-15,8,Dk,1,14); dp(-13,8,Dk,1,14); // тени
        dp(-14,-8,Mp,2,3);    // шейка навершия
        dp(-15,-11,Lp,4,5);   // навершие — основа
        dp(-16,-12,Mp,6,7);   // навершие — блок
        dp(-17,-12,Dk,1,7);   dp(-12,-12,Dk,1,7); // тени
        // Кристалл на посохе
        ctx.save(); ctx.shadowColor='#aa00ff'; ctx.shadowBlur=16+ph*10;
        ctx.fillStyle=`rgba(180,0,255,${0.6+ph*0.4})`; ctx.fillRect(-16*P,-14*P,6*P,8*P);
        ctx.fillStyle=`rgba(220,80,255,${0.7+ph2*0.3})`; ctx.fillRect(-15*P,-13*P,4*P,6*P);
        ctx.fillStyle=`rgba(255,180,255,${ph3})`; ctx.fillRect(-14*P,-12*P,2*P,4*P);
        // Лучи кристалла
        ctx.fillStyle=`rgba(200,0,255,${0.4+ph*0.4})`;
        ctx.fillRect(-17*P,-13*P,P,P); ctx.fillRect(-11*P,-13*P,P,P);
        ctx.fillRect(-14*P,-16*P,2*P,P); ctx.fillRect(-14*P,-6*P,2*P,P);
        ctx.restore();
        // Орнамент на посохе
        ctx.fillStyle=Gp;
        ctx.fillRect(-15*P,-3*P,4*P,P); ctx.fillRect(-15*P,2*P,4*P,P);
        ctx.fillRect(-15*P,7*P,4*P,P);

        // ═══ МАНТИЯ (нижняя, широкая) ════════════════
        // Волнистый низ
        dp(-11,15,Dm,22,3);
        ctx.fillStyle=Rp;
        for(let i=-10;i<=10;i+=4) ctx.fillRect(i*P,17*P,3*P,2*P);
        for(let i=-8;i<=8;i+=4)   ctx.fillRect(i*P,18*P,2*P,2*P);
        ctx.fillStyle=Dk;
        for(let i=-10;i<=10;i+=4) ctx.fillRect(i*P,19*P,2*P,P);
        // Основная мантия
        dp(-10,2,Dm,20,14); dp(-11,3,Dk,1,13); dp(10,3,Dk,1,13);
        // Складки мантии
        ctx.fillStyle=Rp;
        ctx.fillRect(-9*P,3*P,2*P,12*P); ctx.fillRect(-5*P,4*P,P,11*P);
        ctx.fillRect(-1*P,3*P,P,12*P);   ctx.fillRect(3*P,4*P,P,11*P);
        ctx.fillRect(7*P,3*P,2*P,12*P);
        ctx.fillStyle=Bk;
        ctx.fillRect(-8*P,4*P,P,11*P); ctx.fillRect(-4*P,5*P,P,10*P);
        ctx.fillRect(0,4*P,P,11*P);    ctx.fillRect(4*P,5*P,P,10*P);
        ctx.fillRect(8*P,4*P,P,11*P);
        // Кант мантии — фиолетовый
        ctx.fillStyle=Mp;
        ctx.fillRect(-10*P,2*P,2*P,13*P); ctx.fillRect(9*P,2*P,2*P,13*P);
        // Руны на мантии
        ctx.save(); ctx.shadowColor='#9900ff'; ctx.shadowBlur=8;
        ctx.fillStyle=rnC;
        // Руна слева
        ctx.fillRect(-7*P,5*P,P,4*P); ctx.fillRect(-7*P,5*P,3*P,P); ctx.fillRect(-7*P,7*P,3*P,P); ctx.fillRect(-7*P,8*P,3*P,P);
        // Руна справа
        ctx.fillRect(4*P,9*P,P,4*P);  ctx.fillRect(4*P,9*P,3*P,P);  ctx.fillRect(5*P,11*P,2*P,P); ctx.fillRect(4*P,12*P,3*P,P);
        // Руна центр
        ctx.fillStyle=rnB;
        ctx.fillRect(-1*P,6*P,3*P,P); ctx.fillRect(0,7*P,P,2*P); ctx.fillRect(-1*P,9*P,3*P,P);
        ctx.restore();

        // ═══ ТОРС/МАНТИЯ ВЕРХ ════════════════════════
        dp(-8,-10,Dm,16,12); dp(-9,-10,Dk,1,12); dp(8,-10,Dk,1,12);
        dp(-8,-10,Dk,16,1);
        // Складки груди
        ctx.fillStyle=Rp;
        ctx.fillRect(-7*P,-9*P,P,11*P); ctx.fillRect(-3*P,-8*P,P,10*P);
        ctx.fillRect(1*P,-9*P,P,11*P);  ctx.fillRect(5*P,-8*P,P,10*P);
        // Застёжка-пряжка
        dp(-2,-5,Mp,4,3); dp(-1,-4,Lp,2,2);
        ctx.save(); ctx.shadowColor='#8800ff'; ctx.shadowBlur=8;
        ctx.fillStyle=`rgba(160,0,255,${0.5+ph*0.5})`; ctx.fillRect(-1*P,-4*P,2*P,2*P);
        ctx.restore();

        // ═══ НАПЛЕЧНИКИ ══════════════════════════════
        dp(-13,-9,Mp,6,5); dp(-14,-9,Dk,1,5); dp(-8,-9,Dk,1,5);
        dp(7,-9,Mp,6,5);   dp(6,-9,Dk,1,5);   dp(13,-9,Dk,1,5);
        // Шипы наплечников
        dp(-11,-13,Lp,2,1); dp(-12,-12,Mp,2,2); dp(-13,-11,Rp,1,1);
        dp(-9,-13,Lp,2,1);  dp(-10,-12,Mp,2,1);
        dp(8,-13,Lp,2,1);   dp(9,-12,Mp,2,2);   dp(12,-11,Rp,1,1);
        dp(9,-13,Lp,2,1);   dp(10,-12,Mp,2,1);

        // ═══ ПРАВАЯ РУКА (без посоха) ════════════════
        dp(8,-8,Rp,5,6);  dp(7,-8,Dk,1,6); dp(12,-8,Dk,1,6);
        dp(8,-3,Mp,5,4);  dp(7,-3,Dk,1,4);
        // Перчатка
        dp(7,0,Dm,6,5);   dp(6,0,Dk,1,5); dp(12,0,Dk,1,5);
        dp(7,4,Dk,6,1);
        ctx.fillStyle=Lp; ctx.fillRect(8*P,0,2*P,2*P); // блик перчатки
        // Тёмный шлейф от руки
        ctx.save(); ctx.shadowColor='#6600cc'; ctx.shadowBlur=7;
        ctx.fillStyle=`rgba(80,0,180,${0.35+ph*0.3})`;
        ctx.fillRect(12*P,-5*P,3*P,8*P); ctx.fillRect(13*P,-4*P,3*P,6*P);
        ctx.restore();

        // ═══ ЛЕВАЯ РУКА (держит посох) ═══════════════
        dp(-12,-8,Rp,5,6); dp(-13,-8,Dk,1,6); dp(-8,-8,Dk,1,6);
        dp(-12,-3,Mp,5,4); dp(-13,-3,Dk,1,4);
        dp(-13,0,Dm,6,4);  dp(-14,0,Dk,1,4); dp(-8,0,Dk,1,4);
        dp(-13,3,Dk,6,1);

        // ═══ ШЕЯ ════════════════════════════════════
        dp(-3,-14,Dm,6,5); dp(-4,-14,Dk,1,5); dp(3,-14,Dk,1,5);
        dp(-2,-13,Rp,2,1); dp(1,-12,Rp,1,1); // складки

        // ═══ ГОЛОВА ══════════════════════════════════
        dp(-6,-25,Dm,12,12); dp(-7,-25,Dk,1,12); dp(6,-25,Dk,1,12);
        dp(-6,-25,Dk,12,1);
        // Блики головы (ткань капюшона)
        dp(-4,-24,Rp,4,1); dp(0,-23,Rp,3,1);
        dp(-3,-22,Mp,2,1); dp(1,-21,Mp,1,1);
        // Нижняя часть капюшона — тень лица
        dp(-5,-16,Bk,10,4); // тёмное лицо
        dp(-4,-15,Dk,8,3);  // немного светлее

        // ═══ ОСТРЫЙ КАПЮШОН-ШПИЛЬ ═══════════════════
        dp(-3,-34,Bk,1,1); dp(-3,-33,Dk,2,1); dp(-3,-32,Dm,3,1);
        dp(-3,-31,Dm,3,2); dp(-4,-30,Rp,4,1); dp(-4,-29,Rp,5,2);
        dp(-5,-28,Dm,6,1); dp(-5,-27,Dm,6,2);
        dp(-6,-26,Dm,12,1); // соединение с головой
        // Хребет капюшона
        ctx.fillStyle=Lp;
        ctx.fillRect(-2*P,-34*P,P,P); ctx.fillRect(-2*P,-32*P,2*P,P);
        ctx.fillRect(-2*P,-30*P,2*P,P); ctx.fillRect(-3*P,-28*P,2*P,P);

        // ═══ ГЛАЗА — единственное видимое из тени ════
        ctx.save(); ctx.shadowColor='#cc00ff'; ctx.shadowBlur=22+ph*14;
        ctx.fillStyle=eyC;
        ctx.fillRect(-4*P,-17*P,3*P,3*P); ctx.fillRect(1*P,-17*P,3*P,3*P);
        ctx.fillStyle=`rgba(255,150,255,${0.7+ph*0.3})`;
        ctx.fillRect(-3*P,-17*P,2*P,2*P); ctx.fillRect(2*P,-17*P,2*P,2*P);
        ctx.fillStyle=`rgba(255,230,255,${ph3})`;
        ctx.fillRect(-3*P,-17*P,P,P); ctx.fillRect(2*P,-17*P,P,P);
        ctx.restore();

        // ═══ ТЁМНАЯ АУРА — частицы вокруг ═══════════
        ctx.save(); ctx.shadowColor='#7700cc'; ctx.shadowBlur=4;
        const tn = Math.sin(t*0.15)*3;
        ctx.fillStyle=`rgba(100,0,200,${0.35+ph3*0.25})`;
        ctx.fillRect(-15*P,(5+(tn|0))*P,3*P,P);
        ctx.fillRect(12*P,(4+((tn*0.8)|0))*P,3*P,P);
        ctx.fillRect(-16*P,(-1+((tn*1.3)|0))*P,2*P,P);
        ctx.fillRect(14*P,(-2+((tn*0.7)|0))*P,2*P,P);
        ctx.fillStyle=`rgba(60,0,120,${ph2*0.4})`;
        ctx.fillRect(-15*P,(9+(tn|0))*P,2*P,P);
        ctx.fillRect(13*P,(10+((tn*0.9)|0))*P,2*P,P);
        ctx.restore();

        // Тёмно-фиолетовое глобальное свечение
        ctx.save(); ctx.shadowColor='#7700cc'; ctx.shadowBlur=32+ph*14;
        ctx.fillStyle='rgba(80,0,180,0.01)'; ctx.fillRect(-20*P,-36*P,40*P,58*P);
        ctx.restore();
    }

    ctx.shadowBlur = 0;

    ctx.restore();
}

// ============================================
// ALCHEMIST ATTACKS — 3-phase custom attack logic
// ============================================
function updateAlchemistAttacks(timeScale, deltaTime) {
    const dt = deltaTime / 1000;
    const elapsed = currentBoss.duration - bossBattleTime; // 0→30s

    // ─── Determine phase ───────────────────────
    let phase = 1;
    if (elapsed >= 10 && elapsed < 20) phase = 2;
    if (elapsed >= 20) phase = 3;

    if (phase !== alchemistLastPhase) {
        alchemistLastPhase = phase;
        alchemistAttackTimer2 = 99; // trigger first attack of new phase immediately
        if (phase === 3) {
            // Start laser charging from direction toward nearest player
            const tgt = (bossPlayerCat && bossPlayerCat.alive) ? bossPlayerCat : bossPlayerCat2;
            if (tgt) {
                alchemistLaserAngle = Math.atan2(
                    tgt.y + tgt.height / 2 - bossEntity.y,
                    tgt.x + tgt.width  / 2 - bossEntity.x
                );
            }
            alchemistLaserCharged = false;
            alchemistLaserChargeTimer = 0;
            alchemistLaser2Active = false;
            bossProjectiles.length = 0; // clear phase 2 shards
        }
        const hintEl = document.getElementById('dodge-hint');
        if (hintEl) {
            const hints = { 2: '⚗️ КИСЛОТНЫЕ БОМБЫ!', 3: '💥 РАСЩЕПЛЕНИЕ СНАРЯДОВ!' };
            const colors = { 2: '#00ff44',             3: '#88ffaa' };
            const hint = hints[phase];
            if (hint) {
                hintEl.style.display = 'block';
                hintEl.innerText = hint;
                hintEl.style.color = colors[phase];
                clearTimeout(bossHintTimer);
                bossHintTimer = setTimeout(() => { hintEl.style.display = 'none'; }, 2500);
            }
        }
    }

    // ─── Update warning timers ──────────────────
    for (let i = alchemistWarnings.length - 1; i >= 0; i--) {
        const w = alchemistWarnings[i];
        w.timer += dt;
        if (!w.bombSpawned && w.timer >= 1.5) {
            w.bombSpawned = true;
            const dx = w.x - bossEntity.x, dy = w.y - bossEntity.y;
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;
            const spd = 20;
            bossProjectiles.push({
                x: bossEntity.x, y: bossEntity.y,
                vx: (dx/dist)*spd, vy: (dy/dist)*spd,
                size: 15, type: 'alchemist',
                _bomb: true, _tx: w.x, _ty: w.y
            });
        }
        if (w.timer >= 2.2) alchemistWarnings.splice(i, 1);
    }

    // ─── Update acid pool timers ────────────────
    for (let i = alchemistAcid.length - 1; i >= 0; i--) {
        alchemistAcid[i].timer -= dt;
        if (alchemistAcid[i].timer <= 0) alchemistAcid.splice(i, 1);
    }

    alchemistAttackTimer2 += dt;

    // ─── Phase 1 (0–10s): ground-targeted acid bombs ───
    if (phase === 1) {
        if (alchemistAttackTimer2 >= 1.0) {
            alchemistAttackTimer2 = 0;
            const aliveCats = [bossPlayerCat, bossPlayerCat2].filter(c => c && c.alive);
            aliveCats.forEach(cat => {
                alchemistWarnings.push({
                    x: cat.x + cat.width / 2,
                    y: cat.y + cat.height / 2,
                    timer: 0, bombSpawned: false
                });
            });
            // Solo mode: add a second flask near the first, slightly overlapping
            if (aliveCats.length === 1) {
                const cat = aliveCats[0];
                alchemistWarnings.push({
                    x: cat.x + cat.width / 2 + 55,
                    y: cat.y + cat.height / 2,
                    timer: 0, bombSpawned: false
                });
            }
        }
    }
    // ─── Phase 2 (10–20s): split projectiles ───
    else if (phase === 2) {
        if (alchemistAttackTimer2 >= 0.83) {
            alchemistAttackTimer2 = 0;
            const aliveCats = [bossPlayerCat, bossPlayerCat2].filter(c => c && c.alive);
            aliveCats.forEach(cat => {
                const dx = cat.x + cat.width/2 - bossEntity.x;
                const dy = cat.y + cat.height/2 - bossEntity.y;
                const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                const spd = currentBoss.projectileSpeed;
                bossProjectiles.push({
                    x: bossEntity.x, y: bossEntity.y,
                    vx: (dx/dist)*spd, vy: (dy/dist)*spd,
                    size: 15, type: 'alchemist',
                    _splitter: true,
                    _tx: cat.x + cat.width/2,
                    _ty: cat.y + cat.height/2
                });
            });
            // Solo mode: add a second projectile slightly offset from first
            if (aliveCats.length === 1) {
                const cat = aliveCats[0];
                const dx = cat.x + cat.width/2 - bossEntity.x;
                const dy = cat.y + cat.height/2 - bossEntity.y;
                const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                const spd = currentBoss.projectileSpeed;
                // Slight perpendicular offset so they don't fully overlap
                const perpX = -dy / dist, perpY = dx / dist;
                const off = 55;
                bossProjectiles.push({
                    x: bossEntity.x, y: bossEntity.y,
                    vx: (dx/dist)*spd, vy: (dy/dist)*spd,
                    size: 15, type: 'alchemist',
                    _splitter: true,
                    _tx: cat.x + cat.width/2 + perpX * off,
                    _ty: cat.y + cat.height/2 + perpY * off
                });
            }
        }
    }
    // ─── Phase 3 (20–30s): spinning laser ──────
    else if (phase === 3) {
        if (!alchemistLaserCharged) {
            alchemistLaserChargeTimer += dt;
            if (alchemistLaserChargeTimer >= 1.5) {
                alchemistLaserCharged = true;
                const hintEl = document.getElementById('dodge-hint');
                if (hintEl) {
                    hintEl.style.display = 'block';
                    hintEl.innerText = t('bossHintLaser');
                    hintEl.style.color = '#aaffcc';
                    clearTimeout(bossHintTimer);
                    bossHintTimer = setTimeout(() => { hintEl.style.display = 'none'; }, 2200);
                }
            }
        } else {
            // Rotate clockwise: ~72°/sec = 1.256 rad/sec
            alchemistLaserAngle += 1.256 * dt;
            // 4-direction cross in last 5s
            if (bossBattleTime <= 5 && !alchemistLaser2Active) {
                alchemistLaser2Active = true;
                const hintEl = document.getElementById('dodge-hint');
                if (hintEl) {
                    hintEl.style.display = 'block';
                    hintEl.innerText = t('bossHintLaserCross');
                    hintEl.style.color = '#ff2222';
                    clearTimeout(bossHintTimer);
                    bossHintTimer = setTimeout(() => { hintEl.style.display = 'none'; }, 2500);
                }
            }
        }
    }
}

// ============================================
// ALCHEMIST COLLISION CHECK — acid pools + laser
// ============================================
function checkAlchemistCollisions() {
    const tryKill = (cat) => {
        if (!cat || !cat.alive || cat.invulnerable > 0) return;
        cat.alive = false;
        cat.invulnerable = 999;
        AudioEngine.sfx.bossHit();
        const p2dead = !bossPlayerCat2 || !bossPlayerCat2.alive;
        const p1dead  = !bossPlayerCat  || !bossPlayerCat.alive;
        if (p1dead && p2dead) bossLose();
    };

    const checkCat = (cat) => {
        if (!cat || !cat.alive || cat.invulnerable > 0) return;
        const cx = cat.x + cat.width  / 2;
        const cy = cat.y + cat.height / 2;

        // ── Acid pools ──
        for (const acid of alchemistAcid) {
            const dx = cx - acid.x, dy = cy - acid.y;
            if (Math.sqrt(dx*dx + dy*dy) < acid.radius - 4) { tryKill(cat); return; }
        }

        // ── Laser beams ──
        if (!alchemistLaserCharged) return;
        const bx = bossEntity.x, by = bossEntity.y;
        const catR = 12; // collision radius of cat for laser (generous hitbox)

        const laserHit = (angle) => {
            const cos = Math.cos(angle), sin = Math.sin(angle);
            const relX = cx - bx, relY = cy - by;
            const para = relX * cos + relY * sin;   // along beam
            const perp = Math.abs(relX * sin - relY * cos); // perpendicular
            return para > 20 && perp < 14 + catR;
        };

        if (laserHit(alchemistLaserAngle)) { tryKill(cat); return; }
        if (laserHit(alchemistLaserAngle + Math.PI)) { tryKill(cat); return; }
        if (alchemistLaser2Active && laserHit(alchemistLaserAngle + Math.PI/2)) { tryKill(cat); return; }
        if (alchemistLaser2Active && laserHit(alchemistLaserAngle + Math.PI*1.5)) { tryKill(cat); return; }
    };

    checkCat(bossPlayerCat);
    checkCat(bossPlayerCat2);
}

// ============================================
// ALCHEMIST SPECIALS DRAW — warnings, acid pools, laser
// ============================================
function drawAlchemistSpecials(ctx, cw, ch) {

    // ─── Warning circles (phase 1) ─────────────────────────────
    alchemistWarnings.forEach(w => {
        if (w.bombSpawned) return; // hide circle once bomb is launched
        const progress = Math.min(w.timer / 1.5, 1);
        const radius   = 132 - progress * 30; // 3× base, shrinks as bomb approaches
        const pulse    = 0.5 + Math.sin(gameTime * 0.4) * 0.35;
        // Filled danger zone
        ctx.fillStyle = `rgba(0,220,40,${0.08 + progress * 0.1})`;
        ctx.beginPath(); ctx.arc(w.x, w.y, radius, 0, Math.PI*2); ctx.fill();
        // Outer ring
        ctx.strokeStyle = `rgba(0,255,60,${0.5 + pulse * 0.4})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(w.x, w.y, radius, 0, Math.PI*2); ctx.stroke();
        // Inner dashed ring
        ctx.setLineDash([7, 7]);
        ctx.strokeStyle = `rgba(0,200,40,${0.4 + pulse * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(w.x, w.y, radius * 0.55, 0, Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
        // Crosshair
        ctx.strokeStyle = `rgba(0,255,80,${0.35 + pulse * 0.25})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(w.x - radius*0.45, w.y); ctx.lineTo(w.x + radius*0.45, w.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(w.x, w.y - radius*0.45); ctx.lineTo(w.x, w.y + radius*0.45); ctx.stroke();
    });

    // ─── Lingering acid pools ───────────────────────────────────
    alchemistAcid.forEach(acid => {
        const fade = acid.timer / acid.maxTimer;
        const r    = acid.radius;
        // Outer glow
        ctx.fillStyle = `rgba(0,200,30,${fade * 0.22})`;
        ctx.beginPath(); ctx.arc(acid.x, acid.y, r * 1.4, 0, Math.PI*2); ctx.fill();
        // Main pool
        ctx.fillStyle = `rgba(0,180,30,${fade * 0.72})`;
        ctx.beginPath(); ctx.arc(acid.x, acid.y, r, 0, Math.PI*2); ctx.fill();
        // Lighter inner pool
        ctx.fillStyle = `rgba(60,240,80,${fade * 0.55})`;
        ctx.beginPath(); ctx.arc(acid.x, acid.y, r * 0.65, 0, Math.PI*2); ctx.fill();
        // Bubbles
        for (let b = 0; b < 5; b++) {
            const ba  = (b / 5) * Math.PI*2 + gameTime * 0.08 + b;
            const br  = r * 0.45 + Math.sin(gameTime * 0.2 + b * 1.7) * r * 0.18;
            const bsz = 3 + (b % 3);
            ctx.fillStyle = `rgba(140,255,100,${fade * 0.85})`;
            ctx.beginPath(); ctx.arc(acid.x + Math.cos(ba)*br, acid.y + Math.sin(ba)*br, bsz, 0, Math.PI*2); ctx.fill();
        }
        // Outline
        ctx.strokeStyle = `rgba(0,255,80,${fade * 0.75})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(acid.x, acid.y, r, 0, Math.PI*2); ctx.stroke();
    });

    // ─── Laser beam (phase 3, 20–30s) ──────────────────────────
    const elapsed = currentBoss.duration - bossBattleTime;
    if (elapsed < 20) return;

    const bx = bossEntity.x, by = bossEntity.y;

    if (!alchemistLaserCharged) {
        // Charging: convergent particle lines and swelling orb
        const cp = alchemistLaserChargeTimer / 1.5;
        for (let i = 0; i < 14; i++) {
            const a = (i / 14) * Math.PI*2;
            const dist = 180 * (1 - cp) + 10;
            ctx.strokeStyle = `rgba(80,255,160,${cp * 0.7})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(bx + Math.cos(a) * dist, by + Math.sin(a) * dist);
            ctx.lineTo(bx + Math.cos(a) * 8, by + Math.sin(a) * 8);
            ctx.stroke();
        }
        const orbR = 8 + cp * 20 + Math.sin(gameTime * 0.5) * 4;
        ctx.fillStyle = `rgba(80,255,160,${cp * 0.65})`;
        ctx.beginPath(); ctx.arc(bx, by, orbR, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = `rgba(200,255,220,${cp * 0.9})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(bx, by, orbR * 0.6, 0, Math.PI*2); ctx.stroke();
        return;
    }

    // Draw active laser beam(s)
    const drawBeam = (angle) => {
        const len = 1600;
        const ex  = bx + Math.cos(angle) * len;
        const ey  = by + Math.sin(angle) * len;
        // Wide outer glow
        ctx.strokeStyle = 'rgba(0,200,60,0.18)';
        ctx.lineWidth = 52; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
        // Mid glow
        ctx.strokeStyle = 'rgba(0,255,80,0.38)';
        ctx.lineWidth = 28;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
        // Bright core
        ctx.strokeStyle = 'rgba(140,255,150,0.9)';
        ctx.lineWidth = 10;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
        // White hot center
        ctx.strokeStyle = 'rgba(240,255,240,0.95)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.lineCap = 'butt';
    };

    // Always 2 opposite beams; last 5s = 4-way cross
    drawBeam(alchemistLaserAngle);
    drawBeam(alchemistLaserAngle + Math.PI);
    if (alchemistLaser2Active) {
        drawBeam(alchemistLaserAngle + Math.PI/2);
        drawBeam(alchemistLaserAngle + Math.PI*1.5);
    }

    // Laser source orb
    ctx.fillStyle = 'rgba(180,255,180,0.85)';
    ctx.beginPath(); ctx.arc(bx, by, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI*2); ctx.fill();
}

// ============================================
// DRAW PIXEL CAT TOP-DOWN - Cat viewed from above
// ============================================
function drawPixelCatTopDown(ctx, x, y, skin, facingRight) {
    const s = 3;
    ctx.save();
    ctx.translate(x + 15, y + 15);
    if (!facingRight) ctx.scale(-1, 1);
    
    // Shadow on ground
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(0, 4*s, 5*s, 2*s, 0, 0, Math.PI*2); ctx.fill();
    
    // Body (oval from top)
    ctx.fillStyle = skin.body;
    ctx.beginPath(); ctx.ellipse(0, 0, 5*s, 4*s, 0, 0, Math.PI*2); ctx.fill();
    
    // Head (slightly above)
    ctx.fillStyle = skin.body;
    ctx.beginPath(); ctx.ellipse(0, -3.5*s, 3.5*s, 3*s, 0, 0, Math.PI*2); ctx.fill();
    
    // Ears
    ctx.fillStyle = skin.body;
    ctx.fillRect(-3*s, -7*s, 2*s, 2*s);
    ctx.fillRect( 1*s, -7*s, 2*s, 2*s);
    
    // Eyes
    ctx.fillStyle = skin.eye;
    ctx.fillRect(-2*s, -4.5*s, 1.5*s, 1.5*s);
    ctx.fillRect( 1*s, -4.5*s, 1.5*s, 1.5*s);
    
    // Nose
    ctx.fillStyle = skin.nose;
    ctx.fillRect(-0.5*s, -3*s, 1*s, 0.5*s);
    
    // Tail (wagging)
    const wag = Math.sin(gameTime * 0.2) * 2*s;
    ctx.fillStyle = skin.body;
    ctx.fillRect(3*s, 1*s, 2*s, 2*s);
    ctx.fillRect(5*s, wag, 2*s, 2*s);
    ctx.fillRect(7*s, wag * 0.5, 1.5*s, 1.5*s);
    
    // Samurai hat (kasa) on top-down view - big circle hat
    if (skin.hat === 'samurai') {
        ctx.fillStyle = '#3d2b0e';
        ctx.beginPath(); ctx.ellipse(0, -3.5*s, 7*s, 6*s, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#5a3f1a';
        ctx.beginPath(); ctx.ellipse(0, -3.5*s, 5*s, 4*s, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#8b0000';
        ctx.beginPath(); ctx.ellipse(0, -3.5*s, 1.5*s, 1.5*s, 0, 0, Math.PI*2); ctx.fill();
    }
    
    // Katana visible behind
    if (skin.acc === 'katana') {
        ctx.fillStyle = '#1a1a1a';
        ctx.save();
        ctx.rotate(0.5);
        ctx.fillRect(2*s, -8*s, 1.5*s, 12*s);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(1*s, -8*s, 3.5*s, 1.5*s);
        ctx.restore();
    }
    
    ctx.restore();
}

// ============================================
// BOSS WIN - Player survived
// ============================================
function bossWin() {
    if (bossBattlePaused && !bossBattleActive) return; // предотвращаем двойной вызов
    bossBattleActive = false;
    bossBattlePaused = true;
    if (bossAnimationId) cancelAnimationFrame(bossAnimationId);
    AudioEngine.stopBossMusic(false);
    AudioEngine.sfx.victory();

    // Хост уведомляет гостя о победе
    if (net.bossOnline && net.isHost && net.conn && net.conn.open) {
        net.conn.send({ type: 'BOSS_WIN' });
    }
    
    // Сохраняем победу (оба — хост и гость получают прогресс)
    if (!defeatedBosses.includes(currentBoss.id)) {
        defeatedBosses.push(currentBoss.id);
        localStorage.setItem('pixelCatsDefeatedBosses', JSON.stringify(defeatedBosses));
    }
    // Синхронизируем с облаком и таблицей лидеров
    saveGameData();
    if (typeof AccountSystem !== 'undefined' && AccountSystem.submitBossProgress) {
        AccountSystem.submitBossProgress(defeatedBosses.length);
    }
    
    // Show win screen
    document.getElementById('boss-battle-screen').style.display = 'none';
    document.getElementById('boss-win-screen').style.display = 'block';
    document.getElementById('boss-win-title').innerText = t('bossWin');
    // Онлайн: показать кто победил вместе
    document.getElementById('boss-win-msg').innerText = net.bossOnline
        ? (t('bossDefeated') + ' 🎉 2 игрока')
        : t('bossDefeated');
    
    // Check unlock message
    let unlockMsg = '';
    if (currentBoss.id === 'fireGolem' && !defeatedBosses.includes('iceDragon')) {
        unlockMsg = t('bossUnlocked') + ': ' + t('bosses.iceDragon.name');
    } else if (currentBoss.id === 'iceDragon' && !defeatedBosses.includes('alchemist')) {
        unlockMsg = t('bossUnlocked') + ': ' + t('bosses.alchemist.name');
    } else if (currentBoss.id === 'alchemist' && !defeatedBosses.includes('shadowLord')) {
        unlockMsg = t('bossUnlocked') + ': ' + t('bosses.shadowLord.name');
    }
    document.getElementById('boss-unlock-msg').innerText = unlockMsg;
}

// ============================================
// BOSS LOSE - Player hit
// ============================================
function bossLose() {
    if (bossBattlePaused && !bossBattleActive) return; // предотвращаем двойной вызов
    bossBattleActive = false;
    bossBattlePaused = true;
    if (bossAnimationId) cancelAnimationFrame(bossAnimationId);
    AudioEngine.stopBossMusic(false);
    AudioEngine.sfx.defeat();
    // Хост уведомляет гостя о поражении
    if (net.bossOnline && net.isHost && net.conn && net.conn.open) {
        net.conn.send({ type: 'BOSS_LOSE' });
    }
    // Draw one last frame so players can see the scene before overlay
    drawBossBattle();
    document.getElementById('boss-battle-screen').style.display = 'none';
    document.getElementById('boss-lose-screen').style.display = 'block';
    document.getElementById('boss-lose-title').innerText = t('bossLose');
    document.getElementById('boss-lose-msg').innerText = t('bossLost');
}

// ============================================
// RESTART BOSS BATTLE - Try again
// ============================================
function restartBossBattle() {
    // Гость в онлайне не может самостоятельно рестартовать — только хост
    if (net.bossOnline && !net.isHost) {
        document.getElementById('boss-lose-msg').innerText = t('bossWaitHost');
        return;
    }
    bossBattlePaused = false; // Снимаем паузу
    const bossIndex = BOSSES.findIndex(b => b.id === currentBoss.id);
    startBossBattle(bossIndex);
}

// ============================================
// UPDATED SHOWMENU - Handle boss battle cleanup
// Обновленная функция showMenu с очисткой битвы с боссом
// ============================================
const originalShowMenu = showMenu;
showMenu = function() {
    bossBattleActive = false;
    bossBattlePaused = false;
    bossBattleSuspended = false;
    net.bossOnline = false;
    AudioEngine.stopAllMusic();
    _stopBossIconAnim();
    if (bossHintTimer) clearTimeout(bossHintTimer);
    if (bossAnimationId) cancelAnimationFrame(bossAnimationId);
    document.getElementById('boss-screen').style.display = 'none';
    document.getElementById('boss-battle-screen').style.display = 'none';
    document.getElementById('boss-win-screen').style.display = 'none';
    document.getElementById('boss-lose-screen').style.display = 'none';
    const hintEl = document.getElementById('dodge-hint');
    if (hintEl) { hintEl.style.display = 'block'; bossHintVisible = true; }
    originalShowMenu();
};

// Кнопка "Продолжить" после победы над боссом в онлайне:
// Оба возвращаются в онлайн-лобби, хост может снова выбрать режим
function bossWinContinue() {
    if (net.bossOnline || net.isOnline) {
        net.bossOnline = false;
        document.getElementById('boss-win-screen').style.display = 'none';
        if (net.isHost) {
            showOnlineLobby();
        } else {
            numPlayers = 1;
            showOnlineLobby();
        }
    } else {
        showBossScreen();
    }
}
// Переопределяем кнопку "Продолжить" в boss-win-screen
document.getElementById('btn-boss-continue').onclick = bossWinContinue;

// Кнопка "Выбрать другого" для гостя → онлайн-лобби; для хоста → экран боссов
const origBossLoseBack = document.getElementById('btn-boss-lose-back');
if (origBossLoseBack) {
    origBossLoseBack.onclick = function() {
        if (net.bossOnline || net.isOnline) {
            net.bossOnline = false;
            document.getElementById('boss-lose-screen').style.display = 'none';
            if (net.isHost) {
                showOnlineLobby();
            } else {
                numPlayers = 1;
                showOnlineLobby();
            }
        } else {
            showBossScreen();
        }
    };
}

// ⚠️ Инициализация перенесена в main.js

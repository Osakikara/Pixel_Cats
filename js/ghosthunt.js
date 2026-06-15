// ============================================================
// GHOST HUNT — мини-игра «Охота на призраков»
//
// По арене бродят кото-призраки. За каждого побеждённого — очки.
// Сложность растёт волнами. Соло — выживание (3 жизни).
// Вдвоём — дуэль: кто наберёт больше очков за раунд (120 сек).
// Онлайн: хост-авторитарная симуляция (как в боссах).
//
// Оружия (все доступны сразу, переключение 1-4 / Q):
//   1. ЛАПА          — быстрый удар вблизи
//   2. КЛУБОК        — прыгающий снаряд по дуге
//   3. РЫБА-БУМЕРАНГ — летит вперёд и возвращается, пробивает насквозь
//   4. ЛАЗЕР         — мгновенный луч через всю арену
// ============================================================

// ── Виртуальная арена (масштабируется под экран как у боссов) ──
const GH_VW = 1700, GH_VH = 950;
const GH_GROUND = GH_VH - 90;
const GH_DUO_TIME = 120;          // секунд в дуэли
const GH_WAVE_LEN = 1800;         // тиков на волну (30 сек)
const GH_SOLO_LIVES = 3;

// Платформы арены (односторонние: запрыгивать снизу, спускаться кнопкой «вниз»).
// Высота прыжка ≈ 160px (j=-14, g=0.6) — нижний ярус достижим с земли,
// верхняя — с нижней центральной.
const GH_PLATFORMS = [
    { x: 150,             y: GH_GROUND - 150, w: 320 },   // левая
    { x: GH_VW - 470,     y: GH_GROUND - 150, w: 320 },   // правая
    { x: GH_VW / 2 - 210, y: GH_GROUND - 150, w: 420 },   // нижняя по центру (на уровне крайних)
    { x: GH_VW / 2 - 240, y: GH_GROUND - 290, w: 480 },   // верхняя по центру (длинная)
];

// ── Оружия ──
const GH_WEAPONS = [
    { id: 'claw',  cd: 10,  nameKey: 'ghosthunt.weapons.claw'  },
    { id: 'yarn',  cd: 34,  nameKey: 'ghosthunt.weapons.yarn'  },
    { id: 'fish',  cd: 60,  nameKey: 'ghosthunt.weapons.fish'  },
    { id: 'laser', cd: 100, nameKey: 'ghosthunt.weapons.laser' },
];

// Лоадаут: каждый игрок берёт в бой 2 оружия из 4 (выбор до матча). Сохраняется.
let ghLoadout = (typeof SafeStorage !== 'undefined' && SafeStorage.getJSON('pixelCatsGhLoadout')) || [[0, 3], [1, 2]];
if (!Array.isArray(ghLoadout) || !Array.isArray(ghLoadout[0])) ghLoadout = [[0, 3], [1, 2]];

// Оверлей перезарядки внутри кнопки атаки (заполняется снизу)
const GH_CD_OVERLAY = '<div class="gh-cd" style="position:absolute;left:0;bottom:0;width:100%;height:0;background:rgba(0,0,0,0.55);pointer-events:none;"></div>';
// Запомненный тип управления до принудительного джойстика в охоте (для восстановления)
let _ghPrevCtrl = null;


// ── Типы призраков ──
const GH_TYPES = ['wisp', 'swift', 'phantom', 'brute'];
const GH_GHOSTS = {
    wisp:    { hp: 1, pts: 10, speed: 1.15, scale: 1.0,  body: '#cfe8ff', dark: '#9fc4ea', eye: '#7df9ff' },
    swift:   { hp: 1, pts: 15, speed: 2.3,  scale: 0.85, body: '#b8ffd9', dark: '#86d9ae', eye: '#aaffcc' },
    phantom: { hp: 2, pts: 20, speed: 1.5,  scale: 1.0,  body: '#ffb8d0', dark: '#e08aa8', eye: '#ff8fb3' },
    brute:   { hp: 4, pts: 25, speed: 0.62, scale: 1.6,  body: '#d9b8ff', dark: '#aa86d9', eye: '#c77dff' },
};

// Рекорд мини-игры (ghostHighScore объявлен в globals.js)

// ── Состояние ──
const GH = {
    active: false, over: false,
    mode: 'solo',           // 'solo' | 'duo'
    online: false, isHost: true, localIdx: 0,
    players: [], ghosts: [], projs: [], fx: [], texts: [],
    spawnTimer: 60, elapsed: 0, wave: 1, waveShown: 0, waveAnnounce: 0,
    timeLeft: GH_DUO_TIME * 60,
    nextGhostId: 1,
    // онлайн-буферы
    netEvents: { kills: [], hits: [] },
    lastStateSent: 0, lastPosSent: 0,
    stateGhosts: new Map(),
};
let ghAnimationId = null;

// ============================================================
// ЭКРАНЫ (вход в мини-игру)
// ============================================================
function openGhostHunt() {
    AudioEngine.boot();
    const ms = document.getElementById('minigames-screen'); if (ms) ms.style.display = 'none';
    startScreen.style.display = 'none';
    const sc = document.getElementById('ghosthunt-screen');
    if (sc) sc.style.display = 'block';
    updateGhostHuntTexts();
}
function closeGhostHunt() {
    const sc = document.getElementById('ghosthunt-screen'); if (sc) sc.style.display = 'none';
    startScreen.style.display = 'block';
}

// ============================================================
// СТАРТ РАУНДА
// ============================================================
function startGhostHunt(playersCount, opts) {
    opts = opts || {};
    if (menuAnimationId) cancelAnimationFrame(menuAnimationId);
    if (ghAnimationId) cancelAnimationFrame(ghAnimationId);
    AudioEngine.stopMusic();

    GH.mode = (playersCount === 2) ? 'duo' : 'solo';
    GH.online = !!opts.online;
    GH.isHost = opts.isHost !== false;
    GH.localIdx = GH.online ? (GH.isHost ? 0 : 1) : 0;
    GH.active = true; GH.over = false;
    GH.ghosts = []; GH.projs = []; GH.fx = []; GH.texts = [];
    GH.spawnTimer = 90; GH.elapsed = 0; GH.wave = 1; GH.waveShown = 1; GH.waveAnnounce = 150;
    GH.timeLeft = GH_DUO_TIME * 60;
    GH.nextGhostId = 1;
    GH.netEvents = { kills: [], hits: [] };
    GH.stateGhosts = new Map();

    // Игроки
    GH.players = [];
    const s1 = SKINS[p1SkinIndex] || SKINS[0];
    GH.players.push(ghMakePlayer(0, GH_VW / 2 - 160, s1));
    if (GH.mode === 'duo') {
        const s2 = SKINS[p2SkinIndex] || SKINS[1] || SKINS[0];
        GH.players.push(ghMakePlayer(1, GH_VW / 2 + 130, s2));
    }
    // Лоадаут оружия из выбора до матча: в бою только выбранные 2
    GH.players.forEach((pl, i) => {
        let lo = GH.online ? (i === GH.localIdx ? (ghLoadout[0] || []).slice() : [0, 1, 2, 3])
                           : (ghLoadout[i] || ghLoadout[0] || []).slice();
        if (!lo.length) lo = [0];
        pl.loadout = lo;
        pl.weapon = lo[0];
    });
    // Скрыть экраны
    startScreen.style.display = 'none';
    onlineScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    winScreen.style.display = 'none';
    const sc = document.getElementById('ghosthunt-screen'); if (sc) sc.style.display = 'none';
    const ov = document.getElementById('ghosthunt-over-screen'); if (ov) ov.style.display = 'none';
    const ms = document.getElementById('minigames-screen'); if (ms) ms.style.display = 'none';

    _showMobileControls();
    // Охота: на мобиле всегда джойстики (d-pad занимает оба угла и мешает кнопке атаки)
    if (isMobile) {
        if (typeof setCtrlType === 'function' && ctrlType !== 'joystick') { _ghPrevCtrl = ctrlType; setCtrlType('joystick'); }
        const _c1 = document.getElementById('controls-1p'), _c2 = document.getElementById('controls-2p'), _dp = document.getElementById('dpad-controls');
        const _duo = (GH.mode === 'duo' && !GH.online);
        if (_c1) _c1.style.display = _duo ? 'none' : 'block';
        if (_c2) _c2.style.display = _duo ? 'block' : 'none';
        if (_dp) _dp.style.display = 'none';
    }
    ghShowMobileButtons(true);
    ghSetMainHud(true); // скрыть верхнюю панель основной игры (счёт/рыбки)

    lastTime = performance.now();
    ghAnimationId = requestAnimationFrame(ghLoop);
}

// Скрыть/показать верхнюю панель основной игры (она перекрывает HUD арены)
function ghSetMainHud(hidden) {
    const tb = document.querySelector('.top-bar');
    if (tb) tb.style.display = hidden ? 'none' : '';
    const dl = document.getElementById('diff-label');
    if (dl) dl.style.display = hidden ? 'none' : '';
}

function ghMakePlayer(idx, x, skin) {
    return {
        idx: idx, x: x, y: GH_GROUND - 60, dy: 0, w: 30, h: 45,
        onGround: false, facingRight: idx === 0, isMoving: false,
        skin: skin, score: 0, lives: GH_SOLO_LIVES,
        weapon: 0, cd: 0, switchLock: 0, invuln: 0, knockVx: 0,
        streak: 0, fishOut: false, anim: 0, drop: 0,
    };
}

// Локальный ли это игрок (для онлайна)
function ghIsLocal(p) {
    if (!GH.online) return true;
    return p.idx === GH.localIdx;
}

// ============================================================
// ВВОД
// ============================================================
function ghControls(p) {
    // Возвращает {left,right,up} для игрока
    if (GH.online || GH.mode === 'solo') {
        // локальный игрок — любые клавиши
        return {
            left:  keys['KeyA'] || keys['ArrowLeft'],
            right: keys['KeyD'] || keys['ArrowRight'],
            up:    keys['KeyW'] || keys['ArrowUp'] || keys['Space'],
            down:  keys['KeyS'] || keys['ArrowDown'] || joystickAxes.p1.y > 0.5,
            axis:  (Math.abs(joystickAxes.p1.x) > 0.08) ? joystickAxes.p1.x : 0,
        };
    }
    // локальная дуэль
    if (p.idx === 0) return {
        left: keys['KeyA'], right: keys['KeyD'], up: keys['KeyW'],
        down: keys['KeyS'] || joystickAxes.p1.y > 0.5,
        axis: (Math.abs(joystickAxes.p1.x) > 0.08) ? joystickAxes.p1.x : 0,
    };
    return {
        left: keys['ArrowLeft'], right: keys['ArrowRight'], up: keys['ArrowUp'],
        down: keys['ArrowDown'] || joystickAxes.p2.y > 0.5,
        axis: (Math.abs(joystickAxes.p2.x) > 0.08) ? joystickAxes.p2.x : 0,
    };
}

// Клавиатура: атака / смена оружия / выход (событийно)
window.addEventListener('keydown', (e) => {
    if (!GH.active) {
        // Enter на экране результатов — ещё раз
        const ov = document.getElementById('ghosthunt-over-screen');
        if (ov && ov.style.display === 'block' && e.key === 'Enter') ghRestart();
        return;
    }
    if (e.key === 'Escape') { ghExitToMenu(); return; }
    if (GH.over) return;

    const localP = GH.players[GH.localIdx];
    const p2local = (!GH.online && GH.mode === 'duo') ? GH.players[1] : null;

    // P1 (или единственный локальный игрок)
    const p1 = GH.online ? localP : GH.players[0];
    if (p1 && ghIsLocal(p1)) {
        if (e.code === 'KeyF' || e.code === 'KeyJ') ghTryAttack(p1);
        if (e.code === 'KeyQ') ghSwitchWeapon(p1, -1);
        if (e.code === 'KeyE' || e.code === 'KeyG') ghSwitchWeapon(p1, 1); // G — смена оружия одной кнопкой
        if (e.code === 'Digit1') ghSetWeaponSlot(p1, 0);
        if (e.code === 'Digit2') ghSetWeaponSlot(p1, 1);
        // В соло можно атаковать и с правой руки
        if (GH.mode === 'solo' && (e.code === 'Slash' || e.code === 'ShiftRight')) ghTryAttack(p1);
        if (GH.mode === 'solo' && (e.code === 'Period' || e.code === 'NumpadDecimal')) ghSwitchWeapon(p1, 1);
        if (GH.mode === 'solo' && e.code === 'Comma') ghSwitchWeapon(p1, -1);
    }
    // P2 — локальная дуэль
    if (p2local) {
        if (e.code === 'Slash' || e.code === 'ShiftRight' || e.code === 'Numpad0') ghTryAttack(p2local);
        if (e.code === 'Period' || e.code === 'NumpadDecimal') ghSwitchWeapon(p2local, 1);
        if (e.code === 'Comma') ghSwitchWeapon(p2local, -1);
    }
});

function ghSetWeapon(p, idx) {
    if (p.switchLock > 0 || p.weapon === idx) return;
    p.weapon = idx; p.switchLock = 6; p.cd = 0; // смена оружия сбрасывает перезарядку
    AudioEngine.sfx.click();
}
function ghSwitchWeapon(p, dir) {
    if (p.switchLock > 0) return;
    const lo = (p.loadout && p.loadout.length) ? p.loadout : [0, 1, 2, 3];
    let idx = lo.indexOf(p.weapon); if (idx < 0) idx = 0;
    p.weapon = lo[(idx + dir + lo.length) % lo.length];
    p.switchLock = 6; p.cd = 0; // смена оружия сбрасывает перезарядку
    AudioEngine.sfx.click();
}
// Выбрать слот лоадаута (клавиши 1/2)
function ghSetWeaponSlot(p, slot) {
    const lo = (p.loadout && p.loadout.length) ? p.loadout : [0, 1, 2, 3];
    if (slot < lo.length) ghSetWeapon(p, lo[slot]);
}

// Выбор 2 оружий в бой (до матча). Тап по оружию — добавить/снять (макс 2, мин 1).
function ghToggleLoadout(player, wi) {
    const lo = ghLoadout[player];
    const at = lo.indexOf(wi);
    if (at >= 0) { if (lo.length > 1) lo.splice(at, 1); }
    else { lo.push(wi); if (lo.length > 2) lo.shift(); }
    try { SafeStorage.set('pixelCatsGhLoadout', JSON.stringify(ghLoadout)); } catch (e) {}
    ghRenderLoadout();
    if (AudioEngine.sfx && AudioEngine.sfx.click) AudioEngine.sfx.click();
}
function ghRenderLoadout() {
    const cont = document.getElementById('gh-weapons-list');
    if (!cont) return;
    const names = GH_WEAPONS.map(w => t(w.nameKey));
    const row = (player, col) => {
        let h = '<div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap;align-items:center;margin:4px 0;">';
        h += '<span style="color:' + col + ';font-size:9px;min-width:26px;text-align:right;">P' + (player + 1) + '</span>';
        for (let i = 0; i < GH_WEAPONS.length; i++) {
            const sel = ghLoadout[player].includes(i);
            h += '<button onpointerdown="ghToggleLoadout(' + player + ',' + i + ')" style="font-family:inherit;font-size:8px;padding:6px 7px;cursor:pointer;'
               + 'border:2px solid ' + (sel ? col : '#555') + ';background:' + (sel ? 'rgba(125,249,255,0.18)' : 'rgba(0,0,0,0.4)')
               + ';color:' + (sel ? col : '#bbb') + ';">' + names[i] + '</button>';
        }
        return h + '</div>';
    };
    const legend = '<div style="color:#888;font-size:7px;line-height:1.7;margin-top:4px;text-align:left;">'
        + GH_WEAPONS.map((w, i) => names[i] + ' — ' + t('ghosthunt.wd.' + w.id)).join('<br>') + '</div>';
    cont.innerHTML = '<div style="color:#ffd700;font-size:11px;margin-bottom:4px;text-shadow:1px 1px 0 #000;">' + t('ghosthunt.pickTitle') + '</div>'
        + row(0, '#7df9ff') + row(1, '#ffb86c')
        + '<div style="color:#a88beb;font-size:7px;margin-top:2px;">' + t('ghosthunt.pickHint') + '</div>'
        + legend;
}

// ============================================================
// АТАКИ
// ============================================================
function ghTryAttack(p) {
    if (!GH.active || GH.over || p.cd > 0) return;
    // У рыбы-бумеранга только один снаряд в воздухе
    if (GH_WEAPONS[p.weapon].id === 'fish' && p.fishOut) return;

    // Гость в онлайне: эффект локально + событие хосту (урон считает хост)
    if (GH.online && !GH.isHost && ghIsLocal(p)) {
        ghSpawnAttack(p, true);
        if (net.conn && net.conn.open) {
            net.conn.send({ type: 'GH_ATK', w: p.weapon, x: Math.round(p.x), y: Math.round(p.y), dir: p.facingRight });
        }
        p.cd = GH_WEAPONS[p.weapon].cd;
        return;
    }
    ghSpawnAttack(p, false);
    p.cd = GH_WEAPONS[p.weapon].cd;
}

// visualOnly=true — только эффект (гость), урон посчитает хост
function ghSpawnAttack(p, visualOnly) {
    const w = GH_WEAPONS[p.weapon].id;
    const dir = p.facingRight ? 1 : -1;
    const cx = p.x + p.w / 2, cy = p.y + 18;

    if (w === 'claw') {
        AudioEngine.sfx.ghClaw && AudioEngine.sfx.ghClaw();
        const clx = cx + dir * 52, cly = cy, R = 58;        // круг урона впереди кота
        GH.fx.push({ kind: 'slash', x: cx, y: p.y + 14, dir: dir, life: 12, max: 12 }); // визуал — разрезы у головы
        if (!visualOnly) {
            // ВЕСЬ круг наносит урон: пересечение круга с хитбоксом призрака (а не только центр)
            for (const g of GH.ghosts) {
                if (g.dead || g.phased) continue;
                const gw = 30 * g.scale, ghh = 36 * g.scale;
                const nx = Math.max(g.x, Math.min(clx, g.x + gw));  // ближайшая точка хитбокса к центру круга
                const ny = Math.max(g.y, Math.min(cly, g.y + ghh));
                const ddx = clx - nx, ddy = cly - ny;
                if (ddx * ddx + ddy * ddy > R * R) continue;        // хитбокс не касается круга
                ghDamageGhost(g, 1, p);
                if (!g.dead) { g.vx = dir * 16; g.vy = -6; g.knock = 40; g.flash = 8; } // мощный отброс
            }
        }
    } else if (w === 'yarn') {
        AudioEngine.sfx.ghYarn && AudioEngine.sfx.ghYarn();
        if (!visualOnly) {
            GH.projs.push({ kind: 'yarn', owner: p.idx, x: cx + dir * 16, y: cy - 6,
                vx: 8.5 * dir, vy: -3.6, bounces: 5, life: 360, r: 9, rot: 0 });
        }
    } else if (w === 'fish') {
        AudioEngine.sfx.ghFish && AudioEngine.sfx.ghFish();
        if (!visualOnly) {
            GH.projs.push({ kind: 'fish', owner: p.idx, x: cx + dir * 14, y: cy - 4,
                vx: 15 * dir, vy: 0, out: 38, returning: false, life: 600, hitIds: [], rot: 0 });
            p.fishOut = true;
        } else { p.fishOut = true; }
    } else if (w === 'laser') {
        AudioEngine.sfx.ghLaser && AudioEngine.sfx.ghLaser();
        const bx = cx + dir * 16;
        const endX = dir > 0 ? GH_VW : 0;
        GH.fx.push({ kind: 'laser', x: bx, y: cy - 2, x2: endX, life: 14, max: 14 });
        p.knockVx = -dir * 1.5;
        if (!visualOnly) {
            const zone = dir > 0
                ? { x: bx, y: cy - 20, w: endX - bx, h: 40 }
                : { x: 0,  y: cy - 20, w: bx,        h: 40 };
            ghDamageZone(zone, 2, p, 'laser');
        }
    }
}

// Урон по зоне (лапа, лазер)
function ghDamageZone(z, dmg, byPlayer, src) {
    for (const g of GH.ghosts) {
        if (g.dead || g.phased) continue;
        const gw = 30 * g.scale, ghh = 36 * g.scale;
        if (g.x < z.x + z.w && g.x + gw > z.x && g.y < z.y + z.h && g.y + ghh > z.y) {
            ghDamageGhost(g, dmg, byPlayer);
        }
    }
}

function ghDamageGhost(g, dmg, byPlayer) {
    g.hp -= dmg;
    g.flash = 8;
    if (g.hp <= 0) {
        g.dead = true;
        const pts = GH_GHOSTS[g.type].pts;
        ghAddScore(byPlayer, pts, g.x + 15 * g.scale, g.y);
        ghPoof(g.x + 15 * g.scale, g.y + 16 * g.scale, GH_GHOSTS[g.type].body, 1.2 * g.scale);
        AudioEngine.sfx.ghGhostDie && AudioEngine.sfx.ghGhostDie();
        // серия: каждые 5 подряд без урона +20
        byPlayer.streak++;
        if (byPlayer.streak > 0 && byPlayer.streak % 5 === 0) {
            ghAddScore(byPlayer, 20, byPlayer.x + 15, byPlayer.y - 30, t('ghosthunt.streak') + ' +20');
        }
        if (GH.online && GH.isHost) {
            GH.netEvents.kills.push([Math.round(g.x), Math.round(g.y), pts, byPlayer.idx]);
        }
    } else {
        AudioEngine.sfx.ghGhostHit && AudioEngine.sfx.ghGhostHit();
    }
}

function ghAddScore(p, pts, x, y, label) {
    p.score += pts;
    const col = p.idx === 0 ? '#7df9ff' : '#ffb86c';
    GH.texts.push({ text: label || ('+' + pts), x: x, y: y, alpha: 1, dy: -1.4, size: label ? 15 : 13, color: col });
}

// ============================================================
// ПРИЗРАКИ
// ============================================================
function ghSpawnGhost() {
    // Распределение типов по волнам
    const w = GH.wave;
    let type = 'wisp';
    const r = Math.random();
    if (w >= 4)      type = r < 0.35 ? 'wisp' : r < 0.65 ? 'swift' : r < 0.85 ? 'phantom' : 'brute';
    else if (w === 3) type = r < 0.5 ? 'wisp' : r < 0.8 ? 'swift' : 'phantom';
    else if (w === 2) type = r < 0.7 ? 'wisp' : 'swift';

    const def = GH_GHOSTS[type];
    const side = Math.random() < 0.5 ? -1 : 1;
    const fromTop = Math.random() < 0.25;
    const gx = fromTop ? 100 + Math.random() * (GH_VW - 200) : (side < 0 ? -50 : GH_VW + 20);
    const gy = fromTop ? -60 : GH_GROUND - 80 - Math.random() * 420;

    GH.ghosts.push({
        id: GH.nextGhostId++,
        type: type, x: gx, y: gy, vx: 0, vy: 0,
        hp: def.hp, scale: def.scale, dead: false,
        phased: false, phaseTimer: 100 + Math.random() * 80,
        bob: Math.random() * Math.PI * 2, flash: 0, dir: side < 0,
    });
}

function ghUpdateGhosts(ts) {
    const speedMult = 1 + (GH.wave - 1) * 0.12 + GH.elapsed / 14000;
    for (const g of GH.ghosts) {
        if (g.dead) continue;
        const def = GH_GHOSTS[g.type];

        // Фантом периодически растворяется (неуязвим и безопасен)
        if (g.type === 'phantom') {
            g.phaseTimer -= ts;
            if (g.phaseTimer <= 0) {
                g.phased = !g.phased;
                g.phaseTimer = g.phased ? 55 : 130;
            }
        }

        // Цель — ближайший живой игрок
        let target = null, bd = 1e9;
        for (const p of GH.players) {
            if (GH.mode === 'solo' && p.lives <= 0) continue;
            const d = Math.abs(p.x - g.x) + Math.abs(p.y - g.y);
            if (d < bd) { bd = d; target = p; }
        }
        if (g.knock > 0) {
            // отброс лапой — призрак летит назад и не наводится, скорость затухает
            g.knock -= ts;
            g.vx *= Math.pow(0.9, ts);
            g.vy *= Math.pow(0.9, ts);
        } else if (target) {
            const sp = def.speed * speedMult * (g.phased ? 1.8 : 1);
            const dx = (target.x + 15) - (g.x + 15 * g.scale);
            const dy = (target.y + 10) - (g.y + 16 * g.scale);
            const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
            g.vx = lerp(g.vx, (dx / dist) * sp, 0.04 * ts);
            g.vy = lerp(g.vy, (dy / dist) * sp, 0.04 * ts);
            g.dir = dx < 0;
        }
        g.bob += 0.06 * ts;
        g.x += g.vx * ts;
        g.y += g.vy * ts + Math.sin(g.bob) * 0.5 * ts;
        if (g.y > GH_GROUND - 30) g.y = GH_GROUND - 30;
        if (g.flash > 0) g.flash -= ts;

        // Касание игрока
        if (!g.phased) {
            const gw = 24 * g.scale, ghh = 30 * g.scale;
            const gx = g.x + 3 * g.scale, gy = g.y + 3 * g.scale;
            for (const p of GH.players) {
                if (p.invuln > 0) continue;
                if (GH.mode === 'solo' && p.lives <= 0) continue;
                if (gx < p.x + p.w - 4 && gx + gw > p.x + 4 && gy < p.y + p.h && gy + ghh > p.y) {
                    ghHitPlayer(p, g);
                    break;
                }
            }
        }
    }
    GH.ghosts = GH.ghosts.filter(g => !g.dead);
}

function ghHitPlayer(p, g) {
    g.dead = true;
    ghPoof(g.x + 15 * g.scale, g.y + 16 * g.scale, '#9a9ab0', g.scale);
    p.invuln = 100;
    p.streak = 0;
    p.knockVx = (p.x > g.x ? 1 : -1) * 7;
    p.dy = -6;
    AudioEngine.sfx.ghHurt && AudioEngine.sfx.ghHurt();
    if (GH.mode === 'solo') {
        p.lives--;
        GH.texts.push({ text: t('ghosthunt.lifeLost'), x: p.x + 15, y: p.y - 20, alpha: 1, dy: -1.2, size: 11, color: '#ff5566' });
        if (p.lives <= 0) ghEndRound('death');
    } else {
        const lost = Math.min(10, p.score);
        p.score -= lost;
        GH.texts.push({ text: '-' + lost, x: p.x + 15, y: p.y - 20, alpha: 1, dy: -1.2, size: 13, color: '#ff5566' });
    }
    if (GH.online && GH.isHost) GH.netEvents.hits.push(p.idx);
}

function ghPoof(x, y, color, scale) {
    for (let i = 0; i < 10; i++) {
        GH.fx.push({
            kind: 'poof', x: x + (Math.random() - 0.5) * 24 * scale, y: y + (Math.random() - 0.5) * 24 * scale,
            vx: (Math.random() - 0.5) * 2, vy: -0.6 - Math.random() * 1.4,
            life: 26 + Math.random() * 16, max: 40, color: color, size: 3 + Math.random() * 4 * scale,
        });
    }
}

// ============================================================
// СНАРЯДЫ
// ============================================================
function ghUpdateProjs(ts) {
    for (const pr of GH.projs) {
        pr.life -= ts;
        if (pr.kind === 'yarn') {
            pr.vy += 0.32 * ts;
            pr.x += pr.vx * ts; pr.y += pr.vy * ts;
            pr.rot += 0.2 * ts * Math.sign(pr.vx || 1);
            if (pr.y + pr.r > GH_GROUND) {
                pr.y = GH_GROUND - pr.r;
                if (pr.bounces > 0) { pr.vy = -Math.abs(pr.vy) * 0.6; pr.bounces--; }
                else pr.life = 0;
            }
            if (pr.x < -40 || pr.x > GH_VW + 40) pr.life = 0;
            // урон + отскок от моба
            if (pr._noHit > 0) pr._noHit -= ts;
            const owner = GH.players[pr.owner];
            if (!(pr._noHit > 0)) for (const g of GH.ghosts) {
                if (g.dead || g.phased) continue;
                const gw = 30 * g.scale, ghh = 36 * g.scale;
                if (pr.x > g.x - pr.r && pr.x < g.x + gw + pr.r && pr.y > g.y - pr.r && pr.y < g.y + ghh + pr.r) {
                    ghDamageGhost(g, 1, owner);
                    if (!g.dead) { const _kd = Math.sign(pr.vx) || 1; g.vx = _kd * 16; g.vy = -6; g.knock = 40; g.flash = 8; } // отброс как у лапы
                    if (owner) owner.cd = 0;                  // перезарядка сбрасывается при попадании
                    if (pr.bounces > 0) {                      // клубок отскакивает обратно от моба
                        pr.bounces--;
                        pr.vx = -pr.vx; pr.vy = -Math.abs(pr.vy || 3) * 0.8 - 1.5;
                        pr.x += pr.vx; pr.y += pr.vy;
                        pr._noHit = 4;
                    } else { pr.life = 0; }
                    break;
                }
            }
        } else if (pr.kind === 'fish') {
            pr.rot += 0.35 * ts;
            const owner = GH.players[pr.owner];
            if (!pr.returning) {
                pr.out -= ts;
                pr.x += pr.vx * ts;
                if (pr.out <= 0 || pr.x < 10 || pr.x > GH_VW - 10) pr.returning = true;
            } else if (owner) {
                const dx = (owner.x + 15) - pr.x, dy = (owner.y + 16) - pr.y;
                const d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
                pr.x += (dx / d) * 16 * ts;
                pr.y += (dy / d) * 16 * ts;
                if (d < 30) { pr.life = 0; owner.fishOut = false; }
            }
            if (!pr.hitCd) pr.hitCd = {};
            for (const g of GH.ghosts) {
                if (g.dead || g.phased) continue;
                const gw = 30 * g.scale, ghh = 36 * g.scale;
                if (pr.x + 13 > g.x && pr.x - 13 < g.x + gw && pr.y + 7 > g.y && pr.y - 7 < g.y + ghh) {
                    if ((pr.hitCd[g.id] || 0) <= gameTime) {   // урон при касании и повторном касании
                        pr.hitCd[g.id] = gameTime + 18;
                        ghDamageGhost(g, 1, owner || GH.players[0]);
                    }
                }
            }
            if (pr.life <= 0 && owner) owner.fishOut = false;
        }
    }
    GH.projs = GH.projs.filter(pr => pr.life > 0);
}

// ============================================================
// ИГРОКИ — физика
// ============================================================
function ghUpdatePlayer(p, ts) {
    if (GH.mode === 'solo' && p.lives <= 0) return;

    // Онлайн: чужой кот — интерполяция к net-цели
    if (GH.online && !ghIsLocal(p)) {
        if (p._netX !== undefined) {
            p.isMoving = Math.abs(p._netX - p.x) > 0.5;
            p.x = lerp(p.x, p._netX, Math.min(0.35 * ts, 1));
            p.y = lerp(p.y, p._netY, Math.min(0.35 * ts, 1));
            p.facingRight = !!p._netDir;
        }
        if (p.cd > 0) p.cd -= ts;
        if (p.invuln > 0) p.invuln -= ts;
        return;
    }

    const c = ghControls(p);
    const moveSp = 6;
    let dx = 0;
    if (c.axis) { dx = c.axis * moveSp * ts; p.facingRight = c.axis > 0; }
    else {
        if (c.left)  { dx = -moveSp * ts; p.facingRight = false; }
        if (c.right) { dx =  moveSp * ts; p.facingRight = true; }
    }
    p.isMoving = dx !== 0;
    // отдача / отброс
    if (Math.abs(p.knockVx) > 0.1) { dx += p.knockVx * ts; p.knockVx *= Math.pow(0.85, ts); }
    p.x += dx;
    if (p.x < 4) p.x = 4;
    if (p.x + p.w > GH_VW - 4) p.x = GH_VW - 4 - p.w;

    // спуск с платформы: «вниз», стоя на платформе (не на земле)
    if (p.drop > 0) p.drop -= ts;
    if (c.down && p.onGround && p.y + p.h < GH_GROUND - 2) {
        p.drop = 14;          // на это время платформы «прозрачны»
        p.onGround = false;
        p.dy = 2;
    }

    // прыжок
    const prevFeet = p.y + p.h;
    if (c.up && p.onGround) { p.dy = -14; p.onGround = false; AudioEngine.sfx.jump(); }
    p.dy += 0.6 * ts;
    p.y += p.dy * ts;

    // земля
    p.onGround = false;
    if (p.dy >= 0 && p.y + p.h >= GH_GROUND) { p.y = GH_GROUND - p.h; p.dy = 0; p.onGround = true; }
    // платформы (односторонние; во время спуска игнорируются)
    if (p.dy >= 0 && !p.onGround && !(p.drop > 0)) {
        for (const pl of GH_PLATFORMS) {
            if (p.x + p.w - 6 > pl.x && p.x + 6 < pl.x + pl.w &&
                p.y + p.h >= pl.y && prevFeet <= pl.y + 10) {
                p.y = pl.y - p.h; p.dy = 0; p.onGround = true; break;
            }
        }
    }

    if (p.cd > 0) p.cd -= ts;
    if (p.switchLock > 0) p.switchLock -= ts;
    if (p.invuln > 0) p.invuln -= ts;
}

// ============================================================
// КОНЕЦ РАУНДА
// ============================================================
function ghEndRound(reason) {
    if (GH.over) return;
    GH.over = true;

    const p1 = GH.players[0], p2 = GH.players[1];
    // личный рекорд: в онлайне — свой кот, локально — лучший из котов
    let myBest = GH.online ? GH.players[GH.localIdx].score
               : (p2 ? Math.max(p1.score, p2.score) : p1.score);
    let newRecord = false, skinJustUnlocked = false;
    if (myBest > ghostHighScore) { ghostHighScore = myBest; newRecord = true; }
    // разблокировка скина-призрака
    if (ghostHighScore >= 300 && !unlockedSkins.includes('ghost')) {
        unlockedSkins.push('ghost');
        skinJustUnlocked = true;
    }
    try { saveGameData(); } catch (e) {}
    if (typeof AccountSystem !== 'undefined' && AccountSystem._pushLocal) { try { AccountSystem._pushLocal(); } catch (e) {} }
    // Таблица лидеров: отправляем личный результат раунда
    if (typeof _accAutoSubmit === 'function' && myBest > 0) { try { _accAutoSubmit(myBest, 'ghost'); } catch (e) {} }

    // Хост сообщает гостю
    if (GH.online && GH.isHost && net.conn && net.conn.open) {
        try { net.conn.send({ type: 'GH_END', s0: p1.score, s1: p2 ? p2.score : 0 }); } catch (e) {}
    }

    if (skinJustUnlocked) AudioEngine.sfx.unlock();
    else if (GH.mode === 'duo') AudioEngine.sfx.victory();
    else AudioEngine.sfx.defeat();

    // Показ экрана результатов (с небольшой задержкой — чтобы увидеть последний кадр)
    setTimeout(() => {
        GH.active = false;
        if (ghAnimationId) cancelAnimationFrame(ghAnimationId);
        ghShowMobileButtons(false);
        _hideMobileControls();
        ghSetMainHud(false);
        ghShowOverScreen(newRecord, skinJustUnlocked);
    }, 900);
}

function ghShowOverScreen(newRecord, skinJustUnlocked) {
    const ov = document.getElementById('ghosthunt-over-screen');
    if (!ov) return;
    const p1 = GH.players[0], p2 = GH.players[1];
    const title = document.getElementById('gh-over-title');
    const lines = document.getElementById('gh-over-scores');
    const sub   = document.getElementById('gh-over-sub');
    const rec   = document.getElementById('gh-over-record');

    if (GH.mode === 'solo') {
        if (title) { title.innerText = t('ghosthunt.overSolo'); title.style.color = '#a88beb'; }
        if (lines) lines.innerHTML =
            '<span style="color:#7df9ff;">' + t('ghosthunt.score') + ' ' + p1.score + '</span>' +
            '<br><span style="font-size:9px;color:#aaa;">' + t('ghosthunt.wave') + ' ' + GH.wave + '</span>';
        if (sub) sub.innerText = '';
    } else {
        if (title) { title.innerText = t('ghosthunt.overDuo'); title.style.color = '#a88beb'; }
        const n1 = GH.online ? (GH.isHost ? 'P1 (' + t('ghosthunt.you') + ')' : 'P1') : 'P1';
        const n2 = GH.online ? (!GH.isHost ? 'P2 (' + t('ghosthunt.you') + ')' : 'P2') : 'P2';
        if (lines) lines.innerHTML =
            '<span style="color:#7df9ff;">' + n1 + ': ' + p1.score + '</span><br>' +
            '<span style="color:#ffb86c;">' + n2 + ': ' + (p2 ? p2.score : 0) + '</span>';
        if (sub) {
            if (!p2 || p1.score === p2.score) sub.innerText = t('ghosthunt.drawRound');
            else sub.innerText = t('ghosthunt.winner') + ' ' + (p1.score > p2.score ? 'P1!' : 'P2!');
            sub.style.color = '#ffd700';
        }
    }
    if (rec) {
        rec.innerHTML = (newRecord ? '<span style="color:#ffd700;">' + t('ghosthunt.newRecord') + '</span> ' : '') +
            t('ghosthunt.record') + ' ' + ghostHighScore +
            (skinJustUnlocked ? '<br><span style="color:#2ecc71;">' + t('ghosthunt.skinUnlocked') + '</span>'
             : (!unlockedSkins.includes('ghost') ? '<br><span style="color:#888;font-size:8px;">' + t('ghosthunt.skinHint') + '</span>' : ''));
    }
    // Гость в онлайне не может рестартовать сам — показываем «ожидайте решения хоста»
    const againBtn = document.getElementById('gh-btn-again');
    if (againBtn) againBtn.style.display = (GH.online && !GH.isHost) ? 'none' : '';
    if (rec && GH.online && !GH.isHost) {
        rec.innerHTML += '<br><span style="color:#7df9ff;">' + t('ghosthunt.waitHost') + '</span>';
    }
    ov.style.display = 'block';
}

function ghRestart() {
    const ov = document.getElementById('ghosthunt-over-screen'); if (ov) ov.style.display = 'none';
    if (GH.online) {
        if (GH.isHost && net.conn && net.conn.open) {
            net.conn.send({ type: 'GH_START', seed: Date.now() & 0x7FFFFFFF, hostSkin: p1SkinIndex, hostVariant: mySkinVariants[SKINS[p1SkinIndex].id] || 'auto', guestSkin: net.remoteSkin });
            startGhostHunt(2, { online: true, isHost: true });
        } else {
            ghExitToMenu();
        }
        return;
    }
    startGhostHunt(GH.mode === 'duo' ? 2 : 1);
}

function ghExitToMenu() {
    GH.active = false; GH.over = true;
    if (ghAnimationId) cancelAnimationFrame(ghAnimationId);
    ghShowMobileButtons(false);
    ghSetMainHud(false);
    if (_ghPrevCtrl && typeof setCtrlType === 'function') { setCtrlType(_ghPrevCtrl); _ghPrevCtrl = null; }
    if (typeof _applyCtrlType === 'function' && isMobile) _applyCtrlType(); // вернуть обычную раскладку
    const ov = document.getElementById('ghosthunt-over-screen'); if (ov) ov.style.display = 'none';
    const sc = document.getElementById('ghosthunt-screen'); if (sc) sc.style.display = 'none';
    showMenu(); // корректно закрывает онлайн-сессию (LEAVE) и возвращает меню
}

// Возврат с экрана результатов на экран мини-игры
function ghBackToSetup() {
    const ov = document.getElementById('ghosthunt-over-screen'); if (ov) ov.style.display = 'none';
    if (GH.online) { ghExitToMenu(); return; }
    if (_ghPrevCtrl && typeof setCtrlType === 'function') { setCtrlType(_ghPrevCtrl); _ghPrevCtrl = null; }
    const sc = document.getElementById('ghosthunt-screen'); if (sc) sc.style.display = 'block';
    updateGhostHuntTexts();
    menuPixies = []; for (let i = 0; i < 8; i++) menuPixies.push(new Pixie());
    AudioEngine.startMenuMusic();
    menuLoop();
}

// ============================================================
// ОНЛАЙН
// ============================================================
function ghStartOnlineHost(seed) {
    startGhostHunt(2, { online: true, isHost: true, seed: seed });
}
function ghStartOnlineGuest(data) {
    // скины: хост = P1, гость = P2 (+ настройка окраса хоста)
    if (_guestOwnSkin === null) _guestOwnSkin = p1SkinIndex;
    if (data.hostVariant) net.remoteSkinVariant = data.hostVariant;
    if (typeof data.hostSkin === 'number') p1SkinIndex = data.hostSkin;
    if (typeof data.guestSkin === 'number') p2SkinIndex = (_pendingGuestSkin !== null) ? _pendingGuestSkin : data.guestSkin;
    _pendingGuestSkin = null;
    numPlayers = 2;
    const ov = document.getElementById('ghosthunt-over-screen'); if (ov) ov.style.display = 'none';
    startGhostHunt(2, { online: true, isHost: false, seed: data.seed });
}

function ghOnNet(data) {
    switch (data.type) {
        case 'GH_POS': {
            // ХОСТ: позиция гостя
            if (!GH.active || !GH.isHost) break;
            const p = GH.players[1];
            if (p) {
                p._netX = data.x; p._netY = data.y; p._netDir = data.dir;
                if (typeof data.w === 'number') p.weapon = data.w;
            }
            break;
        }
        case 'GH_ATK': {
            // ХОСТ: атака гостя — симулируем с уроном
            if (!GH.active || !GH.isHost || GH.over) break;
            const p = GH.players[1];
            if (!p) break;
            p.weapon = data.w;
            p.x = data.x; p.y = data.y; p.facingRight = !!data.dir;
            ghSpawnAttack(p, false);
            break;
        }
        case 'GH_STATE': {
            // ГОСТЬ: состояние мира от хоста
            if (!GH.active || GH.isHost) break;
            ghApplyState(data);
            break;
        }
        case 'GH_END': {
            // ГОСТЬ: хост завершил раунд
            if (!GH.active || GH.isHost) break;
            if (GH.players[0]) GH.players[0].score = data.s0 || 0;
            if (GH.players[1]) GH.players[1].score = data.s1 || 0;
            ghEndRound('host');
            break;
        }
    }
}

function ghSendState(timestamp) {
    if (!net.conn || !net.conn.open) return;
    if (timestamp - GH.lastStateSent < 50) return;
    GH.lastStateSent = timestamp;
    const p0 = GH.players[0], p1 = GH.players[1];
    const msg = {
        type: 'GH_STATE',
        g: GH.ghosts.map(g => [g.id, Math.round(g.x), Math.round(g.y), GH_TYPES.indexOf(g.type), g.hp, g.phased ? 1 : 0, g.dir ? 1 : 0]),
        pr: GH.projs.map(pr => [Math.round(pr.x), Math.round(pr.y), pr.kind === 'yarn' ? 0 : 1, pr.owner]),
        p0: [Math.round(p0.x), Math.round(p0.y), p0.facingRight ? 1 : 0, p0.isMoving ? 1 : 0, p0.weapon],
        s0: p0.score, s1: p1 ? p1.score : 0,
        tm: Math.ceil(GH.timeLeft / 60), wv: GH.wave,
        i0: p0.invuln > 0 ? 1 : 0, i1: (p1 && p1.invuln > 0) ? 1 : 0,
        ev: GH.netEvents,
    };
    GH.netEvents = { kills: [], hits: [] };
    try { net.conn.send(msg); } catch (e) {}
}

function ghApplyState(d) {
    // призраки: lerp по id
    const seen = new Set();
    for (const a of (d.g || [])) {
        const [id, x, y, ti, hp, ph, dir] = a;
        seen.add(id);
        let g = GH.stateGhosts.get(id);
        if (!g) {
            g = { id: id, type: GH_TYPES[ti] || 'wisp', x: x, y: y, vx: 0, vy: 0, hp: hp,
                  scale: GH_GHOSTS[GH_TYPES[ti] || 'wisp'].scale, dead: false,
                  phased: !!ph, phaseTimer: 0, bob: Math.random() * 6, flash: 0, dir: !!dir };
            GH.stateGhosts.set(id, g);
        }
        g._tx = x; g._ty = y; g.hp = hp; g.phased = !!ph; g.dir = !!dir;
    }
    for (const [id] of GH.stateGhosts) if (!seen.has(id)) GH.stateGhosts.delete(id);
    GH.ghosts = Array.from(GH.stateGhosts.values());

    // снаряды — просто заменяем (визуал)
    GH.projs = (d.pr || []).map(a => ({
        kind: a[2] === 0 ? 'yarn' : 'fish', x: a[0], y: a[1], owner: a[3],
        vx: 0, vy: 0, r: 9, rot: gameTime * 0.3, life: 10, out: 0, returning: false, hitIds: [],
    }));

    // кот хоста
    const p0 = GH.players[0];
    if (p0 && d.p0) {
        p0._netX = d.p0[0]; p0._netY = d.p0[1]; p0._netDir = !!d.p0[2];
        p0.isMoving = !!d.p0[3]; p0.weapon = d.p0[4] || 0;
    }
    // счёт / таймер / волна
    const p1 = GH.players[1];
    if (p0) p0.score = d.s0 || 0;
    if (p1) {
        // урон по гостю определяет хост
        const wasInv = p1.invuln > 0;
        if (d.i1 && !wasInv) {
            p1.invuln = 100;
            AudioEngine.sfx.ghHurt && AudioEngine.sfx.ghHurt();
        }
        p1.score = d.s1 || 0;
    }
    if (p0) p0.invuln = d.i0 ? 60 : Math.min(p0.invuln, 0);
    GH.timeLeft = (d.tm || 0) * 60;
    if (d.wv && d.wv !== GH.wave) {
        GH.wave = d.wv; GH.waveAnnounce = 150;
        AudioEngine.sfx.ghWave && AudioEngine.sfx.ghWave();
    }
    // события: вспышки убийств и попаданий
    if (d.ev) {
        for (const k of (d.ev.kills || [])) {
            const col = k[3] === 0 ? '#7df9ff' : '#ffb86c';
            GH.texts.push({ text: '+' + k[2], x: k[0] + 15, y: k[1], alpha: 1, dy: -1.4, size: 13, color: col });
            ghPoof(k[0] + 15, k[1] + 16, '#cfe8ff', 1);
            AudioEngine.sfx.ghGhostDie && AudioEngine.sfx.ghGhostDie();
        }
    }
}

function ghSendPos(timestamp) {
    if (!net.conn || !net.conn.open) return;
    if (timestamp - GH.lastPosSent < net.tickRate) return;
    GH.lastPosSent = timestamp;
    const p = GH.players[GH.localIdx];
    if (!p) return;
    try {
        net.conn.send({ type: 'GH_POS', x: Math.round(p.x), y: Math.round(p.y), dir: p.facingRight, w: p.weapon });
    } catch (e) {}
}

// ============================================================
// ГЛАВНЫЙ ЦИКЛ
// ============================================================
function ghLoop(timestamp) {
    if (!GH.active) return;
    ghAnimationId = requestAnimationFrame(ghLoop);
    try {
        let dt = timestamp - lastTime;
        lastTime = timestamp;
        if (dt > 100) dt = 100;
        const ts = dt / 16.666;
        gameTime += ts;   // двигает анимации котов (drawPixelCat)

        if (!GH.over) {
            GH.elapsed += ts;

            // Волны сложности
            const newWave = Math.floor(GH.elapsed / GH_WAVE_LEN) + 1;
            if (newWave !== GH.wave && (!GH.online || GH.isHost)) {
                GH.wave = newWave;
                GH.waveAnnounce = 150;
                AudioEngine.sfx.ghWave && AudioEngine.sfx.ghWave();
            }

            // Таймер дуэли
            if (GH.mode === 'duo' && (!GH.online || GH.isHost)) {
                GH.timeLeft -= ts;
                if (GH.timeLeft <= 0) { GH.timeLeft = 0; ghEndRound('time'); }
            }

            // Спавн призраков (хост / локально)
            if (!GH.online || GH.isHost) {
                GH.spawnTimer -= ts;
                const maxGhosts = Math.min(4 + GH.wave * 2, 18);
                if (GH.spawnTimer <= 0 && GH.ghosts.length < maxGhosts) {
                    ghSpawnGhost();
                    GH.spawnTimer = Math.max(30, 110 - GH.wave * 12 - GH.elapsed / 600);
                }
                ghUpdateGhosts(ts);
                ghUpdateProjs(ts);
            } else {
                // гость: визуальная интерполяция призраков
                for (const g of GH.ghosts) {
                    if (g._tx !== undefined) {
                        g.x = lerp(g.x, g._tx, Math.min(0.35 * ts, 1));
                        g.y = lerp(g.y, g._ty, Math.min(0.35 * ts, 1));
                    }
                    g.bob += 0.06 * ts;
                }
            }

            // Игроки
            for (const p of GH.players) ghUpdatePlayer(p, ts);

            // Онлайн-обмен
            if (GH.online && net.conn && net.conn.open) {
                if (GH.isHost) ghSendState(timestamp);
                else ghSendPos(timestamp);
            } else if (GH.online) {
                // соединение потеряно
                ghEndRound('disconnect');
            }
        }

        // Эффекты и тексты
        for (let i = GH.fx.length - 1; i >= 0; i--) {
            const f = GH.fx[i];
            f.life -= ts;
            if (f.kind === 'poof') { f.x += f.vx * ts; f.y += f.vy * ts; }
            if (f.life <= 0) GH.fx.splice(i, 1);
        }
        for (let i = GH.texts.length - 1; i >= 0; i--) {
            const ft = GH.texts[i];
            ft.y += ft.dy * ts; ft.alpha -= 0.018 * ts;
            if (ft.alpha <= 0) GH.texts.splice(i, 1);
        }
        if (GH.waveAnnounce > 0) GH.waveAnnounce -= ts;

        ghRender();
        ghUpdateAtkCD();
    } catch (e) {
        if (!window._ghErrLogged) { console.error('[GhostHunt] ошибка кадра:', e); window._ghErrLogged = true; }
    }
}

// ============================================================
// РЕНДЕР
// ============================================================
function ghRender() {
    const scrW = LOGICAL_W, scrH = LOGICAL_H;
    const sc = Math.min(scrW / GH_VW, scrH / GH_VH);
    const ox = (scrW - GH_VW * sc) / 2, oy = (scrH - GH_VH * sc) / 2;

    // Фон-заливка всего экрана (за пределами арены)
    ctx.setTransform(RS, 0, 0, RS, 0, 0);
    ctx.fillStyle = '#06060d';
    ctx.fillRect(0, 0, scrW, scrH);

    // Переход в координаты арены
    ctx.setTransform(sc * RS, 0, 0, sc * RS, ox * RS, oy * RS);

    ghDrawBackground();

    // Платформы
    for (const pl of GH_PLATFORMS) ghDrawPlatform(pl);

    // Снаряды (за призраками)
    for (const pr of GH.projs) ghDrawProj(pr);

    // Призраки
    for (const g of GH.ghosts) ghDrawGhost(g);

    // Игроки
    for (const p of GH.players) {
        if (GH.mode === 'solo' && p.lives <= 0) continue;
        const blink = p.invuln > 0 && Math.floor(gameTime / 4) % 2 === 0;
        if (blink) continue;
        drawPixelCat(ctx, p.x, p.y, p.skin, p.facingRight, null, p.idx === 0, !p.onGround, p.isMoving);
        // маркер игрока над головой
        ctx.fillStyle = p.idx === 0 ? '#7df9ff' : '#ffb86c';
        ctx.font = "8px 'Press Start 2P', monospace";
        ctx.textAlign = 'center';
        ctx.fillText('P' + (p.idx + 1), p.x + 15, p.y - (p.skin.hat ? 30 : 12));
    }

    // Эффекты
    for (const f of GH.fx) ghDrawFx(f);

    // Всплывающие очки
    for (const ft of GH.texts) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = (ft.size || 13) + "px 'Press Start 2P', monospace";
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000';
        ctx.fillText(ft.text, ft.x + 1.5, ft.y + 1.5);
        ctx.fillStyle = ft.color || '#fff';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
    }

    ghDrawHUD(sc, ox, oy);
}

// ── Ночной призрачный лес ──
function ghDrawBackground() {
    // градиент неба
    let grad = ctx.createLinearGradient(0, 0, 0, GH_VH);
    grad.addColorStop(0, '#07070f');
    grad.addColorStop(0.55, '#12102a');
    grad.addColorStop(1, '#1d1a35');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GH_VW, GH_VH);

    // звёзды
    for (let i = 0; i < 50; i++) {
        const on = Math.sin(gameTime * 0.03 + i * 1.7) > 0.2;
        ctx.fillStyle = on ? '#cfd6ff' : '#56588a';
        const sx = (i * 191 + 37) % (GH_VW - 12) + 6;
        const sy = (i * 83 + 19) % (GH_VH * 0.55) + 8;
        ctx.fillRect(sx, sy, on ? 3 : 2, on ? 3 : 2);
    }

    // бледная луна
    drawSun(ctx, GH_VW - 230, 130, 44, '#e8e8ff', '#b9b9e0');
    // кратеры на луне
    ctx.fillStyle = 'rgba(150,150,200,0.45)';
    ctx.fillRect(GH_VW - 250, 110, 12, 12);
    ctx.fillRect(GH_VW - 218, 142, 9, 9);
    ctx.fillRect(GH_VW - 240, 150, 7, 7);

    // силуэты мёртвого леса (задний план)
    ctx.fillStyle = '#0c0c1a';
    for (let i = 0; i < 14; i++) {
        const tx = (i * 137) % GH_VW;
        const th = 110 + ((i * 53) % 90);
        ctx.fillRect(tx, GH_GROUND - th, 10, th);
        ctx.fillRect(tx - 14, GH_GROUND - th + 24, 14, 6);
        ctx.fillRect(tx + 10, GH_GROUND - th + 44, 16, 6);
        ctx.fillRect(tx - 8, GH_GROUND - th + 70, 8, 5);
    }

    // могилки и черепа на земле (декор)
    const decor = [180, 560, 980, 1370];
    for (let i = 0; i < decor.length; i++) {
        const dx = decor[i];
        ctx.fillStyle = '#2c2c44';
        ctx.fillRect(dx, GH_GROUND - 34, 30, 34);
        ctx.fillRect(dx + 4, GH_GROUND - 40, 22, 8);
        ctx.fillStyle = '#3c3c58';
        ctx.fillRect(dx + 4, GH_GROUND - 30, 22, 4);
        ctx.fillStyle = '#1c1c30';
        ctx.fillRect(dx + 8, GH_GROUND - 22, 14, 3);
        ctx.fillRect(dx + 11, GH_GROUND - 25, 8, 9);
    }

    // земля
    ctx.fillStyle = '#15151f';
    ctx.fillRect(0, GH_GROUND, GH_VW, GH_VH - GH_GROUND);
    ctx.fillStyle = '#262640';
    ctx.fillRect(0, GH_GROUND, GH_VW, 14);
    ctx.fillStyle = '#3a3a5e';
    ctx.fillRect(0, GH_GROUND + 11, GH_VW, 3);
    // трава-ворс
    ctx.fillStyle = '#30305a';
    for (let gx = 0; gx < GH_VW; gx += 26) ctx.fillRect(gx, GH_GROUND - 4, 5, 4);

    // туман (анимированные полосы)
    for (let i = 0; i < 3; i++) {
        const fy = GH_GROUND - 50 - i * 26;
        const off = Math.sin(gameTime * 0.008 + i * 2.0) * 120;
        ctx.fillStyle = 'rgba(160,160,220,' + (0.05 + i * 0.015) + ')';
        ctx.fillRect(off - 100, fy, GH_VW + 240, 18);
    }
}

function ghDrawPlatform(pl) {
    // призрачная каменная плита
    ctx.fillStyle = 'rgba(120,120,190,0.18)';
    ctx.fillRect(pl.x - 4, pl.y - 4, pl.w + 8, 30);
    ctx.fillStyle = '#34345a';
    ctx.fillRect(pl.x, pl.y, pl.w, 22);
    ctx.fillStyle = '#52528a';
    ctx.fillRect(pl.x, pl.y, pl.w, 5);
    ctx.fillStyle = '#26264a';
    for (let bx = pl.x + 12; bx < pl.x + pl.w - 12; bx += 46) ctx.fillRect(bx, pl.y + 9, 22, 4);
}

// ── Кото-призрак (враг) ──
function ghDrawGhost(g) {
    const def = GH_GHOSTS[g.type];
    const s = 3 * g.scale;
    const bobY = Math.sin(g.bob) * 3;
    let alpha = g.phased ? 0.15 : 0.82;
    if (g.flash > 0) alpha = 1;

    ctx.save();
    ctx.translate(g.x + 5 * s, g.y + bobY);
    if (!g.dir) ctx.scale(-1, 1);
    ctx.globalAlpha = alpha;

    const body = g.flash > 0 ? '#ffffff' : def.body;
    const dX = -5 * s;

    // свечение-аура
    ctx.fillStyle = 'rgba(170,200,255,0.12)';
    ctx.fillRect(dX - 1.5 * s, -3.5 * s, 13 * s, 15 * s);

    // хвост-завиток
    ctx.fillStyle = def.dark;
    for (let i = 0; i < 4; i++) {
        const wag = Math.sin(gameTime * 0.18 + i * 0.6) * 0.6 * s;
        ctx.fillRect(dX - (2 + i * 1.3) * s + wag, 5 * s - i * 1.2 * s, 1.8 * s, 1.8 * s);
    }

    // тело + голова единым «привидением»
    ctx.fillStyle = body;
    ctx.fillRect(dX, 0, 10 * s, 9 * s);
    // уши
    ctx.fillRect(dX, -2 * s, 3 * s, 2 * s);
    ctx.fillRect(dX, -3 * s, 1 * s, 1 * s);
    ctx.fillRect(dX + 7 * s, -2 * s, 3 * s, 2 * s);
    ctx.fillRect(dX + 9 * s, -3 * s, 1 * s, 1 * s);
    // волнистый низ (3 зубца, анимированы)
    const ph = Math.floor(gameTime / 10) % 2;
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(dX + i * 2 * s, 9 * s + ((i + ph) % 2) * s, 2 * s, 1.6 * s);
    }

    // глаза — светящиеся
    ctx.fillStyle = def.eye;
    ctx.fillRect(dX + 2 * s, 2 * s, 2 * s, 2 * s);
    ctx.fillRect(dX + 6.5 * s, 2 * s, 2 * s, 2 * s);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(dX + 2 * s, 2 * s, 1 * s, 1 * s);
    ctx.fillRect(dX + 6.5 * s, 2 * s, 1 * s, 1 * s);
    // рот «о»
    ctx.fillStyle = def.dark;
    ctx.fillRect(dX + 4.5 * s, 5 * s, 1.4 * s, 1.4 * s);

    // полоса HP у толстяков / фантомов
    if (def.hp > 1 && g.hp < def.hp && !g.phased) {
        ctx.fillStyle = '#222';
        ctx.fillRect(dX, -5 * s, 10 * s, 1.2 * s);
        ctx.fillStyle = '#c77dff';
        ctx.fillRect(dX, -5 * s, 10 * s * (g.hp / def.hp), 1.2 * s);
    }
    ctx.restore();
}

function ghDrawProj(pr) {
    ctx.save();
    if (pr.kind === 'yarn') {
        ctx.translate(pr.x, pr.y);
        ctx.rotate(pr.rot);
        ctx.fillStyle = '#ff6b9d';
        ctx.fillRect(-8, -8, 16, 16);
        ctx.fillStyle = '#e0487e';
        ctx.fillRect(-8, -2, 16, 3);
        ctx.fillRect(-2, -8, 3, 16);
        ctx.fillStyle = '#ffa8c8';
        ctx.fillRect(-5, -5, 4, 4);
    } else if (pr.kind === 'fish') {
        ctx.translate(pr.x, pr.y);
        ctx.rotate(pr.rot);
        ctx.fillStyle = '#ffa726';
        ctx.fillRect(-10, -6, 20, 12);
        ctx.fillStyle = '#f57c00';
        ctx.fillRect(-15, -4, 5, 8);
        ctx.fillStyle = '#fff';
        ctx.fillRect(4, -4, 4, 4);
        ctx.fillStyle = '#000';
        ctx.fillRect(6, -3, 2, 2);
    }
    ctx.restore();
}

function ghDrawFx(f) {
    const k = f.life / f.max;
    ctx.save();
    if (f.kind === 'slash') {
        ctx.globalAlpha = Math.max(0, k);
        ctx.translate(f.x, f.y);
        if (f.dir < 0) ctx.scale(-1, 1);
        // разрезы лапы: 3 СКРУГЛЁННЫЕ дуги (как нарисовано), по пол-радиуса, слегка за головой кота
        const acx = -30, acy = 0, a0 = -0.62, a1 = 0.62;   // центр дуг позади кота, разворот вперёд
        ctx.lineCap = 'round';
        // мягкий голубой след
        ctx.globalAlpha = Math.max(0, k * 0.30);
        ctx.strokeStyle = '#7df9ff'; ctx.lineWidth = 11;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(acx, acy, 48 + i * 9, a0, a1); ctx.stroke(); }
        // белые скруглённые разрезы
        ctx.globalAlpha = Math.max(0, k);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(acx, acy, 48 + i * 9, a0, a1); ctx.stroke(); }
        ctx.lineCap = 'butt';
    } else if (f.kind === 'laser') {
        ctx.globalAlpha = Math.max(0, k);
        const x1 = Math.min(f.x, f.x2), x2 = Math.max(f.x, f.x2);
        ctx.fillStyle = 'rgba(255,60,60,0.35)';
        ctx.fillRect(x1, f.y - 8, x2 - x1, 16);
        ctx.fillStyle = '#ff3c3c';
        ctx.fillRect(x1, f.y - 3, x2 - x1, 6);
        ctx.fillStyle = '#fff';
        ctx.fillRect(x1, f.y - 1, x2 - x1, 2);
        // точка-указка на конце
        ctx.fillStyle = '#ff3c3c';
        ctx.fillRect((f.x2 > f.x ? x2 - 8 : x1), f.y - 6, 8, 12);
    } else if (f.kind === 'poof') {
        ctx.globalAlpha = Math.max(0, k * 0.9);
        ctx.fillStyle = f.color;
        ctx.fillRect(f.x, f.y, f.size, f.size);
    }
    ctx.restore();
}

// ── HUD (в экранных координатах) ──
function ghDrawHUD(sc, ox, oy) {
    ctx.setTransform(RS, 0, 0, RS, 0, 0);
    const W = LOGICAL_W;
    const F = "px 'Press Start 2P', monospace";
    ctx.textAlign = 'left';

    const p1 = GH.players[0], p2 = GH.players[1];
    const lx = isMobile ? 72 : 18;   // сдвиг под кнопку выхода (ESC) на мобиле

    // — P1 счёт (слева сверху)
    ghHudText(t('ghosthunt.score') + ' ' + p1.score, lx, 30, 13, '#7df9ff');
    if (GH.mode === 'solo') {
        // сердца
        for (let i = 0; i < GH_SOLO_LIVES; i++) {
            ghDrawHeart(lx + 2 + i * 26, 44, i < p1.lives);
        }
        // рекорд
        ghHudText(t('ghosthunt.record') + ' ' + Math.max(ghostHighScore, p1.score), lx, 84, 8, '#aaa');
    } else if (p2) {
        // — P2 счёт (справа сверху)
        ctx.textAlign = 'right';
        ghHudText(t('ghosthunt.score') + ' ' + p2.score, W - 18, 30, 13, '#ffb86c', 'right');
        ctx.textAlign = 'left';
        // — таймер по центру
        const secs = Math.max(0, Math.ceil(GH.timeLeft / 60));
        const mm = Math.floor(secs / 60), ss = ('0' + (secs % 60)).slice(-2);
        ghHudText(mm + ':' + ss, W / 2, 36, 20, secs <= 10 ? '#ff5566' : '#fff', 'center');
    }

    // — волна (справа, под счётом P2 или сверху)
    ctx.textAlign = 'right';
    ghHudText(t('ghosthunt.wave') + ' ' + GH.wave, W - 18, GH.mode === 'duo' ? 52 : 30, 10, '#a88beb', 'right');
    ctx.textAlign = 'left';

    // — анонс волны по центру
    if (GH.waveAnnounce > 0 && GH.wave > 1) {
        const a = Math.min(1, GH.waveAnnounce / 60);
        ctx.globalAlpha = a;
        ghHudText(t('ghosthunt.wave') + ' ' + GH.wave + '!', W / 2, LOGICAL_H * 0.3, 26, '#a88beb', 'center');
        ctx.globalAlpha = 1;
    }

    // — панели оружия (инвентарь): слева снизу, с индикатором перезарядки
    ghDrawWeaponBar(p1, 18, LOGICAL_H - 64, true);
    if (p2 && !GH.online) ghDrawWeaponBar(p2, W - 18 - ((p2.loadout ? p2.loadout.length : 2) * 52), LOGICAL_H - 64, false);
    else if (p2 && GH.online && GH.localIdx === 1) ghDrawWeaponBar(p2, 18, LOGICAL_H - 64, true);

    // подсказка управления (первые секунды)
    if (GH.elapsed < 480 && !GH.online) {
        ctx.globalAlpha = Math.min(1, (480 - GH.elapsed) / 120);
        ghHudText(t('ghosthunt.controls1'), W / 2, LOGICAL_H - 96, 8, '#ccc', 'center');
        if (GH.mode === 'duo') ghHudText(t('ghosthunt.controls2'), W / 2, LOGICAL_H - 80, 8, '#ccc', 'center');
        ctx.globalAlpha = 1;
    } else if (GH.elapsed < 480 && GH.online) {
        ctx.globalAlpha = Math.min(1, (480 - GH.elapsed) / 120);
        ghHudText(t('ghosthunt.controls1'), W / 2, LOGICAL_H - 96, 8, '#ccc', 'center');
        ctx.globalAlpha = 1;
    }
}

function ghHudText(text, x, y, size, color, align) {
    ctx.font = size + "px 'Press Start 2P', monospace";
    ctx.textAlign = align || 'left';
    ctx.fillStyle = '#000';
    ctx.fillText(text, x + 2, y + 2);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.textAlign = 'left';
}

function ghDrawHeart(x, y, full) {
    ctx.fillStyle = full ? '#ff5566' : '#3a2030';
    ctx.fillRect(x, y, 7, 7);
    ctx.fillRect(x + 9, y, 7, 7);
    ctx.fillRect(x - 2, y + 4, 20, 6);
    ctx.fillRect(x + 1, y + 10, 14, 4);
    ctx.fillRect(x + 4, y + 14, 8, 3);
    if (full) {
        ctx.fillStyle = '#ff99aa';
        ctx.fillRect(x + 1, y + 1, 3, 3);
    }
}

function ghDrawWeaponBar(p, x, y, showKeys) {
    const local = ghIsLocal(p);
    const lo = (p.loadout && p.loadout.length) ? p.loadout : [p.weapon];
    for (let s = 0; s < lo.length; s++) {
        const wi = lo[s];
        const sel = p.weapon === wi;
        const bx = x + s * 52;
        ctx.fillStyle = sel ? 'rgba(125,249,255,0.18)' : 'rgba(0,0,0,0.45)';
        ctx.fillRect(bx, y, 46, 46);
        ctx.strokeStyle = sel ? '#7df9ff' : '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx + 1, y + 1, 44, 44);
        ghDrawWeaponIcon(GH_WEAPONS[wi].id, bx + 23, y + 22);
        if (showKeys && local) {
            ctx.font = "7px 'Press Start 2P', monospace";
            ctx.fillStyle = sel ? '#7df9ff' : '#888';
            ctx.textAlign = 'center';
            ctx.fillText(String(s + 1), bx + 23, y + 42);
            ctx.textAlign = 'left';
        }
        if (sel && p.cd > 0 && local) {
            const frac = Math.max(0, Math.min(1, p.cd / GH_WEAPONS[wi].cd));
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(bx, y + 46 * (1 - frac), 46, 46 * frac);
        }
    }
    // имя выбранного оружия
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.fillStyle = p.idx === 0 ? '#7df9ff' : '#ffb86c';
    ctx.fillText(t(GH_WEAPONS[p.weapon].nameKey), x, y - 8);
}

function ghDrawWeaponIcon(id, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    if (id === 'claw') {
        ctx.fillStyle = '#fff';
        ctx.fillRect(-12, -10, 5, 8); ctx.fillRect(-7, -2, 5, 8);
        ctx.fillRect(-2, -12, 5, 8); ctx.fillRect(3, -4, 5, 10);
        ctx.fillStyle = '#7df9ff';
        ctx.fillRect(8, -10, 4, 6);
    } else if (id === 'yarn') {
        ctx.fillStyle = '#ff6b9d';
        ctx.fillRect(-9, -9, 18, 18);
        ctx.fillStyle = '#e0487e';
        ctx.fillRect(-9, -2, 18, 3); ctx.fillRect(-2, -9, 3, 18);
        ctx.fillStyle = '#ffa8c8';
        ctx.fillRect(-6, -6, 4, 4);
    } else if (id === 'fish') {
        ctx.fillStyle = '#ffa726';
        ctx.fillRect(-7, -5, 16, 10);
        ctx.fillStyle = '#f57c00';
        ctx.fillRect(-12, -3, 5, 6);
        ctx.fillStyle = '#fff';
        ctx.fillRect(4, -3, 3, 3);
        ctx.fillStyle = '#000';
        ctx.fillRect(5, -2, 2, 2);
    } else if (id === 'laser') {
        ctx.fillStyle = '#666';
        ctx.fillRect(-10, -3, 12, 8);
        ctx.fillStyle = '#999';
        ctx.fillRect(-10, -3, 12, 3);
        ctx.fillStyle = '#ff3c3c';
        ctx.fillRect(2, -1, 10, 3);
        ctx.fillStyle = '#fff';
        ctx.fillRect(8, 0, 4, 1);
    }
    ctx.restore();
}

// ============================================================
// МОБИЛЬНЫЕ КНОПКИ (создаются один раз, показываются в режиме).
// Позиции управляются редактором расположения (controls.js):
// ключи ghAtk1 / ghWpn1 / ghAtk2 в общем layout.
// ============================================================
function ghEnsureMobileButtons() {
    if (document.getElementById('gh-mob-atk1')) return;
    const layer = document.getElementById('mobile-controls-layer');
    if (!layer) return;
    const mk = (id, size) => {
        const b = document.createElement('button');
        b.id = id; b.className = 'touch-btn gh-touch-btn';
        b.style.cssText = 'display:none;position:absolute;width:' + size + 'px;height:' + size + 'px;' +
            'z-index:210;pointer-events:auto;image-rendering:pixelated;' +
            'background:rgba(58,32,96,0.65);border:3px solid #a88beb;color:#e8dcff;' +
            'box-shadow:3px 3px 0 #000;font-family:\'Press Start 2P\',cursive;font-size:9px;';
        layer.appendChild(b);
        return b;
    };
    // P1 атака (большая) + смена оружия (рядом)
    const atk1 = mk('gh-mob-atk1', 88);
    atk1.innerHTML = IconGenerator.html('swords', '36px') + GH_CD_OVERLAY;
    const wpn1 = mk('gh-mob-wpn1', 60);
    wpn1.innerHTML = _ghWpnHtml(null);
    // P2 атака + смена оружия (локальная дуэль)
    const atk2 = mk('gh-mob-atk2', 88);
    atk2.innerHTML = IconGenerator.html('swords', '36px') + GH_CD_OVERLAY;
    const wpn2 = mk('gh-mob-wpn2', 60);
    wpn2.innerHTML = _ghWpnHtml(null);
    // Кнопка выхода (ESC) — фиксированно в левом верхнем углу
    const ext = mk('gh-mob-exit', 46);
    ext.style.position = 'fixed'; ext.style.left = '8px'; ext.style.top = '8px'; ext.style.fontSize = '10px';
    ext.textContent = 'ESC';

    atk1.addEventListener('pointerdown', (e) => { e.preventDefault(); const p = GH.players[GH.online ? GH.localIdx : 0]; if (p) ghTryAttack(p); });
    atk2.addEventListener('pointerdown', (e) => { e.preventDefault(); const p = GH.players[1]; if (p && !GH.online) ghTryAttack(p); });
    wpn1.addEventListener('pointerdown', (e) => { e.preventDefault(); const p = GH.players[GH.online ? GH.localIdx : 0]; if (p) { ghSwitchWeapon(p, 1); wpn1.innerHTML = _ghWpnHtml(p); } });
    wpn2.addEventListener('pointerdown', (e) => { e.preventDefault(); const p = GH.players[1]; if (p && !GH.online) { ghSwitchWeapon(p, 1); wpn2.innerHTML = _ghWpnHtml(p); } });
    ext.addEventListener('pointerdown', (e) => { e.preventDefault(); ghExitToMenu(); });
}

// Подпись кнопки смены оружия: иконка + номер текущего оружия
function _ghWpnHtml(p) {
    return IconGenerator.html('rotate', '18px') + '<div style="font-size:9px;margin-top:2px;">' + ((p ? (p.weapon | 0) : 0) + 1) + '</div>';
}
// Кнопку оружия приставляем вплотную к кнопке атаки (следует за её положением)
function _ghPlaceWpn(wpnId, atkId) {
    const w = document.getElementById(wpnId), a = document.getElementById(atkId);
    if (!w || !a) return;
    const al = parseFloat(a.style.left), at = parseFloat(a.style.top);
    if (isNaN(al) || isNaN(at)) return;
    const asz = 88, wsz = 60;
    let lx = al - wsz - 6;
    if (lx < 4) lx = al + asz + 6;
    w.style.position = 'absolute';
    w.style.left = lx + 'px';
    w.style.top = (at + (asz - wsz) / 2) + 'px';
    w.style.bottom = 'unset'; w.style.right = 'unset';
    w.style.transform = a.style.transform || '';
}

function ghUpdateAtkCD() {
    if (!isMobile) return;
    const upd = (id, p) => {
        const b = document.getElementById(id); if (!b) return;
        const ov = b.querySelector('.gh-cd'); if (!ov) return;
        const max = p ? GH_WEAPONS[p.weapon].cd : 0;
        const frac = (p && max > 0) ? Math.max(0, Math.min(1, p.cd / max)) : 0;
        ov.style.height = (frac * 100) + '%';
    };
    upd('gh-mob-atk1', GH.players[GH.online ? GH.localIdx : 0]);
    if (GH.mode === 'duo' && !GH.online) upd('gh-mob-atk2', GH.players[1]);
}

function ghShowMobileButtons(show) {
    ghEnsureMobileButtons();
    // применяем сохранённое расположение из редактора кнопок
    if (typeof applyLayout === 'function' && typeof loadLayout === 'function') applyLayout(loadLayout());
    const a1 = document.getElementById('gh-mob-atk1');
    const a2 = document.getElementById('gh-mob-atk2');
    const w1 = document.getElementById('gh-mob-wpn1');
    const w2 = document.getElementById('gh-mob-wpn2');
    const ext = document.getElementById('gh-mob-exit');
    const jm = document.getElementById('joy-menu');
    if (jm && show && isMobile) jm.style.display = 'none'; // в охоте свой ESC (слева сверху)
    const vis = (show && isMobile) ? 'block' : 'none';
    if (a1) a1.style.display = vis;
    if (ext) ext.style.display = vis;
    if (w1) { w1.style.display = vis; w1.innerHTML = _ghWpnHtml(GH.players[GH.online ? GH.localIdx : 0]); }
    const duoVis = (show && isMobile && GH.mode === 'duo' && !GH.online) ? 'block' : 'none';
    if (a2) a2.style.display = duoVis;
    if (w2) { w2.style.display = duoVis; w2.innerHTML = _ghWpnHtml(GH.players[1]); }
    // оружие-кнопки приставляем к кнопкам атаки (после применения раскладки)
    _ghPlaceWpn('gh-mob-wpn1', 'gh-mob-atk1');
    if (GH.mode === 'duo' && !GH.online) _ghPlaceWpn('gh-mob-wpn2', 'gh-mob-atk2');
}

// ============================================================
// ТЕКСТЫ (вызывается из updateAllTexts и при открытии экрана)
// ============================================================
function updateGhostHuntTexts() {
    safeSetText('btn-ghosthunt', t('ghosthunt.btn'));
    safeSetText('gh-title', t('ghosthunt.name'));
    safeSetText('btn-gh-solo', t('ghosthunt.solo'));
    safeSetText('btn-gh-duo', t('ghosthunt.duo'));
    safeSetText('btn-gh-layout', t('ghosthunt.layoutBtn'));
    safeSetText('btn-gh-layout2', t('ghosthunt.layoutBtn2'));
    safeSetText('btn-gh-back', '← ' + t('back'));
    // Акцент: «как играть» и «управление»
    safeSetText('gh-howto-title', t('ghosthunt.howtoTitle'));
    safeSetHTML('gh-howto', t('ghosthunt.howto'));
    safeSetText('gh-controls-title', t('ghosthunt.controlsTitle'));
    safeSetHTML('gh-controls', t('ghosthunt.controlsInfo'));
    ghRenderLoadout();
    const ghOwned = (typeof unlockedSkins !== 'undefined' && unlockedSkins.includes('ghost'));
    safeSetText('gh-skin-promo', ghOwned ? t('ghosthunt.skinReady') : t('ghosthunt.skinHint'));
    const rec = document.getElementById('gh-record');
    if (rec) rec.innerText = t('ghosthunt.record') + ' ' + ghostHighScore;
    safeSetText('gh-btn-again', t('ghosthunt.again'));
    safeSetText('gh-btn-menu', t('menuBtn'));
}

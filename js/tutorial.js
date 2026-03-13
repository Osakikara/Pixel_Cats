// ============================================================
// TUTORIAL — First-time onboarding
//
// Зависимости (должны быть загружены раньше):
//   drawPixelCat(), SKINS[], gameTime, t(), currentLang
//
// Порядок в index.html:
//   ... game.js → boss.js → [tutorial.js] → accounts.js → main.js
// ============================================================

const TUTORIAL_KEY = 'pixelCatsTutorialDone_v4';

const TutorialSystem = (() => {

    // ── state ──────────────────────────────────────────────
    let _step    = 0;
    let _el      = null;
    let _animId  = null;
    let _tt      = 0;   // локальный счётчик времени для анимаций

    const STEPS = ['welcome','movement','collect','modes','controls','shop','online','ready'];

    // Имена шагов (t() в language.js не содержит .stepname, поэтому хардкод)
    const _NAMES = {
        ru: ['ДОБРО ПОЖАЛОВАТЬ','УПРАВЛЕНИЕ','РЫБКИ','РЕЖИМЫ','КНОПКИ','МАГАЗИН','ОНЛАЙН','ГОТОВО'],
        en: ['WELCOME','MOVEMENT','COLLECT','MODES','CONTROLS','SHOP','ONLINE','READY'],
    };

    // ── public API ─────────────────────────────────────────
    function shouldShow() { return !localStorage.getItem(TUTORIAL_KEY); }
    function show()  { if (_el) return; _step = 0; _inject(); _render(); AudioEngine.startMenuMusic(); }
    function skip()  { _done(); }
    function next()  { _step < STEPS.length - 1 ? (_step++, _render()) : _done(); }
    function prev()  { _step > 0 && (_step--, _render()); }
    function goTo(i) { _step = i; _render(); }

    // ── CSS ────────────────────────────────────────────────
    function _injectCSS() {
        if (document.getElementById('tut-css')) return;
        const s = document.createElement('style');
        s.id = 'tut-css';
        s.textContent = `
/* ── overlay ── */
#tut-ov {
    position:fixed;inset:0;z-index:9999;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,.68);
    touch-action:manipulation;
    backdrop-filter:blur(2px);
}
/* ── main box — стиль #start-screen (полупрозрачный, светлее) ── */
#tut-box {
    position:relative;
    background:rgba(5,8,28,0.78);
    border:4px solid #fff;
    box-shadow:8px 8px 0 #000;
    width:min(520px,95vw);
    max-height:95vh;
    overflow:hidden;
    font-family:'Press Start 2P',cursive;
    animation:tut-pop .16s ease-out;
    pointer-events:auto;
    backdrop-filter:blur(4px);
}
@keyframes tut-pop{
    from{transform:scale(.88) translateY(8px);opacity:0}
    to  {transform:scale(1)   translateY(0);  opacity:1}
}
/* Controls step: фиолетовый пульс как Settings */
#tut-box.tut-ctrl {
    border-color:#8e44ad;
    animation:tut-ctrl-pulse 1.3s ease-in-out infinite;
}
@keyframes tut-ctrl-pulse{
    0%,100%{box-shadow:8px 8px 0 #000,0 0 14px rgba(142,68,173,.35)}
    50%    {box-shadow:8px 8px 0 #000,0 0 28px rgba(142,68,173,.75)}
}
/* ── canvas visual area ── */
#tut-vis{
    width:100%;height:172px;display:block;overflow:hidden;
    border-bottom:4px solid rgba(40,45,90,0.9);
    background:#87ceeb;
}
#tut-vis canvas{
    display:block;width:100%;height:100%;
    image-rendering:pixelated;
}
/* ── header strip ── */
#tut-hdr{
    padding:8px 14px 6px;
    background:rgba(15,18,52,0.75);border-bottom:2px solid rgba(50,55,110,0.8);
    display:flex;align-items:center;justify-content:space-between;
}
#tut-num {font-size:7px;color:#667;text-shadow:1px 1px 0 #000;letter-spacing:1px;}
#tut-nm  {font-size:7px;color:#ffd700;text-shadow:2px 2px 0 #000;text-transform:uppercase;letter-spacing:1px;}
/* ── body ── */
#tut-body{padding:14px 18px 10px;min-height:76px;}
#tut-title{
    font-size:clamp(9px,2.1vw,11px);color:#ffd700;
    text-shadow:2px 2px 0 #000;margin-bottom:9px;
    line-height:1.75;text-transform:uppercase;letter-spacing:1px;
}
#tut-desc{
    font-size:clamp(7px,1.6vw,8px);color:#dde;
    line-height:2.3;text-shadow:1px 1px 0 #000;
}
#tut-desc .hl {color:#ffd700;}
#tut-desc .gr {color:#2ecc71;}
#tut-desc .bl {color:#29b6f6;}
#tut-desc .or {color:#ffa726;}
#tut-desc .pur{color:#c39bd3;}
/* key badge — идентично .key-badge */
#tut-desc kbd{
    display:inline-block;background:#4a4a5a;color:#fff;
    padding:1px 4px;border:1px solid rgba(255,255,255,0.7);border-radius:2px;
    font-family:'Press Start 2P',cursive;font-size:7px;
    margin:0 1px;text-shadow:none;
}
/* ── footer ── */
#tut-foot{
    padding:9px 14px 13px;border-top:2px solid rgba(50,55,110,0.8);
    background:rgba(10,14,42,0.82);
    display:flex;align-items:center;justify-content:space-between;
}
/* dots — пиксельные квадраты */
#tut-dots{display:flex;gap:6px;align-items:center;}
.tut-dot{
    width:8px;height:8px;background:rgba(80,85,140,0.6);cursor:pointer;
    box-shadow:1px 1px 0 #000;transition:background .1s;
}
.tut-dot.on{background:#ffd700;box-shadow:2px 2px 0 #000;}
.tut-dot:hover:not(.on){background:rgba(130,135,190,0.7);}
/* nav buttons — точный стиль .btn */
#tut-nav{display:flex;gap:8px;align-items:center;}
#tut-skip{
    font-family:'Press Start 2P',cursive;font-size:7px;color:#999;
    background:rgba(40,40,60,0.7);border:2px solid rgba(120,120,160,0.6);box-shadow:2px 2px 0 #000;
    padding:5px 8px;cursor:pointer;text-transform:uppercase;
}
#tut-skip:hover{color:#ddd;border-color:rgba(200,200,220,0.8);}
#tut-skip:active{transform:translate(1px,1px);box-shadow:1px 1px 0 #000;}
#tut-prev{
    font-family:'Press Start 2P',cursive;font-size:9px;color:#ddd;
    background:rgba(50,50,80,0.75);border:4px solid rgba(180,180,200,0.7);box-shadow:4px 4px 0 #000;
    padding:10px 12px;cursor:pointer;text-transform:uppercase;
}
#tut-prev:hover:not(:disabled){background:rgba(80,80,120,0.85);}
#tut-prev:active:not(:disabled){transform:translate(2px,2px);box-shadow:2px 2px 0 #000;}
#tut-prev:disabled{opacity:.2;cursor:default;pointer-events:none;}
#tut-next{
    font-family:'Press Start 2P',cursive;font-size:9px;color:#fff;
    background:#c0392b;border:4px solid #fff;box-shadow:4px 4px 0 #000;
    padding:10px 14px;cursor:pointer;text-transform:uppercase;
}
#tut-next:hover{background:#e74c3c;}
#tut-next:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #000;}
#tut-next.fin{background:#27ae60;border-color:#2ecc71;}
#tut-next.fin:hover{background:#2ecc71;}
/* slide-in */
.tut-slide{animation:tut-sl .17s ease-out;}
/* fullscreen popup */
#tut-fs-popup{
    display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    z-index:10100;
    background:rgba(5,8,28,0.96);border:4px solid #ffd700;box-shadow:6px 6px 0 #000;
    padding:20px 24px;text-align:center;pointer-events:auto;
    font-family:'Press Start 2P',cursive;
    animation:tut-pop .16s ease-out;
}
#tut-fs-popup.visible{display:block;}
#tut-fs-icon{font-size:36px;display:block;margin-bottom:12px;color:#ffd700;}
#tut-fs-msg{font-size:7px;color:#ffd700;line-height:2;text-shadow:1px 1px 0 #000;margin-bottom:14px;display:block;}
#tut-fs-btn{
    font-family:'Press Start 2P',cursive;font-size:8px;color:#fff;
    background:#c0392b;border:4px solid #fff;box-shadow:4px 4px 0 #000;
    padding:10px 18px;cursor:pointer;text-transform:uppercase;display:block;width:100%;
}
#tut-fs-btn:hover{background:#e74c3c;}
#tut-fs-btn:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #000;}
#tut-fs-skip{
    font-family:'Press Start 2P',cursive;font-size:6px;color:#666;
    background:none;border:none;cursor:pointer;margin-top:10px;display:block;width:100%;
    text-transform:uppercase;
}
#tut-fs-skip:hover{color:#aaa;}
@keyframes tut-sl{
    from{opacity:0;transform:translateX(10px)}
    to  {opacity:1;transform:none}
}
        `;
        document.head.appendChild(s);
    }

    // ── DOM ────────────────────────────────────────────────
    function _inject() {
        _injectCSS();
        _el = document.createElement('div');
        _el.id = 'tut-ov';
        _el.innerHTML = `
          <div id="tut-box">
            <div id="tut-vis"></div>
            <div id="tut-hdr">
              <span id="tut-num"></span>
              <span id="tut-nm"></span>
            </div>
            <div id="tut-body">
              <div id="tut-title"></div>
              <div id="tut-desc"></div>
            </div>
            <div id="tut-foot">
              <div id="tut-dots"></div>
              <div id="tut-nav">
                <button id="tut-skip" onclick="TutorialSystem.skip()"></button>
                <button id="tut-prev" onclick="TutorialSystem.prev()">◄</button>
                <button id="tut-next" onclick="TutorialSystem.next()"></button>
              </div>
            </div>
          </div>`;
        document.body.appendChild(_el);
        _injectFsPopup();
    }

    function _injectFsPopup() {
        if (document.getElementById('tut-fs-popup')) return;
        const p = document.createElement('div');
        p.id = 'tut-fs-popup';
        p.innerHTML = `
          <span id="tut-fs-icon">↺</span>
          <span id="tut-fs-msg"></span>
          <button id="tut-fs-btn" onclick="toggleFullscreen();document.getElementById('tut-fs-popup').classList.remove('visible');"></button>
          <button id="tut-fs-skip" onclick="document.getElementById('tut-fs-popup').classList.remove('visible');">✕ skip</button>
        `;
        document.body.appendChild(p);
        _updateFsPopup();
        document.addEventListener('fullscreenchange', _updateFsPopup);
        document.addEventListener('webkitfullscreenchange', _updateFsPopup);
    }

    function _updateFsPopup() {
        const p = document.getElementById('tut-fs-popup');
        if (!p) return;
        const inFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
        if (inFs) { p.classList.remove('visible'); return; }
        const msg = document.getElementById('tut-fs-msg');
        const btn = document.getElementById('tut-fs-btn');
        const lang = (typeof currentLang !== 'undefined') ? currentLang : 'ru';
        if (msg) msg.textContent = lang === 'ru' ? 'Для лучшего опыта\nрекомендуется\nполный экран' : 'Fullscreen mode\nis recommended\nfor best experience';
        if (btn) btn.textContent = lang === 'ru' ? '[ ] ПОЛНЫЙ ЭКРАН' : '[ ] FULLSCREEN';
        p.classList.add('visible');
    }

    // ── render ─────────────────────────────────────────────
    function _render() {
        if (!_el) return;
        if (_animId) { cancelAnimationFrame(_animId); _animId = null; }
        _tt = 0;

        const isFin  = _step === STEPS.length - 1;
        const isCtrl = STEPS[_step] === 'controls';
        const lang   = (typeof currentLang !== 'undefined') ? currentLang : 'ru';

        // dots
        document.getElementById('tut-dots').innerHTML =
            STEPS.map((_,i) =>
                `<div class="tut-dot${i===_step?' on':''}" onclick="TutorialSystem.goTo(${i})"></div>`
            ).join('');

        // buttons
        document.getElementById('tut-prev').disabled = (_step === 0);
        // Show fullscreen popup if not in fullscreen
        _updateFsPopup();
        document.getElementById('tut-skip').textContent = t('tut.skip');
        const bn = document.getElementById('tut-next');
        bn.textContent = isFin ? ('★ ' + t('tut.play')) : (t('tut.next') + ' ►');
        bn.className   = isFin ? 'fin' : '';

        // box border
        document.getElementById('tut-box').classList.toggle('tut-ctrl', isCtrl);

        // header
        document.getElementById('tut-num').textContent = (_step+1) + ' / ' + STEPS.length;
        document.getElementById('tut-nm').textContent  = (_NAMES[lang] || _NAMES.en)[_step] || '';

        // body slide
        const body = document.getElementById('tut-body');
        body.classList.remove('tut-slide');
        void body.offsetWidth;
        body.classList.add('tut-slide');
        document.getElementById('tut-title').innerHTML = t('tut.' + STEPS[_step] + '.title');
        document.getElementById('tut-desc').innerHTML  = t('tut.' + STEPS[_step] + '.desc');

        // visual
        const vis = document.getElementById('tut-vis');
        vis.innerHTML = '';
        VISUALS[STEPS[_step]](vis);
    }

    // ══════════════════════════════════════════════════════
    // CANVAS HELPERS
    // ══════════════════════════════════════════════════════

    // Создать canvas 520×172 и вернуть [canvas, ctx]
    function _mkCv(container) {
        const c = document.createElement('canvas');
        c.width = 520; c.height = 172;
        c.style.cssText = 'display:block;width:100%;height:100%;image-rendering:pixelated;';
        container.appendChild(c);
        return [c, c.getContext('2d')];
    }

    // Высота полосы земли в пикселях на tutorial-канвасе
    const GH = 30;

    // ── Sky — точная копия drawMenuScene ──────────────────
    function _sky(cx, W, H) {
        const g = cx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#87CEEB');
        g.addColorStop(1, '#E0F7FA');
        cx.fillStyle = g;
        cx.fillRect(0, 0, W, H);
    }

    // ── Night sky ─────────────────────────────────────────
    function _nightSky(cx, W, H, tt) {
        cx.fillStyle = '#060615'; cx.fillRect(0, 0, W, H);
        for (let i = 0; i < 26; i++) {
            const on = Math.sin(tt * .04 + i * 2.13) > .28;
            cx.fillStyle = on ? '#ffffff' : '#6677aa';
            cx.fillRect((i * 163 + 11) % (W - 6) + 3,
                        (i * 71  +  7) % (H - GH - 20) + 3,
                        on ? 2 : 1, on ? 2 : 1);
        }
    }

    // ── Ground — точная копия drawWorld ──────────────────
    // groundY = H - GH = верхний край земли
    function _ground(cx, W, H) {
        const gY = H - GH;
        cx.fillStyle = '#6d4c41'; cx.fillRect(0, gY,      W, GH);
        cx.fillStyle = '#66bb6a'; cx.fillRect(0, gY,      W, 15);
        cx.fillStyle = '#43a047'; cx.fillRect(0, gY + 12, W, 3);
        cx.fillStyle = '#5d4037';
        for (let xd = 40; xd < W; xd += 80) cx.fillRect(xd, gY + 18, 6, 6);
    }

    // ── Рыбки — точная копия drawWorld (item.type fish) ──
    // type: 'orange' | 'blue' | 'gold'
    function _fish(cx, x, y, type) {
        if (type === 'blue')      cx.fillStyle = '#29b6f6';
        else if (type === 'gold') cx.fillStyle = '#ffd700';
        else                      cx.fillStyle = '#ffa726';
        cx.fillRect(x, y, 20, 12);

        if (type === 'blue')      cx.fillStyle = '#0288d1';
        else if (type === 'gold') cx.fillStyle = '#e6c200';
        else                      cx.fillStyle = '#f57c00';
        cx.fillRect(x - 5, y + 2, 5, 8);

        cx.fillStyle = 'white'; cx.fillRect(x + 14, y + 2, 4, 4);
        cx.fillStyle = 'black'; cx.fillRect(x + 16, y + 3, 2, 2);
    }

    // ── drawPixelCat wrapper ──────────────────────────────
    // cx = screenCenterX (кот будет центрирован по горизонтали)
    // groundY = Y поверхности земли на канвасе
    // Внутри drawPixelCat: translate(x + 15, y), ноги на y + 45
    // Значит: x = cx - 15, y = groundY - 45
    function _cat(tutCtx, cx, groundY, skinIdx, facingRight, jumping, moving) {
        drawPixelCat(
            tutCtx,
            cx - 15,            // x: так чтобы центр тела на cx
            groundY - 45,       // y: так чтобы ноги касались groundY
            SKINS[skinIdx],
            facingRight,
            null,               // controls = null
            skinIdx === 0,      // isPlayer1
            jumping  || false,
            moving   != null ? moving : null
        );
    }

    // ── Пиксельный текст с жёсткой тенью ─────────────────
    function _pxt(cx, text, x, y, col, px) {
        cx.font = px + 'px "Press Start 2P",monospace';
        cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
        cx.fillStyle = '#000'; cx.fillText(text, x + 2, y + 2);
        cx.fillStyle = col;    cx.fillText(text, x,     y);
    }

    // ── Кнопка — точный стиль .btn ───────────────────────
    function _btn(cx, x, y, w, h, bg, border, label, fSize) {
        cx.fillStyle = '#000';   cx.fillRect(x + 4, y + 4, w, h);
        cx.fillStyle = bg;       cx.fillRect(x,     y,     w, h);
        cx.strokeStyle = border; cx.lineWidth = 3;
        cx.strokeRect(x + 1, y + 1, w - 2, h - 2);
        if (!label) return;
        cx.font = (fSize || 7) + 'px "Press Start 2P",monospace';
        cx.textAlign = 'center'; cx.textBaseline = 'middle';
        cx.fillStyle = '#000'; cx.fillText(label, x + w/2 + 1, y + h/2 + 1);
        cx.fillStyle = '#fff'; cx.fillText(label, x + w/2,     y + h/2);
    }

    // ══════════════════════════════════════════════════════
    // VISUALS — по одному на каждый шаг
    // Все котики рисуются через настоящую drawPixelCat()
    // Все рыбки — через _fish() (точная копия кода игры)
    // gameTime временно заменяется на _tt для анимаций
    // ══════════════════════════════════════════════════════
    const VISUALS = {

        // ── 0. WELCOME ───────────────────────────────────
        welcome(vis) {
            const [c, cx] = _mkCv(vis);
            const W = c.width, H = c.height;
            const gY = H - GH;   // Y поверхности земли

            // Три кота: белый, рыжий, чёрный
            const CATS = [
                { cx: 92,  si: 0, face: true  },
                { cx: 260, si: 1, face: true  },
                { cx: 428, si: 2, face: false },
            ];

            function frame() {
                if (!document.contains(c)) return;
                _animId = requestAnimationFrame(frame);
                _tt++;
                const sgt = gameTime; gameTime = _tt;

                _sky(cx, W, H);
                _ground(cx, W, H);

                // Заголовок
                _pxt(cx, 'PIXEL CATS', W/2, 38, '#ffd700', 18);
                _pxt(cx, 'ONLINE',     W/2, 55, '#ffffff', 9);

                // Анимированные точки
                const DCOLS = ['#ffd700','#e67e22','#2ecc71','#29b6f6','#ffd700'];
                for (let d = 0; d < 5; d++) {
                    const on = Math.sin(_tt * .07 + d * .87) > 0;
                    cx.fillStyle = on ? DCOLS[d] : '#2a2a2a';
                    cx.fillRect(W/2 - 44 + d * 22, 61, 6, 6);
                }

                CATS.forEach(cat => {
                    const bob = Math.round(Math.sin(_tt * .055 + cat.cx * .007) * 3);
                    _cat(cx, cat.cx, gY + bob, cat.si, cat.face, false, false);
                });

                gameTime = sgt;
            }
            _animId = requestAnimationFrame(frame);
        },

        // ── 1. MOVEMENT ──────────────────────────────────
        movement(vis) {
            const [c, cx] = _mkCv(vis);
            const W = c.width, H = c.height;
            const gY = H - GH;
            let catX = 70, dir = 1, offY = 0, jumpVy = 0, onGround = true;

            function frame() {
                if (!document.contains(c)) return;
                _animId = requestAnimationFrame(frame);
                _tt++;
                const sgt = gameTime; gameTime = _tt;

                // Физика кота — прыжок масштабирован под высоту 172px канваса
                catX += dir * 1.7;
                if (catX > W - 80) dir = -1;
                if (catX < 80)     dir =  1;
                if (onGround && Math.random() < .013) { jumpVy = -7; onGround = false; }
                jumpVy += 0.3;
                offY = Math.min(offY + jumpVy, 0);
                if (offY >= 0) { offY = 0; onGround = true; jumpVy = 0; }

                _sky(cx, W, H);
                _ground(cx, W, H);

                // Рыжий кот бежит
                _cat(cx, catX, gY + offY, 1, dir > 0, !onGround, true);

                // ── WASD (верхний левый угол) ──
                [
                    { k:'W', bx:42, by:8,  hl:!onGround },
                    { k:'A', bx:18, by:28, hl:dir < 0   },
                    { k:'S', bx:42, by:28, hl:false      },
                    { k:'D', bx:66, by:28, hl:dir > 0   },
                ].forEach(({ k, bx, by, hl }) => {
                    cx.fillStyle = '#000'; cx.fillRect(bx+2, by+2, 22, 20);
                    cx.fillStyle = hl ? 'rgba(255,215,0,.24)' : '#1a1a1a';
                    cx.fillRect(bx, by, 22, 20);
                    cx.strokeStyle = hl ? '#ffd700' : '#555';
                    cx.lineWidth   = hl ? 2 : 1;
                    cx.strokeRect(bx, by, 22, 20);
                    cx.font = '7px "Press Start 2P",monospace';
                    cx.fillStyle = hl ? '#ffd700' : '#888';
                    cx.textAlign = 'center'; cx.textBaseline = 'middle';
                    cx.fillText(k, bx + 11, by + 10);
                });
                // SPACE
                cx.fillStyle = '#000'; cx.fillRect(14, 52, 80, 14);
                cx.fillStyle = !onGround ? 'rgba(255,215,0,.20)' : '#111';
                cx.fillRect(12, 50, 80, 14);
                cx.strokeStyle = !onGround ? '#ffd700' : '#444'; cx.lineWidth = 1;
                cx.strokeRect(12, 50, 80, 14);
                cx.font = '5px "Press Start 2P",monospace';
                cx.fillStyle = '#777'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
                cx.fillText('SPACE / ↑', 52, 57);

                // OR
                cx.font = '6px "Press Start 2P",monospace';
                cx.fillStyle = '#444'; cx.textAlign = 'center';
                cx.fillText('OR', 163, 33);

                // ── Стрелки ──
                [
                    { k:'↑', bx:228, by:8,  hl:!onGround },
                    { k:'←', bx:204, by:28, hl:dir < 0   },
                    { k:'↓', bx:228, by:28, hl:false      },
                    { k:'→', bx:252, by:28, hl:dir > 0   },
                ].forEach(({ k, bx, by, hl }) => {
                    cx.fillStyle = '#000'; cx.fillRect(bx+2, by+2, 22, 20);
                    cx.fillStyle = hl ? 'rgba(255,215,0,.24)' : '#1a1a1a';
                    cx.fillRect(bx, by, 22, 20);
                    cx.strokeStyle = hl ? '#ffd700' : '#555';
                    cx.lineWidth   = hl ? 2 : 1;
                    cx.strokeRect(bx, by, 22, 20);
                    cx.font = '11px sans-serif';
                    cx.fillStyle = hl ? '#ffd700' : '#888';
                    cx.textAlign = 'center'; cx.textBaseline = 'middle';
                    cx.fillText(k, bx + 11, by + 11);
                });

                // ── Джойстик (справа) — стиль .joystick-base ──
                const jx = 422, jy = 62, jr = 36;
                cx.fillStyle = 'rgba(255,255,255,.07)';
                cx.fillRect(jx - jr, jy - jr, jr*2, jr*2);
                cx.strokeStyle = 'rgba(255,255,255,.22)'; cx.lineWidth = 3;
                cx.strokeRect(jx - jr, jy - jr, jr*2, jr*2);
                // Ручка — стиль .joystick-knob.active
                const kx = Math.round(jx + Math.cos(_tt * .038) * 15);
                const ky = Math.round(jy + Math.sin(_tt * .038) * 12);
                cx.fillStyle = 'rgba(142,68,173,.65)';
                cx.fillRect(kx - 14, ky - 14, 28, 28);
                cx.strokeStyle = '#d7bde2'; cx.lineWidth = 2;
                cx.strokeRect(kx - 14, ky - 14, 28, 28);
                cx.font = '5px "Press Start 2P",monospace';
                cx.fillStyle = 'rgba(255,255,255,.28)'; cx.textAlign = 'center';
                cx.fillText('MOBILE', jx, H - 31);

                gameTime = sgt;
            }
            _animId = requestAnimationFrame(frame);
        },

        // ── 2. COLLECT ───────────────────────────────────
        collect(vis) {
            const [c, cx] = _mkCv(vis);
            const W = c.width, H = c.height;
            const gY = H - GH;

            // Рыбки — позиции и типы
            const FDEFS = [
                { x: 114, type: 'orange' },
                { x: 202, type: 'blue'   },
                { x: 290, type: 'gold'   },
                { x: 378, type: 'orange' },
                { x: 466, type: 'blue'   },
            ];
            let catX = 22, score = 0;
            let fish = FDEFS.map(f => ({ ...f, alive: true, vy: 0, fy: gY - 44, alpha: 1 }));

            function reset() {
                catX = 22; score = 0;
                fish = FDEFS.map(f => ({ ...f, alive: true, vy: 0, fy: gY - 44, alpha: 1 }));
            }

            function frame() {
                if (!document.contains(c)) return;
                _animId = requestAnimationFrame(frame);
                _tt++;
                const sgt = gameTime; gameTime = _tt;

                catX += 1.45;
                if (catX > W + 24) reset();

                _sky(cx, W, H);
                _ground(cx, W, H);

                fish.forEach(f => {
                    if (f.alpha <= 0) return;

                    if (!f.alive) {
                        // Подлетает вверх
                        f.fy  += f.vy;
                        f.vy  -= 0.24;
                        f.alpha -= 0.022;
                    } else {
                        // Бобинг — точно как в игре: Math.sin(gameTime * 0.1 + item.x) * 5
                        f.fy = gY - 44 + Math.sin(_tt * 0.1 + f.x * 0.1) * 5;
                        // Поимка котом
                        if (Math.abs(catX - (f.x + 10)) < 27) {
                            f.alive = false; f.vy = -4.8; score++;
                        }
                    }

                    cx.globalAlpha = f.alpha;
                    _fish(cx, f.x, f.fy, f.type);

                    // +1 при подлёте
                    if (!f.alive && f.alpha > .3) {
                        cx.font = '8px "Press Start 2P",monospace';
                        cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
                        cx.fillStyle = '#000';    cx.fillText('+1', f.x + 11, f.fy - 4);
                        cx.fillStyle = '#ffd700'; cx.fillText('+1', f.x + 10, f.fy - 5);
                    }
                    cx.globalAlpha = 1;
                });

                // Кот собирает
                _cat(cx, catX, gY, 1, true, false, true);

                // Счёт — стиль .screen-overlay с бордером
                cx.fillStyle = '#000'; cx.fillRect(13, 11, 116, 22);
                cx.fillStyle = 'rgba(0,0,0,.88)'; cx.fillRect(10, 8, 116, 22);
                cx.strokeStyle = '#ffd700'; cx.lineWidth = 2; cx.strokeRect(10, 8, 116, 22);
                cx.font = '8px "Press Start 2P",monospace';
                cx.fillStyle = '#ffd700'; cx.textAlign = 'left'; cx.textBaseline = 'middle';
                IconGenerator.drawIcon(cx, 'fish_orange', 15, 11, 14);
                cx.fillText(' ' + score, 32, 19);

                // Иконки валют внизу
                cx.textBaseline = 'alphabetic'; cx.textAlign = 'center';
                IconGenerator.drawIcon(cx, 'fish_orange', W/2 - 88, H - 14, 12);
                IconGenerator.drawIcon(cx, 'fish_blue',   W/2 - 4,  H - 14, 12);
                IconGenerator.drawIcon(cx, 'fish_gold',   W/2 + 80, H - 14, 12);

                gameTime = sgt;
            }
            _animId = requestAnimationFrame(frame);
        },

        // ── 3. MODES ─────────────────────────────────────
        modes(vis) {
            const [c, cx] = _mkCv(vis);
            const W = c.width, H = c.height;
            const gY = H - GH;

            const BW = 106, BH = 114, PAD = 14;
            const MDEFS = [
                { label:'EASY', bg:'#1a3a1a', border:'#27ae60', tc:'#2ecc71', si:0, unlocked:true  },
                { label:'HARD', bg:'#3a1212', border:'#c0392b', tc:'#e74c3c', si:1, unlocked:false },
                { label:'MEGA', bg:'#2a1a3a', border:'#8e44ad', tc:'#9b59b6', si:2, unlocked:false },
                { label:'∞INF', bg:'#121a3a', border:'#2980b9', tc:'#3498db', si:3, unlocked:false },
            ];

            function frame() {
                if (!document.contains(c)) return;
                _animId = requestAnimationFrame(frame);
                _tt++;
                const sgt = gameTime; gameTime = _tt;

                _sky(cx, W, H);
                _ground(cx, W, H);

                MDEFS.forEach((m, i) => {
                    const bx = PAD + i * (BW + PAD);
                    const by = 10;
                    const pulse = m.unlocked ? (Math.sin(_tt * .07) * .05 + .97) : 1;

                    cx.save();
                    cx.translate(bx + BW/2, by + BH/2);
                    cx.scale(pulse, pulse);
                    cx.translate(-(bx + BW/2), -(by + BH/2));

                    // Тень и фон
                    cx.fillStyle = '#000'; cx.fillRect(bx+4, by+4, BW, BH);
                    cx.fillStyle = m.bg;   cx.fillRect(bx,   by,   BW, BH);
                    cx.strokeStyle = m.border; cx.lineWidth = 3;
                    cx.strokeRect(bx+1, by+1, BW-2, BH-2);

                    // Название режима
                    cx.font = '7px "Press Start 2P",monospace';
                    cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
                    cx.fillStyle = '#000'; cx.fillText(m.label, bx+BW/2+1, by+20+1);
                    cx.fillStyle = m.unlocked ? '#fff' : m.tc;
                    cx.fillText(m.label, bx+BW/2, by+20);

                    // Звёзды (pixel-иконки)
                    for (let si2 = 0; si2 < Math.min(i+1, 4); si2++) {
                        IconGenerator.drawIcon(cx, 'star', bx + 12 + si2 * 10, by + 26, 10);
                    }

                    // Кот в открытом режиме
                    if (m.unlocked) {
                        _cat(cx, bx + BW/2, by + BH - 20, m.si, true, false, false);
                    }

                    cx.restore();

                    // Замок на закрытых
                    if (!m.unlocked) {
                        cx.fillStyle = 'rgba(0,0,0,.72)'; cx.fillRect(bx, by, BW, BH);
                        IconGenerator.drawIcon(cx, 'lock', bx + BW/2 - 16, by + BH/2 - 16, 32);
                    }
                });

                // Подсказка
                cx.globalAlpha = Math.sin(_tt * .05) * .22 + .72;
                _pxt(cx, 'WIN TO UNLOCK NEXT MODE', W/2, H - 5, '#ffd700', 5);
                cx.globalAlpha = 1;

                gameTime = sgt;
            }
            _animId = requestAnimationFrame(frame);
        },

        // ── 4. CONTROLS ──────────────────────────────────
        controls(vis) {
            const [c, cx] = _mkCv(vis);
            const W = c.width, H = c.height;
            const gY = H - GH;
            let tick = 0;
            const TOTAL = 240;

            function frame() {
                if (!document.contains(c)) return;
                _animId = requestAnimationFrame(frame);
                _tt++; tick++;
                const sgt = gameTime; gameTime = _tt;
                const ph = tick % TOTAL;

                _sky(cx, W, H);
                _ground(cx, W, H);

                // Белый кот стоит по центру
                _cat(cx, W/2, gY, 0, true, false, false);

                // ── Кнопка SETTINGS (фаза 0-50: пульсирует) ──
                const sp = ph < 50 ? (Math.sin(tick * .1) * .08 + .94) : 1;
                cx.save();
                cx.translate(W/2, 20); cx.scale(sp, sp); cx.translate(-W/2, -20);
                _btn(cx, W/2-94, 6, 188, 28, '#1a0b2e', '#8e44ad', '⚙  SETTINGS', 7);
                cx.restore();

                // ── Редактор (фаза > 48) ──
                if (ph > 48) {
                    cx.fillStyle = 'rgba(0,0,0,.62)'; cx.fillRect(0, 0, W, H);

                    // Сетка — как в .editor-grid-line
                    cx.strokeStyle = 'rgba(255,255,255,.04)'; cx.lineWidth = 1;
                    for (let gx2 = 52; gx2 < W; gx2 += 52) {
                        cx.beginPath(); cx.moveTo(gx2, 0); cx.lineTo(gx2, H); cx.stroke();
                    }
                    for (let gy2 = 17; gy2 < H; gy2 += 17) {
                        cx.beginPath(); cx.moveTo(0, gy2); cx.lineTo(W, gy2); cx.stroke();
                    }

                    // Тулбар редактора — точно как в #controls-editor-overlay .editor-topbar
                    cx.fillStyle = 'rgba(0,0,0,.88)'; cx.fillRect(0, 0, W, 32);
                    cx.strokeStyle = '#8e44ad'; cx.lineWidth = 2;
                    cx.beginPath(); cx.moveTo(0, 32); cx.lineTo(W, 32); cx.stroke();
                    cx.font = '7px "Press Start 2P",monospace';
                    cx.fillStyle = '#ffd700'; cx.textAlign = 'left'; cx.textBaseline = 'middle';
                    IconGenerator.drawIcon(cx, 'pencil', 8, 8, 14);
                    cx.fillText('  РЕДАКТОР УПРАВЛЕНИЯ', 24, 16);
                    _btn(cx, W-64,  6, 56, 20, '#27ae60', '#2ecc71', '✓ SAVE',  5);
                    _btn(cx, W-126, 6, 56, 20, '#c0392b', '#e74c3c', '↺ RESET', 5);
                }

                // ── Перетаскиваемый джойстик-призрак (фаза 50→148) ──
                if (ph > 50) {
                    const p = Math.min(1, (ph - 50) / 90);
                    const ease = p < .5 ? 2*p*p : 1 - Math.pow(-2*p+2, 2)/2;
                    const gx3 = Math.round(26  + ease * 250);
                    const gy3 = Math.round(50  + Math.sin(ease * Math.PI) * (-22));

                    // .ctrl-ghost-inner — пунктир + прозрачный фон
                    cx.fillStyle = 'rgba(142,68,173,.18)';
                    cx.fillRect(gx3, gy3, 84, 84);
                    cx.strokeStyle = '#8e44ad'; cx.lineWidth = 3;
                    cx.setLineDash([5, 3]);
                    cx.strokeRect(gx3, gy3, 84, 84);
                    cx.setLineDash([]);

                    // Ручка джойстика
                    cx.fillStyle = 'rgba(142,68,173,.52)';
                    cx.fillRect(gx3+24, gy3+24, 36, 36);
                    cx.strokeStyle = '#d7bde2'; cx.lineWidth = 2;
                    cx.strokeRect(gx3+24, gy3+24, 36, 36);

                    cx.font = '6px "Press Start 2P",monospace';
                    cx.fillStyle = '#d7bde2'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
                    cx.fillText('P1', gx3+42, gy3+66);
                    IconGenerator.drawIcon(cx, 'joystick', gx3+30, gy3+52, 14);

                    // Иконка руки при перетаскивании
                    if (ph < 132) {
                        cx.globalAlpha = Math.min(1, (ph - 50) / 18);
                        IconGenerator.drawIcon(cx, 'hand', gx3+34, gy3+20, 16);
                        cx.globalAlpha = 1;
                    }

                    // Кнопки − / + (ctrl-size-row, появляются позже)
                    if (ph > 120) {
                        const sa = Math.min(1, (ph - 120) / 18);
                        cx.globalAlpha = sa;
                        cx.fillStyle = '#000';    cx.fillRect(gx3+1, gy3+87, 84, 18);
                        cx.fillStyle = '#1a1a2e'; cx.fillRect(gx3,   gy3+86, 84, 18);
                        cx.strokeStyle = '#555'; cx.lineWidth = 1.5;
                        cx.strokeRect(gx3, gy3+86, 84, 18);
                        cx.font = '6px "Press Start 2P",monospace';
                        cx.fillStyle = '#ccc'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
                        cx.fillText('−  100%  +', gx3+42, gy3+95);
                        cx.globalAlpha = 1;
                    }
                }

                // Мигающая подсказка
                cx.globalAlpha = Math.sin(_tt * .07) * .28 + .68;
                _pxt(cx, 'DRAG & RESIZE BUTTONS!', W/2, H - 5, '#8e44ad', 6);
                cx.globalAlpha = 1;

                gameTime = sgt;
            }
            _animId = requestAnimationFrame(frame);
        },

        // ── 5. SHOP ──────────────────────────────────────
        shop(vis) {
            const [c, cx] = _mkCv(vis);
            const W = c.width, H = c.height;

            // Показываем 5 скинов как в renderShop()
            // Индексы: white(0), orange(1), black(2), pink(4), cyber(6)
            const SHOP_SI = [0, 1, 2, 4, 6];
            const N = SHOP_SI.length;
            const PAD = 10;
            const BW = Math.floor((W - PAD * (N+1)) / N);  // ~90
            const BY = 24;
            const BH = H - BY - 4;   // высота карточки
            let selIdx = 0;

            function frame() {
                if (!document.contains(c)) return;
                _animId = requestAnimationFrame(frame);
                _tt++;
                const sgt = gameTime; gameTime = _tt;

                cx.fillStyle = '#08080f'; cx.fillRect(0, 0, W, H);
                selIdx = Math.floor(_tt / 86) % N;

                // ── Кошелёк — стиль .shop-wallet ──
                cx.fillStyle = '#000'; cx.fillRect(0, 0, W, 22);
                cx.fillStyle = 'rgba(255,255,255,.04)'; cx.fillRect(0, 0, W, 22);
                cx.strokeStyle = '#333'; cx.lineWidth = 2; cx.strokeRect(0, 0, W, 22);
                cx.font = '7px "Press Start 2P",monospace'; cx.textBaseline = 'middle';
                IconGenerator.drawIcon(cx, 'fish_orange', 4,  4, 14); cx.fillStyle = '#ffa726'; cx.textAlign = 'left';   cx.fillText('28', 20, 11);
                IconGenerator.drawIcon(cx, 'fish_blue',   W/2-20, 4, 14); cx.fillStyle = '#29b6f6'; cx.textAlign = 'center'; cx.fillText('12', W/2+8, 11);
                IconGenerator.drawIcon(cx, 'fish_gold',   W-32, 4, 14); cx.fillStyle = '#ffd700'; cx.textAlign = 'right';  cx.fillText('5 ', W-4, 11);

                SHOP_SI.forEach((si, i) => {
                    const skin  = SKINS[si];
                    const bx    = PAD + i * (BW + PAD);
                    const isSel = i === selIdx;
                    const owned = si < 4;   // первые 4 скина разблокированы по умолчанию

                    // ── .shop-card ──
                    cx.fillStyle = '#000'; cx.fillRect(bx+3, BY+3, BW, BH);
                    cx.fillStyle = isSel ? 'rgba(255,215,0,.07)' : 'rgba(255,255,255,.05)';
                    cx.fillRect(bx, BY, BW, BH);
                    // Бордер — .shop-card.owned / .shop-card.selected
                    cx.strokeStyle = isSel ? '#ffd700' : (owned ? '#27ae60' : '#444');
                    cx.lineWidth   = isSel ? 3 : 2;
                    cx.strokeRect(bx+1, BY+1, BW-2, BH-2);

                    // ── Котик — точно как renderShop() ──
                    // renderShop: drawPixelCat(cx, 8, 22, skin, ...) на 80x70
                    // Здесь: центрируем в карточке, ноги в нижней трети карточки
                    const catDrawY = BY + BH - 22;  // ноги кота
                    _cat(cx, bx + BW/2, catDrawY, si, true, false, false);

                    // ── Название — .shop-card-name ──
                    cx.font = '5px "Press Start 2P",monospace';
                    cx.fillStyle = isSel ? '#ffd700' : (owned ? '#ffd700' : '#888');
                    cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
                    const nm = t(skin.nameKey);
                    cx.fillText(nm.slice(0, 9), bx + BW/2, BY + BH - 19);

                    // ── Бейдж — .shop-card-badge ──
                    const badY = BY + BH - 15;
                    cx.fillStyle = '#000'; cx.fillRect(bx+2, badY+2, BW-4, 11);
                    cx.fillStyle = isSel ? '#ffd700' : (owned ? '#27ae60' : '#2980b9');
                    cx.fillRect(bx+2, badY, BW-4, 11);
                    cx.font = '4px "Press Start 2P",monospace';
                    cx.fillStyle = isSel ? '#000' : '#fff';
                    cx.textAlign = 'center'; cx.textBaseline = 'middle';
                    if (owned) {
                        cx.fillText(isSel ? '✓ SELECTED' : '✓ OWNED', bx + BW/2, badY + 5.5);
                    } else {
                        // Иконка валюты в бейдже
                        const fishName = skin.currency==='blue' ? 'fish_blue'
                                       : skin.currency==='gold' ? 'fish_gold' : 'fish_orange';
                        IconGenerator.drawIcon(cx, fishName, bx+3, badY+1, 9);
                        cx.fillText(' ' + (skin.cost || '?'), bx + BW/2 + 4, badY + 5.5);
                    }
                });

                gameTime = sgt;
            }
            _animId = requestAnimationFrame(frame);
        },

        // ── 6. ONLINE ────────────────────────────────────
        online(vis) {
            const [c, cx] = _mkCv(vis);
            const W = c.width, H = c.height;
            const gY = H - GH;

            function frame() {
                if (!document.contains(c)) return;
                _animId = requestAnimationFrame(frame);
                _tt++;
                const sgt = gameTime; gameTime = _tt;

                _nightSky(cx, W, H, _tt);
                _ground(cx, W, H);

                // Два кота смотрят друг на друга
                const bob = Math.round(Math.sin(_tt * .055) * 4);
                _cat(cx, 110,      gY + bob,  0, true,  false, false); // P1 белый
                _cat(cx, W - 110,  gY - bob,  1, false, false, false); // P2 рыжий

                // Пунктирная линия соединения
                const lineY = gY - 48;
                cx.globalAlpha = Math.sin(_tt * .06) * .2 + .72;
                cx.strokeStyle = '#e67e22'; cx.lineWidth = 2;
                cx.setLineDash([8, 5]);
                cx.beginPath();
                cx.moveTo(150, lineY); cx.lineTo(W - 150, lineY);
                cx.stroke();
                cx.setLineDash([]); cx.globalAlpha = 1;

                // Движущийся пакет данных — маленький золотой квадрат
                const dp = (_tt * .014) % 1;
                const px2 = Math.round(150 + dp * (W - 300));
                cx.fillStyle = '#ffd700'; cx.fillRect(px2-5, lineY-5, 10, 10);
                cx.strokeStyle = '#fff'; cx.lineWidth = 1;
                cx.strokeRect(px2-5, lineY-5, 10, 10);

                _pxt(cx, 'P2P / FIREBASE', W/2, lineY - 9, '#e67e22', 6);

                // Подписи игроков
                cx.font = '5px "Press Start 2P",monospace';
                cx.textAlign = 'center'; cx.textBaseline = 'alphabetic'; cx.fillStyle = '#888';
                cx.fillText('P1 (YOU)',    110,     H - 31);
                cx.fillText('P2 (FRIEND)', W - 110, H - 31);

                // Кнопка ONLINE — .btn-blue
                _btn(cx, W/2 - 90, 8, 180, 28, '#1a2a3e', '#3498db', 'ONLINE', 7);
                IconGenerator.drawIcon(cx, 'globe', W/2 - 83, 15, 14);

                gameTime = sgt;
            }
            _animId = requestAnimationFrame(frame);
        },

        // ── 7. READY ─────────────────────────────────────
        ready(vis) {
            const [c, cx] = _mkCv(vis);
            const W = c.width, H = c.height;
            const gY = H - GH;

            // Конфетти
            const conf = Array.from({ length: 28 }, (_, i) => ({
                x:   Math.random() * W,
                y:   Math.random() * H - H,
                vy:  1.3 + Math.random() * 2.4,
                vx:  (Math.random() - .5) * 2.4,
                col: ['#ffd700','#e67e22','#2ecc71','#29b6f6','#e74c3c','#8e44ad'][i % 6],
                w:   4 + Math.floor(Math.random() * 5),
                h:   3 + Math.floor(Math.random() * 3),
            }));

            function frame() {
                if (!document.contains(c)) return;
                _animId = requestAnimationFrame(frame);
                _tt++;
                const sgt = gameTime; gameTime = _tt;

                _sky(cx, W, H);

                // Конфетти
                conf.forEach(p => {
                    p.y += p.vy; p.x += p.vx;
                    if (p.y > H + 4) { p.y = -4; p.x = Math.random() * W; }
                    cx.fillStyle = p.col;
                    cx.fillRect(Math.round(p.x), Math.round(p.y), p.w, p.h);
                });

                _ground(cx, W, H);

                // Три прыгающих кота с разными фазами
                [
                    { cx2: 110, si: 0, ph: 0.0 },
                    { cx2: 260, si: 1, ph: 1.1 },
                    { cx2: 410, si: 2, ph: 2.2 },
                ].forEach(cat => {
                    const jump = Math.round(Math.sin(_tt * .065 + cat.ph) * 15);
                    _cat(cx, cat.cx2, gY + Math.min(jump, 0), cat.si, true, jump < -4, jump < -4);
                });

                // Заголовок — двойная тень как в игре
                cx.font = '14px "Press Start 2P",monospace';
                cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
                cx.fillStyle = '#003300'; cx.fillText("LET'S PLAY!", W/2+2, 46+2);
                cx.fillStyle = '#004400'; cx.fillText("LET'S PLAY!", W/2+1, 46+1);
                cx.fillStyle = '#2ecc71'; cx.fillText("LET'S PLAY!", W/2,   46);

                // Пульсирующая звезда
                cx.globalAlpha = Math.sin(_tt * .08) * .22 + .75;
                IconGenerator.drawIcon(cx, 'star', W/2 - 8, 54, 16);
                cx.globalAlpha = 1;

                gameTime = sgt;
            }
            _animId = requestAnimationFrame(frame);
        },
    };

    // ── done / destroy ─────────────────────────────────────
    function _done() {
        localStorage.setItem(TUTORIAL_KEY, '1');
        _destroy();
    }

    function _destroy() {
        if (_animId) { cancelAnimationFrame(_animId); _animId = null; }
        if (_el)     { _el.remove(); _el = null; }
        const s = document.getElementById('tut-css');
        if (s) s.remove();
        const p = document.getElementById('tut-fs-popup');
        if (p) p.remove();
        document.removeEventListener('fullscreenchange', _updateFsPopup);
        document.removeEventListener('webkitfullscreenchange', _updateFsPopup);
    }

    return { show, skip, next, prev, goTo, shouldShow };

})();

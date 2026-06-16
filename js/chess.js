// ============================================================
// ШАХМАТЫ — мини-игра (локально вдвоём + онлайн), пиксельный стиль
// Полные правила: рокировка, взятие на проходе, превращение, шах/мат/пат.
// ============================================================
(function () {
    'use strict';

    // ---- Пиксельные спрайты фигур (X = тело, S = тень) ----
    const COL_LIGHT = '#e8d3a8', COL_DARK = '#a87b53';
    // Фигуры — настоящие коты игры (drawPixelCat) + шахматная шапка сверху
    const CHESS_SKIN_W = { id: 'cw', body: '#fff',    nose: '#ffafcc', eye: '#1a1a1a', type: 'solid' };
    const CHESS_SKIN_B = { id: 'cb', body: '#3b3b46', nose: '#c97fa0', eye: '#ffd24a', type: 'solid' };
    const CAT_SF = { p: 0.60, n: 0.80, b: 0.86, r: 0.78, q: 0.90, k: 0.98 }; // доля высоты клетки
    const CAT_BOX_H = 70, CAT_CENTER_X = 10;
    // шапки рисуются в системе координат drawPixelCat(ctx,0,0): центр головы x=15, макушка ~ y=-9
    function chessHat(ctx, t) {
        const R = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
        if (t === 'n') { R(4,-13,22,9,'#aeb6c2'); R(4,-5,22,3,'#7c8595'); R(6,-15,18,3,'#9aa3b2'); R(13,-26,5,13,'#d9534f'); R(13,-26,5,4,'#e8736c'); }
        else if (t === 'b') { R(6,-6,18,5,'#9b59b6'); R(8,-13,14,8,'#9b59b6'); R(10,-20,10,8,'#9b59b6'); R(12,-27,6,8,'#9b59b6'); R(13,-31,4,5,'#9b59b6'); R(6,-4,18,3,'#f1c40f'); R(14,-24,2,16,'#d8a6ef'); }
        else if (t === 'r') { R(4,-13,22,9,'#9a9aa6'); R(4,-5,22,2,'#6e6e78'); R(4,-18,5,5,'#9a9aa6'); R(12,-18,6,5,'#9a9aa6'); R(21,-18,5,5,'#9a9aa6'); R(4,-13,22,2,'#bcbcc6'); }
        else if (t === 'q') { R(4,-12,22,7,'#f1c40f'); R(4,-5,22,2,'#c79a10'); [5,11,17,23].forEach(x => R(x,-17,4,6,'#f1c40f')); R(8,-9,3,3,'#e74c3c'); R(15,-9,3,3,'#e74c3c'); R(21,-9,3,3,'#3aa0e0'); }
        else if (t === 'k') { R(4,-12,22,7,'#f1c40f'); R(4,-5,22,2,'#c79a10'); R(4,-15,22,4,'#f5d44a'); R(13,-28,5,12,'#f5f5ef'); R(9,-25,13,4,'#f5f5ef'); }
    }

    // ---- Состояние ----
    const C = {
        active: false, mode: 'local', myColor: 'w', flip: false,
        b: null, turn: 'w', castle: null, ep: null,
        sel: null, legal: [], lastMove: null, over: false, result: '',
        canvas: null, ctx: null, dpr: 1, sq: 48, pendingPromo: null
    };

    const T = (k, f) => { const v = (typeof t === 'function') ? t(k) : null; return (v && v !== k) ? v : f; };
    const SFX = (n) => { try { if (typeof AudioEngine !== 'undefined' && AudioEngine.sfx && AudioEngine.sfx[n]) AudioEngine.sfx[n](); } catch (e) {} };

    // ============================================================
    // ДВИЖОК
    // ============================================================
    function startPos() {
        const b = Array.from({ length: 8 }, () => Array(8).fill(null));
        const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
        for (let c = 0; c < 8; c++) {
            b[0][c] = { t: back[c], c: 'b' }; b[1][c] = { t: 'p', c: 'b' };
            b[6][c] = { t: 'p', c: 'w' }; b[7][c] = { t: back[c], c: 'w' };
        }
        return b;
    }
    function clone(b) { return b.map(row => row.map(p => p ? { t: p.t, c: p.c } : null)); }
    function inB(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
    function findKing(b, col) {
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = b[r][c]; if (p && p.t === 'k' && p.c === col) return [r, c]; }
        return null;
    }
    const KN = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    const ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    function attacked(b, r, c, by) {
        // пешки
        if (by === 'w') { if ((inB(r + 1, c - 1) && b[r + 1][c - 1] && b[r + 1][c - 1].c === 'w' && b[r + 1][c - 1].t === 'p') || (inB(r + 1, c + 1) && b[r + 1][c + 1] && b[r + 1][c + 1].c === 'w' && b[r + 1][c + 1].t === 'p')) return true; }
        else { if ((inB(r - 1, c - 1) && b[r - 1][c - 1] && b[r - 1][c - 1].c === 'b' && b[r - 1][c - 1].t === 'p') || (inB(r - 1, c + 1) && b[r - 1][c + 1] && b[r - 1][c + 1].c === 'b' && b[r - 1][c + 1].t === 'p')) return true; }
        // кони
        for (const [dr, dc] of KN) { const rr = r + dr, cc = c + dc; if (inB(rr, cc)) { const p = b[rr][cc]; if (p && p.c === by && p.t === 'n') return true; } }
        // король
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const rr = r + dr, cc = c + dc; if (inB(rr, cc)) { const p = b[rr][cc]; if (p && p.c === by && p.t === 'k') return true; } }
        // диагонали (слон/ферзь)
        for (const [dr, dc] of DIAG) { let rr = r + dr, cc = c + dc; while (inB(rr, cc)) { const p = b[rr][cc]; if (p) { if (p.c === by && (p.t === 'b' || p.t === 'q')) return true; break; } rr += dr; cc += dc; } }
        // прямые (ладья/ферзь)
        for (const [dr, dc] of ORTH) { let rr = r + dr, cc = c + dc; while (inB(rr, cc)) { const p = b[rr][cc]; if (p) { if (p.c === by && (p.t === 'r' || p.t === 'q')) return true; break; } rr += dr; cc += dc; } }
        return false;
    }
    function inCheck(b, col) { const k = findKing(b, col); return k ? attacked(b, k[0], k[1], col === 'w' ? 'b' : 'w') : false; }

    // Псевдо-ходы (без проверки на шах). Каждый ход: {fr,fc,tr,tc,promo?,castle?,ep?,dbl?}
    function pseudo(b, col, castle, ep) {
        const mv = [], opp = col === 'w' ? 'b' : 'w';
        const add = (fr, fc, tr, tc, extra) => mv.push(Object.assign({ fr, fc, tr, tc }, extra || {}));
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
            const p = b[r][c]; if (!p || p.c !== col) continue;
            if (p.t === 'p') {
                const dir = col === 'w' ? -1 : 1, startRow = col === 'w' ? 6 : 1, lastRow = col === 'w' ? 0 : 7;
                if (inB(r + dir, c) && !b[r + dir][c]) {
                    if (r + dir === lastRow) add(r, c, r + dir, c, { promo: '?' }); else add(r, c, r + dir, c);
                    if (r === startRow && !b[r + 2 * dir][c]) add(r, c, r + 2 * dir, c, { dbl: true });
                }
                for (const dc of [-1, 1]) {
                    const tr = r + dir, tc = c + dc; if (!inB(tr, tc)) continue;
                    const tp = b[tr][tc];
                    if (tp && tp.c === opp) { if (tr === lastRow) add(r, c, tr, tc, { promo: '?' }); else add(r, c, tr, tc); }
                    else if (ep && ep[0] === tr && ep[1] === tc) add(r, c, tr, tc, { ep: true });
                }
            } else if (p.t === 'n') {
                for (const [dr, dc] of KN) { const tr = r + dr, tc = c + dc; if (inB(tr, tc) && (!b[tr][tc] || b[tr][tc].c === opp)) add(r, c, tr, tc); }
            } else if (p.t === 'k') {
                for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const tr = r + dr, tc = c + dc; if (inB(tr, tc) && (!b[tr][tc] || b[tr][tc].c === opp)) add(r, c, tr, tc); }
                // рокировка
                const hr = col === 'w' ? 7 : 0;
                if (r === hr && c === 4 && !inCheck(b, col)) {
                    const kSide = col === 'w' ? castle.wK : castle.bK, qSide = col === 'w' ? castle.wQ : castle.bQ;
                    if (kSide && !b[hr][5] && !b[hr][6] && b[hr][7] && b[hr][7].t === 'r' && b[hr][7].c === col && !attacked(b, hr, 5, opp) && !attacked(b, hr, 6, opp)) add(r, c, hr, 6, { castle: 'K' });
                    if (qSide && !b[hr][3] && !b[hr][2] && !b[hr][1] && b[hr][0] && b[hr][0].t === 'r' && b[hr][0].c === col && !attacked(b, hr, 3, opp) && !attacked(b, hr, 2, opp)) add(r, c, hr, 2, { castle: 'Q' });
                }
            } else {
                const dirs = p.t === 'b' ? DIAG : p.t === 'r' ? ORTH : DIAG.concat(ORTH);
                for (const [dr, dc] of dirs) { let tr = r + dr, tc = c + dc; while (inB(tr, tc)) { const tp = b[tr][tc]; if (!tp) add(r, c, tr, tc); else { if (tp.c === opp) add(r, c, tr, tc); break; } tr += dr; tc += dc; } }
            }
        }
        return mv;
    }
    // Применить ход к копии состояния -> {b,castle,ep}
    function apply(b0, m, castle0, col) {
        const b = clone(b0), castle = Object.assign({}, castle0);
        const p = b[m.fr][m.fc];
        let ep = null;
        b[m.tr][m.tc] = p; b[m.fr][m.fc] = null;
        if (m.ep) b[m.fr][m.tc] = null;                  // взятие на проходе
        if (m.dbl) ep = [(m.fr + m.tr) / 2, m.fc];
        if (m.promo && m.promo !== '?') p.t = m.promo;
        if (m.castle === 'K') { const hr = m.tr; b[hr][5] = b[hr][7]; b[hr][7] = null; }
        if (m.castle === 'Q') { const hr = m.tr; b[hr][3] = b[hr][0]; b[hr][0] = null; }
        // права рокировки
        if (p.t === 'k') { if (col === 'w') { castle.wK = castle.wQ = false; } else { castle.bK = castle.bQ = false; } }
        if (m.fr === 7 && m.fc === 0) castle.wQ = false; if (m.fr === 7 && m.fc === 7) castle.wK = false;
        if (m.fr === 0 && m.fc === 0) castle.bQ = false; if (m.fr === 0 && m.fc === 7) castle.bK = false;
        if (m.tr === 7 && m.tc === 0) castle.wQ = false; if (m.tr === 7 && m.tc === 7) castle.wK = false;
        if (m.tr === 0 && m.tc === 0) castle.bQ = false; if (m.tr === 0 && m.tc === 7) castle.bK = false;
        return { b, castle, ep };
    }
    function legalMoves(b, col, castle, ep) {
        const out = [];
        for (const m of pseudo(b, col, castle, ep)) {
            const st = apply(b, m.promo === '?' ? Object.assign({}, m, { promo: 'q' }) : m, castle, col);
            if (!inCheck(st.b, col)) out.push(m);
        }
        return out;
    }

    // ============================================================
    // ИГРОВАЯ ЛОГИКА
    // ============================================================
    function sideToMove() { return C.turn; }
    function myTurn() { return C.mode === 'local' ? true : (C.turn === C.myColor); }

    function recomputeStatus() {
        const lm = pseudo(C.b, C.turn, C.castle, C.ep);   // разрешаем «ошибочные» ходы
        const chk = inCheck(C.b, C.turn);
        if (lm.length === 0) {
            C.over = true;
            if (chk) { const w = C.turn === 'w' ? 'b' : 'w'; C.result = 'mate:' + w; }
            else C.result = 'stale';
        } else if (chk) { C.result = 'check'; } else C.result = '';
        return lm;
    }

    function doMove(m, remote) {
        const moverColor = C.turn;
        const tgt = C.b[m.tr][m.tc];                       // взятие короля = конец партии
        const st = apply(C.b, m, C.castle, C.turn);
        C.b = st.b; C.castle = st.castle; C.ep = st.ep;
        C.lastMove = { fr: m.fr, fc: m.fc, tr: m.tr, tc: m.tc };
        C.sel = null; C.legal = [];
        C.turn = C.turn === 'w' ? 'b' : 'w';
        if (tgt && tgt.t === 'k') { C.over = true; C.result = 'mate:' + moverColor; }
        else recomputeStatus();
        SFX(C.result.startsWith('mate') ? 'unlock' : (C.result === 'check' ? 'hit' : 'click'));
        // отправить сопернику
        if (!remote && C.mode === 'online' && typeof net !== 'undefined' && net.conn && net.conn.open) {
            try { net.conn.send({ type: 'CHESS_MOVE', m: { fr: m.fr, fc: m.fc, tr: m.tr, tc: m.tc, promo: m.promo || null } }); } catch (e) {}
        }
        draw(); updateStatusText();
    }

    // выбор хода игроком: m может требовать превращения
    function chooseMove(m) {
        if (m.promo === '?') { C.pendingPromo = m; showPromo(); return; }
        // отметить, было ли взятие (для звука)
        m.cap = !!C.b[m.tr][m.tc];
        doMove(m, false);
    }

    function onSquare(br, bc) {
        if (!C.active || C.over) return;
        if (!myTurn()) return;
        const moveColor = C.mode === 'local' ? C.turn : C.myColor;
        // ход по выбранной фигуре?
        if (C.sel) {
            const hit = C.legal.find(m => m.tr === br && m.tc === bc);
            if (hit) { chooseMove(hit); return; }
        }
        const p = C.b[br][bc];
        if (p && p.c === moveColor) {
            C.sel = [br, bc];
            C.legal = pseudo(C.b, moveColor, C.castle, C.ep).filter(m => m.fr === br && m.fc === bc);
            SFX('click'); draw();
        } else { C.sel = null; C.legal = []; draw(); }
    }

    // ============================================================
    // ОТРИСОВКА
    // ============================================================
    function fitCanvas() {
        if (!C.canvas) return;
        const availW = Math.min(window.innerWidth - 24, 560);
        const availH = window.innerHeight - 150;
        const size = Math.max(176, Math.min(availW, availH, 520));
        const sq = Math.floor(size / 8);
        C.sq = sq;
        const px = sq * 8;
        C.dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
        C.canvas.width = px * C.dpr; C.canvas.height = px * C.dpr;
        C.canvas.style.width = px + 'px'; C.canvas.style.height = px + 'px';
        C.ctx = C.canvas.getContext('2d');
        C.ctx.setTransform(C.dpr, 0, 0, C.dpr, 0, 0);
        C.ctx.imageSmoothingEnabled = false;
    }
    function scr(br, bc) { return C.flip ? [7 - bc, 7 - br] : [bc, br]; } // -> [colScreen, rowScreen]
    function drawPieceBmp(ctx, grid, x, y, cell, pal) {
        const H = grid.length, W = grid[0].length;
        const fl = (r, c) => r >= 0 && r < H && c >= 0 && c < W && grid[r][c] !== '.';
        for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
            if (grid[r][c] !== '.') continue; let adj = false;
            for (let dr = -1; dr <= 1 && !adj; dr++) for (let dc = -1; dc <= 1; dc++) { if ((dr || dc) && fl(r + dr, c + dc)) { adj = true; } }
            if (adj) { ctx.fillStyle = pal.out; ctx.fillRect(x + c * cell, y + r * cell, cell, cell); }
        }
        for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) { const g = grid[r][c]; if (g === '.') continue; ctx.fillStyle = pal[g] || pal.B; ctx.fillRect(x + c * cell, y + r * cell, cell, cell); }
    }
    function draw() {
        if (!C.ctx) return;
        const ctx = C.ctx, sq = C.sq;
        const kc = C.over || C.result === 'check' || C.result === 'mate:w' || C.result === 'mate:b' ? findKing(C.b, C.turn) : null;
        const inChk = inCheck(C.b, C.turn);
        for (let br = 0; br < 8; br++) for (let bc = 0; bc < 8; bc++) {
            const [sc, sr] = scr(br, bc); const x = sc * sq, y = sr * sq;
            ctx.fillStyle = (br + bc) % 2 === 0 ? COL_LIGHT : COL_DARK;
            ctx.fillRect(x, y, sq, sq);
            if (C.lastMove && ((C.lastMove.fr === br && C.lastMove.fc === bc) || (C.lastMove.tr === br && C.lastMove.tc === bc))) { ctx.fillStyle = 'rgba(255,235,90,0.30)'; ctx.fillRect(x, y, sq, sq); }
            if (inChk && kc && kc[0] === br && kc[1] === bc) { ctx.fillStyle = 'rgba(231,76,60,0.55)'; ctx.fillRect(x, y, sq, sq); }
            if (C.sel && C.sel[0] === br && C.sel[1] === bc) { ctx.fillStyle = 'rgba(125,249,255,0.45)'; ctx.fillRect(x, y, sq, sq); }
            const p = C.b[br][bc];
            if (p && typeof drawPixelCat === 'function') {
                const scl = sq * CAT_SF[p.t] / CAT_BOX_H;
                ctx.save();
                ctx.translate(x + sq / 2 - CAT_CENTER_X * scl, y + sq - Math.round(sq * 0.05) - 45 * scl);
                ctx.scale(scl, scl); ctx.imageSmoothingEnabled = false;
                drawPixelCat(ctx, 0, 0, p.c === 'w' ? CHESS_SKIN_W : CHESS_SKIN_B, true, null, true, false, false);
                chessHat(ctx, p.t);
                ctx.restore();
                ctx.imageSmoothingEnabled = false;
            }
        }
        // подсказки ходов поверх
        for (const m of C.legal) {
            const [sc, sr] = scr(m.tr, m.tc); const x = sc * sq, y = sr * sq, cx = x + sq / 2, cy = y + sq / 2;
            ctx.fillStyle = 'rgba(40,40,40,0.45)';
            if (C.b[m.tr][m.tc] || m.ep) { ctx.lineWidth = Math.max(3, sq * 0.08); ctx.strokeStyle = 'rgba(40,40,40,0.5)'; ctx.beginPath(); ctx.arc(cx, cy, sq * 0.40, 0, Math.PI * 2); ctx.stroke(); }
            else { ctx.beginPath(); ctx.arc(cx, cy, sq * 0.16, 0, Math.PI * 2); ctx.fill(); }
        }
    }

    // ============================================================
    // UI / DOM
    // ============================================================
    function el(id) { return typeof document !== 'undefined' ? document.getElementById(id) : null; }
    function updateStatusText() {
        const s = el('chess-status'); if (!s) return;
        let txt;
        if (C.over) {
            if (C.result === 'stale') txt = T('chess.stalemate', 'Пат — ничья');
            else { const w = C.result.split(':')[1]; const wn = w === 'w' ? T('chess.white', 'Белые') : T('chess.black', 'Чёрные'); txt = T('chess.mate', 'Мат!') + ' ' + wn + ' ' + T('chess.win', 'победили'); }
        } else {
            const turnName = C.turn === 'w' ? T('chess.white', 'Белые') : T('chess.black', 'Чёрные');
            if (C.mode === 'online') txt = (C.turn === C.myColor ? T('chess.yourMove', 'Ваш ход') : T('chess.oppMove', 'Ход соперника'));
            else txt = T('chess.move', 'Ход') + ': ' + turnName;
            if (C.result === 'check') txt += ' — ' + T('chess.check', 'Шах!');
        }
        s.textContent = txt;
        const rb = el('btn-chess-resign'); if (rb) rb.style.display = C.over ? 'none' : '';
        const rm = el('btn-chess-rematch'); if (rm) rm.style.display = (C.over && C.mode === 'local') ? '' : 'none';
    }
    function showPromo() {
        const pv = el('chess-promo'); if (!pv) { // нет UI — авто-ферзь
            const m = C.pendingPromo; C.pendingPromo = null; m.promo = 'q'; m.cap = !!C.b[m.tr][m.tc]; doMove(m, false); return;
        }
        pv.style.display = 'flex';
    }
    function pickPromo(t2) {
        const pv = el('chess-promo'); if (pv) pv.style.display = 'none';
        const m = C.pendingPromo; C.pendingPromo = null; if (!m) return;
        m.promo = t2; m.cap = !!C.b[m.tr][m.tc]; doMove(m, false);
    }

    function pointerToSquare(ev) {
        const rect = C.canvas.getBoundingClientRect();
        const cx = (ev.touches ? ev.touches[0].clientX : ev.clientX) - rect.left;
        const cy = (ev.touches ? ev.touches[0].clientY : ev.clientY) - rect.top;
        let sc = Math.floor(cx / C.sq), sr = Math.floor(cy / C.sq);
        if (sc < 0 || sc > 7 || sr < 0 || sr > 7) return null;
        // screen -> board (обратное к scr)
        let br, bc;
        if (C.flip) { bc = 7 - sc; br = 7 - sr; } else { bc = sc; br = sr; }
        return [br, bc];
    }
    function onPointer(ev) { ev.preventDefault(); const s = pointerToSquare(ev); if (s) onSquare(s[0], s[1]); }

    // ============================================================
    // ПУБЛИЧНЫЕ ФУНКЦИИ
    // ============================================================
    function showScreen() {
        if (typeof document === 'undefined') return;
        ['start-screen', 'minigames-screen', 'chess-menu-screen', 'online-screen', 'settings-screen', 'shop-screen'].forEach(id => { const e = el(id); if (e) e.style.display = 'none'; });
        const sc = el('chess-screen'); if (sc) sc.style.display = 'flex';
        C.canvas = el('chess-canvas');
        if (C.canvas && !C.canvas._chessBound) {
            C.canvas._chessBound = true;
            C.canvas.addEventListener('pointerdown', onPointer);
        }
        fitCanvas(); draw(); updateStatusText();
    }

    window.startChess = function (mode, myColor) {
        C.mode = mode || 'local';
        C.myColor = myColor || 'w';
        C.flip = (C.mode === 'online' && C.myColor === 'b');
        C.b = startPos(); C.turn = 'w';
        C.castle = { wK: true, wQ: true, bK: true, bQ: true };
        C.ep = null; C.sel = null; C.legal = []; C.lastMove = null; C.over = false; C.result = '';
        C.pendingPromo = null; C.active = true;
        const pv = el('chess-promo'); if (pv) pv.style.display = 'none';
        showScreen();
    };
    window.chessPickPromo = pickPromo;
    window.chessResign = function () {
        if (!C.active || C.over) return;
        if (C.mode === 'online') {
            if (typeof net !== 'undefined' && net.conn && net.conn.open) { try { net.conn.send({ type: 'CHESS_END', reason: 'resign' }); } catch (e) {} }
            C.over = true; C.result = 'mate:' + (C.myColor === 'w' ? 'b' : 'w');
        } else { C.over = true; C.result = 'mate:' + (C.turn === 'w' ? 'b' : 'w'); }
        draw(); updateStatusText();
    };
    window.chessRematch = function () { window.startChess(C.mode, C.myColor); };
    window.chessExit = function () {
        C.active = false;
        if (C.mode === 'online' && !C.over && typeof net !== 'undefined' && net.conn && net.conn.open) { try { net.conn.send({ type: 'CHESS_END', reason: 'leave' }); } catch (e) {} }
        const sc = el('chess-screen'); if (sc) sc.style.display = 'none';
        if (C.mode === 'online' && typeof numPlayers !== 'undefined') numPlayers = 1;
        const back = el(C.mode === 'online' ? 'start-screen' : 'minigames-screen');
        if (back) back.style.display = 'block';
    };
    // сетевые сообщения
    window.chessOnNet = function (data) {
        if (data.type === 'CHESS_START') { window.startChess('online', data.color); }
        else if (data.type === 'CHESS_MOVE' && C.active) {
            const m = data.m; if (!m) return;
            // принять ход соперника
            const legal = pseudo(C.b, C.turn, C.castle, C.ep);
            const found = legal.find(x => x.fr === m.fr && x.fc === m.fc && x.tr === m.tr && x.tc === m.tc);
            if (found) { if (found.promo === '?') found.promo = m.promo || 'q'; found.cap = !!C.b[m.tr][m.tc]; doMove(found, true); }
        } else if (data.type === 'CHESS_END' && C.active) {
            C.over = true;
            if (data.reason === 'resign') C.result = 'mate:' + C.myColor; // соперник сдался — вы победили
            else C.result = 'mate:' + C.myColor;
            draw(); updateStatusText();
        }
    };
    window.addEventListener && window.addEventListener('resize', () => { if (C.active) { fitCanvas(); draw(); } });

    // ---- переходы экранов мини-игр ----
    window.openChessMenu = function () {
        const e = el('minigames-screen'); if (e) e.style.display = 'none';
        const m = el('chess-menu-screen'); if (m) m.style.display = 'flex';
        SFX('click');
    };
    window.closeChessMenu = function () {
        const m = el('chess-menu-screen'); if (m) m.style.display = 'none';
        const e = el('minigames-screen'); if (e) e.style.display = 'block';
    };
    window.chessOnlineFromMenu = function () {
        window.chessOnlinePending = true;
        const m = el('chess-menu-screen'); if (m) m.style.display = 'none';
        if (typeof handleOnlineClick === 'function') handleOnlineClick();
    };

    // экспорт движка для тестов
    C._e = { startPos, clone, legalMoves, apply, attacked, findKing, pseudo, inCheck };
    window.CHESS = C;
})();

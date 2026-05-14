// ============================================================
// CONTROLS — Mobile button click sfx, layout editor, touch controls
// ============================================================

// ---- Button click sfx on any button ----
document.addEventListener('click', e => {
    if (e.target.matches('button, .arrow-btn, .action-btn, .toggle-btn, .track-btn')) AudioEngine.sfx.click();
}, true);

// ============================================================
// CONTROLS LAYOUT EDITOR
// ============================================================
const CTRL_STORAGE_KEY = 'pixelCatsCtrlLayout';

// Default layout — percentage of viewport (x, y) + scale multiplier
const DEFAULT_LAYOUT = {
    joy1:    { x: 3,  y: 55, scale: 1.0 },
    joy1_2p: { x: 5,  y: 55, scale: 1.0 },
    joy2_2p: { x: 72, y: 55, scale: 1.0 },
    mbMenu:  { x: 88, y: 2,  scale: 1.0 },
    dpLeft:  { x: 2,  y: 70, scale: 1.0 },
    dpRight: { x: 72, y: 70, scale: 1.0 },
};

function loadLayout() {
    try {
        const saved = SafeStorage.getJSON(CTRL_STORAGE_KEY);
        if (!saved) return JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
        // Merge with defaults so old saves without 'scale' still work
        const merged = JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
        for (const key in merged) {
            if (saved[key]) {
                merged[key].x = saved[key].x ?? merged[key].x;
                merged[key].y = saved[key].y ?? merged[key].y;
                merged[key].scale = saved[key].scale ?? 1.0;
            }
        }
        return merged;
    } catch(e) { return JSON.parse(JSON.stringify(DEFAULT_LAYOUT)); }
}

function applyLayout(layout) {
    const W = window.innerWidth, H = window.innerHeight;
    const set = (el, lx, ly, sc) => {
        if (!el) return;
        el.style.position = 'absolute';
        el.style.left  = (lx / 100 * W) + 'px';
        el.style.top   = (ly / 100 * H) + 'px';
        el.style.bottom = 'unset';
        el.style.right  = 'unset';
        el.style.transformOrigin = 'top left';
        el.style.transform = sc && sc !== 1.0 ? `scale(${sc})` : '';
    };
    const joy1w  = document.getElementById('joy1-wrapper');
    const joy1w2 = document.getElementById('joy1-wrapper-2p');
    const joy2w2 = document.getElementById('joy2-wrapper-2p');
    const mbMenu = document.getElementById('mb-menu');
    const dpLeftW  = document.getElementById('dpad-left-wrapper');
    const dpRightW = document.getElementById('dpad-right-wrapper');

    if (layout.joy1)    set(joy1w,    layout.joy1.x,    layout.joy1.y,    layout.joy1.scale);
    if (layout.joy1_2p) set(joy1w2,   layout.joy1_2p.x, layout.joy1_2p.y, layout.joy1_2p.scale);
    if (layout.joy2_2p) set(joy2w2,   layout.joy2_2p.x, layout.joy2_2p.y, layout.joy2_2p.scale);
    if (layout.mbMenu)  set(mbMenu,   layout.mbMenu.x,  layout.mbMenu.y,  layout.mbMenu.scale);
    if (layout.dpLeft)  set(dpLeftW,  layout.dpLeft.x,  layout.dpLeft.y,  layout.dpLeft.scale);
    if (layout.dpRight) set(dpRightW, layout.dpRight.x, layout.dpRight.y, layout.dpRight.scale);
}

// Apply layout on load and resize
window.addEventListener('resize', () => applyLayout(loadLayout()));

// ---- EDITOR ----
let _editorLayout = null; // working copy during edit

function openControlsEditor() {
    closeSettings();
    _showMobileControls();
    _editorLayout = JSON.parse(JSON.stringify(loadLayout()));
    const overlay = document.getElementById('controls-editor-overlay');
    overlay.classList.add('active');
    _buildEditorGhosts(overlay);
}

function closeControlsEditor() {
    const overlay = document.getElementById('controls-editor-overlay');
    overlay.classList.remove('active');
    overlay.querySelectorAll('.ctrl-ghost, .editor-grid-line').forEach(g => g.remove());
}

function saveControlsLayout() {
    SafeStorage.set(CTRL_STORAGE_KEY, JSON.stringify(_editorLayout));
    applyLayout(_editorLayout);
    closeControlsEditor();
    openSettings();
}

function resetControlsLayout() {
    _editorLayout = JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
    const overlay = document.getElementById('controls-editor-overlay');
    overlay.querySelectorAll('.ctrl-ghost, .editor-grid-line').forEach(g => g.remove());
    _buildEditorGhosts(overlay);
}

function _buildEditorGhosts(overlay) {
    const W = window.innerWidth, H = window.innerHeight;

    // Subtle grid lines
    for (let i = 1; i < 10; i++) {
        const vl = document.createElement('div');
        vl.className = 'editor-grid-line';
        vl.style.cssText = `left:${i*10}%;top:0;width:1px;height:100%;`;
        overlay.appendChild(vl);
        const hl = document.createElement('div');
        hl.className = 'editor-grid-line';
        hl.style.cssText = `top:${i*10}%;left:0;height:1px;width:100%;`;
        overlay.appendChild(hl);
    }

    const items = [
        { key: 'joy1',    label: '🕹️ P1',    baseW: 110, baseH: 110, round: true,  joystickOnly: true  },
        { key: 'joy1_2p', label: '🕹️ P1 2P', baseW: 110, baseH: 110, round: true,  joystickOnly: true  },
        { key: 'joy2_2p', label: '🕹️ P2 2P', baseW: 110, baseH: 110, round: true,  joystickOnly: true  },
        { key: 'mbMenu',  label: '☰ ESC',    baseW:  70, baseH:  40, round: false, joystickOnly: true  },
        { key: 'dpLeft',  label: '◄ ►',      baseW: 150, baseH:  70, round: false, dpadOnly: true      },
        { key: 'dpRight', label: 'ESC ▼ ▲',  baseW: 200, baseH:  70, round: false, dpadOnly: true      },
    ];

    const isJoyMode = (ctrlType === 'joystick');
    items.forEach(item => {
        if (item.joystickOnly && !isJoyMode) return;
        if (item.dpadOnly && isJoyMode) return;

        const sc = _editorLayout[item.key].scale || 1.0;
        const lx = _editorLayout[item.key].x;
        const ly = _editorLayout[item.key].y;
        const px = lx / 100 * W;
        const py = ly / 100 * H;

        const ghost = document.createElement('div');
        ghost.className = 'ctrl-ghost';
        ghost.dataset.key = item.key;
        ghost.style.cssText = `left:${px}px;top:${py}px;z-index:205;position:absolute;`;

        const inner = document.createElement('div');
        inner.className = 'ctrl-ghost-inner' + (item.round ? '' : ' menu-ghost');
        const dispW = item.baseW * sc, dispH = item.baseH * sc;
        inner.style.width  = dispW + 'px';
        inner.style.height = dispH + 'px';

        const lbl = document.createElement('div');
        lbl.className = 'ctrl-ghost-label';
        lbl.textContent = item.label;

        // ---- SIZE CONTROLS ----
        const sizeRow = document.createElement('div');
        sizeRow.className = 'ctrl-size-row';
        sizeRow.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:4px;margin-top:4px;';

        const btnMinus = document.createElement('button');
        btnMinus.textContent = '−';
        btnMinus.className = 'ctrl-size-btn';
        btnMinus.style.cssText = 'width:26px;height:26px;font-size:16px;line-height:1;border-radius:5px;border:2px solid rgba(255,255,255,0.6);background:rgba(0,0,0,0.55);color:#fff;cursor:pointer;touch-action:none;';

        const scaleLabel = document.createElement('span');
        scaleLabel.className = 'ctrl-scale-label';
        scaleLabel.style.cssText = 'font-size:11px;color:#fff;min-width:36px;text-align:center;';
        scaleLabel.textContent = Math.round(sc * 100) + '%';

        const btnPlus = document.createElement('button');
        btnPlus.textContent = '+';
        btnPlus.className = 'ctrl-size-btn';
        btnPlus.style.cssText = btnMinus.style.cssText;

        function updateScale(delta) {
            let cur = _editorLayout[item.key].scale || 1.0;
            cur = Math.round((cur + delta) * 10) / 10;
            cur = Math.max(0.4, Math.min(2.5, cur));
            _editorLayout[item.key].scale = cur;
            const nW = item.baseW * cur, nH = item.baseH * cur;
            inner.style.width  = nW + 'px';
            inner.style.height = nH + 'px';
            scaleLabel.textContent = Math.round(cur * 100) + '%';
        }

        // Touch AND click for size buttons (stop drag propagation)
        function bindSizeBtn(btn, delta) {
            btn.addEventListener('touchstart', e => { e.stopPropagation(); e.preventDefault(); updateScale(delta); }, { passive: false });
            btn.addEventListener('mousedown', e => { e.stopPropagation(); e.preventDefault(); updateScale(delta); });
        }
        bindSizeBtn(btnMinus, -0.1);
        bindSizeBtn(btnPlus,  +0.1);

        sizeRow.appendChild(btnMinus);
        sizeRow.appendChild(scaleLabel);
        sizeRow.appendChild(btnPlus);

        inner.appendChild(lbl);
        inner.appendChild(sizeRow);
        ghost.appendChild(inner);
        overlay.appendChild(ghost);

        _makeDraggable(ghost, item.key);
    });
}

function _makeDraggable(el, key) {
    let startX, startY, startLeft, startTop, isDragging = false;

    function onStart(ex, ey) {
        isDragging = true;
        startX = ex; startY = ey;
        startLeft = parseFloat(el.style.left) || 0;
        startTop  = parseFloat(el.style.top)  || 0;
        el.classList.add('dragging');
    }
    function onMove(ex, ey) {
        if (!isDragging) return;
        const dx = ex - startX, dy = ey - startY;
        const W = window.innerWidth, H = window.innerHeight;
        const elW = el.offsetWidth  || 120;
        const elH = el.offsetHeight || 120;
        const newL = Math.max(0, Math.min(W - elW, startLeft + dx));
        const newT = Math.max(50, Math.min(H - elH, startTop  + dy));
        el.style.left = newL + 'px';
        el.style.top  = newT + 'px';
        _editorLayout[key].x = newL / W * 100;
        _editorLayout[key].y = newT / H * 100;
    }
    function onEnd() {
        isDragging = false;
        el.classList.remove('dragging');
    }

    el.addEventListener('mousedown',  e => {
        // Don't start drag if clicking size buttons
        if (e.target.classList.contains('ctrl-size-btn')) return;
        e.preventDefault(); onStart(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup',   () => onEnd());

    el.addEventListener('touchstart', e => {
        if (e.target.classList.contains('ctrl-size-btn')) return;
        e.preventDefault();
        const t = e.touches[0];
        onStart(t.clientX, t.clientY);
    }, { passive: false });
    el.addEventListener('touchmove', e => {
        if (!isDragging) return;
        e.preventDefault();
        const t = e.touches[0];
        onMove(t.clientX, t.clientY);
    }, { passive: false });
    el.addEventListener('touchend', () => onEnd());
}



// ---- Settings screen functions ----

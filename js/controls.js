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

// Default layout — percentage of viewport (stored as {x, y} in %)
const DEFAULT_LAYOUT = {
    joy1:    { x: 3,  y: 55 },   // 1p joystick
    joy1_2p: { x: 5,  y: 55 },   // 2p left joystick
    joy2_2p: { x: 72, y: 55 },   // 2p right joystick
    mbMenu:  { x: 88, y: 2  },   // ESC/menu button (joystick mode)
    dpLeft:  { x: 2,  y: 70 },   // dpad left group (◄ ►)
    dpRight: { x: 72, y: 70 },   // dpad right group (ESC ▼ ▲)
};

function loadLayout() {
    try { return JSON.parse(localStorage.getItem(CTRL_STORAGE_KEY)) || {...DEFAULT_LAYOUT}; }
    catch(e) { return {...DEFAULT_LAYOUT}; }
}

function applyLayout(layout) {
    const W = window.innerWidth, H = window.innerHeight;
    const set = (el, lx, ly) => {
        if (!el) return;
        el.style.position = 'absolute';
        el.style.left  = (lx / 100 * W) + 'px';
        el.style.top   = (ly / 100 * H) + 'px';
        el.style.bottom = 'unset';
        el.style.right  = 'unset';
    };
    const joy1w = document.getElementById('joy1-wrapper');
    const joy1w2 = document.getElementById('joy1-wrapper-2p');
    const joy2w2 = document.getElementById('joy2-wrapper-2p');
    const mbMenu = document.getElementById('mb-menu');
    const dpLeftW  = document.getElementById('dpad-left-wrapper');
    const dpRightW = document.getElementById('dpad-right-wrapper');

    if (layout.joy1)    set(joy1w,    layout.joy1.x,    layout.joy1.y);
    if (layout.joy1_2p) set(joy1w2,   layout.joy1_2p.x, layout.joy1_2p.y);
    if (layout.joy2_2p) set(joy2w2,   layout.joy2_2p.x, layout.joy2_2p.y);
    if (layout.mbMenu)  set(mbMenu,   layout.mbMenu.x,  layout.mbMenu.y);
    if (layout.dpLeft)  set(dpLeftW,  layout.dpLeft.x,  layout.dpLeft.y);
    if (layout.dpRight) set(dpRightW, layout.dpRight.x, layout.dpRight.y);
}

// Apply layout on load and resize
window.addEventListener('resize', () => applyLayout(loadLayout()));

// ---- EDITOR ----
let _editorLayout = null; // working copy during edit

function openControlsEditor() {
    closeSettings();
    _showMobileControls(); // keep controls visible for editor preview
    _editorLayout = JSON.parse(JSON.stringify(loadLayout()));
    const overlay = document.getElementById('controls-editor-overlay');
    overlay.classList.add('active');
    _buildEditorGhosts(overlay);
}

function closeControlsEditor() {
    const overlay = document.getElementById('controls-editor-overlay');
    overlay.classList.remove('active');
    // remove ghosts
    overlay.querySelectorAll('.ctrl-ghost').forEach(g => g.remove());
}

function saveControlsLayout() {
    localStorage.setItem(CTRL_STORAGE_KEY, JSON.stringify(_editorLayout));
    applyLayout(_editorLayout);
    closeControlsEditor();
    // reopen settings (will call _showMobileControls internally)
    openSettings();
}

function resetControlsLayout() {
    _editorLayout = JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
    const overlay = document.getElementById('controls-editor-overlay');
    overlay.querySelectorAll('.ctrl-ghost').forEach(g => g.remove());
    _buildEditorGhosts(overlay);
}

function _buildEditorGhosts(overlay) {
    const W = window.innerWidth, H = window.innerHeight;

    // Draw subtle grid
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
        { key: 'joy1',    label: '🕹️ P1',   size: 110, round: true,  joystickOnly: true  },
        { key: 'joy1_2p', label: '🕹️ P1 2P', size: 110, round: true,  joystickOnly: true  },
        { key: 'joy2_2p', label: '🕹️ P2 2P', size: 110, round: true,  joystickOnly: true  },
        { key: 'mbMenu',  label: '☰ ESC',   size: 70,  round: false, w:70, h:40, joystickOnly: true },
        { key: 'dpLeft',  label: '◄ ►',     size: 150, round: false, w:150, h:70, dpadOnly: true },
        { key: 'dpRight', label: 'ESC ▼ ▲', size: 200, round: false, w:200, h:70, dpadOnly: true },
    ];

    const isJoyMode = (ctrlType === 'joystick');
    items.forEach(item => {
        if (item.joystickOnly && !isJoyMode) return;
        if (item.dpadOnly && isJoyMode) return;
        const lx = _editorLayout[item.key].x;
        const ly = _editorLayout[item.key].y;
        const px = lx / 100 * W;
        const py = ly / 100 * H;

        const ghost = document.createElement('div');
        ghost.className = 'ctrl-ghost';
        ghost.dataset.key = item.key;
        ghost.style.left = px + 'px';
        ghost.style.top  = py + 'px';
        ghost.style.zIndex = 205;

        const inner = document.createElement('div');
        inner.className = 'ctrl-ghost-inner' + (item.round ? '' : ' menu-ghost');
        if (!item.round) {
            inner.style.width  = (item.w || item.size) + 'px';
            inner.style.height = (item.h || item.size) + 'px';
        } else {
            inner.style.width  = item.size + 'px';
            inner.style.height = item.size + 'px';
        }

        const lbl = document.createElement('div');
        lbl.className = 'ctrl-ghost-label';
        lbl.textContent = item.label;
        inner.appendChild(lbl);
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
        _editorLayout[key] = { x: newL / W * 100, y: newT / H * 100 };
    }
    function onEnd() {
        isDragging = false;
        el.classList.remove('dragging');
    }

    // Mouse
    el.addEventListener('mousedown',  e => { e.preventDefault(); onStart(e.clientX, e.clientY); });
    window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup',   () => onEnd());

    // Touch
    el.addEventListener('touchstart', e => {
        e.preventDefault();
        const t = e.touches[0];
        onStart(t.clientX, t.clientY);
    }, { passive: false });
    el.addEventListener('touchmove', e => {
        e.preventDefault();
        const t = e.touches[0];
        onMove(t.clientX, t.clientY);
    }, { passive: false });
    el.addEventListener('touchend', () => onEnd());
}



// ---- Settings screen functions ----

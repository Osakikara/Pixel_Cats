// ============================================================
// NETWORKING — Firebase relay, PeerJS P2P, online lobby, game data, skin management
// ============================================================

function openOnlineMenu() {
    startScreen.style.display = 'none';
    onlineScreen.style.display = 'block';
    _hideLeaveBtn();
    _hideMobileControls();
    _fbAutoSelectRan = false;  // сброс — авто-выбор сработает при входе
    switchConnMode('firebase'); // по умолчанию Firebase
}

// Переключение вкладок P2P / Firebase
function switchConnMode(mode) {
    connMode = mode;
    const isPeer = mode === 'p2p';
    document.getElementById('p2p-block').style.display       = isPeer ? '' : 'none';
    document.getElementById('firebase-block').style.display  = isPeer ? 'none' : '';
    // Статус — переключаем нужный элемент
    const p2pSt = document.getElementById('online-status');
    const fbSt  = document.getElementById('fb-status');
    if (p2pSt) p2pSt.style.display = isPeer ? '' : 'none';
    if (fbSt)  fbSt.style.display  = isPeer ? 'none' : '';
    // Табы — новый pixel-стиль
    const tabP2p = document.getElementById('tab-p2p');
    const tabFb  = document.getElementById('tab-firebase');
    if (tabP2p) { tabP2p.className = isPeer ? 'lobby-tab lobby-tab-active' : 'lobby-tab lobby-tab-inactive'; }
    if (tabFb)  { tabFb.className  = isPeer ? 'lobby-tab lobby-tab-inactive' : 'lobby-tab lobby-tab-active'; }
    if (isPeer) {
        initPeer();
    } else {
        // Скрыть P2P-специфичные элементы во вкладке Firebase
        const hintBanner = document.getElementById('firebase-hint-banner');
        if (hintBanner) hintBanner.style.display = 'none';
        const retryBtn = document.getElementById('btn-peer-retry');
        if (retryBtn) retryBtn.style.display = 'none';

        _updateServerBadge();
        // Авто-выбор сервера — только один раз при первом входе в лобби
        if (!_fbAutoSelectRan) {
            _fbAutoSelectRan = true;
            _fbSetStatus(t('fbStatusSearching'), '#f39c12');
            _fbAutoSelectServer().then(() => {
                _fbSetStatus(t('fbStatusReady'), '#2ecc71');
                _updateServerBadge();
            }).catch(() => _fbSetStatus(t('fbStatusReady'), '#2ecc71'));
        }
        // Обновить информацию о загрузке серверов
        setTimeout(() => {
            FB_SERVERS.forEach((_, i) => {
                if (!_fbEnsureDb(i)) return;
                _fbDbs[i].ref('pixelcats_rooms').once('value').then(snap => {
                    const count = Object.keys(snap.val() || {}).length;
                    const el = document.getElementById('fb-srv-load-' + i);
                    if (el) {
                        const pct = Math.min(100, Math.round(count / FB_MAX_ROOMS * 100));
                        const color = pct < 60 ? '#2ecc71' : pct < 85 ? '#f39c12' : '#e74c3c';
                        el.textContent = count + ' ' + t('srvRooms');
                        el.style.color = color;
                    }
                }).catch(() => {
                    const el = document.getElementById('fb-srv-load-' + i);
                    if (el) { el.textContent = t('srvUnavailable'); el.style.color = '#e74c3c'; }
                });
            });
        }, 300);
        _updateServerSelectorUI();
    }
}

// Уничтожить peer и сбросить состояние (для повторной инициализации)
function destroyPeer() {
    if (net.peer) {
        try { net.peer.destroy(); } catch(e) {}
        net.peer = null;
    }
    net.myId = null;
    net.conn = null;
    net.isHost = false;
    net.isOnline = false;
}

// ════════════════════════════════════════════════════════════════
// FIREBASE РЕЖИМ — все данные через Firebase Realtime Database
// (НЕ WebRTC — чистый Firebase как у старого файла, только надёжнее)
//
// Архитектура:
//  • хост создаёт комнату: pixelcats_rooms/{roomId}
//  • хост пишет данные в: host_to_guest
//  • гость пишет данные в: guest_to_host
//  • оба слушают входящий путь через .on('value')
//  • net.conn — обёртка, совместимая с PeerJS API
//    (send / on / open) — остальной код игры не меняется
// ════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════
// MULTI-SERVER CONFIG — два сервера (Firebase проекта)
// ════════════════════════════════════════════════════════════════
const FB_SERVERS = [
    {
        name: "Server 1",
        emoji: "🟢",
        apiKey:            "AIzaSyCZojXiH_qbHIJVWLnAQaTUPF28RsdJmKE",
        authDomain:        "cats-1f134.firebaseapp.com",
        databaseURL:       "https://cats-1f134-default-rtdb.europe-west1.firebasedatabase.app",
        projectId:         "cats-1f134",
        storageBucket:     "cats-1f134.firebasestorage.app",
        messagingSenderId: "411300615771",
        appId:             "1:411300615771:web:8569492efb4d2f3334d17e"
    },
    {
        name: "Server 2",
        emoji: "🔵",
        apiKey:            "AIzaSyDwOUvN6GOMhfHLlFVg58Ck0uJNRxymBgA",
        authDomain:        "catsbase1-7ba05.firebaseapp.com",
        databaseURL:       "https://catsbase1-7ba05-default-rtdb.europe-west1.firebasedatabase.app",
        projectId:         "catsbase1-7ba05",
        storageBucket:     "catsbase1-7ba05.firebasestorage.app",
        messagingSenderId: "588657190973",
        appId:             "1:588657190973:web:3845477dd037c4eb88a254",
        measurementId:     "G-CXFQE3N2LF"
    }
];

// Максимальное количество активных комнат на сервере до авто-переключения
const FB_MAX_ROOMS = 30;

let _currentServerIdx = 0;  // индекс текущего сервера
let _fbAutoSelectRan = false;          // флаг: авто-выбор уже запускался в этой сессии лобби
let _fbServerRoomCounts = {};          // кэш кол-ва комнат { idx: count }
let _fbApps     = {};       // { idx: firebaseApp }
let _fbDbs      = {};       // { idx: firebase.database() }
let _fbDb         = null;   // текущий firebase.database()
let _fbRoomRef    = null;   // ref на комнату
let _fbListeners  = [];     // { ref, handler } для отписки
let _fbConnObj    = null;   // текущий conn-объект

// Получить текущий конфиг сервера
function _fbCurrentConfig() { return FB_SERVERS[_currentServerIdx]; }

// Инициализация Firebase для заданного сервера
function _fbEnsureDb(serverIdx) {
    const idx = (serverIdx !== undefined) ? serverIdx : _currentServerIdx;
    if (_fbDbs[idx]) { _fbDb = _fbDbs[idx]; return true; }
    try {
        const cfg = FB_SERVERS[idx];
        let app;
        // Ищем уже инициализированное приложение по имени
        const appName = 'pxcats_' + idx;
        const existing = firebase.apps.find(a => a.name === appName);
        if (existing) {
            app = existing;
        } else {
            app = firebase.initializeApp(cfg, appName);
        }
        _fbApps[idx] = app;
        _fbDbs[idx] = firebase.database(app);
        _fbDb = _fbDbs[idx];
        return true;
    } catch(e) {
        _fbSetStatus(t('fbStatusUnavailable') + e.message, '#e74c3c');
        return false;
    }
}

// Переключение сервера
function switchFbServer(idx) {
    if (idx === _currentServerIdx) return;
    // Нельзя переключать во время активного соединения
    if (_fbConnObj && _fbConnObj.open) {
        alert(t('srvCantSwitch'));
        return;
    }
    _fbReset();
    _currentServerIdx = idx;
    _fbDb = null;
    _updateServerSelectorUI();
    _fbSetStatus(t('fbStatusSwitched') + ' ' + FB_SERVERS[idx].name, '#e67e22');
    setTimeout(() => _fbSetStatus(IconGenerator.html('check','12px') + ' ' + FB_SERVERS[idx].name + ' ' + t('fbStatusSrvReady'), '#2ecc71'), 800);
}

// Авто-выбор наименее загруженного сервера
async function _fbAutoSelectServer() {
    _fbSetStatus(t('fbStatusSearching'), '#f39c12');
    let bestIdx = 0;
    let bestCount = Infinity;
    for (let i = 0; i < FB_SERVERS.length; i++) {
        try {
            if (!_fbEnsureDb(i)) continue;
            const snap = await _fbDbs[i].ref('pixelcats_rooms').once('value');
            const rooms = snap.val() || {};
            const activeCount = Object.keys(rooms).length;
            _fbServerRoomCounts[i] = activeCount;  // кэшируем для модала
            console.log('[FB AutoSelect] Сервер', i, '— комнат:', activeCount);
            // Обновить метку загрузки в модале
            const pct = Math.min(100, Math.round(activeCount / FB_MAX_ROOMS * 100));
            const clr = pct < 60 ? '#2ecc71' : pct < 85 ? '#f39c12' : '#e74c3c';
            const oldLbl = document.getElementById('fb-srv-load-' + i);
            const modLbl = document.getElementById('modal-srv-load-' + i);
            if (oldLbl) { oldLbl.textContent = activeCount + ' ' + t('srvRooms'); oldLbl.style.color = clr; }
            if (modLbl) { modLbl.textContent = activeCount + ' ' + t('srvRooms'); modLbl.style.color = clr; }
            if (activeCount < bestCount) { bestCount = activeCount; bestIdx = i; }
        } catch(e) { console.warn('[FB AutoSelect] Ошибка сервера', i, e); }
    }
    if (bestCount >= FB_MAX_ROOMS) {
        _fbSetStatus(t('fbStatusAllFull'), '#e74c3c');
    }
    _currentServerIdx = bestIdx;
    _fbDb = _fbDbs[bestIdx];
    _updateServerSelectorUI();
    _fbSetStatus(IconGenerator.html('check','12px') + ' ' + FB_SERVERS[bestIdx].name + ' (' + bestCount + ')', '#2ecc71');
}

// Обновить визуальный селектор серверов
function _updateServerSelectorUI() {
    // Обновляем строки в модальном окне если оно открыто
    const container = document.getElementById('srv-rows-container');
    if (container && container.children.length > 0) {
        Array.from(container.querySelectorAll('.srv-row')).forEach((row, i) => {
            row.classList.toggle('srv-active', i === _currentServerIdx);
            const check = row.querySelector('.srv-check');
            if (check) check.textContent = (i === _currentServerIdx) ? '✔' : '';
        });
    }
    // Обновляем старые кнопки (если вдруг остались в DOM)
    FB_SERVERS.forEach((srv, i) => {
        const btn = document.getElementById('fb-srv-btn-' + i);
        if (!btn) return;
        const isActive = (i === _currentServerIdx);
        btn.style.background  = isActive ? '#c0390b' : '#222';
        btn.style.borderColor = isActive ? '#fff'    : '#555';
        btn.style.color       = isActive ? '#fff'    : '#888';
    });
    _updateServerBadge();
}

function _updateServerBadge() {
    const badge = document.getElementById('fb-srv-current-badge');
    if (!badge) return;
    const srv = FB_SERVERS[_currentServerIdx];
    if (srv) badge.innerText = srv.emoji + ' ' + srv.name;
}

function openServerModal() {
    buildServerModal();
    document.getElementById('server-modal-overlay').classList.add('open');
}
function closeServerModal() {
    document.getElementById('server-modal-overlay').classList.remove('open');
}
function buildServerModal() {
    const container = document.getElementById('srv-rows-container');
    if (!container) return;
    container.innerHTML = '';
    FB_SERVERS.forEach((srv, i) => {
        const row = document.createElement('div');
        row.className = 'srv-row' + (i === _currentServerIdx ? ' srv-active' : '');
        row.onclick = () => { switchFbServer(i); _updateServerBadge(); closeServerModal(); };
        const loadEl = document.getElementById('fb-srv-load-' + i);
        const cachedCount = _fbServerRoomCounts[i];
        const loadTxt = cachedCount !== undefined
            ? (cachedCount + ' ' + t('srvRooms'))
            : (loadEl ? loadEl.textContent : '—');
        const loadPct = cachedCount !== undefined ? Math.min(100, Math.round(cachedCount / FB_MAX_ROOMS * 100)) : -1;
        const loadColor = loadPct < 0 ? '#888' : loadPct < 60 ? '#2ecc71' : loadPct < 85 ? '#f39c12' : '#e74c3c';
        row.innerHTML =
            '<span class="srv-emoji">' + srv.emoji + '</span>' +
            '<div class="srv-info">' +
                '<div class="srv-name">' + srv.name + '</div>' +
                '<div class="srv-load" id="modal-srv-load-' + i + '" style="color:' + loadColor + '">' + loadTxt + '</div>' +
            '</div>' +
            '<span class="srv-check">' + (i === _currentServerIdx ? '✔' : '') + '</span>';
        container.appendChild(row);
    });
}

// Проверить загруженность и предупредить если сервер почти полный
async function _fbCheckServerLoad() {
    try {
        if (!_fbEnsureDb()) return;
        const snap = await _fbDb.ref('pixelcats_rooms').once('value');
        const rooms = snap.val() || {};
        const count = Object.keys(rooms).length;
        const loadEl = document.getElementById('fb-srv-load-' + _currentServerIdx);
        const pct = Math.min(100, Math.round(count / FB_MAX_ROOMS * 100));
        const color = pct < 60 ? '#2ecc71' : pct < 85 ? '#f39c12' : '#e74c3c';
        const loadTxt = count + ' ' + t('srvRooms');
        if (loadEl) { loadEl.textContent = loadTxt; loadEl.style.color = color; }
        const modalLoad = document.getElementById('modal-srv-load-' + _currentServerIdx);
        if (modalLoad) { modalLoad.textContent = loadTxt; modalLoad.style.color = color; }
        if (count >= FB_MAX_ROOMS) {
            _fbSetStatus(t('fbStatusOverloaded'), '#e74c3c');
            await _fbAutoSelectServer();
        }
    } catch(e) {}
}

function _fbSetStatus(msg, color) {
    const el = document.getElementById('fb-status');
    if (el) { el.innerHTML = msg; el.style.color = color || '#2ecc71'; }
}

function fbCopyRoomId() {
    const id = document.getElementById('fb-room-id').innerText;
    if (id && id !== '—') {
        navigator.clipboard.writeText(id)
            .then(() => {
                const hint = document.getElementById('fb-copy-hint');
                if (hint) { hint.innerText = t('codeCopied'); hint.style.color = '#2ecc71'; setTimeout(() => { hint.innerText = t('copyCodeHint'); hint.style.color = '#555'; }, 2000); }
            })
            .catch(() => prompt('Copy code:', id));
    }
}

// Снять все Firebase-слушатели
function _fbDetachListeners() {
    _fbListeners.forEach(({ ref, handler }) => { try { ref.off('value', handler); } catch(e){} });
    _fbListeners = [];
}

// Создать conn-объект, совместимый с PeerJS API
// send() пишет в Firebase, Firebase-слушатель вызывает обработчики data
function _fbMakeConnObj(roomRef, isHost) {
    const _handlers = { open: [], data: [], close: [], error: [] };
    let _open = false;
    const conn = {
        get open() { return _open; },
        send(data) {
            if (!roomRef) return;
            const path = isHost ? 'host_to_guest' : 'guest_to_host';
            // Добавляем timestamp для измерения ping через POS
            roomRef.child(path).set(Object.assign({}, data, { _t: Date.now() }))
                .catch(e => console.warn('[FB send]', e));
        },
        on(ev, handler) { if (_handlers[ev]) _handlers[ev].push(handler); },
        _emit(ev, ...args) { (_handlers[ev] || []).forEach(h => { try { h(...args); } catch(e){} }); },
        _setOpen(v) { _open = v; },
        close() { _fbReset(); },
    };
    return conn;
}

// Подключить Firebase-слушатель входящих данных
// Вызывается ПОСЛЕ setupPeerConnection() чтобы data-хендлеры уже были зарегистрированы
function _fbStartListening(roomRef, isHost, conn) {
    const listenPath = isHost ? 'guest_to_host' : 'host_to_guest';
    let lastMsgT = 0; // защита от повторной обработки одного сообщения
    const h = roomRef.child(listenPath).on('value', snap => {
        if (!snap.exists()) return;
        const d = snap.val();
        if (!d || !d.type) return;
        // Обновляем ping по timestamp из POS
        if (d._t && d.type === 'POS') {
            net.ping = Math.round(Date.now() - d._t);
            const pd = document.getElementById('ping-display');
            if (pd && pd.style.display !== 'none') {
                pd.innerText = 'PING: ' + net.ping + 'ms';
                pd.style.color = net.ping < 120 ? '#2ecc71' : net.ping < 250 ? '#f39c12' : '#e74c3c';
            }
        }
        // Дедупликация только для высокочастотных POS/PING/PONG.
        // Критические пакеты (DEAD, WIN, INIT, BOSS_*) НЕ дедуплицируем —
        // иначе DEAD с тем же _t что у последнего POS может быть проигнорирован.
        const _IS_DEDUP = d.type === 'POS' || d.type === 'PING' || d.type === 'PONG';
        if (_IS_DEDUP && d._t && d._t === lastMsgT) return;
        if (_IS_DEDUP && d._t) lastMsgT = d._t;
        conn._emit('data', d);
    });
    _fbListeners.push({ ref: roomRef.child(listenPath), handler: h });

    // Следим за онлайн-статусом партнёра
    const partnerPath = isHost ? 'guest/online' : 'host/online';
    let _disconnectDebounce = null;
    const dh = roomRef.child(partnerPath).on('value', snap => {
        if (snap.exists() && snap.val() === false && net.isOnline) {
            // Ждём 3 секунды — иногда Firebase сообщает false при кратковременном обрыве
            clearTimeout(_disconnectDebounce);
            _disconnectDebounce = setTimeout(() => {
                // Проверяем снова актуальное значение
                roomRef.child(partnerPath).once('value', snap2 => {
                    if (snap2.exists() && snap2.val() === false && net.isOnline) {
                        conn._emit('close');
                    }
                });
            }, 3000);
        } else if (snap.exists() && snap.val() === true) {
            // Партнёр снова онлайн — отменяем дисконнект
            clearTimeout(_disconnectDebounce);
        }
    });
    _fbListeners.push({ ref: roomRef.child(partnerPath), handler: dh });
}

// ── ХОСТ: Создать комнату ──────────────────────────────────────
function fbCreateRoom() {
    if (!_fbEnsureDb()) return;
    _fbReset();
    _fbCheckServerLoad();

    // Код: номер_сервера (1-based) + 6 случайных символов → итого 7 символов
    const srvPrefix = String(_currentServerIdx + 1);
    const shortId   = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomId    = shortId; // в БД хранится только shortId
    const fullCode  = srvPrefix + shortId; // показываем пользователю
    document.getElementById('fb-room-id').innerText = fullCode;
    _fbSetStatus(t('fbStatusCreating'), '#f39c12');

    const roomRef = _fbDb.ref('pixelcats_rooms/' + roomId);
    _fbRoomRef = roomRef;

    roomRef.set({
        host: { skin: p1SkinIndex, online: true },
        guest: null,
        host_to_guest: null,
        guest_to_host: null
    }).then(() => {
        roomRef.child('host/online').onDisconnect().set(false);
        _fbSetStatus(t('fbStatusCreated'), '#2ecc71');

        // Ждём гостя
        const guestRef = roomRef.child('guest');
        const gh = guestRef.on('value', snap => {
            if (!snap.exists() || !snap.val() || !snap.val().online) return;

            // Гость подключился
            guestRef.off('value', gh);
            _fbListeners = _fbListeners.filter(l => l.handler !== gh);

            net.remoteSkin = snap.val().skin !== undefined ? snap.val().skin : 1;
            // Обновляем скин хоста на случай если гость успел считать
            roomRef.child('host/skin').set(p1SkinIndex);

            // Создаём conn и вызываем setupPeerConnection
            const conn = _fbMakeConnObj(roomRef, true);
            net.conn    = conn;
            net.isHost  = true;
            net.isOnline = true;
            _showLeaveBtn();

            setupPeerConnection(); // регистрирует on('open'), on('data'), on('close')
            _fbStartListening(roomRef, true, conn); // начинаем слушать ПОСЛЕ регистрации

            conn._setOpen(true);
            conn._emit('open'); // триггер → отправит SKIN + PING, покажет секции лобби

            _fbSetStatus(t('fbStatusPlayerConn'), '#2ecc71');
        });
        _fbListeners.push({ ref: guestRef, handler: gh });

    }).catch(e => _fbSetStatus(t('fbStatusError') + e.message, '#e74c3c'));
}

// ── ГОСТЬ: Войти в комнату ─────────────────────────────────────
function fbJoinRoom() {
    const rawInput = (document.getElementById('fb-remote-id-input').value || '').toUpperCase().trim();
    if (!rawInput) { _fbSetStatus(t('fbStatusEnterCode'), '#e74c3c'); return; }

    // Парсим: первый символ = номер сервера (1-based), остаток = roomId
    const firstChar = rawInput[0];
    const srvNum    = parseInt(firstChar, 10);
    let roomId, targetSrvIdx;
    if (!isNaN(srvNum) && srvNum >= 1 && srvNum <= FB_SERVERS.length) {
        targetSrvIdx = srvNum - 1;
        roomId       = rawInput.slice(1); // убираем префикс
    } else {
        // Старый формат без префикса — используем текущий сервер
        targetSrvIdx = _currentServerIdx;
        roomId       = rawInput;
    }
    if (!roomId) { _fbSetStatus(t('fbStatusInvalidCode'), '#e74c3c'); return; }

    // Переключаемся на нужный сервер если нужно
    if (targetSrvIdx !== _currentServerIdx) {
        _currentServerIdx = targetSrvIdx;
        _updateServerSelectorUI();
        _updateServerBadge();
    }
    if (!_fbEnsureDb(targetSrvIdx)) return;

    _fbReset();
    _fbSetStatus(t('fbStatusSearchRoom') + ' ' + rawInput + '...', '#f39c12');

    const roomRef = _fbDb.ref('pixelcats_rooms/' + roomId);
    _fbRoomRef = roomRef;

    roomRef.child('host').once('value', snap => {
        if (!snap.exists() || !snap.val() || !snap.val().online) {
            _fbSetStatus(t('fbStatusRoomNotFound'), '#e74c3c');
            return;
        }
        net.remoteSkin = snap.val().skin !== undefined ? snap.val().skin : 0;

        // Записываемся как гость
        roomRef.child('guest').set({ skin: p1SkinIndex, online: true });
        roomRef.child('guest/online').onDisconnect().set(false);
        // Запомнить собственный скин гостя на момент подключения
        _guestOwnSkin = p1SkinIndex;

        // Создаём conn и запускаем всё
        const conn = _fbMakeConnObj(roomRef, false);
        net.conn    = conn;
        net.isHost  = false;
        net.isOnline = true;
        _showLeaveBtn();

        setupPeerConnection();
        _fbStartListening(roomRef, false, conn);

        conn._setOpen(true);
        conn._emit('open');

        _fbSetStatus(t('fbStatusConnected'), '#2ecc71');
    });
}

// Сброс Firebase при выходе
function _fbReset() {
    _fbDetachListeners();
    if (_fbRoomRef) {
        try {
            if (net.isHost) {
                // Хост полностью удаляет комнату из Firebase
                _fbRoomRef.remove();
            } else {
                _fbRoomRef.child('guest/online').set(false);
            }
        } catch(e) {}
        _fbRoomRef = null;
    }
    if (_fbConnObj) { _fbConnObj = null; }
}

// ════════════════════════════════════════════════════════════════
// фоллбеком сигнального сервера и relay-режимом
// ============================================

// Флаг принудительного TURN-реле (для строгого NAT/CGNAT/мобильный интернет)
net.forceRelay = false;

// ICE-серверы: STUN + несколько TURN для обхода NAT
function _getIceServers() {
    return [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },   // надёжнее Google в ряде регионов
        { urls: 'stun:global.stun.twilio.com:3478' },
        // TURN серверы — обходят строгий NAT (офисы, мобильный интернет, CGNAT)
        { urls: 'turn:openrelay.metered.ca:80',               username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:443',              username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:80?transport=udp',  username: 'openrelayproject', credential: 'openrelayproject' },
    ];
}

// ── Pre-warm ICE: создаём временный RTCPeerConnection чтобы браузер
//    начал STUN-запросы ещё ДО того, как пользователь нажмёт Join ──
function _preWarmIce() {
    try {
        const cfg = { iceServers: _getIceServers(), iceCandidatePoolSize: 8 };
        const pc = new RTCPeerConnection(cfg);
        // Создаём фиктивный канал — без него ICE не стартует
        pc.createDataChannel('__warm');
        pc.createOffer().then(o => pc.setLocalDescription(o)).catch(() => {});
        // Закрываем через 6 секунд — кандидаты уже собраны в кеше браузера
        setTimeout(() => { try { pc.close(); } catch(e) {} }, 6000);
    } catch(e) { /* не критично */ }
}

// Переключатель режима "принудить TURN-реле"
function toggleRelayMode() {
    net.forceRelay = !net.forceRelay;
    const btn = document.getElementById('btn-relay-mode');
    if (btn) {
        btn.textContent = net.forceRelay ? t('relayOn') : t('relayOff');
        btn.style.borderColor = net.forceRelay ? '#e74c3c' : '#999';
        btn.style.color = net.forceRelay ? '#e74c3c' : '#aaa';
    }
    document.getElementById('online-status').innerText = net.forceRelay
        ? '⚡ Режим реле: прямое P2P отключено'
        : t('ready');
}

// Вставляем кнопку relay-режима в онлайн-экран (один раз)
function _ensureRelayButton() {
    if (document.getElementById('btn-relay-mode')) return;
    const btn = document.createElement('button');
    btn.id = 'btn-relay-mode';
    btn.className = 'btn btn-dark';
    btn.style.cssText = 'width:220px;padding:6px;font-size:8px;margin:6px auto;display:block;';
    btn.textContent = t('relayOff');
    btn.title = 'Enable if connection fails (strict NAT, mobile internet, VPN)';
    btn.onclick = toggleRelayMode;
    const retryBtn = document.getElementById('btn-peer-retry');
    const anchor = retryBtn || document.getElementById('btn-join');
    anchor.parentNode.insertBefore(btn, anchor);
}

function initPeer() {
    // Проверяем что PeerJS вообще загрузился
    if (typeof Peer === 'undefined') {
        document.getElementById('online-status').innerText = t('statusPeerJsFail');
        document.getElementById('my-peer-id').innerText = '—';
        _showRetryButton();
        return;
    }

    // Если peer уже открыт и работает — ничего не делать
    if (net.peer && !net.peer.destroyed && net.myId) {
        document.getElementById('my-peer-id').innerText = net.myId;
        document.getElementById('online-status').innerText = t('ready');
        _ensureRelayButton();
        return;
    }
    // Уничтожить старый сломанный peer если есть
    destroyPeer();

    document.getElementById('my-peer-id').innerText = '...';
    document.getElementById('online-status').innerText = t('statusInitializing');
    document.getElementById('btn-join').disabled = true;

    // Запускаем pre-warm сразу — браузер начнёт собирать кандидаты заранее
    _preWarmIce();
    _ensureRelayButton();

    const ICE_SERVERS = _getIceServers();

    // 6 символов: 36^6 ≈ 2.1 млрд комбинаций, минимум коллизий
    const simpleId = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Список сигнальных серверов — перебираем по очереди при ошибке
    const SIGNAL_SERVERS = [
        { host: '0.peerjs.com',      port: 443, path: '/', secure: true,  label: '0.peerjs.com' },
        { host: 'broker.peerjs.com', port: 443, path: '/', secure: true,  label: 'broker.peerjs.com' },
        { host: '0.peerjs.com',      port: 80,  path: '/', secure: false, label: '0.peerjs.com:80' },
    ];
    let serverIdx = 0;
    let currentTimeout = null;
    let isSwitching = false; // защита от двойного переключения

    function _switchToNextServer() {
        if (isSwitching || net.myId) return;
        isSwitching = true;
        clearTimeout(currentTimeout);
        try { if (net.peer && !net.peer.destroyed) net.peer.destroy(); } catch(e) {}
        net.peer = null;

        serverIdx++;
        if (serverIdx >= SIGNAL_SERVERS.length) {
            document.getElementById('online-status').innerText = t('statusAllDown');
            document.getElementById('my-peer-id').innerText = '—';
            // Показываем подсказку переключиться на Firebase
            const banner = document.getElementById('firebase-hint-banner');
            if (banner) banner.style.display = 'block';
            _showRetryButton();
            return;
        }
        const next = SIGNAL_SERVERS[serverIdx];
        document.getElementById('online-status').innerText = t('statusTryBackup') + ' (' + next.label + ')...';
        setTimeout(() => { isSwitching = false; _tryInit(next); }, 500);
    }

    function _tryInit(srv) {
        currentTimeout = setTimeout(() => {
            if (!net.myId) _switchToNextServer();
        }, 10000);

        net.peer = new Peer(simpleId, {
            host: srv.host, port: srv.port, path: srv.path, secure: srv.secure,
            debug: 0,
            config: {
                iceServers: ICE_SERVERS,
                iceCandidatePoolSize: 10,
                bundlePolicy: 'max-bundle',
                rtcpMuxPolicy: 'require',
            }
        });

        net.peer.on('open', (id) => {
            clearTimeout(currentTimeout);
            isSwitching = false;
            net.myId = id;
            document.getElementById('my-peer-id').innerText = id;
            document.getElementById('online-status').innerText = t('ready');
            document.getElementById('btn-join').disabled = false;
            _hideRetryButton();
        });

        // Входящее соединение — мы хост
        net.peer.on('connection', (conn) => {
            if (net.conn && net.conn.open) { conn.close(); return; }
            net.conn = conn;
            net.isHost = true;
            net.isOnline = true;
            _showLeaveBtn();
            setupPeerConnection();
            document.getElementById('online-status').innerText = t('playerJoined');
        });

        net.peer.on('error', (err) => {
            console.error('PeerJS error:', err.type, err);
            if (err.type === 'peer-unavailable') {
                // Это ошибка при join, а не при инициализации — не переключаем сервер
                document.getElementById('online-status').innerText = t('statusNotFound');
                net.conn = null; net.isOnline = false;
            } else if (err.type === 'unavailable-id') {
                // ID занят — пересоздать с новым ID
                clearTimeout(currentTimeout);
                destroyPeer();
                setTimeout(initPeer, 300);
            } else if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error' || err.type === 'socket-closed') {
                // Сервер недоступен — немедленно пробуем следующий
                _switchToNextServer();
            } else {
                clearTimeout(currentTimeout);
                document.getElementById('online-status').innerText = t('statusConnErr') + err.type;
                _showRetryButton();
            }
        });

        net.peer.on('disconnected', () => {
            // Потеряно соединение с сигнальным сервером
            // НЕ вызываем reconnect() — он снова пойдёт на заблокированный сервер.
            // Вместо этого — пробуем следующий сервер из списка (если ещё не нашли ID)
            if (!net.myId) {
                _switchToNextServer();
            } else if (!isPlaying && net.peer && !net.peer.destroyed) {
                // Соединение было, но потерялось — тихое переподключение к тому же серверу
                document.getElementById('online-status').innerText = t('statusReconnecting');
                setTimeout(() => {
                    if (net.peer && !net.peer.destroyed && !net.myId) {
                        initPeer(); // полный перезапуск если myId пропал
                    }
                }, 3000);
            }
        });
    }

    // Начинаем с первого сервера
    _tryInit(SIGNAL_SERVERS[0]);
}

function _showRetryButton() {
    let btn = document.getElementById('btn-peer-retry');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'btn-peer-retry';
        btn.className = 'pixel-btn pixel-btn-orange';
        btn.textContent = t('btnReconnect');
        btn.onclick = () => { _hideRetryButton(); initPeer(); };
        const statusEl = document.getElementById('online-status');
        if (statusEl && statusEl.parentNode) statusEl.parentNode.insertBefore(btn, statusEl.nextSibling);
    }
    if (btn) btn.style.display = 'block';
}

function _hideRetryButton() {
    const btn = document.getElementById('btn-peer-retry');
    if (btn) btn.style.display = 'none';
}
function _showLeaveBtn() {
    const btn = document.getElementById('btn-leave-room');
    if (btn) btn.style.display = '';
}
function _hideLeaveBtn() {
    const btn = document.getElementById('btn-leave-room');
    if (btn) btn.style.display = 'none';
}
// ============================================
// FIREBASE INLINE HOST UI — fbSetMode / fbSetDiff / show/restore
// ============================================
function fbSetMode(mode) {
    setOnlineMode(mode);
    const isRace = mode === 'race';
    const raceBtn = document.getElementById('fb-omode-race');
    const bossBtn = document.getElementById('fb-omode-boss');
    if (raceBtn) {
        raceBtn.className = isRace
            ? 'pixel-btn pixel-btn-blue  lobby-mode-btn lobby-mode-active'
            : 'pixel-btn pixel-btn-dark lobby-mode-btn';
    }
    if (bossBtn) {
        bossBtn.className = !isRace
            ? 'pixel-btn pixel-btn-red   lobby-mode-btn lobby-mode-active'
            : 'pixel-btn pixel-btn-dark lobby-mode-btn';
    }
    document.getElementById('fb-diff-section').style.display = isRace  ? '' : 'none';
    document.getElementById('fb-boss-section').style.display = !isRace ? '' : 'none';
    if (!isRace) buildOnlineBossList('fb-boss-list-items');
}

function fbSetDiff(diff) {
    setOnlineDiff(diff);
    const classes = {
        easy:     'pixel-btn pixel-btn-green  lobby-diff-btn',
        hard:     'pixel-btn pixel-btn-red    lobby-diff-btn',
        megahard: 'pixel-btn pixel-btn-purple lobby-diff-btn',
        infinity: 'pixel-btn pixel-btn-inf    lobby-diff-btn'
    };
    ['easy','hard','megahard','infinity'].forEach(d => {
        const btn = document.getElementById('fb-diff-' + d);
        if (btn) {
            btn.className = classes[d] + (d === diff ? ' lobby-diff-active' : '');
        }
    });
}

function _fbShowHostReady() {
    const createEl = document.getElementById('fb-create-section');
    const joinEl   = document.getElementById('fb-join-section');
    const readyEl  = document.getElementById('fb-host-ready');
    if (createEl) createEl.style.display = 'none';
    if (joinEl)   joinEl.style.display   = 'none';
    if (readyEl)  readyEl.style.display  = '';
    // Восстанавливаем предыдущий режим/сложность/босса (не сбрасываем при ре-входе)
    fbSetMode(onlineMode);
    if (onlineMode === 'race') fbSetDiff(onlineDifficulty);
    else if (onlineMode === 'boss' && selectedOnlineBoss !== null) {
        buildOnlineBossList('fb-boss-list-items');
    }
    // Скрыть старый online-host-start чтобы не задваивать
    document.getElementById('online-host-start').style.display = 'none';
    // Обновить тексты на текущем языке
    _updateFbTexts();
}

function _fbRestoreCreateSection() {
    const createEl = document.getElementById('fb-create-section');
    const joinEl   = document.getElementById('fb-join-section');
    const readyEl  = document.getElementById('fb-host-ready');
    if (createEl) createEl.style.display = '';
    if (joinEl)   joinEl.style.display   = '';
    if (readyEl)  readyEl.style.display  = 'none';
    const roomIdEl = document.getElementById('fb-room-id');
    if (roomIdEl) roomIdEl.innerText = '—';
}
// ============================================
// SETUP PEER CONNECTION
// ============================================
function setupPeerConnection() {
    net.conn.on('open', () => {
        document.getElementById('online-status').innerText = t('connected');
        // Обмен скинами
        net.conn.send({ type: 'SKIN', skin: p1SkinIndex });
        // Пинг
        net.lastPingTime = performance.now(); 
        net.conn.send({ type: 'PING', time: net.lastPingTime });
        if (!net.isHost) {
            // Гость: показываем секцию ожидания хоста
            document.getElementById('online-guest-wait').style.display = 'block';
            document.getElementById('online-host-start').style.display = 'none';
            const pingEl = document.getElementById('ping-display');
            if (pingEl) pingEl.style.display = 'block';
        } else {
            // Хост: в Firebase-режиме показываем inline UI; в P2P — старый блок
            if (connMode === 'firebase') {
                _fbShowHostReady();
            } else {
                document.getElementById('online-host-start').style.display = 'block';
                document.getElementById('online-guest-wait').style.display = 'none';
                document.getElementById('online-status').innerText = t('statusPlayerConnected');
            }
        }
    });
    net.conn.on('data', (data) => handlePeerData(data));
    net.conn.on('close', () => {
        // Сбрасываем bossOnline при разрыве
        net.bossOnline = false;
        document.getElementById('online-host-start').style.display = 'none';
        document.getElementById('online-guest-wait').style.display = 'none';
        net.isOnline = false;
        _hideLeaveBtn();
        if (bossBattleActive) {
            bossBattleActive = false;
            if (bossAnimationId) cancelAnimationFrame(bossAnimationId);
            AudioEngine.stopBossMusic(false);
            document.getElementById('boss-battle-screen').style.display = 'none';
            document.getElementById('boss-lose-screen').style.display = 'block';
            document.getElementById('boss-lose-msg').innerText = t('statusConnLostBoss');
            // Показываем кнопку возврата в лобби на экране поражения
            const bossLoseBack = document.getElementById('btn-boss-lose-back');
            if (bossLoseBack) { bossLoseBack.innerText = '↩ ОНЛАЙН ЛОББИ'; bossLoseBack.onclick = showOnlineLobby; }
        } else if (isPlaying) {
            // Разрыв во время игры — показываем экран проигрыша с кнопкой лобби
            isPlaying = false;
            if (animationId) cancelAnimationFrame(animationId);
            AudioEngine.stopMusic();
            isGameOver = true;
            finalScoreEl.innerText = score;
            gameOverScreen.style.display = 'block';
            npcDialog.style.display = 'none';
            const goHint = document.getElementById('try-again-hint');
            if (goHint) goHint.innerText = t('statusConnLostHint');
            const _lg = document.getElementById('btn-lobby-go');
            if (_lg) _lg.style.display = 'block';
            const _ta = document.getElementById('btn-try-again');
            if (_ta) _ta.style.display = 'none';
        } else {
            // Разрыв в лобби — сбрасываем состояние, показываем уведомление
            document.getElementById('online-host-start').style.display = 'none';
            document.getElementById('online-guest-wait').style.display = 'none';
            if (connMode === 'firebase') {
                _fbReset(); // Очищаем Firebase-комнату ПЕРЕД сбросом isHost
                net.isOnline = false; net.isHost = false; numPlayers = 1;
                _fbRestoreCreateSection();
                _fbSetStatus(t('fbStatusPlayerLeft'), '#e74c3c');
            } else {
                net.isOnline = false; net.isHost = false; numPlayers = 1;
                const statusEl = document.getElementById('online-status');
                if (statusEl) { statusEl.innerText = t('statusPlayerLeftRoom'); statusEl.style.color = '#e74c3c'; }
            }
        }
    });
    net.conn.on('error', (err) => console.error('Connection error:', err));
}

// Хост запускает игру после получения скина от гостя
function _hostStartOnlineGame() {
    // Проверка: игрок всё ещё подключён?
    if (!net.conn || !net.conn.open) {
        const msg = t('statusPlayerLeftCantStart');
        if (connMode === 'firebase') {
            _fbSetStatus(msg, '#e74c3c');
        } else {
            const st = document.getElementById('online-status');
            if (st) { st.innerText = msg; st.style.color = '#e74c3c'; }
        }
        return;
    }
    // Генерируем seed и рассылаем INIT
    net.worldSeed = Math.floor(Math.random() * 0x7FFFFFFF);
    net.worldGroundBase = canvas.height - 100;
    p2SkinIndex = net.remoteSkin;
    const bossIdx = (onlineMode === 'boss') ? (net.selectedBossIndex !== undefined ? net.selectedBossIndex : selectedOnlineBoss) : undefined;
    setTimeout(() => {
        if (!net.conn || !net.conn.open) return; // повторная проверка
        if (onlineMode === 'boss' && bossIdx != null) {
            // Режим боссов
            net.conn.send({ type: 'BOSS_START', bossIndex: bossIdx });
            openOnlineBossScreen(bossIdx);
        } else {
            net.conn.send({ 
                type: 'INIT', 
                diff: onlineDifficulty, 
                seed: net.worldSeed, 
                hostSkin: p1SkinIndex, 
                guestSkin: net.remoteSkin,
                groundBase: net.worldGroundBase
            }); 
            numPlayers = 2;
            net.lastSentTime = performance.now() + 1000;
            startGame(onlineDifficulty);
        }
    }, 300);
}

        // ============================================
// HANDLE PEER DATA — новая P2P архитектура
// ============================================
function handlePeerData(data) {
    switch(data.type) {
        case 'SKIN':
            // Получили скин от другого игрока
            net.remoteSkin = data.skin;
            if (net.isHost) {
                // Хост получил скин гостя — показываем выбор режима и СТАРТ
                if (connMode === 'firebase') {
                    _fbShowHostReady();
                } else {
                    document.getElementById('online-host-start').style.display = 'block';
                    document.getElementById('online-guest-wait').style.display = 'none';
                    document.getElementById('online-status').innerText = t('statusPlayerConnected');
                }
            } else {
                // Гость получил скин хоста (на случай если придёт позже)
                // (обычно гость получает скин в INIT)
            }
            break;

        case 'LOBBY':
            // Хост вернулся в лобби — гость тоже переходит в лобби
            // (скрывает экраны поражения/победы автоматически)
            if (!net.isHost) {
                showOnlineLobby();
            }
            break;

        case 'LEAVE':
            // Партнёр намеренно вышел из лобби — мгновенно сбрасываем соединение
            if (connMode === 'firebase') {
                _fbReset();
                net.isOnline = false; net.isHost = false; numPlayers = 1;
                _hideLeaveBtn();
                document.getElementById('online-host-start').style.display = 'none';
                document.getElementById('online-guest-wait').style.display = 'none';
                _fbRestoreCreateSection();
                _fbSetStatus(t('fbStatusPlayerLeftLobby'), '#e74c3c');
            } else {
                if (net.conn) { try { net.conn.close(); } catch(e) {} net.conn = null; }
                net.isOnline = false; net.isHost = false; numPlayers = 1;
                _hideLeaveBtn();
                document.getElementById('online-host-start').style.display = 'none';
                document.getElementById('online-guest-wait').style.display = 'none';
                const statusEl = document.getElementById('online-status');
                if (statusEl) { statusEl.innerText = '⚠ Игрок покинул лобби.'; statusEl.style.color = '#e74c3c'; }
            }
            break;

        case 'INIT':
            // Гость получает параметры игры от хоста
            // Хост = P1, Гость = P2
            currentDifficulty = data.diff;
            net.worldSeed = data.seed;
            // FIX #1: принимаем базу земли от хоста
            net.worldGroundBase = data.groundBase || (canvas.height - 100);
            net.remoteSkin = data.hostSkin;   // скин хоста
            // Сохраняем текущий скин гостя ДО перезаписи p1SkinIndex —
            // чтобы восстановить его при возврате в лобби
            if (_guestOwnSkin === null) _guestOwnSkin = p1SkinIndex;
            p1SkinIndex = data.hostSkin;       // P1 = хост
            // FIX SKIN: гость использует свой текущий скин (p1SkinIndex до перезаписи
            // уже переписан выше), поэтому берём data.guestSkin от хоста,
            // но если гость успел поменять скин и отправил SKIN-сообщение — хост
            // должен был уже прислать правильный guestSkin.
            // Дополнительная страховка: если гость только что менял скин, его
            // _currentGuestSkin (сохранённый ниже) имеет приоритет.
            p2SkinIndex = (typeof _pendingGuestSkin !== 'undefined' && _pendingGuestSkin !== null)
                ? _pendingGuestSkin
                : data.guestSkin;
            _pendingGuestSkin = null;
            numPlayers = 2;
            // Сбросить состояние game over/win у гостя перед стартом
            isGameOver = false; isWin = false;
            gameOverScreen.style.display = 'none';
            winScreen.style.display = 'none';
            // Скрыть кнопки лобби
            const _lgi = document.getElementById('btn-lobby-go'); if (_lgi) _lgi.style.display = 'none';
            const _lwi = document.getElementById('btn-lobby-win'); if (_lwi) _lwi.style.display = 'none';
            const _tai = document.getElementById('btn-try-again'); if (_tai) _tai.style.display = '';
            // Восстановить подсказку
            const _hi = document.getElementById('try-again-hint'); if (_hi) _hi.innerText = t('tryAgainHint');
            updatePlayerModeUI(); 
            startGame(currentDifficulty);
            break;

        case 'POS':
            // Позиция удалённого кота — только цель для интерполяции
            // velocity prediction убрана: вызывала overshooting и «телепортацию»
            net.remote.x = data.x;
            net.remote.y = data.y;
            net.remote.dir = data.dir;
            net.remote.lastTime = performance.now();
            break;

        case 'DEAD':
            // Удалённый игрок умер.
            // Игнорируем пакеты старше момента старта игры — Firebase может
            // переслать устаревший DEAD при переподключении.
            if (data._t && data._t < net.gameStartTime) break;
            if (!isGameOver && !isWin) { score = data.score || score; endGame(); }
            break;

        case 'WIN':
            if (data._t && data._t < net.gameStartTime) break;
            if (!isWin && !isGameOver) { score = data.score || score; triggerWin(); }
            break;

        case 'PING':
            net.conn.send({ type: 'PONG', time: data.time });
            break;

        case 'PONG':
            net.ping = Math.round(performance.now() - data.time);
            break;

        // ══════════════════════════════════════════════════════════
        // ОНЛАЙН БИТВА С БОССОМ — новые типы сообщений
        // Хост ведёт всю симуляцию, гость получает состояние мира.
        // ══════════════════════════════════════════════════════════

        case 'BOSS_START':
            // ГОСТЬ: хост выбрал босса — входим автоматически
            p1SkinIndex = data.hostSkin;
            p2SkinIndex = data.guestSkin;
            numPlayers = 2;
            _guestJoinOnlineBossBattle(data.bossIndex);
            break;

        case 'BOSS_STATE': {
            // ГОСТЬ: получаем состояние всего мира от хоста (~20 раз/сек)
            if (!bossBattleActive || !net.bossOnline) break;
            // Обновляем сущность босса
            if (bossEntity) {
                bossEntity.x         = data.ex;
                bossEntity.y         = data.ey;
                bossEntity.moveAngle = data.ema;
                bossEntity.floatAngle= data.efa;
                bossEntity.animFrame = data.eat;
            }
            // Обновляем глобальные состояния
            bossHp                      = data.hp;
            bossBattleTime              = data.bt;
            shadowLordPhase             = data.slp;
            shadowLordEvaporating       = !!data.sle;
            shadowLordEvaporateProgress = data.slep || 0;
            shadowLordFinalTimer        = data.slft || 0;
            // Восстанавливаем снаряды из сжатого формата
            bossProjectiles = (data.projs || []).map(p => ({
                x: p[0], y: p[1], vx: p[2], vy: p[3], size: p[4],
                type: currentBoss ? currentBoss.id : ''
            }));
            // Позиция кота хоста (P1) для рендера
            if (bossPlayerCat && data.p1x !== undefined) {
                bossPlayerCat.x            = lerp(bossPlayerCat.x, data.p1x, 0.4);
                bossPlayerCat.y            = lerp(bossPlayerCat.y, data.p1y, 0.4);
                bossPlayerCat.facingRight  = !!data.p1dir;
                bossPlayerCat.alive        = !!data.p1alive;
                bossPlayerCat.invulnerable = data.p1inv ? 5 : 0;
            }
            // Состояние кота гостя (P2) — хост авторитетен
            if (bossPlayerCat2 && data.p2alive !== undefined) {
                const wasAlive = bossPlayerCat2.alive;
                bossPlayerCat2.alive        = !!data.p2alive;
                bossPlayerCat2.invulnerable = data.p2inv ? 30 : 0;
                if (wasAlive && !bossPlayerCat2.alive) AudioEngine.sfx.bossHit();
            }
            // Обновляем UI таймера и HP
            if (currentBoss) {
                document.getElementById('boss-hp-fill').style.width =
                    currentBoss && currentBoss.id !== 'shadowLord'
                        ? Math.max(0, bossBattleTime / currentBoss.duration * 100) + '%'
                        : Math.max(0, (bossHp / currentBoss.hp * 100)) + '%';
                if (currentBoss.id !== 'shadowLord') {
                    document.getElementById('boss-timer').innerText = Math.max(0, Math.ceil(bossBattleTime));
                } else {
                    if (shadowLordPhase === 4) {
                        document.getElementById('boss-timer').innerText = Math.max(0, Math.ceil(10 - shadowLordFinalTimer));
                    } else if (shadowLordPhase === 3) {
                        document.getElementById('boss-timer').innerText = '...';
                    } else {
                        document.getElementById('boss-timer').innerText = Math.ceil(999 - bossBattleTime);
                    }
                }
            }
            break;
        }

        case 'BOSS_POS':
            // ХОСТ: получаем позицию гостя (P2)
            if (!bossBattleActive || !net.bossOnline) break;
            net.bossRemote.x     = data.x;
            net.bossRemote.y     = data.y;
            net.bossRemote.dir   = !!data.dir;
            net.bossRemote.alive = !!data.alive;
            net.bossRemote.inv   = data.inv || 0;
            break;

        case 'BOSS_P2_DEAD':
            // ХОСТ: гость сообщил что умер — засчитываем, но проигрыш только если оба мертвы
            if (!bossBattleActive || !net.bossOnline || !net.isHost) break;
            if (bossPlayerCat2 && bossPlayerCat2.alive) {
                bossPlayerCat2.alive = false;
                bossPlayerCat2.invulnerable = 999;
                AudioEngine.sfx.bossHit();
                const p1dead = !bossPlayerCat || !bossPlayerCat.alive;
                if (p1dead) { bossLose(); }
            }
            break;

        case 'BOSS_WIN':
            // ГОСТЬ: хост объявил победу
            if (bossBattleActive) bossWin();
            break;

        case 'BOSS_LOSE':
            // ГОСТЬ: хост объявил поражение
            if (bossBattleActive) bossLose();
            break;

        case 'BOSS_HINT': {
            // ГОСТЬ: показать подсказку (фаза босса, предупреждение)
            const hEl = document.getElementById('dodge-hint');
            if (hEl) {
                hEl.style.display = 'block';
                hEl.innerText = data.text || '';
                if (data.color) hEl.style.color = data.color;
                clearTimeout(window._bossHintGuestTimer);
                if (data.ms) window._bossHintGuestTimer = setTimeout(() => {
                    hEl.style.display = 'none';
                }, data.ms);
            }
            break;
        }
    }
}

        

// ════════════════════════════════════════════════════════════════
// ОНЛАЙН БИТВА С БОССОМ — вспомогательные функции
// ════════════════════════════════════════════════════════════════

// Хост: открыть экран выбора босса для онлайн-боя
function openOnlineBossScreen(bossIdx) {
    if (!net.isOnline || !net.isHost) return;
    if (bossIdx != null) {
        // Прямой старт боссовой битвы без экрана выбора
        onlineScreen.style.display = 'none';
        startBossBattle(bossIdx);
        return;
    }
    onlineScreen.style.display = 'none';
    showBossScreen();
    const backBtn = document.getElementById('btn-boss-back');
    if (backBtn) backBtn.onclick = function() { showOnlineLobby(); };
}

// Гость: автоматически войти в бой когда хост его начал
function _guestJoinOnlineBossBattle(bossIndex) {
    // Сброс экрана — закрываем всё кроме boss-battle-screen
    onlineScreen.style.display = 'none';
    startScreen.style.display = 'none';
    document.getElementById('boss-screen').style.display = 'none';
    document.getElementById('boss-win-screen').style.display = 'none';
    document.getElementById('boss-lose-screen').style.display = 'none';
    if (animationId) cancelAnimationFrame(animationId);
    if (menuAnimationId) cancelAnimationFrame(menuAnimationId);
    net.bossOnline = true;
    startBossBattle(bossIndex);
}

// Хост: отправить текущее состояние мира гостю
function _sendBossState() {
    if (!net.conn || !net.conn.open || !bossEntity || !currentBoss) return;
    net.conn.send({
        type: 'BOSS_STATE',
        // Сущность босса
        ex:   bossEntity.x,
        ey:   bossEntity.y,
        ema:  bossEntity.moveAngle,
        efa:  bossEntity.floatAngle,
        eat:  bossEntity.animFrame,
        // Глобальное состояние
        hp:   bossHp,
        bt:   bossBattleTime,
        slp:  shadowLordPhase,
        sle:  shadowLordEvaporating ? 1 : 0,
        slep: shadowLordEvaporateProgress,
        slft: shadowLordFinalTimer,
        // Кот хоста (P1) для рендера на стороне гостя
        p1x:    bossPlayerCat ? bossPlayerCat.x   : 0,
        p1y:    bossPlayerCat ? bossPlayerCat.y   : 0,
        p1dir:  bossPlayerCat ? (bossPlayerCat.facingRight ? 1 : 0) : 1,
        p1alive:bossPlayerCat ? (bossPlayerCat.alive ? 1 : 0) : 0,
        p1inv:  bossPlayerCat ? (bossPlayerCat.invulnerable > 0 ? 1 : 0) : 0,
        // Кот гостя (P2) — хост авторитетен
        p2alive:bossPlayerCat2 ? (bossPlayerCat2.alive ? 1 : 0) : 0,
        p2inv:  bossPlayerCat2 ? (bossPlayerCat2.invulnerable > 0 ? 1 : 0) : 0,
        // Снаряды — сжатый формат [x, y, vx, vy, size]
        projs: bossProjectiles.map(p => [
            Math.round(p.x), Math.round(p.y),
            +p.vx.toFixed(2), +p.vy.toFixed(2),
            p.size
        ])
    });
}

// Отправить подсказку гостю
function _sendBossHint(text, color, ms) {
    if (net.bossOnline && net.isHost && net.conn && net.conn.open) {
        net.conn.send({ type: 'BOSS_HINT', text, color, ms });
    }
}

// Выбранная сложность для онлайна (хост)
let onlineDifficulty = 'easy';
let onlineMode = 'race'; // 'race' | 'boss'

function setOnlineMode(mode) {
    onlineMode = mode;
    document.getElementById('online-race-opts').style.display = mode === 'race' ? '' : 'none';
    document.getElementById('online-boss-opts').style.display  = mode === 'boss' ? '' : 'none';
    if (mode === 'boss') buildOnlineBossList('p2p-boss-list-items');
}

function buildOnlineBossList(containerId) {
    const container = document.getElementById(containerId);
    if (!container || typeof BOSSES === 'undefined') return;
    container.innerHTML = '';
    const defeated = typeof defeatedBosses !== 'undefined' ? defeatedBosses : [];
    BOSSES.forEach((boss, index) => {
        const isDefeated = defeated.includes(boss.id);
        const item = document.createElement('div');
        item.className = 'lobby-boss-item' + (selectedOnlineBoss === index ? ' selected' : '');
        item.onclick = () => selectOnlineBoss(index, containerId);
        const bossIconHtml = boss.iconName ? IconGenerator.html(boss.iconName, '16px') : boss.icon;
        const checkHtml = isDefeated ? IconGenerator.html('check','14px') : '';
        item.innerHTML = '<span class="lobby-boss-icon">' + bossIconHtml + '</span>' +
            '<span class="lobby-boss-name">' + (t('bosses.' + boss.id + '.name') || boss.id) + '</span>' +
            '<span class="lobby-boss-check">' + checkHtml + '</span>';
        container.appendChild(item);
    });
    // Show START button when in p2p boss mode
    const startBtn = document.getElementById('btn-online-boss-start');
    if (startBtn) startBtn.style.display = selectedOnlineBoss !== null ? '' : 'none';
}

let selectedOnlineBoss = null;
function selectOnlineBoss(index, containerId) {
    selectedOnlineBoss = index;
    net.selectedBossIndex = index;
    buildOnlineBossList(containerId);
    // Also rebuild the other list if open
    const otherId = containerId === 'fb-boss-list-items' ? 'p2p-boss-list-items' : 'fb-boss-list-items';
    const otherContainer = document.getElementById(otherId);
    if (otherContainer && otherContainer.children.length > 0) buildOnlineBossList(otherId);
    const startBtn = document.getElementById('btn-online-boss-start');
    if (startBtn) startBtn.style.display = '';
}

function setOnlineDiff(diff) {
    onlineDifficulty = diff;
    const classes = {
        easy:     'pixel-btn pixel-btn-green  lobby-diff-btn',
        hard:     'pixel-btn pixel-btn-red    lobby-diff-btn',
        megahard: 'pixel-btn pixel-btn-purple lobby-diff-btn',
        infinity: 'pixel-btn pixel-btn-inf    lobby-diff-btn'
    };
    ['easy','hard','megahard','infinity'].forEach(d => {
        const btn = document.getElementById('odiff-' + d);
        if (btn) btn.className = classes[d] + (d === diff ? ' lobby-diff-active' : '');
    });
}

function joinRoom() {
    const remoteId = document.getElementById('remote-id-input').value.toUpperCase().trim();
    if (!remoteId) return alert(t('enterId'));
    if (!net.peer || net.peer.destroyed || !net.myId) {
        document.getElementById('online-status').innerText = t('statusWaitInit');
        return;
    }

    document.getElementById('online-status').innerText = '↻ Соединение с ' + remoteId + '...';

    // Опции соединения: если включён relay-режим — только TURN
    const connOpts = { reliable: true, serialization: 'json' };
    if (net.forceRelay) {
        // Переопределяем конфиг RTCPeerConnection через внутренний API PeerJS
        connOpts.config = {
            iceServers: _getIceServers(),
            iceTransportPolicy: 'relay',  // только TURN, без прямого P2P
            iceCandidatePoolSize: 10,
        };
    }

    net.conn = net.peer.connect(remoteId, connOpts);
    net.isHost = false;
    net.isOnline = true;
    _showLeaveBtn();
    setupPeerConnection();

    // Показываем прогресс ICE-подключения через внутренний RTCPeerConnection
    const _iceStatusPoll = setInterval(() => {
        try {
            const pc = net.conn.peerConnection;
            if (!pc) return;
            const state = pc.iceConnectionState;
            const G = IconGenerator;
            const labels = {
                'new':          G.html('hourglass','12px') + ' Начало ICE...',
                'checking':     G.html('hourglass','12px') + ' Проверка маршрутов...',
                'connected':    G.html('check','12px') + ' Маршрут найден!',
                'completed':    G.html('check','12px') + ' ICE завершён',
                'failed':       G.html('cross','12px') + ' ICE не удался',
                'disconnected': G.html('warning','12px') + ' ICE отключился',
                'closed':       G.html('dot_red','12px') + ' Закрыто',
            };
            if (labels[state]) {
                document.getElementById('online-status').innerHTML = labels[state] || state;
            }
            if (['connected','completed','failed','closed'].includes(state)) {
                clearInterval(_iceStatusPoll);
            }
        } catch(e) { clearInterval(_iceStatusPoll); }
    }, 400);

    // Таймаут подключения: 15 сек (было 10)
    const joinTimeout = setTimeout(() => {
        clearInterval(_iceStatusPoll);
        if (net.isOnline && net.conn && !net.conn.open && !isPlaying) {
            document.getElementById('online-status').innerText =
                net.forceRelay
                    ? '⚠ Реле не помогло. Попросите хоста обновить страницу.'
                    : t('statusRelayHint');
            net.conn = null; net.isOnline = false;
        }
    }, 15000);

    net.conn.on('open', () => {
        clearTimeout(joinTimeout);
        clearInterval(_iceStatusPoll);
    });
}

function copyId() { navigator.clipboard.writeText(document.getElementById('my-peer-id').innerText).then(() => alert(t('idCopied'))); }

function saveGameData() {
    localStorage.setItem('pixelCatsOrange', fishWallet.orange); localStorage.setItem('pixelCatsBlueFish', fishWallet.blue);
    localStorage.setItem('pixelCatsGold', fishWallet.gold); localStorage.setItem('pixelCatsUnlockedSkins', JSON.stringify(unlockedSkins));
    localStorage.setItem('pixelCatsDiffScore', highScore); localStorage.setItem('pixelCatsInfinityHighScore', infinityHighScore);
    localStorage.setItem('pixelCatsHardUnlocked', hardUnlocked); localStorage.setItem('pixelCatsMegaHardUnlocked', megaHardUnlocked);
    localStorage.setItem('pixelCatsInfinityUnlocked', infinityUnlocked);
    if (typeof defeatedBosses !== 'undefined') {
        localStorage.setItem('pixelCatsDefeatedBosses', JSON.stringify(defeatedBosses));
    }
}

function updateFishUI() {
    menuOrange.innerText = fishWallet.orange; menuBlue.innerText = fishWallet.blue; menuGold.innerText = fishWallet.gold;
    hudOrange.innerText = fishWallet.orange; hudBlue.innerText = fishWallet.blue; hudGold.innerText = fishWallet.gold;
}

function isSkinUnlocked(skinId) {
    if (skinId === 'newyear') return true;
    if (skinId === 'samurai') return samuraiUnlocked;
    if (unlockedSkins.includes(skinId)) return true;
    const skin = SKINS.find(s => s.id === skinId);
    if (!skin) return false;
    // Скин без требований и без цены — всегда доступен (базовые скины)
    if (!skin.cost && !skin.reqScore && !skin.reqInfinityScore && !skin.secret) return true;
    if (skin.reqScore && highScore >= skin.reqScore) { if (!unlockedSkins.includes(skinId)) { unlockedSkins.push(skinId); saveGameData(); } return true; }
    if (skin.reqInfinityScore && infinityHighScore >= skin.reqInfinityScore) { if (!unlockedSkins.includes(skinId)) { unlockedSkins.push(skinId); saveGameData(); } return true; }
    return false;
}

function buySkin(playerNum) {
    let index = (playerNum === 1) ? p1SkinIndex : p2SkinIndex, skin = SKINS[index];
    if (isSkinUnlocked(skin.id)) return;
    let currencyVal = 0;
    if (skin.currency === 'blue') currencyVal = fishWallet.blue; else if (skin.currency === 'orange') currencyVal = fishWallet.orange; else if (skin.currency === 'gold') currencyVal = fishWallet.gold;
    if (skin.cost && currencyVal >= skin.cost) {
        if (skin.currency === 'blue') fishWallet.blue -= skin.cost; else if (skin.currency === 'orange') fishWallet.orange -= skin.cost; else if (skin.currency === 'gold') fishWallet.gold -= skin.cost;
        unlockedSkins.push(skin.id); saveGameData(); updateFishUI(); updateMenuButtons();
    } else alert(t('notEnough') + " " + skin.currency.toUpperCase() + " " + t('fish'));
}

function changeSkin(player, dir) {
    let idx = (player === 1) ? p1SkinIndex : p2SkinIndex;
    let tries = 0;
    do {
        idx = (idx + dir + SKINS.length) % SKINS.length;
        tries++;
    } while (!isSkinUnlocked(SKINS[idx].id) && tries < SKINS.length);
    if (player === 1) p1SkinIndex = idx;
    else p2SkinIndex = idx;
    updateMenuButtons();

    // ── Синхронизация скина с партнёром в онлайне ──
    // Клиент меняет только своего кота (player === 1 в лобби).
    // Отправляем новый скин сразу — иначе хост запустит игру
    // со старым значением net.remoteSkin и выдаст гостю неверный скин.
    if (player === 1 && net.isOnline && net.conn && net.conn.open) {
        net.conn.send({ type: 'SKIN', skin: p1SkinIndex });
    }
    // Обновляем запись в Firebase (для хоста, который читает snap.val().skin)
    if (player === 1 && net.isOnline && !net.isHost && _fbRoomRef) {
        _fbRoomRef.child('guest/skin').set(p1SkinIndex);
        // Страховка: запомнить скин на случай если INIT придёт раньше ACK от Firebase
        _pendingGuestSkin = p1SkinIndex;
        // Запоминаем как собственный скин гостя
        _guestOwnSkin = p1SkinIndex;
    }
    if (player === 1 && net.isOnline && net.isHost && _fbRoomRef) {
        _fbRoomRef.child('host/skin').set(p1SkinIndex);
    }
}

function updateMenuButtons() {
    const updatePlayerUI = (idx, labelEl, statusEl, actionEl) => {
        const skin = SKINS[idx]; labelEl.innerText = t(skin.nameKey);
        const unlocked = isSkinUnlocked(skin.id); labelEl.style.color = unlocked ? '#ffd700' : '#aaa';
        actionEl.className = 'action-btn'; actionEl.style.display = 'none'; statusEl.innerText = "";
        if (!unlocked) {
            if (skin.reqScore) { statusEl.innerText = t('needDist') + " " + skin.reqScore; statusEl.style.color = '#c0392b'; actionEl.style.display = 'inline-block'; actionEl.innerText = t('lockedBtn'); actionEl.classList.add('action-lock'); }
            else if (skin.reqInfinityScore) { statusEl.innerText = t('infScore') + " " + skin.reqInfinityScore; statusEl.style.color = '#c0392b'; actionEl.style.display = 'inline-block'; actionEl.innerText = t('lockedBtn'); actionEl.classList.add('action-lock'); }
            else if (skin.cost) { actionEl.style.display = 'inline-block'; let fishName = skin.currency==='blue' ? 'fish_blue' : skin.currency==='gold' ? 'fish_gold' : 'fish_orange'; actionEl.innerHTML = t('buy') + ' ' + skin.cost + ' ' + IconGenerator.html(fishName,'13px'); let currencyVal = (skin.currency === 'blue') ? fishWallet.blue : (skin.currency === 'gold' ? fishWallet.gold : fishWallet.orange); if (currencyVal >= skin.cost) actionEl.classList.add('action-buy'); else actionEl.classList.add('action-lock'); }
            else if (skin.secret) { statusEl.innerText = "???"; statusEl.style.color = '#8e44ad'; }
        }
        return unlocked;
    };
    const p1Ready = updatePlayerUI(p1SkinIndex, p1SkinLabel, p1Status, p1Action);
    let p2Ready = true; if (numPlayers === 2) p2Ready = updatePlayerUI(p2SkinIndex, p2SkinLabel, p2Status, p2Action);
    let skinsReady = p1Ready && p2Ready;
    const onlineSkin = SKINS[p1SkinIndex]; onlineSkinLabel.innerText = t(onlineSkin.nameKey);
    const onlineUnlocked = isSkinUnlocked(onlineSkin.id); onlineSkinLabel.style.color = onlineUnlocked ? '#ffd700' : '#aaa';
    if (!onlineUnlocked) onlineSkinLabel.innerText += " (" + t('lockedBtn') + ")";
    btnEasy.disabled = !skinsReady; btnEasy.classList.toggle('btn-disabled', !skinsReady);
    updateDifficultyButtons();
}

function updatePlayerModeUI() {
    btnMode.innerText = (numPlayers === 1) ? t('player1') : t('player2');
    if (numPlayers === 1) { p2Area.classList.add('hidden'); hintP1.innerHTML = t('p1Controls') + ' <span class="key-badge">WASD</span> / <span class="key-badge">ARROWS</span>'; hintP2.classList.add('hidden'); }
    else { p2Area.classList.remove('hidden'); hintP1.innerHTML = t('p1Controls') + ' <span class="key-badge">W</span> ' + t('jump') + ' <span class="key-badge">A</span><span class="key-badge">D</span> ' + t('move'); hintP2.classList.remove('hidden'); }
    updateMenuButtons();
    const c1p = document.getElementById('controls-1p'), c2p = document.getElementById('controls-2p');
    if (net.isOnline || numPlayers === 1) { if (c1p) c1p.style.display = 'block'; if (c2p) c2p.style.display = 'none'; }
    else { if (c1p) c1p.style.display = 'none'; if (c2p) c2p.style.display = 'block'; }
}

function togglePlayerMode() { 
    numPlayers = (numPlayers === 1) ? 2 : 1; 
    // На мобильных: при переходе на 2 игрока — принудительно джойстик
    if (isMobile && numPlayers === 2 && ctrlType !== 'joystick') {
        setCtrlType('joystick');
    }
    // Скрыть/показать кнопку "КНОПКИ" в зависимости от режима
    const dpadBtn = document.getElementById('ctrl-type-dpad');
    if (dpadBtn) {
        if (numPlayers === 2 && !net.isOnline) {
            dpadBtn.disabled = true;
            dpadBtn.style.opacity = '0.4';
            dpadBtn.title = '2P: только джойстики';
        } else {
            dpadBtn.disabled = false;
            dpadBtn.style.opacity = '';
            dpadBtn.title = '';
        }
    }
    updatePlayerModeUI(); 
}

function playNextLevel() {
    let nextMode = '';
    if (currentDifficulty === 'easy') nextMode = 'hard'; else if (currentDifficulty === 'hard') nextMode = 'megahard'; else if (currentDifficulty === 'megahard') nextMode = 'infinity';
    if (nextMode) startGame(nextMode);
}

let terrain = [], items = [], pixies = [], menuPixies = [], cats = [];
let nextTerrainX = 0, lastHeight = 0, blocksSinceLastGap = 0, consecutiveGaps = 0, blocksSinceLastCactus = 0, lastBlockWasGap = false;
let npcCat = null, npcDialogShown = false, npcFadeOut = false, npcOpacity = 1;

const keys = { KeyW: false, KeyA: false, KeyS: false, KeyD: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, KeyG: false, Space: false };
let godMode = false;
// Analog joystick axes — updated by makeJoystick, used in Cat.update() for smooth movement
const joystickAxes = { p1: { x: 0, y: 0 }, p2: { x: 0, y: 0 } };

// ============================================================
// CONTROL TYPE — must be declared BEFORE setupMobileControls()
// because makeJoystick references joyStyle immediately on init
// ============================================================
let ctrlType = localStorage.getItem('pcCtrlType') || 'dpad';
let joyStyle = localStorage.getItem('pcJoyStyle') || 'fixed'; // 'fixed' | 'float'

function setupMobileControls() {
    // ================================================================
    // FLOATING ANALOG JOYSTICK SYSTEM
    // ================================================================
    // The joystick "floats" — its base snaps to wherever the player
    // first touches inside the touch zone (wrapper). This means the
    // player never has to aim at a fixed circle; just press and drag.
    //
    // axisKey  — 'p1'|'p2': which joystickAxes slot to update for
    //            smooth proportional movement in Cat.update() / boss
    // wrapId   — id of the large invisible touch zone wrapper
    // ================================================================
    function makeJoystick(baseId, knobId, opts, axisKey, wrapId) {
        const base = document.getElementById(baseId);
        const knob = document.getElementById(knobId);
        const wrap = wrapId ? document.getElementById(wrapId) : base;
        if (!base || !knob) return;

        // ---- Deadzone & thresholds ----
        const DEAD   = 0.10;   // ignore tiny drift
        const JUMP_T = -0.42;  // pull up ≥42% to jump
        const DOWN_T = 0.38;   // push down ≥38% for boss-down

        let active = false, touchId = null;
        let bx = 0, by = 0;   // touch origin (center of floating base)

        // ---- Visibility helpers ----
        base.style.transition = 'opacity 0.12s';
        base.style.position   = 'absolute';

        function _setVisible(v)  { base.style.opacity = v ? '0.82' : '0'; }
        function applyJoyVisibility() {
            if (joyStyle === 'fixed') _setVisible(true);
            else                      _setVisible(active);
        }
        base._applyJoyVisibility = applyJoyVisibility;
        applyJoyVisibility();

        function getRadius() { return base.getBoundingClientRect().width / 2; }

        // Float mode only — snaps base to finger
        function floatBaseTo(cx, cy) {
            if (!wrap) return;
            const wr  = wrap.getBoundingClientRect();
            const bw  = base.offsetWidth  || 110;
            const bh  = base.offsetHeight || 110;
            let rx = cx - wr.left - bw / 2;
            let ry = cy - wr.top  - bh / 2;
            rx = Math.max(0, Math.min(wr.width  - bw, rx));
            ry = Math.max(0, Math.min(wr.height - bh, ry));
            base.style.left   = rx + 'px';
            base.style.top    = ry + 'px';
            base.style.right  = 'unset';
            base.style.bottom = 'unset';
        }

        function applyPos(nx, ny) {
            const R  = getRadius();
            const px = nx * R * 0.65, py = ny * R * 0.65;
            knob.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`;

            // ── Analog axes — single 2D dead zone for true 360° direction ──
            if (axisKey) {
                const _mag = Math.sqrt(nx * nx + ny * ny);
                if (_mag > DEAD) {
                    // Normalize to unit vector — always 100% speed regardless of pull distance
                    joystickAxes[axisKey].x = nx / _mag;
                    joystickAxes[axisKey].y = ny / _mag;
                } else {
                    joystickAxes[axisKey].x = 0;
                    joystickAxes[axisKey].y = 0;
                }
            }

            // ── Boolean keys (jump, down, boss 4-dir, keyboard compat) ──
            if (opts.left)  keys[opts.left]  = false;
            if (opts.right) keys[opts.right] = false;
            if (opts.up)    keys[opts.up]    = false;
            if (opts.up2)   keys[opts.up2]   = false;
            if (opts.jump)  keys[opts.jump]  = false;
            if (opts.down)  keys[opts.down]  = false;
            if (opts.down2) keys[opts.down2] = false;

            if (Math.abs(nx) > DEAD) {
                if (nx < 0 && opts.left)  keys[opts.left]  = true;
                if (nx > 0 && opts.right) keys[opts.right] = true;
            }
            if (ny < JUMP_T) {
                if (opts.up)   keys[opts.up]   = true;
                if (opts.up2)  keys[opts.up2]  = true;
                if (opts.jump) keys[opts.jump] = true;
            }
            if (ny > DOWN_T) {
                if (opts.down)  keys[opts.down]  = true;
                if (opts.down2) keys[opts.down2] = true;
            }
        }

        function releaseAll() {
            active = false; touchId = null;
            if (joyStyle !== 'fixed') _setVisible(false);
            base.classList.remove('active');
            knob.style.transform = 'translate(-50%, -50%)';
            if (axisKey) { joystickAxes[axisKey].x = 0; joystickAxes[axisKey].y = 0; }
            if (opts.left)  keys[opts.left]  = false;
            if (opts.right) keys[opts.right] = false;
            if (opts.up)    keys[opts.up]    = false;
            if (opts.up2)   keys[opts.up2]   = false;
            if (opts.jump)  keys[opts.jump]  = false;
            if (opts.down)  keys[opts.down]  = false;
            if (opts.down2) keys[opts.down2] = false;
        }

        // ---- Touch zone: the large wrapper (or base as fallback) ----
        const touchTarget = wrap || base;

        touchTarget.addEventListener('touchstart', e => {
            e.preventDefault();
            if (active) return;
            const touch = e.changedTouches[0];
            touchId  = touch.identifier;
            active   = true;
            if (joyStyle === 'float') {
                // Float: snap base to finger, origin = finger pos
                floatBaseTo(touch.clientX, touch.clientY);
                requestAnimationFrame(() => {
                    const r = base.getBoundingClientRect();
                    bx = r.left + r.width  / 2;
                    by = r.top  + r.height / 2;
                });
                bx = touch.clientX;
                by = touch.clientY;
                _setVisible(true);
            } else {
                // Fixed: base stays put, origin = base center
                const r = base.getBoundingClientRect();
                bx = r.left + r.width  / 2;
                by = r.top  + r.height / 2;
            }
            base.classList.add('active');
        }, { passive: false });

        touchTarget.addEventListener('touchmove', e => {
            e.preventDefault();
            if (!active) return;
            let touch = null;
            for (let t of e.touches)        if (t.identifier === touchId) { touch = t; break; }
            if (!touch) for (let t of e.changedTouches) if (t.identifier === touchId) { touch = t; break; }
            if (!touch) return;
            const R = getRadius();
            let dx = touch.clientX - bx, dy = touch.clientY - by;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > R) { dx = dx / dist * R; dy = dy / dist * R; }
            applyPos(dx / R, dy / R);
        }, { passive: false });

        touchTarget.addEventListener('touchend', e => {
            e.preventDefault();
            for (let t of e.changedTouches) if (t.identifier === touchId) { releaseAll(); return; }
        }, { passive: false });
        touchTarget.addEventListener('touchcancel', () => releaseAll(), { passive: false });
    }

    // ---- Make the joystick wrapper a large comfortable touch zone ----
    // Left half of screen bottom = P1 zone; right half = P2 zone
    function _expandWrapperZone(wrapperId, leftPct, widthPct) {
        const el = document.getElementById(wrapperId);
        if (!el) return;
        el.style.position = 'absolute';
        el.style.left     = leftPct + '%';
        el.style.top      = '45%';
        el.style.width    = widthPct + '%';
        el.style.height   = '55%';
        el.style.pointerEvents = 'auto';
        el.style.background    = 'transparent';
        el.style.zIndex        = '190';
        // The actual joystick-base is a child — override its positioning
        const b = el.querySelector('.joystick-base');
        if (b) {
            b.style.position = 'absolute';
            b.style.left     = '20px';
            b.style.top      = '50%';
            b.style.transform = 'translateY(-50%)';
            b.style.right    = 'unset';
            b.style.bottom   = 'unset';
        }
    }
    _expandWrapperZone('joy1-wrapper',    0,  47);
    _expandWrapperZone('joy1-wrapper-2p', 0,  47);
    _expandWrapperZone('joy2-wrapper-2p', 53, 47);

    // 1-player: full left zone
    makeJoystick('joy1-base', 'joy1-knob', {
        left: 'KeyA', right: 'KeyD', up: 'KeyW', up2: 'Space', jump: 'ArrowUp',
        down: 'KeyS', down2: 'ArrowDown'
    }, 'p1', 'joy1-wrapper');

    // 2-player P1
    makeJoystick('joy1-base-2p', 'joy1-knob-2p', {
        left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS'
    }, 'p1', 'joy1-wrapper-2p');

    // 2-player P2
    makeJoystick('joy2-base-2p', 'joy2-knob-2p', {
        left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown'
    }, 'p2', 'joy2-wrapper-2p');

    // ESC / Menu button
    const menuBtn = document.getElementById('mb-menu');
    if (menuBtn) menuBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        if (isPlaying || isGameOver || isWin) showMenu();
        else if (bossBattleActive) showBossScreen(true);
    }, { passive: false });
}
setupMobileControls();

// ============================================================
// D-PAD CONTROL SYSTEM
// ============================================================
const DPAD_KEY_MAP = {
    up:    ['KeyW', 'ArrowUp'],
    down:  ['KeyS', 'ArrowDown'],
    left:  ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
};

function dpDown(dir) {
    DPAD_KEY_MAP[dir].forEach(k => { keys[k] = true; });
    const btn = document.getElementById('dp-' + dir);
    if (btn) { btn.classList.add('pressed'); btn.style.transform = 'scale(0.9)'; }
}
function dpUp(dir) {
    DPAD_KEY_MAP[dir].forEach(k => { keys[k] = false; });
    const btn = document.getElementById('dp-' + dir);
    if (btn) { btn.classList.remove('pressed'); btn.style.transform = 'scale(1)'; }
}
function dpMenuDown() {
    const btn = document.getElementById('dp-menu');
    if (btn) { btn.classList.add('pressed'); btn.style.transform = 'scale(0.9)'; }
    if (isPlaying || isGameOver || isWin) showMenu();
    else if (bossBattleActive) showBossScreen(true);
}
function dpMenuUp() {
    const btn = document.getElementById('dp-menu');
    if (btn) { btn.classList.remove('pressed'); btn.style.transform = 'scale(1)'; }
}

function setCtrlType(type) {
    ctrlType = type;
    localStorage.setItem('pcCtrlType', type);
    const isJoy  = (type === 'joystick');
    document.getElementById('ctrl-type-joy').classList.toggle('active',  isJoy);
    document.getElementById('ctrl-type-dpad').classList.toggle('active', !isJoy);
    // Always show edit row — works for both joystick and dpad
    const editRow = document.getElementById('ctrl-edit-row');
    if (editRow) editRow.style.display = '';
    // Show joy-style row only when joystick is selected
    const joyStyleRow = document.getElementById('joy-style-row');
    if (joyStyleRow) joyStyleRow.style.display = isJoy ? '' : 'none';
    if (isMobile) _applyCtrlType();
}

// Toggle fixed / floating joystick style
function setJoyStyle(style) {
    joyStyle = style;
    localStorage.setItem('pcJoyStyle', style);
    document.getElementById('joy-style-fixed').classList.toggle('active', style === 'fixed');
    document.getElementById('joy-style-float').classList.toggle('active', style === 'float');
    // Refresh all joystick bases visibility
    document.querySelectorAll('.joystick-base').forEach(b => {
        if (typeof b._applyJoyVisibility === 'function') b._applyJoyVisibility();
    });
}

function _applyCtrlType() {
    const isJoy  = (ctrlType === 'joystick');
    const c1p  = document.getElementById('controls-1p');
    const c2p  = document.getElementById('controls-2p');
    const dpad = document.getElementById('dpad-controls');
    if (isJoy) {
        if (numPlayers === 1) { if (c1p) c1p.style.display = 'block'; if (c2p) c2p.style.display = 'none'; }
        else { if (c1p) c1p.style.display = 'none'; if (c2p) c2p.style.display = 'block'; }
        if (dpad) dpad.style.display = 'none';
    } else {
        if (c1p) c1p.style.display = 'none';
        if (c2p) c2p.style.display = 'none';
        if (dpad) dpad.style.display = 'block';
    }
}

// Init ctrl type UI
(function() {
    const isJoy = (ctrlType === 'joystick');
    document.getElementById('ctrl-type-joy').classList.toggle('active',  isJoy);
    document.getElementById('ctrl-type-dpad').classList.toggle('active', !isJoy);
    // Always show edit row
    const editRow = document.getElementById('ctrl-edit-row');
    if (editRow) editRow.style.display = '';
    // Joy-style row: show only if joystick selected
    const joyStyleRow = document.getElementById('joy-style-row');
    if (joyStyleRow) joyStyleRow.style.display = isJoy ? '' : 'none';
    // Sync joy-style buttons
    const fixedBtn = document.getElementById('joy-style-fixed');
    const floatBtn = document.getElementById('joy-style-float');
    if (fixedBtn) fixedBtn.classList.toggle('active', joyStyle === 'fixed');
    if (floatBtn) floatBtn.classList.toggle('active', joyStyle === 'float');
})();

// Patch updatePlayerModeUI to respect ctrlType
const _origUpdatePlayerModeUI = updatePlayerModeUI;
updatePlayerModeUI = function() {
    _origUpdatePlayerModeUI();
    if (isMobile) {
        // При 2P — всегда джойстик, кнопка dpad недоступна
        if (numPlayers === 2 && !net.isOnline) {
            if (ctrlType !== 'joystick') setCtrlType('joystick');
            const dpadBtn = document.getElementById('ctrl-type-dpad');
            if (dpadBtn) { dpadBtn.disabled = true; dpadBtn.style.opacity = '0.4'; }
        } else {
            const dpadBtn = document.getElementById('ctrl-type-dpad');
            if (dpadBtn) { dpadBtn.disabled = false; dpadBtn.style.opacity = ''; }
        }
        _applyCtrlType();
    }
};

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code) || e.code === 'Space') keys[e.code] = true;
    if (e.code === 'KeyG') godMode = !godMode;
    if (e.key === 'Escape') {
        if (isPlaying || isGameOver || isWin) showMenu();
        else if (bossBattleActive) showBossScreen(true);
        else if (bossBattleSuspended || document.getElementById('boss-lose-screen').style.display === 'block' || document.getElementById('boss-win-screen').style.display === 'block') showBossScreen(false);
    }
    if ((isGameOver || isWin) && e.key === 'Enter') restartGame();
    if (document.getElementById('boss-lose-screen').style.display === 'block' && e.key === 'Enter') restartBossBattle();
});
window.addEventListener('keyup', (e) => { if (keys.hasOwnProperty(e.code) || e.code === 'Space') keys[e.code] = false; });

const PIXIE_COLORS = ["#ff9ff3", "#54a0ff", "#5f27cd", "#fab1a0", "#1dd1a1", "#feca57"];
class Pixie {
    constructor() {
        this.reset(); this.x = Math.random() * canvas.width;
        if (currentDifficulty === 'infinity') { const evilColors = ["#e74c3c", "#8b0000", "#9400D3", "#ff0033", "#ffffff", "#2c3e50"]; this.color = evilColors[Math.floor(Math.random() * evilColors.length)]; }
        else this.color = PIXIE_COLORS[Math.floor(Math.random() * PIXIE_COLORS.length)];
    }
    reset() { this.x = camera.x + canvas.width + 800 + Math.random() * 800; this.baseY = 50 + Math.random() * 200; this.y = this.baseY; this.speed = 2 + Math.random() * 2; this.phase = Math.random() * Math.PI * 2; this.sparkles = []; }
    update(timeScale, forceResetX) {
        this.x -= this.speed * timeScale; this.y = this.baseY + Math.sin(gameTime * 0.1 + this.phase) * 30;
        let limitX = forceResetX || (camera.x - 50); if (this.x < limitX) { if (forceResetX) this.x = camera.x + canvas.width + 800 + Math.random() * 800; else this.reset(); }
        if (this.sparkles.length < 8 && Math.random() < 0.08) this.sparkles.push({ x: this.x, y: this.y, life: 1.0 });
        for (let i = this.sparkles.length - 1; i >= 0; i--) { this.sparkles[i].life -= 0.05; this.sparkles[i].y += 0.5; if (this.sparkles[i].life <= 0) this.sparkles.splice(i, 1); }
    }
    draw(ctx) {
        const size = 3; if (currentDifficulty === 'infinity') ctx.fillStyle = "rgba(100, 0, 0, 0.5)"; else ctx.fillStyle = "rgba(173, 216, 230, 0.7)";
        let wingFlap = Math.sin(gameTime * 0.8) > 0 ? -2 : 0; ctx.fillRect(this.x - 2 * size, this.y + wingFlap, 2 * size, 3 * size); ctx.fillRect(this.x + 3 * size, this.y + wingFlap, 2 * size, 3 * size);
        ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, 3 * size, 4 * size);
        if (currentDifficulty === 'infinity') ctx.fillStyle = "#333"; else ctx.fillStyle = "#ffe0bd"; ctx.fillRect(this.x, this.y - 2 * size, 3 * size, 2 * size);
        if (currentDifficulty !== 'infinity') { ctx.fillStyle = "#f1c40f"; ctx.fillRect(this.x, this.y - 3 * size, 3 * size, 1.5 * size); }
        ctx.fillStyle = this.color; this.sparkles.forEach(s => { ctx.globalAlpha = s.life; ctx.fillRect(s.x, s.y, 2, 2); ctx.globalAlpha = 1.0; });
    }
}

class NPCCat {
    constructor(x, y) {
        this.x = x; this.y = y; this.width = 30; this.height = 45;
        // Evil dark cat in infinity mode
        if (currentDifficulty === 'infinity') {
            this.skin = { ...SKINS[2], body: '#0a0a0a', eye: '#8b0000', nose: '#3d0000', type: 'default' }; // black base, red eyes
        } else {
            this.skin = SKINS[0];
        }
        this.facingRight = false; this.opacity = 1; this.isFadingOut = false;
    }
    update(timeScale) { this.bobOffset = Math.sin(gameTime * 0.1) * 2; if (this.isFadingOut && this.opacity > 0) { this.opacity -= 0.02 * timeScale; if (this.opacity < 0) this.opacity = 0; } }
    draw(ctx) { if (this.opacity <= 0) return; ctx.save(); ctx.globalAlpha = this.opacity; drawPixelCat(ctx, this.x, this.y, this.skin, this.facingRight, null, false, false); ctx.restore(); }
    startFadeOut() { this.isFadingOut = true; }
}

class Cat {
    constructor(x, skin, controls, isPlayer1) { this.x = x; this.y = 100; this.width = 30; this.height = 45; this.dy = 0; this.skin = skin; this.onGround = false; this.controls = controls; this.facingRight = true; this.isPlayer1 = isPlayer1; this.isMoving = false; this._prevX = x; }
    update(timeScale) {
        if (isWin) return;
        let left = false, right = false, up = false, down = false;
        if (net.isOnline) {
            const isMycat = (net.isHost && this.isPlayer1) || (!net.isHost && !this.isPlayer1);
            if (!isMycat) {
                // Удалённый кот — isMoving определяем по смещению позиции
                this.isMoving = Math.abs(this.x - this._prevX) > 0.3;
                this._prevX = this.x;
                return;
            }
            left = keys['KeyA'] || keys['ArrowLeft'];
            right = keys['KeyD'] || keys['ArrowRight'];
            up = keys['KeyW'] || keys['ArrowUp'] || keys['Space'];
        } else {
            if (numPlayers === 1 && this.isPlayer1) { left = keys['KeyA'] || keys['ArrowLeft']; right = keys['KeyD'] || keys['ArrowRight']; up = keys['KeyW'] || keys['ArrowUp'] || keys['Space']; down = keys['KeyS'] || keys['ArrowDown']; }
            else { left = keys[this.controls.left]; right = keys[this.controls.right]; up = keys[this.controls.up]; const downKey = (this.controls.up === 'KeyW') ? 'KeyS' : 'ArrowDown'; down = keys[downKey]; }
        }
        this.isMoving = !!(left || right);
        if (godMode) {
            const flySpeed = 15; if (left) { this.x -= flySpeed * timeScale; this.facingRight = false; } if (right) { this.x += flySpeed * timeScale; this.facingRight = true; }
            if (up) this.y -= flySpeed * timeScale; if (down) this.y += flySpeed * timeScale;
            if (this.x < camera.x) this.x = camera.x; if (this.x + this.width > camera.x + canvas.width / zoomFactor) this.x = camera.x + canvas.width / zoomFactor - this.width; return;
        }
        // === ANALOG MOVEMENT — ax.x raw value (unit-clamped, no scaling) ===
        let dx = 0;
        const _axisSlot = (!net.isOnline && !this.isPlayer1) ? 'p2' : 'p1';
        const _jAxis = joystickAxes[_axisSlot];
        if (Math.abs(_jAxis.x) > 0.08) {
            // ax.x is already in [-1,1] — full speed, exact direction
            dx = _jAxis.x * moveSpeed * timeScale;
            this.facingRight = _jAxis.x > 0;
        } else {
            // Boolean fallback: keyboard or dpad
            if (left)  { dx = -moveSpeed * timeScale; this.facingRight = false; }
            if (right) { dx =  moveSpeed * timeScale; this.facingRight = true;  }
        }
        if (dx !== 0 && !this.checkWallCollision(dx)) this.x += dx; if (this.x < camera.x) this.x = camera.x;
        const visibleWidth = canvas.width / zoomFactor; if (this.x + this.width > camera.x + visibleWidth) this.x = camera.x + visibleWidth - this.width;
        // Ground detection: check left edge, center, and right edge to prevent falling into block seams
        let groundY = canvas.height + 1000;
        const checkXs = [this.x + 4, this.x + this.width / 2, this.x + this.width - 4];
        for (const cx of checkXs) {
            for (let block of terrain) {
                if (cx >= block.x && cx < block.x + block.w) {
                    if (block.y < groundY) groundY = block.y;
                    break;
                }
            }
        }
        if (up && this.onGround) { this.dy = jumpStrength; this.onGround = false; AudioEngine.sfx.jump(); }
        this.dy += gravity * timeScale; this.y += this.dy * timeScale;
        if (this.dy > 0 && this.y + this.height >= groundY) { if (this.y + this.height - (this.dy * timeScale) <= groundY + 10) { this.y = groundY - this.height; this.dy = 0; this.onGround = true; } }
        else this.onGround = false;
        // FIX #1: используем getWorldGround() вместо canvas.height
        if (this.y > getWorldGround() + 200) endGame();
    }
    checkWallCollision(dx) { let checkLeft = this.x + dx, checkRight = this.x + dx + this.width, checkY = this.y + this.height - 10; for (let block of terrain) { if (checkRight > block.x && checkLeft < block.x + block.w) { if (block.y < checkY) return true; } } return false; }
    draw() { drawPixelCat(ctx, this.x, this.y, this.skin, this.facingRight, this.controls, this.isPlayer1, !this.onGround, this.isMoving); }
}

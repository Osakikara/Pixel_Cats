// ============================================================
// ACCOUNTS — Гибридный режим
// Запускается офлайн. При нажатии «ОНЛАЙН (БЕТА)» грузит
// Firebase SDK + PeerJS, инициализирует всё и открывает лобби.
// Кнопка становится «ОНЛАЙН ЛОББИ», появляются ВОЙТИ + РЕКОРДЫ.
// ============================================================

// ─── Глобальная точка входа: нажатие кнопки ОНЛАЙН ──────────
let _onlineConnected = false;
let _onlineConnecting = false;

async function handleOnlineClick() {
    if (_onlineConnecting) return;

    // Уже подключены — просто открываем лобби
    if (_onlineConnected) {
        openOnlineMenu();
        return;
    }

    _onlineConnecting = true;
    const btn = document.getElementById('btn-online-menu');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ ПОДКЛЮЧЕНИЕ...'; }

    try {
        // 1-2. Firebase SDK + PeerJS
        await _loadOnlineSdks();

        // 3. Инициализируем систему аккаунтов (Firebase Auth + DB)
        await AccountSystem.connectFirebase();

        // 4. Успех — обновляем UI, остаёмся на главной
        _onlineConnected = true;
        _onlineConnecting = false;
        _revealOnlineUI();

    } catch(e) {
        _onlineConnecting = false;
        console.error('[handleOnlineClick] Ошибка подключения:', e);
        if (btn) { btn.disabled = false; btn.textContent = 'ОНЛАЙН (бета)'; }
        _showAccountToast((typeof t==='function'?t('noInternet'):'Нет доступа к интернету'), '#e74c3c');
    }
}

// Загрузка SDK для онлайна (Firebase + PeerJS). Используется и кнопкой, и автоподключением.
async function _loadOnlineSdks() {
    await _loadSdkIfNeeded('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
    await _loadSdkIfNeeded('https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js');
    await _loadSdkIfNeeded('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js');
    if (typeof Peer === 'undefined') {
        const PEER_CDNS = [
            'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js',
            'https://cdn.jsdelivr.net/npm/peerjs@1.5.2/dist/peerjs.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.2/peerjs.min.js',
        ];
        let peerLoaded = false;
        for (const url of PEER_CDNS) {
            try { await _loadSdkIfNeeded(url); peerLoaded = true; break; } catch(e) {}
        }
        if (!peerLoaded) window._peerJsLoadFailed = true;
    }
}

// Автоподключение к онлайну при старте — ТИХО. Если Firebase доступен,
// сами включаем онлайн (кнопка → «ОНЛАЙН ЛОББИ», появляются ВОЙТИ/РЕКОРДЫ).
// Если доступа нет — молча остаёмся офлайн, без ошибок и тостов.
async function _tryAutoOnline() {
    if (_onlineConnected || _onlineConnecting) return false;
    _onlineConnecting = true;
    try {
        await _loadOnlineSdks();
        await AccountSystem.connectFirebase();
        _onlineConnected = true;
        _onlineConnecting = false;
        _revealOnlineUI();
        console.info('[AutoOnline] Firebase доступен — онлайн включён автоматически.');
        return true;
    } catch (e) {
        _onlineConnecting = false;
        console.info('[AutoOnline] Firebase недоступен — остаёмся офлайн.');
        return false;
    }
}

function _revealOnlineUI() {
    // Кнопка становится «ОНЛАЙН ЛОББИ»
    const btn = document.getElementById('btn-online-menu');
    if (btn) {
        btn.disabled = false;
        btn.textContent = 'ОНЛАЙН ЛОББИ';
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.style.animation = '';
    }

    // Показываем ВОЙТИ + РЕКОРДЫ
    const row = document.getElementById('acc-online-row');
    if (row) {
        row.style.display = 'flex';
        row.style.opacity = '0';
        row.style.transform = 'translateY(6px)';
        row.style.transition = 'opacity 0.35s, transform 0.35s';
        requestAnimationFrame(() => requestAnimationFrame(() => {
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        }));
    }
}

function _loadSdkIfNeeded(url) {
    return new Promise((resolve, reject) => {
        // Проверяем, не загружен ли уже скрипт с таким src
        if ([...document.scripts].some(s => s.src === url)) { resolve(); return; }
        const s = document.createElement('script');
        s.src = url;
        s.onload = resolve;
        s.onerror = () => reject(new Error('Failed to load: ' + url));
        document.head.appendChild(s);
    });
}

function _showAccountToast(msg, color) {
    let el = document.getElementById('acc-toast');
    if (!el) {
        el = document.createElement('div'); el.id = 'acc-toast';
        el.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);color:#000;padding:10px 22px;font-size:11px;font-family:\'Press Start 2P\',monospace;border:3px solid #000;z-index:9999;pointer-events:none;transition:opacity .4s;';
        document.body.appendChild(el);
    }
    el.textContent = msg; el.style.background = color || '#2ecc71'; el.style.opacity = '1';
    clearTimeout(el._tid); el._tid = setTimeout(() => { el.style.opacity = '0'; }, 2800);
}

// ─────────────────────────────────────────────────────────────
// ACCOUNTS SYSTEM
// ─────────────────────────────────────────────────────────────
function _patchSaveGameData() {
    if (typeof saveGameData !== 'function') return;
    const orig = window._origSaveGameData || saveGameData;
    window._origSaveGameData = orig;
    window.saveGameData = function() {
        try { orig(); } catch(e) { console.warn('[Save] local:', e); }
        try { if (AccountSystem && typeof AccountSystem._pushLocal === 'function') AccountSystem._pushLocal(); }
        catch(e) { console.warn('[Save] cloud:', e); }
    };
}

const AccountSystem = (() => {

    const ACCOUNTS_CFG = {
        apiKey:            "AIzaSyDyjrFPlIn3jgHcZxJb9ACwubYxOTI6CQs",
        authDomain:        "accounts-718fe.firebaseapp.com",
        databaseURL:       "https://accounts-718fe-default-rtdb.europe-west1.firebasedatabase.app",
        projectId:         "accounts-718fe",
        storageBucket:     "accounts-718fe.firebasestorage.app",
        messagingSenderId: "825506738449",
        appId:             "1:825506738449:web:ac7287b50787c38cb99cb0"
    };

    const DB_BOARD = 'pixelcats_leaderboard', DB_USERS = 'pixelcats_users', DB_PROGRESS = 'pixelcats_progress';

    let _app = null, _auth = null, _db = null;
    let _user = null, _profile = null, _ready = false;
    let _lastSyncTime = null, _currentBoardMode = 'bosses';

    // ── Вызывается из handleOnlineClick после загрузки SDK ──
    function connectFirebase() {
        return new Promise((resolve, reject) => {
            try {
                const appName = 'pxcats_accounts';
                const existing = firebase.apps.find(a => a.name === appName);
                _app  = existing || firebase.initializeApp(ACCOUNTS_CFG, appName);
                _db   = firebase.database(_app);
                _auth = firebase.auth(_app);
            } catch(e) { reject(e); return; }

            // Тест соединения
            _db.ref('.info/connected').once('value')
                .then(() => {
                    _ready = true;
                    _auth.onAuthStateChanged(user => {
                        _user = user;
                        if (user) {
                            Promise.all([
                                _db.ref(DB_USERS    + '/' + user.uid).once('value'),
                                _db.ref(DB_PROGRESS + '/' + user.uid).once('value')
                            ]).then(([profSnap, progSnap]) => {
                                _profile = profSnap.val() || { name: user.email.split('@')[0], skinId: 'white' };
                                const prog = progSnap.val(); if (prog) _applyProgress(prog);
                                _updateBadge();
                            }).catch(() => {
                                _profile = { name: user.email.split('@')[0], skinId: 'white' };
                                _updateBadge();
                            });
                        } else { _profile = null; _updateBadge(); }
                    });
                    _patchSaveGameDataFull();
                    resolve();
                })
                .catch(reject);
        });
    }

    // ── INIT (офлайн-заглушка при старте) ──────────────────
    function init() {
        console.info('[AccountSystem] offline stub. Click ОНЛАЙН to connect.');
        const row = document.getElementById('acc-online-row');
        if (row) row.style.display = 'none';
        _patchSaveGameData();
    }

    function _patchSaveGameDataFull() {
        if (typeof saveGameData !== 'function') return;
        const orig = window._origSaveGameData || saveGameData;
        window._origSaveGameData = orig;
        window.saveGameData = function() {
            try { orig(); } catch(e) {}
            if (_user && _ready) _push(_user.uid);
        };
    }

    // ── PROGRESS ────────────────────────────────────────────
    function _collect() {
        return {
            highScore:         highScore || 0,
            infinityHighScore: infinityHighScore || 0,
            ghostHighScore:    (typeof ghostHighScore !== 'undefined' ? ghostHighScore : 0) || 0,
            skinVariants:      (typeof mySkinVariants !== 'undefined' ? Object.assign({}, mySkinVariants) : {}),
            hardUnlocked:      hardUnlocked || false,
            megaHardUnlocked:  megaHardUnlocked || false,
            infinityUnlocked:  infinityUnlocked || false,
            samuraiUnlocked:   (typeof samuraiUnlocked !== 'undefined' ? !!samuraiUnlocked : false),
            unlockedSkins:     (unlockedSkins || []).slice(),
            fishOrange:        fishWallet.orange || 0,
            fishBlue:          fishWallet.blue   || 0,
            fishGold:          fishWallet.gold   || 0,
            p1SkinIndex:       p1SkinIndex || 0,
            p2SkinIndex:       p2SkinIndex || 1,
            defeatedBossIds:   (typeof defeatedBosses !== 'undefined' ? defeatedBosses.slice() : []),
            defeatedBossCount: (typeof defeatedBosses !== 'undefined' ? defeatedBosses.length : 0),
            savedAt:           Date.now()
        };
    }

    function _applyProgress(prog) {
        highScore         = Math.max(prog.highScore || 0, highScore || 0);
        infinityHighScore = Math.max(prog.infinityHighScore || 0, infinityHighScore || 0);
        if (typeof ghostHighScore !== 'undefined') ghostHighScore = Math.max(prog.ghostHighScore || 0, ghostHighScore || 0);
        // Настройки окраса скинов: облачные дополняют локальные (локальные приоритетнее)
        if (typeof mySkinVariants !== 'undefined' && prog.skinVariants) {
            mySkinVariants = Object.assign({}, prog.skinVariants, mySkinVariants);
        }
        hardUnlocked      = hardUnlocked || prog.hardUnlocked || false;
        megaHardUnlocked  = megaHardUnlocked || prog.megaHardUnlocked || false;
        infinityUnlocked  = infinityUnlocked || prog.infinityUnlocked || false;
        (prog.unlockedSkins || []).forEach(s => { if (!unlockedSkins.includes(s)) unlockedSkins.push(s); });
        if (prog.samuraiUnlocked && typeof samuraiUnlocked !== 'undefined') {
            samuraiUnlocked = true; localStorage.setItem('pixelCatsSamuraiUnlocked', 'true');
        }
        fishWallet.orange = Math.max(fishWallet.orange || 0, prog.fishOrange || 0);
        fishWallet.blue   = Math.max(fishWallet.blue   || 0, prog.fishBlue   || 0);
        fishWallet.gold   = Math.max(fishWallet.gold   || 0, prog.fishGold   || 0);
        if (prog.p1SkinIndex !== undefined) p1SkinIndex = prog.p1SkinIndex;
        if (prog.p2SkinIndex !== undefined) p2SkinIndex = prog.p2SkinIndex;
        if (Array.isArray(prog.defeatedBossIds) && typeof defeatedBosses !== 'undefined') {
            prog.defeatedBossIds.forEach(id => { if (!defeatedBosses.includes(id)) defeatedBosses.push(id); });
            localStorage.setItem('pixelCatsDefeatedBosses', JSON.stringify(defeatedBosses));
        }
        saveGameData(); updateFishUI();
        if (typeof updateMenuButtons       === 'function') updateMenuButtons();
        if (typeof updateDifficultyButtons === 'function') updateDifficultyButtons();
        if (typeof updateMenuPreviews      === 'function') updateMenuPreviews();
        if (typeof highScoreEl !== 'undefined' && highScoreEl) highScoreEl.innerText = highScore;
        if (typeof infinityHighScoreEl !== 'undefined' && infinityHighScoreEl) infinityHighScoreEl.innerText = infinityHighScore;
        _lastSyncTime = Date.now();
    }

    function _push(uid) {
        if (!_ready || !uid) return Promise.resolve();
        return _db.ref(DB_PROGRESS + '/' + uid).set(_collect())
            .then(() => { _lastSyncTime = Date.now(); })
            .catch(e => console.warn('[Accounts] push error:', e));
    }

    // Вызывается из _patchSaveGameData (офлайн-версия)
    function _pushLocal() { if (_user && _ready) _push(_user.uid); }

    // ── AUTH ────────────────────────────────────────────────
    function register(email, password, displayName) {
        if (!_ready) return Promise.reject('Firebase не подключён');
        if (String(displayName||'').trim().length < 2) return Promise.reject('Имя слишком короткое');
        if (password.length < 6) return Promise.reject('Пароль минимум 6 символов');
        return _auth.createUserWithEmailAndPassword(email.trim(), password)
            .then(cred => {
                const uid = cred.user.uid;
                _profile = { name: displayName.trim(), skinId: (SKINS[p1SkinIndex]||SKINS[0]).id, createdAt: Date.now() };
                return Promise.all([_db.ref(DB_USERS+'/'+uid).set(_profile), _push(uid)]);
            }).then(() => _updateBadge());
    }

    function login(email, password) {
        if (!_ready) return Promise.reject('Firebase не подключён');
        return _auth.signInWithEmailAndPassword(email.trim(), password)
            .then(cred => Promise.all([
                _db.ref(DB_USERS    + '/' + cred.user.uid).once('value'),
                _db.ref(DB_PROGRESS + '/' + cred.user.uid).once('value')
            ]))
            .then(([p, g]) => {
                _profile = p.val() || { name: _user.email.split('@')[0], skinId: 'white' };
                const prog = g.val(); if (prog) _applyProgress(prog);
                _updateBadge();
            });
    }

    function logout() {
        if (!_auth) return;
        (_user ? _push(_user.uid) : Promise.resolve()).then(() => {
            _auth.signOut().then(() => {
                _user = null; _profile = null; _updateBadge(); _closeAllModals();
                if (typeof startScreen !== 'undefined') startScreen.style.display = 'block';
            });
        });
    }

    function updateDisplayName(newName) {
        if (!_user || !_ready) return Promise.reject('Не авторизован');
        const n = newName.trim();
        if (n.length < 2 || n.length > 16) return Promise.reject('Неверная длина имени');
        return _db.ref(DB_USERS+'/'+_user.uid)
            .update({ name: n, skinId: (SKINS[p1SkinIndex]||SKINS[0]).id })
            .then(() => { _profile.name = n; _updateBadge(); });
    }

    // ── LEADERBOARD ─────────────────────────────────────────
    function submitScore(scoreVal, mode) {
        if (!_ready || !_user || !_profile || !(scoreVal > 0)) return;
        const uid = _user.uid; _push(uid);
        const ref = _db.ref(DB_BOARD + '/' + uid);
        ref.once('value').then(snap => {
            const prev = snap.val() || {};
            const isNew = mode === 'infinity' ? scoreVal > (prev.scoreInfinity||0)
                        : mode === 'ghost'    ? scoreVal > (prev.scoreGhost||0)
                        : scoreVal > (prev.scoreNormal||0);
            if (!isNew) return;
            return ref.set({
                name:          _profile.name,
                skinId:        (SKINS[p1SkinIndex]||SKINS[0]).id,
                skinVariant:   (typeof mySkinVariants!=='undefined' ? mySkinVariants[(SKINS[p1SkinIndex]||SKINS[0]).id] : null) || 'auto',
                scoreNormal:   mode==='normal'   ? Math.max(scoreVal,prev.scoreNormal||0)   : (prev.scoreNormal||0),
                scoreInfinity: mode==='infinity' ? Math.max(scoreVal,prev.scoreInfinity||0) : (prev.scoreInfinity||0),
                scoreGhost:    mode==='ghost'    ? Math.max(scoreVal,prev.scoreGhost||0)    : (prev.scoreGhost||0),
                bossCount:     typeof defeatedBosses!=='undefined' ? defeatedBosses.length : (prev.bossCount||0),
                updatedAt:     Date.now()
            });
        });
    }

    function submitBossProgress() {
        if (!_ready || !_user || !_profile) return;
        const uid = _user.uid;
        _db.ref(DB_BOARD+'/'+uid).once('value').then(snap => {
            const prev = snap.val() || {};
            return _db.ref(DB_BOARD+'/'+uid).update({
                name: _profile.name, skinId: (SKINS[p1SkinIndex]||SKINS[0]).id,
                skinVariant: (typeof mySkinVariants!=='undefined' ? mySkinVariants[(SKINS[p1SkinIndex]||SKINS[0]).id] : null) || 'auto',
                bossCount: typeof defeatedBosses!=='undefined' ? defeatedBosses.length : (prev.bossCount||0),
                updatedAt: Date.now()
            });
        });
        _push(uid);
    }

    function submitInfinityScore(score) { submitScore(score, 'infinity'); }

    function fetchLeaderboard(mode) {
        if (!_ready) return Promise.reject('offline');
        const field = mode==='infinity' ? 'scoreInfinity' : (mode==='bosses' ? 'bossCount' : (mode==='ghost' ? 'scoreGhost' : 'scoreNormal'));
        return _db.ref(DB_BOARD).once('value').then(snap => {
            const rows = [];
            snap.forEach(child => {
                const d = child.val() || {};
                if ((d[field]||0)>0) rows.push({id:child.key, name:d.name, skinId:d.skinId, skinVariant:d.skinVariant||'auto',
                    scoreNormal:d.scoreNormal||0, scoreInfinity:d.scoreInfinity||0, scoreGhost:d.scoreGhost||0, bossCount:d.bossCount||0});
            });
            rows.sort((a,b)=>(b[field]||0)-(a[field]||0));
            return rows.map((r,i)=>Object.assign({rank:i+1},r));
        });
    }

    function manualSync() {
        if (!_user) { _showAccountToast('Сначала войдите','#e74c3c'); return; }
        const btn = document.getElementById('btn-manual-sync');
        if (btn) { btn.disabled=true; btn.textContent='⏳ Синхронизация...'; }
        // Отправляем локальные рекорды режимов в таблицу лидеров
        try {
            if ((highScore || 0) > 0) submitScore(highScore, 'normal');
            if ((infinityHighScore || 0) > 0) submitScore(infinityHighScore, 'infinity');
            if (typeof ghostHighScore !== 'undefined' && (ghostHighScore || 0) > 0) submitScore(ghostHighScore, 'ghost');
            submitBossProgress();
        } catch (e) { console.warn('[sync] records:', e); }
        _push(_user.uid).then(()=>{
            _showAccountToast('Сохранено в облако!');
            if (btn) { btn.disabled=false; btn.textContent='☁ В ОБЛАКО'; }
        }).catch(()=>{
            _showAccountToast('Ошибка синхронизации','#e74c3c');
            if (btn) { btn.disabled=false; btn.textContent='☁ В ОБЛАКО'; }
        });
    }

    // ── UI HELPERS ──────────────────────────────────────────
    function _updateBadge() {
        const el = document.getElementById('acc-profile-badge');
        if (!el) return;
        if (_profile && _profile.name) {
            el.innerText = _profile.name;
            el.style.color = '#ffd700';
        } else {
            el.innerText = (typeof t === 'function' ? t('accLoginBadge') : 'ВОЙТИ');
            el.style.color = '#aaa';
        }
    }

    function _authErrMsg(code) {
        const map = {
            'auth/email-already-in-use':'Email уже используется',
            'auth/invalid-email':'Неверный email',
            'auth/weak-password':'Слабый пароль',
            'auth/user-not-found':'Пользователь не найден',
            'auth/wrong-password':'Неверный пароль',
            'auth/too-many-requests':'Слишком много попыток',
            'auth/network-request-failed':'Нет соединения',
            'auth/invalid-credential':'Неверный логин или пароль'
        };
        return map[code] || ('Ошибка: ' + (code||'неизвестная'));
    }

    function _closeAllModals() {
        ['acc-auth-modal','acc-profile-modal','acc-leaderboard-modal'].forEach(id=>{
            const el=document.getElementById(id); if(el) el.style.display='none';
        });
    }

    function _escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    function _skinEmoji(skin) {
        if (!skin) return IconGenerator.html('fish_orange','20px');
        return '<img src="'+IconGenerator.getCatIcon(skin)+'" style="width:60px;height:40px;image-rendering:pixelated;display:block;margin:0 auto;">';
    }

    function _timeSince(ts) {
        const s=Math.floor((Date.now()-ts)/1000);
        if(s<60) return s+' сек. назад';
        if(s<3600) return Math.floor(s/60)+' мин. назад';
        return Math.floor(s/3600)+' ч. назад';
    }

    // ── AUTH MODAL ──────────────────────────────────────────
    let _authTab = 'login';

    function openAuthModal(tab) {
        if (!_ready) { _showAccountToast('Нажмите «ОНЛАЙН» для подключения','#e67e22'); return; }
        AudioEngine.boot();
        if (_user) { openProfileModal(); return; }
        _authTab = tab||'login'; _closeAllModals();
        if (typeof startScreen!=='undefined') startScreen.style.display='none';
        document.getElementById('acc-auth-modal').style.display='block';
        _renderAuthModal();
    }

    function _renderAuthModal() {
        document.getElementById('auth-tab-login').className    = 'auth-tab'+(_authTab==='login'   ?' auth-tab-active':'');
        document.getElementById('auth-tab-register').className = 'auth-tab'+(_authTab==='register'?' auth-tab-active':'');
        document.getElementById('auth-section-login').style.display    = _authTab==='login'   ?'flex':'none';
        document.getElementById('auth-section-register').style.display = _authTab==='register'?'flex':'none';
        ['auth-login-err','auth-reg-err'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='';});
        const lb=document.getElementById('btn-do-login'), rb=document.getElementById('btn-do-register');
        if(lb){lb.disabled=false;lb.textContent='ВОЙТИ';}
        if(rb){rb.disabled=false;rb.textContent='СОЗДАТЬ';}
    }

    function switchAuthTab(tab) { _authTab=tab; _renderAuthModal(); }

    function closeAuthModal() {
        document.getElementById('acc-auth-modal').style.display='none';
        if(typeof startScreen!=='undefined') startScreen.style.display='block';
    }

    function doLogin() {
        const email=document.getElementById('login-email').value,
              pass =document.getElementById('login-pass').value;
        const errEl=document.getElementById('auth-login-err'), btn=document.getElementById('btn-do-login');
        errEl.textContent=''; btn.disabled=true; btn.textContent='⏳ Вход...';
        login(email,pass)
            .then(()=>{ _showAccountToast('Вход выполнен!'); closeAuthModal(); })
            .catch(e=>{ errEl.textContent=_authErrMsg(e.code||e); btn.disabled=false; btn.textContent='ВОЙТИ'; });
    }

    function doRegister() {
        const name=document.getElementById('reg-name').value,
              email=document.getElementById('reg-email').value,
              pass=document.getElementById('reg-pass').value;
        const errEl=document.getElementById('auth-reg-err'), btn=document.getElementById('btn-do-register');
        errEl.textContent=''; btn.disabled=true; btn.textContent='⏳ Создание...';
        register(email,pass,name)
            .then(()=>{ _showAccountToast('Аккаунт создан!'); closeAuthModal(); })
            .catch(e=>{ errEl.textContent=_authErrMsg(e.code||e); btn.disabled=false; btn.textContent='СОЗДАТЬ'; });
    }

    // ── PROFILE MODAL ───────────────────────────────────────
    function openProfileModal() {
        AudioEngine.boot(); if(!_user){openAuthModal('login');return;}
        _closeAllModals();
        if(typeof startScreen!=='undefined') startScreen.style.display='none';
        document.getElementById('acc-profile-modal').style.display='block';
        const inp=document.getElementById('acc-name-input');
        if(inp&&_profile&&_profile.name) inp.value=_profile.name;
        document.getElementById('acc-name-error').textContent='';
        const btn=document.getElementById('btn-save-profile');
        if(btn){btn.disabled=false;btn.innerHTML=IconGenerator.html('check','13px')+' СОХРАНИТЬ';}
        const stats=document.getElementById('acc-stats-block');
        if(stats){
            const G=IconGenerator;
            stats.innerHTML=
                (_user?'<div class="acc-stat-row"><span>Email</span><span style="color:#aaa;font-size:7px;">'+_escHtml(_user.email)+'</span></div>':'')+
                '<div class="acc-stat-row"><span>РЕКОРД</span><span>'+G.html('trophy','13px')+' '+highScore+'</span></div>'+
                '<div class="acc-stat-row"><span>БЕСК.</span><span>'+G.html('infinity','13px')+' '+infinityHighScore+'</span></div>'+
                '<div class="acc-stat-row"><span>РЫБКИ</span><span>'+G.html('fish_orange','13px')+' '+fishWallet.orange+' '+G.html('fish_blue','13px')+' '+fishWallet.blue+' '+G.html('fish_gold','13px')+' '+fishWallet.gold+'</span></div>'+
                '<div class="acc-stat-row"><span>СКИНЫ</span><span>'+G.html('cart','13px')+' '+unlockedSkins.length+'/'+SKINS.length+'</span></div>'+
                '<div class="acc-stat-row"><span>СИНХР.</span><span style="font-size:7px;color:#888;">'+(_lastSyncTime?_timeSince(_lastSyncTime):'Никогда')+'</span></div>';
        }
    }

    function closeProfileModal() {
        document.getElementById('acc-profile-modal').style.display='none';
        if(typeof startScreen!=='undefined') startScreen.style.display='block';
    }

    function saveProfileFromUI() {
        const input=document.getElementById('acc-name-input'),
              errEl=document.getElementById('acc-name-error'),
              btn  =document.getElementById('btn-save-profile');
        if(!input) return;
        const n=input.value.trim();
        if(n.length<2||n.length>16){errEl.textContent='Неверная длина имени';return;}
        errEl.textContent=''; btn.disabled=true; btn.textContent='⏳ Сохраняем...';
        updateDisplayName(n)
            .then(()=>_push(_user.uid))
            .then(()=>{ _showAccountToast('Сохранено!'); closeProfileModal(); })
            .catch(e=>{ errEl.textContent=String(e); btn.disabled=false; btn.textContent='СОХРАНИТЬ'; });
    }

    // ── LEADERBOARD MODAL ───────────────────────────────────
    function openLeaderboard() {
        if(!_ready){_showAccountToast('Нажмите «ОНЛАЙН» для подключения','#e67e22');return;}
        AudioEngine.boot(); _closeAllModals();
        if(typeof startScreen!=='undefined') startScreen.style.display='none';
        document.getElementById('acc-leaderboard-modal').style.display='block';
        _currentBoardMode='bosses'; _renderBoardTabs(); _loadAndRenderBoard();
    }

    function closeLeaderboard() {
        document.getElementById('acc-leaderboard-modal').style.display='none';
        if(typeof startScreen!=='undefined') startScreen.style.display='block';
    }

    function switchBoardMode(mode) { _currentBoardMode=mode; _renderBoardTabs(); _loadAndRenderBoard(); }

    function _renderBoardTabs() {
        ['bosses','infinity','ghost'].forEach(m=>{
            const tab=document.getElementById('board-tab-'+m);
            if(tab) tab.className='board-tab'+(_currentBoardMode===m?' board-tab-active':'');
        });
    }

    function _loadAndRenderBoard() {
        const body=document.getElementById('acc-board-body'); if(!body) return;
        body.innerHTML='<tr><td colspan="4" class="board-empty-cell">Загрузка...</td></tr>';
        if(!_ready){body.innerHTML='<tr><td colspan="4" class="board-empty-cell" style="color:#e74c3c;">'+(typeof t==='function'?t('accBoardNoConn'):'Нет соединения')+'</td></tr>';return;}
        const scoreHeader=document.getElementById('board-th-score');
        if(scoreHeader) scoreHeader.innerHTML=_currentBoardMode==='bosses'?'⚔️ БОССЫ':'СЧЁТ';
        fetchLeaderboard(_currentBoardMode).then(rows=>{
            if(!rows.length){body.innerHTML='<tr><td colspan="4" class="board-empty-cell">Пусто</td></tr>';return;}
            const isBosses=_currentBoardMode==='bosses';
            const field=isBosses?'bossCount':(_currentBoardMode==='infinity'?'scoreInfinity':(_currentBoardMode==='ghost'?'scoreGhost':'scoreNormal'));
            body.innerHTML=rows.map(r=>{
                const isMe=_user&&r.id===_user.uid;
                const medal=r.rank===1?'<span style="color:#FFD700;font-family:\'Press Start 2P\',monospace;font-size:12px;">1</span>':
                            r.rank===2?'<span style="color:#C0C0C0;font-family:\'Press Start 2P\',monospace;font-size:12px;">2</span>':
                            r.rank===3?'<span style="color:#CD7F32;font-family:\'Press Start 2P\',monospace;font-size:12px;">3</span>':
                            '<span style="color:#777;font-family:\'Press Start 2P\',monospace;font-size:10px;">'+r.rank+'</span>';
                // Скин с учётом настройки окраса игрока (видна всем в таблице)
                const _baseSkin=SKINS.find(s=>s.id===r.skinId)||SKINS[0];
                const skin=_baseSkin.configurable?Object.assign({},_baseSkin,{_variant:r.skinVariant||'auto'}):_baseSkin;
                return '<tr class="'+(isMe?'board-row-me':'')+'"><td class="board-rank">'+medal+'</td>'+
                    '<td class="board-name">'+_escHtml(r.name)+(isMe?' <span class="board-you-badge">ТЫ</span>':'')+
                    '</td><td class="board-skin">'+_skinEmoji(skin)+'</td>'+
                    '<td class="board-score">'+(isBosses?'⚔️ '+r.bossCount+' / 4':r[field])+'</td></tr>';
            }).join('');
        }).catch(()=>{
            body.innerHTML='<tr><td colspan="4" class="board-empty-cell" style="color:#e74c3c;">Ошибка загрузки</td></tr>';
        });
    }

    return {
        init, connectFirebase,
        isReady:     () => _ready,
        getUsername: () => _profile ? _profile.name : null,
        getUserId:   () => _user    ? _user.uid      : null,
        _pushLocal,
        submitScore, submitBossProgress, submitInfinityScore, fetchLeaderboard,
        logout, manualSync,
        openAuthModal, closeAuthModal, switchAuthTab, doLogin, doRegister,
        openProfileModal, closeProfileModal, saveProfileFromUI,
        openLeaderboard, closeLeaderboard, switchBoardMode,
        _updateBadge, _patchSaveGameData
    };
})();

function _accAutoSubmit(scoreValue, mode) {
    AccountSystem.submitScore(scoreValue, mode || 'normal');
}

// ============================================================
// ACCOUNTS — Firebase Auth + Realtime DB
// Регистрация / вход / синхронизация ВСЕГО прогресса
// ============================================================

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

    const DB_BOARD    = 'pixelcats_leaderboard';
    const DB_USERS    = 'pixelcats_users';
    const DB_PROGRESS = 'pixelcats_progress';
    const MAX_ROWS    = 50;
    const NAME_RE     = /^[a-zA-Za-яёА-ЯЁ0-9_\-. ]+$/;

    let _app     = null, _auth = null, _db = null;
    let _user    = null, _profile = null, _ready = false;
    let _lastSyncTime = null;
    let _currentBoardMode = 'bosses';

    // ════════════════════════════════════════════════════════════
    // CORE
    // ════════════════════════════════════════════════════════════

    function init() {
        try {
            const appName = 'pxcats_accounts';
            const existing = firebase.apps.find(a => a.name === appName);
            _app  = existing || firebase.initializeApp(ACCOUNTS_CFG, appName);
            _db   = firebase.database(_app);
            _auth = firebase.auth(_app);
            _ready = true;
        } catch(e) {
            console.error('[Accounts] init error:', e);
            _ready = false; _updateBadge(); return;
        }

        _auth.onAuthStateChanged(user => {
            _user = user;
            if (user) {
                Promise.all([
                    _db.ref(DB_USERS    + '/' + user.uid).once('value'),
                    _db.ref(DB_PROGRESS + '/' + user.uid).once('value')
                ]).then(function(results) {
                    var profSnap = results[0], progSnap = results[1];
                    _profile = profSnap.val() || { name: user.email.split('@')[0], skinId: 'white' };
                    var prog = progSnap.val();
                    if (prog) _applyProgress(prog);
                    _updateBadge();
                }).catch(function() {
                    _profile = { name: user.email.split('@')[0], skinId: 'white' };
                    _updateBadge();
                });
            } else {
                _profile = null; _updateBadge();
            }
        });

        // Patch saveGameData so every local save also goes to cloud
        _patchSaveGameData();
    }

    function getUsername() { return _profile ? _profile.name : null; }
    function getUserId()   { return _user ? _user.uid : null; }
    function isReady()     { return _ready; }

    // ── Collect local progress ────────────────────────────────────
    function _collect() {
        return {
            highScore:         highScore         || 0,
            infinityHighScore: infinityHighScore || 0,
            hardUnlocked:      hardUnlocked      || false,
            megaHardUnlocked:  megaHardUnlocked  || false,
            infinityUnlocked:  infinityUnlocked  || false,
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

    // ── Apply cloud progress → game globals (always take MAX) ─────
    function _applyProgress(prog) {
        highScore         = Math.max(prog.highScore         || 0, highScore         || 0);
        infinityHighScore = Math.max(prog.infinityHighScore || 0, infinityHighScore || 0);
        hardUnlocked      = hardUnlocked      || prog.hardUnlocked      || false;
        megaHardUnlocked  = megaHardUnlocked  || prog.megaHardUnlocked  || false;
        infinityUnlocked  = infinityUnlocked  || prog.infinityUnlocked  || false;

        var dbSkins = prog.unlockedSkins || [];
        dbSkins.forEach(function(s) { if (!unlockedSkins.includes(s)) unlockedSkins.push(s); });

        if (prog.samuraiUnlocked && typeof samuraiUnlocked !== 'undefined') {
            samuraiUnlocked = true;
            localStorage.setItem('pixelCatsSamuraiUnlocked', 'true');
        }

        fishWallet.orange = Math.max(fishWallet.orange || 0, prog.fishOrange || 0);
        fishWallet.blue   = Math.max(fishWallet.blue   || 0, prog.fishBlue   || 0);
        fishWallet.gold   = Math.max(fishWallet.gold   || 0, prog.fishGold   || 0);

        if (prog.p1SkinIndex !== undefined) p1SkinIndex = prog.p1SkinIndex;
        if (prog.p2SkinIndex !== undefined) p2SkinIndex = prog.p2SkinIndex;

        // Мёрджим победы над боссами — union массивов, никогда не уменьшаем
        if (Array.isArray(prog.defeatedBossIds) && prog.defeatedBossIds.length > 0) {
            if (typeof defeatedBosses !== 'undefined') {
                prog.defeatedBossIds.forEach(function(id) {
                    if (!defeatedBosses.includes(id)) defeatedBosses.push(id);
                });
                localStorage.setItem('pixelCatsDefeatedBosses', JSON.stringify(defeatedBosses));
            }
        }

        // Flush merged state to localStorage + refresh UI
        saveGameData();
        updateFishUI();
        if (typeof updateMenuButtons       === 'function') updateMenuButtons();
        if (typeof updateDifficultyButtons === 'function') updateDifficultyButtons();
        if (typeof updateMenuPreviews      === 'function') updateMenuPreviews();
        if (typeof highScoreEl         !== 'undefined' && highScoreEl)         highScoreEl.innerText         = highScore;
        if (typeof infinityHighScoreEl !== 'undefined' && infinityHighScoreEl) infinityHighScoreEl.innerText = infinityHighScore;
        _lastSyncTime = Date.now();
        console.log('[Accounts] progress applied from cloud');
    }

    // ── Push local progress to cloud ──────────────────────────────
    function _push(uid) {
        if (!_ready || !uid) return Promise.resolve();
        return _db.ref(DB_PROGRESS + '/' + uid).set(_collect())
            .then(function() { _lastSyncTime = Date.now(); console.log('[Accounts] progress pushed'); })
            .catch(function(e) { console.warn('[Accounts] push error:', e); });
    }

    // ── Patch global saveGameData ─────────────────────────────────
    function _patchSaveGameData() {
        if (typeof saveGameData !== 'function') return;
        var orig = saveGameData;
        window.saveGameData = function() {
            orig();
            if (_user && _ready) _push(_user.uid);
        };
        console.log('[Accounts] saveGameData patched');
    }

    // ════════════════════════════════════════════════════════════
    // AUTH
    // ════════════════════════════════════════════════════════════

    function register(email, password, displayName) {
        if (!_ready) return Promise.reject('Firebase не подключён');
        var nameErr = _validateName(displayName);
        if (nameErr) return Promise.reject(nameErr);
        if (password.length < 6) return Promise.reject(t('accPassMin'));

        return _auth.createUserWithEmailAndPassword(email.trim(), password)
            .then(function(cred) {
                var uid = cred.user.uid;
                _profile = { name: displayName.trim(), skinId: (SKINS[p1SkinIndex] ? SKINS[p1SkinIndex].id : 'white'), createdAt: Date.now() };
                // Upload profile + local progress simultaneously
                return Promise.all([
                    _db.ref(DB_USERS + '/' + uid).set(_profile),
                    _push(uid)
                ]);
            })
            .then(function() { _updateBadge(); });
    }

    function login(email, password) {
        if (!_ready) return Promise.reject('Firebase не подключён');
        var uid;
        return _auth.signInWithEmailAndPassword(email.trim(), password)
            .then(function(cred) {
                uid = cred.user.uid;
                return Promise.all([
                    _db.ref(DB_USERS    + '/' + uid).once('value'),
                    _db.ref(DB_PROGRESS + '/' + uid).once('value')
                ]);
            })
            .then(function(results) {
                _profile = results[0].val() || { name: _user.email.split('@')[0], skinId: 'white' };
                var prog = results[1].val();
                if (prog) _applyProgress(prog);
                _updateBadge();
            });
    }

    function logout() {
        if (!_auth) return;
        if (_user) {
            _push(_user.uid).then(function() { _doSignOut(); });
        } else { _doSignOut(); }
    }

    function _doSignOut() {
        _auth.signOut().then(function() {
            _user = null; _profile = null;
            _updateBadge(); _closeAllModals();
            startScreen.style.display = 'block';
        });
    }

    function updateDisplayName(newName) {
        if (!_user || !_ready) return Promise.reject('Не авторизован');
        var err = _validateName(newName);
        if (err) return Promise.reject(err);
        var trimmed = newName.trim();
        return _db.ref(DB_USERS + '/' + _user.uid)
            .update({ name: trimmed, skinId: SKINS[p1SkinIndex] ? SKINS[p1SkinIndex].id : 'white' })
            .then(function() { _profile.name = trimmed; _updateBadge(); });
    }

    // ════════════════════════════════════════════════════════════
    // LEADERBOARD
    // ════════════════════════════════════════════════════════════

    function submitScore(scoreVal, mode) {
        console.log('[Accounts] submitScore:', scoreVal, mode, '| uid:', _user ? _user.uid : 'none', '| ready:', _ready);
        if (!_ready)       { console.warn('[Accounts] not ready');     return; }
        if (!_user)        { console.warn('[Accounts] not logged in'); return; }
        if (!_profile)     { console.warn('[Accounts] no profile');    return; }
        if (!(scoreVal > 0)) { console.warn('[Accounts] score <= 0'); return; }

        var uid = _user.uid;
        _push(uid); // save full progress too

        var ref = _db.ref(DB_BOARD + '/' + uid);
        ref.once('value').then(function(snap) {
            var prev         = snap.val() || {};
            var prevNormal   = prev.scoreNormal   || 0;
            var prevInfinity = prev.scoreInfinity || 0;
            var isNew = mode === 'infinity' ? scoreVal > prevInfinity : scoreVal > prevNormal;
            if (!isNew) { console.log('[Accounts] not a new best'); return null; }
            return ref.set({
                name:          _profile.name,
                skinId:        SKINS[p1SkinIndex] ? SKINS[p1SkinIndex].id : (_profile.skinId || 'white'),
                scoreNormal:   mode === 'normal'   ? Math.max(scoreVal, prevNormal)   : prevNormal,
                scoreInfinity: mode === 'infinity' ? Math.max(scoreVal, prevInfinity) : prevInfinity,
                updatedAt:     Date.now()
            });
        })
        .then(function(r) { if (r !== null) { console.log('[Accounts] leaderboard saved'); _showToast(t('accToastScore')); } })
        .catch(function(e) { console.error('[Accounts] leaderboard error:', e); });
    }

    // Записывает количество побеждённых боссов в таблицу лидеров
    function submitBossProgress(count) {
        if (!_ready || !_user || !_profile) return;
        if (!(count > 0)) return;
        var uid  = _user.uid;
        var ref  = _db.ref(DB_BOARD + '/' + uid);
        ref.once('value').then(function(snap) {
            var prev      = snap.val() || {};
            var prevCount = prev.bossCount || 0;
            if (count <= prevCount) return; // не снижаем рекорд
            return ref.update({
                bossCount:  count,
                name:       _profile.name,
                skinId:     SKINS[p1SkinIndex] ? SKINS[p1SkinIndex].id : (_profile.skinId || 'white'),
                updatedAt:  Date.now()
            });
        }).then(function() {
            console.log('[Accounts] bossCount updated to', count);
        }).catch(function(e) { console.warn('[Accounts] bossCount error:', e); });
    }

    function fetchLeaderboard(mode) {
        if (!_ready) return Promise.reject('DB not ready');
        if (mode === 'bosses') {
            return _db.ref(DB_BOARD).orderByChild('bossCount').limitToLast(MAX_ROWS).once('value')
                .then(function(snap) {
                    var rows = [];
                    snap.forEach(function(child) {
                        var d = child.val();
                        if ((d.bossCount || 0) > 0)
                            rows.push({ id: child.key, name: d.name, skinId: d.skinId,
                                bossCount: d.bossCount || 0,
                                scoreNormal: d.scoreNormal || 0, scoreInfinity: d.scoreInfinity || 0 });
                    });
                    rows.sort(function(a, b) { return (b.bossCount || 0) - (a.bossCount || 0); });
                    return rows.map(function(r, i) { return Object.assign({ rank: i + 1 }, r); });
                });
        }
        var field = mode === 'infinity' ? 'scoreInfinity' : 'scoreNormal';
        return _db.ref(DB_BOARD).orderByChild(field).limitToLast(MAX_ROWS).once('value')
            .then(function(snap) {
                var rows = [];
                snap.forEach(function(child) {
                    var d = child.val();
                    if ((d[field] || 0) > 0)
                        rows.push({ id: child.key, name: d.name, skinId: d.skinId,
                            scoreNormal: d.scoreNormal || 0, scoreInfinity: d.scoreInfinity || 0 });
                });
                rows.sort(function(a, b) { return (b[field] || 0) - (a[field] || 0); });
                return rows.map(function(r, i) { return Object.assign({ rank: i + 1 }, r); });
            });
    }

    // Manual sync from profile screen
    function manualSync() {
        if (!_user) { _showToast(t('accToastNeedLogin'), '#e74c3c'); return; }
        var btn = document.getElementById('btn-manual-sync');
        if (btn) { btn.disabled = true; btn.textContent = t('accSyncing'); }
        _push(_user.uid).then(function() {
            _showToast(t('accToastCloud'));
            if (btn) { btn.disabled = false; btn.textContent = t('accSaveCloud'); }
        }).catch(function() {
            _showToast(t('accToastSyncErr'), '#e74c3c');
            if (btn) { btn.disabled = false; btn.textContent = t('accSaveCloud'); }
        });
    }

    // ════════════════════════════════════════════════════════════
    // UI HELPERS
    // ════════════════════════════════════════════════════════════

    function _updateBadge() {
        var el = document.getElementById('acc-profile-badge');
        if (!el) return;
        if (_profile && _profile.name) {
            el.innerHTML = IconGenerator.html('person','12px') + ' ' + _escHtml(_profile.name);
            el.style.color = '#ffd700';
        } else {
            el.innerHTML = IconGenerator.html('person','12px') + ' ' + (t('accLoginBadge')||'ВОЙТИ');
            el.style.color = '#aaa';
        }
    }

    function _validateName(name) {
        var n = String(name || '').trim();
        if (n.length < 2)  return t('accNameShort');
        if (n.length > 16) return t('accNameLong');
        return null;
    }

    function _authErrMsg(code) {
        var map = {
            'auth/email-already-in-use':   t('accErrEmailUsed'),
            'auth/invalid-email':          t('accErrInvalidEmail'),
            'auth/weak-password':          t('accErrWeakPass'),
            'auth/user-not-found':         'Пользователь не найден',
            'auth/wrong-password':         t('accErrWrongPass'),
            'auth/too-many-requests':      'Слишком много попыток. Подожди',
            'auth/network-request-failed': 'Нет соединения с интернетом',
            'auth/invalid-credential':     t('accErrInvalidCred')
        };
        return map[code] || ('Ошибка: ' + (code || 'неизвестная'));
    }

    function _closeAllModals() {
        ['acc-auth-modal','acc-profile-modal','acc-leaderboard-modal'].forEach(function(id) {
            var el = document.getElementById(id); if (el) el.style.display = 'none';
        });
    }

    function _escHtml(s) {
        return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function _skinEmoji(skin) {
        if (!skin) return IconGenerator.html('fish_orange','20px');
        // Canvas 120x80 → показываем 60x40 (чёткий пиксель-арт x2)
        return '<img src="' + IconGenerator.getCatIcon(skin) + '" style="width:60px;height:40px;image-rendering:pixelated;display:block;margin:0 auto;">';
    }

    function _timeSince(ts) {
        var s = Math.floor((Date.now() - ts) / 1000);
        if (s < 60)   return s + ' ' + t('accSyncAgoSec');
        if (s < 3600) return Math.floor(s/60) + ' ' + t('accSyncAgoMin');
        return Math.floor(s/3600) + ' ' + t('accSyncAgoHour');
    }

    function _diffBadges() {
        var ck = IconGenerator.html('check','11px');
        var inf = IconGenerator.html('infinity','11px');
        var s = ck + t('accDiffEasy');
        if (hardUnlocked)     s += ' ' + ck + t('accDiffHard');
        if (megaHardUnlocked) s += ' ' + ck + t('accDiffMega');
        if (infinityUnlocked) s += ' ' + ck + inf;
        return s;
    }

    function _showToast(msg, color) {
        var t = document.getElementById('acc-toast');
        if (!t) {
            t = document.createElement('div'); t.id = 'acc-toast';
            t.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);' +
                'color:#000;padding:10px 22px;font-size:11px;font-family:\'Press Start 2P\',monospace;' +
                'border:3px solid #000;z-index:9999;pointer-events:none;transition:opacity .4s;';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.style.background = color || '#2ecc71';
        t.style.opacity = '1';
        clearTimeout(t._tid);
        t._tid = setTimeout(function() { t.style.opacity = '0'; }, 2800);
    }

    // ════════════════════════════════════════════════════════════
    // UI — Auth Modal
    // ════════════════════════════════════════════════════════════
    var _authTab = 'login';

    function openAuthModal(tab) {
        AudioEngine.boot();
        if (_user) { openProfileModal(); return; }
        _authTab = tab || 'login';
        _closeAllModals();
        startScreen.style.display = 'none';
        document.getElementById('acc-auth-modal').style.display = 'block';
        _renderAuthModal();
    }

    function _renderAuthModal() {
        document.getElementById('auth-tab-login').className    = 'auth-tab' + (_authTab === 'login'    ? ' auth-tab-active' : '');
        document.getElementById('auth-tab-register').className = 'auth-tab' + (_authTab === 'register' ? ' auth-tab-active' : '');
        document.getElementById('auth-section-login').style.display    = _authTab === 'login'    ? 'flex' : 'none';
        document.getElementById('auth-section-register').style.display = _authTab === 'register' ? 'flex' : 'none';
        ['auth-login-err','auth-reg-err'].forEach(function(id) {
            var el = document.getElementById(id); if (el) el.textContent = '';
        });
        var lb = document.getElementById('btn-do-login'),
            rb = document.getElementById('btn-do-register');
        if (lb) { lb.disabled = false; lb.textContent = t('accLoginBtn'); }
        if (rb) { rb.disabled = false; rb.textContent = t('accRegisterBtn'); }
    }

    function switchAuthTab(tab) { _authTab = tab; _renderAuthModal(); }

    function closeAuthModal() {
        document.getElementById('acc-auth-modal').style.display = 'none';
        startScreen.style.display = 'block';
    }

    function doLogin() {
        var email = document.getElementById('login-email').value;
        var pass  = document.getElementById('login-pass').value;
        var errEl = document.getElementById('auth-login-err');
        var btn   = document.getElementById('btn-do-login');
        errEl.textContent = ''; btn.disabled = true; btn.textContent = t('accLoggingIn');
        login(email, pass)
            .then(function() { _showToast(t('accToastLogin')); closeAuthModal(); })
            .catch(function(e) { errEl.textContent = _authErrMsg(e.code || e); btn.disabled = false; btn.textContent = t('accLoginBtn'); });
    }

    function doRegister() {
        var name  = document.getElementById('reg-name').value;
        var email = document.getElementById('reg-email').value;
        var pass  = document.getElementById('reg-pass').value;
        var errEl = document.getElementById('auth-reg-err');
        var btn   = document.getElementById('btn-do-register');
        errEl.textContent = ''; btn.disabled = true; btn.textContent = t('accCreating');
        register(email, pass, name)
            .then(function() { _showToast(t('accToastRegister')); closeAuthModal(); })
            .catch(function(e) { errEl.textContent = _authErrMsg(e.code || e); btn.disabled = false; btn.textContent = t('accRegisterBtn'); });
    }

    // ════════════════════════════════════════════════════════════
    // UI — Profile Modal
    // ════════════════════════════════════════════════════════════
    function openProfileModal() {
        AudioEngine.boot();
        if (!_user) { openAuthModal('login'); return; }
        _closeAllModals();
        startScreen.style.display = 'none';
        document.getElementById('acc-profile-modal').style.display = 'block';
        var inp = document.getElementById('acc-name-input');
        if (inp && _profile && _profile.name) inp.value = _profile.name;
        document.getElementById('acc-name-error').textContent = '';
        var btn = document.getElementById('btn-save-profile');
        if (btn) { btn.disabled = false; btn.innerHTML = IconGenerator.html('check','13px') + ' ' + t('accSaveNameShort'); }
        var stats = document.getElementById('acc-stats-block');
        if (stats) {
            var G = IconGenerator;
            var emailLine = _user
                ? '<div class="acc-stat-row"><span>Email</span><span style="color:#aaa;font-size:7px;">' + _escHtml(_user.email) + '</span></div>'
                : '';
            // FIX: was `syncAgo` (undefined variable) — now computed correctly
            var syncAgoText = _lastSyncTime ? _timeSince(_lastSyncTime) : (t('accNoSync') || 'Никогда');
            stats.innerHTML =
                emailLine +
                '<div class="acc-stat-row"><span>' + t('accStatBest') + '</span><span>' + G.html('trophy','13px') + ' ' + highScore + '</span></div>' +
                '<div class="acc-stat-row"><span>' + t('accStatInfinity') + '</span><span>' + G.html('infinity','13px') + ' ' + infinityHighScore + '</span></div>' +
                '<div class="acc-stat-row"><span>' + t('accStatFish') + '</span><span>' + G.html('fish_orange','13px') + ' ' + fishWallet.orange + ' ' + G.html('fish_blue','13px') + ' ' + fishWallet.blue + ' ' + G.html('fish_gold','13px') + ' ' + fishWallet.gold + '</span></div>' +
                '<div class="acc-stat-row"><span>' + t('accStatSkins') + '</span><span>' + G.html('cart','13px') + ' ' + unlockedSkins.length + '/' + SKINS.length + '</span></div>' +
                '<div class="acc-stat-row"><span>' + t('accStatDiffs') + '</span><span style="font-size:7px;">' + _diffBadges() + '</span></div>' +
                '<div class="acc-stat-row"><span>' + t('accStatSync') + '</span><span style="font-size:7px;color:#888;">' + syncAgoText + '</span></div>';
        }
    }

    function closeProfileModal() {
        document.getElementById('acc-profile-modal').style.display = 'none';
        startScreen.style.display = 'block';
    }

    function saveProfileFromUI() {
        var input = document.getElementById('acc-name-input');
        var errEl = document.getElementById('acc-name-error');
        var btn   = document.getElementById('btn-save-profile');
        if (!input) return;
        var err = _validateName(input.value);
        if (err) { errEl.textContent = err; return; }
        errEl.textContent = ''; btn.disabled = true; btn.textContent = '⏳ Сохраняем...';
        updateDisplayName(input.value)
            .then(function() { return _push(_user.uid); })
            .then(function() { _showToast(t('accToastSaved')); closeProfileModal(); })
            .catch(function(e) { errEl.textContent = String(e); btn.disabled = false; btn.textContent = t('accSaveName'); });
    }

    // ════════════════════════════════════════════════════════════
    // UI — Leaderboard Modal
    // ════════════════════════════════════════════════════════════
    function openLeaderboard() {
        AudioEngine.boot();
        _closeAllModals();
        startScreen.style.display = 'none';
        document.getElementById('acc-leaderboard-modal').style.display = 'block';
        _currentBoardMode = 'bosses';
        _renderBoardTabs(); _loadAndRenderBoard();
    }

    function closeLeaderboard() {
        document.getElementById('acc-leaderboard-modal').style.display = 'none';
        startScreen.style.display = 'block';
    }

    function switchBoardMode(mode) {
        _currentBoardMode = mode; _renderBoardTabs(); _loadAndRenderBoard();
    }

    function _renderBoardTabs() {
        ['bosses','infinity'].forEach(function(m) {
            var tab = document.getElementById('board-tab-' + m);
            if (tab) tab.className = 'board-tab' + (_currentBoardMode === m ? ' board-tab-active' : '');
        });
    }

    function _loadAndRenderBoard() {
        var body = document.getElementById('acc-board-body');
        if (!body) return;
        body.innerHTML = '<tr><td colspan="4" class="board-empty-cell">' + t('accBoardLoading') + '</td></tr>';
        if (!_ready) {
            body.innerHTML = '<tr><td colspan="4" class="board-empty-cell" style="color:#e74c3c;">' + t('accBoardNoConn') + '</td></tr>'; return;
        }
        // Update score column header based on mode
        var scoreHeader = document.getElementById('board-th-score');
        if (scoreHeader) {
            scoreHeader.innerHTML = _currentBoardMode === 'bosses' ? (IconGenerator.html('swords','12px') + ' ' + (t('accBoardColBosses') || 'БОССЫ')) : t('accBoardColScore');
        }
        fetchLeaderboard(_currentBoardMode).then(function(rows) {
            if (!rows.length) { body.innerHTML = '<tr><td colspan="4" class="board-empty-cell">' + t('accBoardEmpty') + '</td></tr>'; return; }
            var isBosses = _currentBoardMode === 'bosses';
            var field = isBosses ? 'bossCount' : (_currentBoardMode === 'infinity' ? 'scoreInfinity' : 'scoreNormal');
            body.innerHTML = rows.map(function(r) {
                var isMe  = _user && r.id === _user.uid;
                var medal = r.rank === 1 ? '<img src="'+IconGenerator.getIcon('medal1')+'" class="pixel-icon">' :
                            r.rank === 2 ? '<img src="'+IconGenerator.getIcon('medal2')+'" class="pixel-icon">' :
                            r.rank === 3 ? '<img src="'+IconGenerator.getIcon('medal3')+'" class="pixel-icon">' : ('#' + r.rank);
                var skin  = SKINS.find(function(s) { return s.id === r.skinId; }) || SKINS[0];
                var scoreCell = isBosses ? ('<img src="'+IconGenerator.getIcon('swords')+'" class="pixel-icon"> ' + r.bossCount + ' / 4') : r[field];
                return '<tr class="' + (isMe ? 'board-row-me' : '') + '">' +
                    '<td class="board-rank">' + medal + '</td>' +
                    '<td class="board-name">' + _escHtml(r.name) + (isMe ? ' <span class="board-you-badge">' + t('accBoardYou') + '</span>' : '') + '</td>' +
                    '<td class="board-skin">' + _skinEmoji(skin) + '</td>' +
                    '<td class="board-score">' + scoreCell + '</td></tr>';
            }).join('');
        }).catch(function(e) {
            body.innerHTML = '<tr><td colspan="4" class="board-empty-cell" style="color:#e74c3c;">' + t('accBoardErr') + '</td></tr>';
            console.error('[Accounts] board error:', e);
        });
    }

    // Public API
    return {
        init, isReady, getUsername, getUserId,
        submitScore, submitBossProgress, fetchLeaderboard, logout, manualSync,
        openAuthModal, closeAuthModal, switchAuthTab, doLogin, doRegister,
        openProfileModal, closeProfileModal, saveProfileFromUI,
        openLeaderboard, closeLeaderboard, switchBoardMode,
        _updateBadge, _patchSaveGameData
    };
})();

// ── Auto-submit from game.js ──────────────────────────────────
function _accAutoSubmit(scoreValue, mode) {
    console.log('[_accAutoSubmit]', scoreValue, mode);
    AccountSystem.submitScore(scoreValue, mode || 'normal');
}

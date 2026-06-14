// ============================================================
// SETTINGS & SHOP — Settings screen, skin shop, volume controls
// ============================================================

function openSettings() {
    AudioEngine.boot();
    startScreen.style.display = 'none';
    document.getElementById('settings-screen').style.display = 'block';
    _syncSettingsUI();
}
function closeSettings() {
    document.getElementById('settings-screen').style.display = 'none';
    startScreen.style.display = 'block';
    if (!isPlaying && !bossBattleActive) _hideMobileControls(); // hide unless game is running
}

// ============================================================
// SKIN SHOP SYSTEM
// ============================================================
let shopSelectedSkin = null; // id of currently selected skin in shop

function openShop() {
    AudioEngine.boot();
    startScreen.style.display = 'none';
    document.getElementById('shop-screen').style.display = 'block';
    renderShop();
}

function closeShop() {
    document.getElementById('shop-screen').style.display = 'none';
    startScreen.style.display = 'block';
    updateMenuButtons();
}

function renderShop() {
    // Update wallet display
    document.getElementById('shop-orange').innerText = fishWallet.orange;
    document.getElementById('shop-blue').innerText   = fishWallet.blue;
    document.getElementById('shop-gold').innerText   = fishWallet.gold;

    // P2 equip button visibility
    document.getElementById('btn-shop-equip-p2').style.display = numPlayers === 2 ? 'block' : 'none';

    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';

    SKINS.forEach((skin, idx) => {
        const owned    = isSkinUnlocked(skin.id);
        const isSelSel = shopSelectedSkin === skin.id;

        const card = document.createElement('div');
        card.className = 'shop-card' +
            (owned    ? ' owned' : ' locked-card') +
            (isSelSel ? ' selected' : '');
        card.onclick = () => { shopSelectedSkin = skin.id; renderShop(); };

        // Square 80×80 canvas. Body occupies y+15..y+39, centre = y+27.
        // y=13 → body centre = 40 = canvas centre for ALL skins, no exceptions.
        const cv = document.createElement('canvas');
        cv.width        = 80;
        cv.height       = 80;
        cv.style.width  = '72px';
        cv.style.height = '72px';
        const cx = cv.getContext('2d');
        cx.clearRect(0, 0, 80, 80);
        const savedTime = gameTime;
        gameTime = 20;
        drawPixelCat(cx, 25, 30, skin, true, null, true, false);
        gameTime = savedTime;
        card.appendChild(cv);

        // Name
        const nameEl = document.createElement('div');
        nameEl.className = 'shop-card-name' + (owned ? '' : ' locked-name');
        nameEl.innerText = t(skin.nameKey);
        card.appendChild(nameEl);

        // Badge
        const badge = document.createElement('div');
        badge.className = 'shop-card-badge';

        if (owned) {
            if (isSelSel) {
                badge.textContent = t('shopSelected');
                badge.classList.add('badge-selected');
            } else {
                badge.textContent = t('shopOwned');
                badge.classList.add('badge-owned');
            }
        } else if (skin.secret) {
            badge.textContent = '???';
            badge.classList.add('badge-secret');
        } else if (skin.reqScore) {
            badge.textContent = t('shopDist') + skin.reqScore;
            badge.classList.add('badge-locked-score');
        } else if (skin.reqInfinityScore) {
            badge.textContent = '∞ ' + skin.reqInfinityScore;
            badge.classList.add('badge-locked-score');
        } else if (skin.reqGhostScore) {
            badge.innerText = t('needGhost') + ' ' + skin.reqGhostScore;
            badge.classList.add('badge-locked-score');
        } else if (skin.cost) {
            const wallet = skin.currency === 'blue' ? fishWallet.blue
                         : skin.currency === 'gold' ? fishWallet.gold
                         : fishWallet.orange;
            const fishName = skin.currency === 'blue' ? 'fish_blue' : skin.currency === 'gold' ? 'fish_gold' : 'fish_orange';
            badge.innerHTML = IconGenerator.html(fishName,'12px') + ' ' + skin.cost;
            badge.classList.add('badge-buy');
            if (wallet < skin.cost) badge.classList.add('cant-afford');
            badge.onclick = (e) => {
                e.stopPropagation();
                shopBuySkin(skin.id);
            };
        } else {
            badge.innerHTML = IconGenerator.html('lock','14px');
            badge.classList.add('badge-locked-score');
        }

        card.appendChild(badge);
        grid.appendChild(card);
    });
}

function shopBuySkin(skinId) {
    const skin = SKINS.find(s => s.id === skinId);
    if (!skin || isSkinUnlocked(skinId)) return;
    if (!skin.cost) return;
    const wallet = skin.currency === 'blue' ? fishWallet.blue
                 : skin.currency === 'gold' ? fishWallet.gold
                 : fishWallet.orange;
    if (wallet < skin.cost) {
        // Flash wallet display
        const idMap = { blue: 'shop-blue', gold: 'shop-gold', orange: 'shop-orange' };
        const el = document.getElementById(idMap[skin.currency]);
        if (el) { el.style.color = '#e74c3c'; setTimeout(() => el.style.color = '', 600); }
        return;
    }
    if (skin.currency === 'blue')   fishWallet.blue   -= skin.cost;
    else if (skin.currency === 'gold')   fishWallet.gold   -= skin.cost;
    else                                 fishWallet.orange -= skin.cost;
    unlockedSkins.push(skinId);
    shopSelectedSkin = skinId;
    saveGameData(); updateFishUI(); AudioEngine.sfx.unlock();
    renderShop();
}

function shopEquipP1() {
    if (!shopSelectedSkin) return;
    const idx = SKINS.findIndex(s => s.id === shopSelectedSkin);
    if (idx < 0 || !isSkinUnlocked(shopSelectedSkin)) return;
    p1SkinIndex = idx;
    closeShop();
}

function shopEquipP2() {
    if (!shopSelectedSkin) return;
    const idx = SKINS.findIndex(s => s.id === shopSelectedSkin);
    if (idx < 0 || !isSkinUnlocked(shopSelectedSkin)) return;
    p2SkinIndex = idx;
    closeShop();
}

function _syncSettingsUI() {
    const S = AudioEngine.settings;
    document.getElementById('set-music-on').classList.toggle('active', S.musicOn);
    document.getElementById('set-music-off').classList.toggle('active', !S.musicOn);
    document.getElementById('set-sfx-on').classList.toggle('active', S.sfxOn);
    document.getElementById('set-sfx-off').classList.toggle('active', !S.sfxOn);
    document.getElementById('music-vol-slider').value = Math.round(S.musicVol * 100);
    document.getElementById('sfx-vol-slider').value   = Math.round(S.sfxVol   * 100);
    document.getElementById('music-vol-val').innerText = Math.round(S.musicVol * 100) + '%';
    document.getElementById('sfx-vol-val').innerText   = Math.round(S.sfxVol   * 100) + '%';
    // Sync joy-style row visibility and buttons
    const _isJoy = (typeof ctrlType !== 'undefined') && ctrlType === 'joystick';
    const _joyRow = document.getElementById('joy-style-row');
    if (_joyRow) _joyRow.style.display = _isJoy ? '' : 'none';
    const _js = (typeof joyStyle !== 'undefined') ? joyStyle : 'fixed';
    const _fixedBtn = document.getElementById('joy-style-fixed');
    const _floatBtn = document.getElementById('joy-style-float');
    if (_fixedBtn) _fixedBtn.classList.toggle('active', _js === 'fixed');
    if (_floatBtn) _floatBtn.classList.toggle('active', _js === 'float');
}
function setMusicOn(v) {
    AudioEngine.setMusicOn(v);
    document.getElementById('set-music-on').classList.toggle('active', v);
    document.getElementById('set-music-off').classList.toggle('active', !v);
    if (v) AudioEngine.startMenuMusic();
}
function setSfxOn(v) {
    AudioEngine.setSfxOn(v);
    document.getElementById('set-sfx-on').classList.toggle('active', v);
    document.getElementById('set-sfx-off').classList.toggle('active', !v);
}
function setMusicVol(val) {
    AudioEngine.setMusicVol(val);
    document.getElementById('music-vol-val').innerText = val + '%';
}

// ============================================================
// НАСТРОЙКА СКИНА — выбор окраса (авто / светлый / тёмный)
// ============================================================
function openSkinConfig() {
    const overlay = document.getElementById('skin-config-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    _buildSkinConfigOptions();
    _syncSkinConfigUI();
}
function closeSkinConfig() {
    const overlay = document.getElementById('skin-config-overlay');
    if (overlay) overlay.style.display = 'none';
}
function _skinDefs() {
    const skin = SKINS[p1SkinIndex];
    return (skin && typeof SKIN_VARIANT_DEFS !== 'undefined') ? SKIN_VARIANT_DEFS[skin.id] : null;
}
// Динамически строит кнопки вариантов под текущий скин (попап «НАСТРОИТЬ»)
function _buildSkinConfigOptions() {
    const skin = SKINS[p1SkinIndex];
    const cont = document.getElementById('skin-var-options');
    const hintEl = document.getElementById('skin-config-hint');
    const defs = _skinDefs();
    if (hintEl) hintEl.innerText = t(defs && defs.hintKey ? defs.hintKey : 'skinCfg.hint');
    if (!cont) return;
    cont.innerHTML = '';
    if (!skin || !defs) return;
    defs.options.forEach(opt => {
        const b = document.createElement('button');
        b.className = 'toggle-btn';
        b.id = 'skin-var-' + opt.id;
        b.style.cssText = 'display:block;width:100%;margin:6px 0;padding:10px;font-size:12px;';
        b.onclick = () => setSkinVariant(opt.id);
        let label = t(opt.labelKey);
        if (opt.cost && !isVariantUnlocked(skin.id, opt.id)) label += ' \u2014 ' + opt.cost + ' ' + t('skinCfg.gold');
        b.innerText = label;
        cont.appendChild(b);
    });
}
function setSkinVariant(variant) {
    const skin = SKINS[p1SkinIndex];
    if (!skin || !skin.configurable) { closeSkinConfig(); return; }
    const defs = _skinDefs();
    const opt = defs ? defs.options.find(o => o.id === variant) : null;
    // Платный вариант — сначала покупка
    if (opt && opt.cost && !isVariantUnlocked(skin.id, variant)) {
        const wallet = opt.currency === 'gold' ? fishWallet.gold : opt.currency === 'blue' ? fishWallet.blue : fishWallet.orange;
        if (wallet < opt.cost) {
            const lb = document.getElementById('skin-var-' + variant);
            if (lb) { lb.style.borderColor = '#e74c3c'; setTimeout(() => { lb.style.borderColor = ''; }, 600); }
            if (typeof _showAccountToast === 'function') _showAccountToast(t('skinCfg.needGold'), '#e74c3c');
            return;
        }
        if (opt.currency === 'gold') fishWallet.gold -= opt.cost;
        else if (opt.currency === 'blue') fishWallet.blue -= opt.cost;
        else fishWallet.orange -= opt.cost;
        unlockedSkinVariants.push(skin.id + ':' + variant);
        try { SafeStorage.set('pixelCatsUnlockedVariants', JSON.stringify(unlockedSkinVariants)); } catch (e) {}
        if (typeof updateFishUI === 'function') updateFishUI();
        if (AudioEngine.sfx && AudioEngine.sfx.unlock) AudioEngine.sfx.unlock();
        _buildSkinConfigOptions();
    }
    mySkinVariants[skin.id] = variant;
    saveGameData(); // localStorage + облако (через патч AccountSystem)
    if (net.isOnline && net.conn && net.conn.open) {
        try { net.conn.send({ type: 'SKIN', skin: p1SkinIndex, variant: variant }); } catch (e) {}
    }
    _syncSkinConfigUI();
    if (AudioEngine.sfx && AudioEngine.sfx.click) AudioEngine.sfx.click();
}
function _syncSkinConfigUI() {
    const skin = SKINS[p1SkinIndex];
    const defs = _skinDefs();
    if (!skin) return;
    const cur = mySkinVariants[skin.id] || (defs ? defs.def : 'auto');
    if (defs) defs.options.forEach(opt => {
        const b = document.getElementById('skin-var-' + opt.id);
        if (b) {
            b.classList.toggle('active', cur === opt.id);
            const locked = opt.cost && !isVariantUnlocked(skin.id, opt.id);
            b.style.opacity = locked ? '0.85' : '1';
        }
    });
}
function setSfxVol(val) {
    AudioEngine.setSfxVol(val);
    document.getElementById('sfx-vol-val').innerText = val + '%';
}

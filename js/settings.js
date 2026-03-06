// ============================================================
// SETTINGS & SHOP — Settings screen, skin shop, volume controls
// ============================================================

function openSettings() {
    AudioEngine.boot();
    startScreen.style.display = 'none';
    document.getElementById('settings-screen').style.display = 'block';
    _syncSettingsUI();
    _showMobileControls(); // show controls preview for layout editor
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
function setSfxVol(val) {
    AudioEngine.setSfxVol(val);
    document.getElementById('sfx-vol-val').innerText = val + '%';
}

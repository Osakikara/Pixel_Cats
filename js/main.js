// ============================================================
// MAIN — App initialization, boot audio, apply layout
// ============================================================


ctx.fillStyle = "#202028";
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#aaa';
ctx.font = '14px "Press Start 2P", monospace';
ctx.textAlign = 'center';
ctx.fillText('Загрузка...', canvas.width/2, canvas.height/2);

(async () => {
    // ── 1. СРАЗУ задаём язык через window, чтобы не было TDZ-ошибки ──────────
    window.currentLang = window.currentLang || SafeStorage.get('pixelCatsLang') || 'ru';

    // ── 2. СРАЗУ инициализируем UI — кнопки живут с первой миллисекунды ───────
    try {
        resizeCanvas();
        ctx.fillStyle = '#202028';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const langBtn = document.getElementById('btn-lang');
        if (langBtn) langBtn.innerText = window.currentLang.toUpperCase();

        updateAllTexts();
        updatePlayerModeUI();
        showMenu();
    } catch (e) {
        console.error('[Main] Ошибка инициализации UI:', e);
    }

    // ── 3. Ждём SDK (макс. 3 сек) ДО решения о языке/туториале ─────────────
    // Это гарантирует, что язык Яндекса будет применён ПЕРЕД показом туториала
    try {
        await Promise.race([
            YandexSDK.init(),
            new Promise(res => setTimeout(res, 3000)),
        ]);
    } catch (e) {
        console.warn('[Main] SDK timeout or fail:', e);
    }

    // Восстановить сохранённое расположение мобильных кнопок
    try { applyLayout(loadLayout()); } catch (e) {}

    // Обновить кошелёк в UI
    try { updateFishUI(); } catch (e) {}

    // Пиксельные иконки в UI
    const _bossTabIcon = document.getElementById('icon-tab-boss');
    if (_bossTabIcon) _bossTabIcon.src = IconGenerator.getIcon('swords');

    // ── Инициализация ВСЕХ иконок в HTML ──────────────────────────────────────
    function initAllPixelIcons() {
        const G = IconGenerator;
        const set = (id, name, size) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.src = G.getIcon(name);
            const s = (size || 16) + 'px';
            el.style.cssText += `;width:${s};height:${s};max-width:${s};max-height:${s};`;
        };
        ['ico-fish-orange','ico-menu-fish-o','ico-shop-fish-o'].forEach(id => set(id,'fish_orange',16));
        ['ico-fish-blue',  'ico-menu-fish-b','ico-shop-fish-b'].forEach(id => set(id,'fish_blue',16));
        ['ico-fish-gold',  'ico-menu-fish-g','ico-shop-fish-g'].forEach(id => set(id,'fish_gold',16));
        set('ico-srv-globe','globe',14); set('ico-srv-bolt','lightning',13); set('ico-cross-1','cross',12);
        set('ico-srv-dot','dot_green',10); set('ico-gear-srv','gear',11);
        set('ico-rotate-big','rotate',36);
        set('ico-person','person',13); set('ico-person-profile','person',14);
        set('ico-trophy','trophy',14); set('ico-trophy-board','trophy',16);
        set('ico-phone','phone',14);
        set('ico-gear','gear',14); set('ico-gear-title','gear',16);
        set('ico-cart','cart',14); set('ico-cart-shop-title','cart',18);
        set('ico-online-title','globe',14);
        set('ico-antenna','antenna',12); set('ico-fire-fb','fire',12); set('ico-fire-hint','fire',12); set('ico-fire-create','fire',12);
        set('ico-warn','warning',14);
        set('ico-cross-leave','cross',12);
        set('ico-link-join','link',12); set('ico-link-fbjoin','link',12);
        set('ico-gamepad-joined','gamepad',14); set('ico-check-p2p','check',14);
        set('ico-runner','runner',12);
        ['ico-dot-easy1','ico-dot-easy2'].forEach(id => set(id,'dot_green',10));
        ['ico-dot-hard1','ico-dot-hard2'].forEach(id => set(id,'dot_red',10));
        ['ico-skull-mega1','ico-skull-mega2'].forEach(id => set(id,'skull',10));
        ['ico-inf1','ico-inf2'].forEach(id => set(id,'infinity',10));
        ['ico-play-start','ico-play-p2p','ico-play-boss','ico-play-resume','ico-play-login'].forEach(id => set(id,'play',12));
        set('ico-hg','hourglass',14); set('ico-timer-hpbar','timer',10);
        set('ico-return-1','back_curved',12);
        set('ico-music','music',14); set('ico-speaker','speaker',14);
        set('ico-globe-lang','globe',14); set('ico-joy-ctrl','joystick',14); set('ico-joy-btn','joystick',11);
        set('ico-pencil-ctrl','pencil',12); set('ico-pencil-editor','pencil',13);
        ['ico-check-p1','ico-check-p2','ico-check-save','ico-check-register','ico-check-savename'].forEach(id => set(id,'check',13));
        set('ico-rotate-reset','rotate',12);
        set('ico-cloud-sync','cloud',13); set('ico-door-logout','door',13);
        const _bossTabIco = document.getElementById('icon-tab-boss');
        if (_bossTabIco) { _bossTabIco.src = G.getIcon('swords'); _bossTabIco.style.cssText += ';width:14px;height:14px;max-width:14px;max-height:14px;'; }
    }
    if (document.readyState === 'complete') initAllPixelIcons();
    else window.addEventListener('load', initAllPixelIcons);

    // Boot audio on first interaction — also start menu music
    document.addEventListener('touchstart', () => { AudioEngine.boot(); AudioEngine.startMenuMusic(); }, { once: true, passive: true });
    document.addEventListener('mousedown',  () => { AudioEngine.boot(); AudioEngine.startMenuMusic(); }, { once: true });

    // Показать обучение при первом запуске — только в альбомной ориентации
    function tryStartTutorial() {
        if (TutorialSystem.shouldShow()) {
            if (window.innerWidth > window.innerHeight) {
                TutorialSystem.show();
            } else {
                const onOrientationChange = () => {
                    if (window.innerWidth > window.innerHeight) {
                        window.removeEventListener('resize', onOrientationChange);
                        TutorialSystem.show();
                    }
                };
                window.addEventListener('resize', onOrientationChange);
            }
        }
    }
    // ── Окно выбора языка при первом запуске ─────────────────────────────────
    function showLanguagePicker() {
        const isMobileDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 900);

        const ov = document.createElement('div');
        ov.id = 'lang-pick-ov';
        ov.style.cssText = [
            'position:fixed;inset:0;z-index:10100',
            'display:flex;align-items:center;justify-content:center',
            'background:rgba(0,0,0,.82)',
            'backdrop-filter:blur(3px)',
            'touch-action:manipulation',
        ].join(';');

        const box = document.createElement('div');
        box.style.cssText = [
            'position:relative',
            'background:rgba(5,8,28,0.92)',
            'border:4px solid #fff',
            'box-shadow:8px 8px 0 #000',
            'width:min(380px,92vw)',
            'padding:32px 28px 28px',
            'font-family:"Press Start 2P",cursive',
            'text-align:center',
            'box-sizing:border-box',
        ].join(';');


        const title = document.createElement('div');

        const subtitle = document.createElement('div');
        subtitle.style.cssText = 'color:#aab;font-size:clamp(14px,1.8vw,8px);margin-bottom:24px;line-height:1.8';
        subtitle.innerHTML = 'Choose your language<br><span style="color:#667;font-size:14px">Выберите язык</span>';

        function makeBtn(label, lang) {
            const btn = document.createElement('button');
            btn.textContent = label;
            btn.style.cssText = [
                'display:block;width:100%;margin-bottom:12px',
                'padding:14px 0',
                'background:rgba(255,255,255,0.07)',
                'border:3px solid #fff',
                'box-shadow:4px 4px 0 #000',
                'color:#fff',
                'font-family:"Press Start 2P",cursive',
                'font-size:clamp(9px,2.4vw,12px)',
                'cursor:pointer',
                'letter-spacing:2px',
                'transition:background .15s,transform .1s',
            ].join(';');
            btn.onmouseover = () => { btn.style.background = 'rgba(255,215,0,0.18)'; btn.style.color = '#ffd700'; btn.style.borderColor = '#ffd700'; };
            btn.onmouseout  = () => { btn.style.background = 'rgba(255,255,255,0.07)'; btn.style.color = '#fff'; btn.style.borderColor = '#fff'; };
            btn.addEventListener('click', () => {
                window.currentLang = lang;
                SafeStorage.set('pixelCatsLang', lang);
                document.getElementById('btn-lang').innerText = lang.toUpperCase();
                updateAllTexts();
                ov.remove();
                tryStartTutorial();
            });
            return btn;
        }

        const btnRu = makeBtn('🇷🇺  РУССКИЙ', 'ru');
        const btnEn = makeBtn('🇬🇧  ENGLISH', 'en');

        box.appendChild(title);
        box.appendChild(subtitle);
        box.appendChild(btnRu);
        box.appendChild(btnEn);

        // Кнопка полноэкранного режима — только на мобильных
        if (isMobileDevice) {
            const fsBtn = document.createElement('button');
            fsBtn.style.cssText = [
                'display:block;width:100%;margin-top:8px',
                'padding:10px 0',
                'background:rgba(255,200,0,0.13)',
                'border:2px solid #ffd700',
                'box-shadow:3px 3px 0 #000',
                'color:#ffd700',
                'font-family:"Press Start 2P",cursive',
                'font-size:clamp(6px,1.8vw,8px)',
                'cursor:pointer',
                'letter-spacing:1px',
            ].join(';');
            fsBtn.textContent = '⛶  FULLSCREEN / ПОЛНОЭКРАНЫЙ';
            fsBtn.onmouseover = () => { fsBtn.style.background = 'rgba(255,215,0,0.28)'; };
            fsBtn.onmouseout  = () => { fsBtn.style.background = 'rgba(255,200,0,0.13)'; };
            fsBtn.addEventListener('click', () => {
                if (typeof toggleFullscreen === 'function') toggleFullscreen();
                else {
                    const el = document.documentElement;
                    const req = el.requestFullscreen || el.webkitRequestFullscreen;
                    if (req) req.call(el).catch(() => {});
                }
            });
            box.appendChild(fsBtn);
        }

        ov.appendChild(box);
        document.body.appendChild(ov);
    }
    

    // ── Применяем язык от Яндекса (если SDK его вернул и язык ещё не сохранён)
    try {
        const yLang = YandexSDK.getLang ? YandexSDK.getLang() : null;
        if (yLang && !SafeStorage.get('pixelCatsLang')) {
            window.currentLang = (yLang === 'ru' || yLang === 'en') ? yLang : 'en';
            SafeStorage.set('pixelCatsLang', window.currentLang);
            const langBtn = document.getElementById('btn-lang');
            if (langBtn) langBtn.innerText = window.currentLang.toUpperCase();
            updateAllTexts();
        }
    } catch (e) {}

    // Показываем выбор языка только если он ещё не определён (ни Яндексом, ни сохранённым)
    if (!SafeStorage.get('pixelCatsLang')) {
        showLanguagePicker();
    } else {
        tryStartTutorial();
    }

    // ── Инициализация аккаунтов — в фоне через 500мс, не блокирует UI ──────────
    setTimeout(() => {
        try {
            if (typeof AccountSystem !== 'undefined') AccountSystem.init();
        } catch (e) {
            console.warn('[Main] AccountSystem заблокирован (Firebase/CSP):', e);
        }
    }, 500);
})();
// ============================================================
// MAIN — App initialization, boot audio, apply layout
// ============================================================

// Инициализация приложения — запускается после загрузки всех модулей
resizeCanvas();
ctx.fillStyle = "#202028";
ctx.fillRect(0, 0, canvas.width, canvas.height);

document.getElementById('btn-lang').innerText = currentLang.toUpperCase();
updateAllTexts();
updatePlayerModeUI();
showMenu();

// Восстановить сохранённое расположение мобильных кнопок
applyLayout(loadLayout());

// Обновить кошелёк в UI (функция из networking.js — теперь точно загружена)
updateFishUI();
AccountSystem.init();

// Пиксельные иконки в UI
const _bossTabIcon = document.getElementById('icon-tab-boss');
if (_bossTabIcon) _bossTabIcon.src = IconGenerator.getIcon('swords');

// ── Инициализация ВСЕХ иконок в HTML ────────────────────────────
function initAllPixelIcons() {
    const G = IconGenerator;
    // Устанавливает src + фиксированный размер в пикселях
    const set = (id, name, size) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.src = G.getIcon(name);
        const s = (size || 16) + 'px';
        el.style.cssText += `;width:${s};height:${s};max-width:${s};max-height:${s};`;
    };
    // Рыбки — HUD (16px)
    ['ico-fish-orange','ico-menu-fish-o','ico-shop-fish-o'].forEach(id => set(id,'fish_orange',16));
    ['ico-fish-blue',  'ico-menu-fish-b','ico-shop-fish-b'].forEach(id => set(id,'fish_blue',16));
    ['ico-fish-gold',  'ico-menu-fish-g','ico-shop-fish-g'].forEach(id => set(id,'fish_gold',16));
    // Сервер
    set('ico-srv-globe','globe',14); set('ico-srv-bolt','lightning',13); set('ico-cross-1','cross',12);
    set('ico-srv-dot','dot_green',10); set('ico-gear-srv','gear',11);
    // Поворот
    set('ico-rotate-big','rotate',36);
    // Профиль / аккаунт
    set('ico-person','person',13); set('ico-person-profile','person',14);
    // Кубок / рекорды
    set('ico-trophy','trophy',14); set('ico-trophy-board','trophy',16);
    // Телефон
    set('ico-phone','phone',14);
    // Шестерёнка (настройки)
    set('ico-gear','gear',14); set('ico-gear-title','gear',16);
    // Корзина (магазин)
    set('ico-cart','cart',14); set('ico-cart-shop-title','cart',18);
    // Онлайн / лобби
    set('ico-online-title','globe',14);
    // P2P / Firebase
    set('ico-antenna','antenna',12); set('ico-fire-fb','fire',12); set('ico-fire-hint','fire',12); set('ico-fire-create','fire',12);
    // Предупреждение
    set('ico-warn','warning',14);
    // Крест / закрыть
    set('ico-cross-leave','cross',12);
    // Ссылки
    set('ico-link-join','link',12); set('ico-link-fbjoin','link',12);
    // Геймпад / игрок
    set('ico-gamepad-joined','gamepad',14); set('ico-check-p2p','check',14);
    // Бегун (режим гонки)
    set('ico-runner','runner',12);
    // Сложности
    ['ico-dot-easy1','ico-dot-easy2'].forEach(id => set(id,'dot_green',10));
    ['ico-dot-hard1','ico-dot-hard2'].forEach(id => set(id,'dot_red',10));
    ['ico-skull-mega1','ico-skull-mega2'].forEach(id => set(id,'skull',10));
    ['ico-inf1','ico-inf2'].forEach(id => set(id,'infinity',10));
    // Старт/воспроизведение
    ['ico-play-start','ico-play-p2p','ico-play-boss','ico-play-resume','ico-play-login'].forEach(id => set(id,'play',12));
    // Часы
    set('ico-hg','hourglass',14); set('ico-timer-hpbar','timer',10);
    // Возврат в лобби
    set('ico-return-1','back_curved',12);
    // Музыка / звук
    set('ico-music','music',14); set('ico-speaker','speaker',14);
    // Язык / джойстик
    set('ico-globe-lang','globe',14); set('ico-joy-ctrl','joystick',14); set('ico-joy-btn','joystick',11);
    // Карандаш
    set('ico-pencil-ctrl','pencil',12); set('ico-pencil-editor','pencil',13);
    // Магазин — чекмарки
    ['ico-check-p1','ico-check-p2','ico-check-save','ico-check-register','ico-check-savename'].forEach(id => set(id,'check',13));
    // Редактор управления
    set('ico-rotate-reset','rotate',12);
    // Облако / выход
    set('ico-cloud-sync','cloud',13); set('ico-door-logout','door',13);
    // Мечи (вкладка боссов)
    const _bossTabIco = document.getElementById('icon-tab-boss');
    if (_bossTabIco) { _bossTabIco.src = G.getIcon('swords'); _bossTabIco.style.cssText += ';width:14px;height:14px;max-width:14px;max-height:14px;'; }
}
// Запускаем иконки после загрузки DOM
if (document.readyState === 'complete') initAllPixelIcons();
else window.addEventListener('load', initAllPixelIcons);

// Boot audio on first interaction — also start menu music
document.addEventListener('touchstart', () => { AudioEngine.boot(); AudioEngine.startMenuMusic(); }, { once: true, passive: true });
document.addEventListener('mousedown', () => { AudioEngine.boot(); AudioEngine.startMenuMusic(); }, { once: true });
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
tryStartTutorial();

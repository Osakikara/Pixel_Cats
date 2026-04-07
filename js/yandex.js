// ============================================================
// YANDEX GAMES SDK — Интеграция Яндекс.Игр
// Документация: https://yandex.ru/dev/games/doc/ru/sdk/sdk-adv
// ============================================================

const YandexSDK = (() => {
    let _ysdk = null;
    let _ready = false;
    let _lastFullscreenTime = 0;

    // Минимальный интервал между межстраничными объявлениями (60 сек)
    const FULLSCREEN_COOLDOWN_MS = 60_000;

    // Промис, который резолвится когда SDK готов (или если SDK недоступен)
    let _resolveReady;
    const _readyPromise = new Promise(res => { _resolveReady = res; });

    // ─── Инициализация ────────────────────────────────────────────────────────
    async function init() {
        if (typeof YaGames === 'undefined') {
            console.warn('[YandexSDK] YaGames не найден — локальная разработка, SDK отключён');
            _resolveReady();
            return;
        }
        try {
            _ysdk = await YaGames.init();
            _ready = true;
            console.log('[YandexSDK] SDK успешно инициализирован ✓');
        } catch (e) {
            console.warn('[YandexSDK] Ошибка инициализации SDK:', e);
        }
        _resolveReady();
    }

    // Ждать готовности SDK перед стартом игры
    function waitReady() {
        return _readyPromise;
    }

    // ─── Утилиты аудио ────────────────────────────────────────────────────────
    function _muteGame() {
        try {
            if (typeof AudioEngine !== 'undefined') {
                AudioEngine.stopAllMusic();
            }
        } catch (e) {}
    }

    // ─── Межстраничная реклама ────────────────────────────────────────────────
    // Показывается между игровыми сессиями (конец игры, победа над боссом)
    // onClose(wasShown) — вызывается после закрытия рекламы
    function showFullscreenAd(onClose) {
        if (!_ysdk) {
            if (onClose) onClose(false);
            return;
        }

        const now = Date.now();
        if (now - _lastFullscreenTime < FULLSCREEN_COOLDOWN_MS) {
            console.log('[YandexSDK] Межстраничная реклама на кулдауне, пропускаем');
            if (onClose) onClose(false);
            return;
        }
        _lastFullscreenTime = now;

        _ysdk.adv.showFullscreenAdv({
            callbacks: {
                onOpen:    ()          => { _muteGame(); },
                onClose:   (wasShown)  => { if (onClose) onClose(wasShown); },
                onError:   (err)       => { console.warn('[YandexSDK] Ошибка межстраничной рекламы:', err); if (onClose) onClose(false); },
                onOffline: ()          => { console.warn('[YandexSDK] Нет интернета — реклама недоступна'); if (onClose) onClose(false); },
            }
        });
    }

    // ─── Вознаграждаемая реклама ──────────────────────────────────────────────
    // Игрок добровольно смотрит рекламу в обмен на награду
    // onRewarded()        — игрок досмотрел до конца → выдать награду
    // onClose(wasShown)   — реклама закрыта (досмотрена или нет)
    function showRewardedAd(onRewarded, onClose) {
        if (!_ysdk) {
            console.warn('[YandexSDK] SDK не готов для вознаграждаемой рекламы');
            if (onClose) onClose(false);
            return;
        }

        _ysdk.adv.showRewardedVideo({
            callbacks: {
                onOpen:     ()          => { _muteGame(); },
                onRewarded: ()          => { if (onRewarded) onRewarded(); },
                onClose:    (wasShown)  => { if (onClose) onClose(wasShown); },
                onError:    (err)       => { console.warn('[YandexSDK] Ошибка вознаграждаемой рекламы:', err); if (onClose) onClose(false); },
            }
        });
    }

    return {
        init,
        waitReady,
        showFullscreenAd,
        showRewardedAd,
        get ready() { return _ready; },
    };
})();

// ─── Вознаграждаемая реклама: возрождение после поражения от босса ────────────
function reviveWithAd() {
    const btn = document.getElementById('btn-boss-revive');
    if (btn) btn.style.display = 'none';

    YandexSDK.showRewardedAd(
        // Досмотрел — рестартуем бой
        () => {
            document.getElementById('boss-lose-screen').style.display = 'none';
            restartBossBattle();
        },
        // Закрыл не досмотрев — вернуть кнопку
        (wasShown) => {
            if (!wasShown && btn) btn.style.display = 'block';
        }
    );
}

// ─── Вознаграждаемая реклама: рыбки за просмотр (экран проигрыша) ────────────
function getFishFromAd() {
    const btn   = document.getElementById('btn-game-ad-fish');
    const msgEl = document.getElementById('game-ad-reward-msg');
    if (btn) btn.style.display = 'none';

    YandexSDK.showRewardedAd(
        // Досмотрел — даём рыбки
        () => {
            fishWallet.orange += 5;
            fishWallet.blue   += 3;
            fishWallet.gold   += 1;
            saveGameData();
            if (typeof updateFishUI === 'function') updateFishUI();
            if (msgEl) {
                msgEl.style.display = 'block';
                setTimeout(() => { msgEl.style.display = 'none'; }, 2500);
            }
        },
        // Закрыл не досмотрев — вернуть кнопку
        (wasShown) => {
            if (!wasShown && btn) btn.style.display = 'block';
        }
    );
}

// ============================================================
// LANGUAGE — Translation strings (RU/EN), t(), language toggle, UI text updates
// ============================================================

// --- LANGUAGE SYSTEM ---
const translations = {
    ru: {
        title: "PIXEL CATS", player1: "1 ИГРОК", player2: "2 ИГРОКА", mobileAuto: "МОБИЛЬНЫЙ: АВТО", mobileOn: "МОБИЛЬНЫЙ: ВКЛ",
        online: "ОНЛАЙН (бета)", fullscreen: "[ ] ПОЛНЫЙ ЭКРАН", player1Label: "ИГРОК 1", player2Label: "ИГРОК 2",
        easyMode: "ЛЁГКИЙ РЕЖИМ", hardMode: "СЛОЖНЫЙ РЕЖИМ", megaHardMode: "МЕГАСЛОЖНО", infinityMode: "БЕСКОНЕЧНОСТЬ",
        classicMode: "КЛАССИКА", minigamesMode: "МИНИ-ИГРЫ", classicHint: "Выберите режим",
        minigamesTitle: "МИНИ-ИГРЫ", minigamesDev: "Скоро новые мини-игры",
        chess: { title: "ШАХМАТЫ", local: "ЛОКАЛЬНО ВДВОЁМ", online: "ОНЛАЙН", lobbyInfo: "Классические шахматы. Хост играет белыми.", move: "Ход", white: "Белые", black: "Чёрные", check: "Шах!", mate: "Мат!", win: "победили", stalemate: "Пат — ничья", yourMove: "Ваш ход", oppMove: "Ход соперника", resign: "СДАТЬСЯ", rematch: "РЕВАНШ", exit: "← ВЫХОД", promoLabel: "Превратить в:", queen: "Ферзь", rook: "Ладья", bishop: "Слон", knight: "Конь" },
        locked: "🔒", buy: "КУПИТЬ", lockedBtn: "ЗАБЛОКИРОВАНО", needDist: "НУЖНО ДИСТ.", infScore: "БЕСК. СЧЁТ", needGhost: "ПРИЗРАКИ:",
        ghosthunt: {
            name: "ОХОТА НА ПРИЗРАКОВ", btn: "ОХОТА НА ПРИЗРАКОВ",
            hint: "Отбивайся от кото-призраков и набирай очки!",
            solo: "1 ИГРОК — ВЫЖИВАНИЕ", duo: "2 ИГРОКА — ДУЭЛЬ",
            soloDesc: "3 жизни. Продержись как можно дольше!",
            duoDesc: "120 секунд. Кто наберёт больше очков?",
            howtoTitle: "КАК ИГРАТЬ",
            howto: 'Побеждай кото-призраков — за каждого дают <span style="color:#ffd700;">очки</span>.<br>'
                + 'Каждые 30 секунд — <span style="color:#a88beb;">новая волна</span>: призраков больше, они быстрее.<br>'
                + '<span style="color:#7df9ff;">ВЫЖИВАНИЕ:</span> 3 жизни, касание призрака отнимает одну.<br>'
                + '<span style="color:#ffb86c;">ДУЭЛЬ:</span> 120 секунд, касание −10 очков. Кто набрал больше — победил!',
            controlsTitle: "УПРАВЛЕНИЕ",
            controlsInfo: 'P1: <span class="key-badge">A</span><span class="key-badge">D</span> движение · <span class="key-badge">W</span> прыжок · <span class="key-badge">S</span> спуск<br>'
                + '<span class="key-badge">F</span> атака · <span class="key-badge">G</span> сменить оружие<br>'
                + 'P2: <span class="key-badge">◄►▲▼</span> движение · <span class="key-badge">/</span> атака · <span class="key-badge">.</span> оружие<br>'
                + 'Мобильные: джойстик + кнопки атаки и смены оружия',
            layoutBtn: "РАСПОЛОЖЕНИЕ КНОПОК",
            layoutBtn2: "РАСПОЛОЖЕНИЕ (2 ИГРОКА)",
            weaponsTitle: "ОРУЖИЯ",
            weapons: { claw: "ЛАПА", yarn: "ПОПРЫГУНЧИК", fish: "РЫБА-БУМЕРАНГ", laser: "ЛАЗЕР" },
            wd: { claw: "широкий удар вблизи", yarn: "рикошет, до 5 отскоков", fish: "бумеранг, бьёт насквозь", laser: "луч через всю арену" },
            controls1: "P1: F — АТАКА · G — ОРУЖИЕ · S — СПУСК",
            controls2: "P2: / — АТАКА · . — ОРУЖИЕ",
            score: "СЧЁТ:", wave: "ВОЛНА", record: "РЕКОРД:", streak: "СЕРИЯ",
            lifeLost: "-1 ЖИЗНЬ",
            overSolo: "ВЫЖИВАНИЕ ОКОНЧЕНО", overDuo: "РАУНД ОКОНЧЕН",
            winner: "ПОБЕДИЛ", drawRound: "НИЧЬЯ!", you: "ВЫ",
            newRecord: "НОВЫЙ РЕКОРД!", again: "ЕЩЁ РАЗ",
            skinUnlocked: "СКИН «ПРИЗРАК» ОТКРЫТ!",
            skinHint: "Скин «ПРИЗРАК» за 300 очков",
            skinReady: "Скин «ПРИЗРАК» открыт! Окрас меняется в меню скинов кнопкой «НАСТРОИТЬ».",
            ghostModeInfo: "Дуэль 120 секунд: кто наберёт больше очков!",
            waitHost: "Пожалуйста, ожидайте решения хоста",
            pickTitle: "ВЫБЕРИТЕ 2 ОРУЖИЯ В БОЙ", pickHint: "В бою доступны только выбранные 2",
        },
        skinCfg: {
            configure: "НАСТРОИТЬ", title: "НАСТРОЙКА СКИНА",
            hint: "Выберите окрас кота-призрака",
            hintFrog: "Выберите вид лягушки",
            auto: "АВТО (ПОД ФОН)", light: "СВЕТЛЫЙ", dark: "ТЁМНЫЙ", done: "ГОТОВО",
            frogNormal: "ОБЫЧНАЯ", frogBlue: "ГОЛУБАЯ ШАПОЧКА", frogDivine: "БОЖЕСТВЕННАЯ",
            gold: "ЗОЛОТЫХ", needGold: "Не хватает золотых рыбок",
        },
        onlineTitle: "ОНЛАЙН ЛОББИ", yourSkin: "ВАШ СКИН", initializing: "Инициализация P2P...", ready: "Готов к подключению.",
        connected: "ПОДКЛЮЧЕНО!", playerJoined: "ИГРОК ПОДКЛЮЧИЛСЯ! Ожидание данных...", yourId: "ВАШ ID (ОТПРАВЬТЕ ДРУГУ):",
        waitFriend: "Ждите подключения друга...", joinFriend: "ПРИСОЕДИНИТЬСЯ К ДРУГУ:", pasteId: "ВСТАВЬТЕ ID СЮДА",
        joinGame: "ПРИСОЕДИНИТЬСЯ", back: "НАЗАД", idCopied: "ID скопирован!", enterId: "Введите ID", connectionLost: "Соединение потеряно",
        score: "СЧЁТ:", infinityScore: "БЕСК. СЧЁТ:", best: "РЕКОРД:", menu: "Меню", p1Controls: "ИГРОК 1:", p2Controls: "ИГРОК 2:",
        jump: "Прыжок", move: "Движение", arrows: "СТРЕЛКИ", gameOver: "ИГРА ОКОНЧЕНА", distance: "ДИСТАНЦИЯ:",
        tryAgainHint: "НАЖМИТЕ ENTER ИЛИ ПОПРОБУЙТЕ СНОВА", tryAgain: "ПОПРОБОВАТЬ СНОВА", menuBtn: "МЕНЮ",
        victory: "ПОБЕДА!", reachedCastle: "Вы достигли Замка!", highScoreSaved: "РЕКОРД СОХРАНЁН!",
        nextLevel: "СЛЕДУЮЩИЙ УРОВЕНЬ", hardUnlocked: "СЛОЖНЫЙ РЕЖИМ ОТКРЫТ!", megaUnlocked: "МЕГАСЛОЖНО ОТКРЫТО!",
        infinityUnlocked: "БЕСКОНЕЧНОСТЬ ОТКРЫТА!", secretUnlocked: "СЕКРЕТНЫЙ СКИН САМУРАЯ ОТКРЫТ!",
        skins: { white: "БЕЛЫЙ", orange: "РЫЖИЙ", black: "ЧЁРНЫЙ", calico: "ТРЁХЦВЕТНЫЙ", pink: "РОЗОВЫЙ", witch: "ВЕДЬМА",
            cyber: "КИБЕР", froggy: "ЛЯГУШКА", sims: "СИМС", newyear: "НОВОГОДНИЙ", angel: "АНГЕЛ", samurai: "САМУРАЙ ★", foxcoat: "ЭДВАРД", ghost: "ПРИЗРАК" },
        npcMessage: "Ваша цель: дойти до замка!", npcMessageInfinity: "Ваша цель: ... у самурая нет цели, только путь.", rotate: "ПОВЕРНИТЕ УСТРОЙСТВО", landscapeRequired: "Требуется альбомная ориентация",
        notEnough: "НЕДОСТАТОЧНО", fish: "РЫБЫ!",
        bossBattle: "БИТВА С БОССОМ", bossSelectHint: "Выберите босса для битвы", bossBack: "НАЗАД",
        bossWin: "ПОБЕДА НАД БОССОМ!", bossLose: "ПОРАЖЕНИЕ", bossDefeated: "Вы победили босса!",
        bossLost: "Босс вас победил!", bossContinue: "ПРОДОЛЖИТЬ", bossRetry: "ПОПРОБОВАТЬ СНОВА",
        bossSelectOther: "ВЫБРАТЬ ДРУГОГО БОССА", bossUnlocked: "Новый босс открыт!",
        dodgeHint: "УКЛОНЯЙСЯ ОТ АТАК!", bosses: {
            fireGolem: { name: "ОГНЕННЫЙ ГОЛЕМ", desc: "Медленные, но мощные огненные шары" },
            iceDragon: { name: "ЛЕДЯНОЙ ДРАКОН", desc: "Быстрые ледяные снаряды", locked: "Победите Огненного Голема" },
            alchemist: { name: "АЛХИМИК", desc: "Кислотные бомбы, расщепляющиеся снаряды и лазер", locked: "Победите Ледяного Дракона" },
            shadowLord: { name: "ТЕНЕВОЙ ЛОРД", desc: "Неуловимые теневые атаки", locked: "Победите Алхимика" }
        },
        tut: {
            skip: 'Пропустить',
            next: 'Далее',
            play: 'Играть!',
            welcome: {
                title: 'Привет!',
                desc:  'Игра про котов: бегай, прыгай, собирай рыбок.<br>Сейчас покажем основы.'
            },
            movement: {
                title: 'Движение',
                desc:  '<kbd>A</kbd><kbd>D</kbd> или <kbd>←</kbd><kbd>→</kbd> — идти.<br>'
                    + '<kbd>W</kbd> или <kbd>Пробел</kbd> — прыжок.<br>'
                    + 'На телефоне — джойстик слева.'
            },
            collect: {
                title: 'Рыбки',
                desc:  'Касайся рыбок, чтобы собрать. До высоких — прыгай.<br>'
                    + '<span class="or">Оранжевые</span> · <span class="bl">Синие</span> · <span class="hl">Золотые</span><br>'
                    + 'Рыбки — валюта для скинов.'
            },
            modes: {
                title: 'Режимы',
                desc:  'Классика: <span class="gr">Easy</span> → <span class="hl">Hard</span> → <span class="or">Mega</span> → <span class="hl">∞</span>.<br>'
                    + 'Ещё: Битва с боссом и Охота на призраков.'
            },
            controls: {
                title: 'Кнопки под себя',
                desc:  '<span class="hl">Настройки → Расположение кнопок</span>.<br>'
                    + 'Двигай кнопки и меняй размер (− / +).<br>'
                    + 'Особенно удобно на телефоне.'
            },
            shop: {
                title: 'Магазин',
                desc:  'Трать рыбок на скины.<br>'
                    + 'Часть открывается за <span class="hl">рекорды</span>, часть — за рыбок.'
            },
            online: {
                title: 'Онлайн (бета)',
                desc:  'Кнопка <span class="bl">ОНЛАЙН</span> в меню.<br>'
                    + 'Создай комнату и дай код другу.'
            },
            ready: {
                title: 'Готово!',
                desc:  'Это всё нужное.<br><span class="gr">Удачи!</span>'
            },
        },
        settings: "⚙ НАСТРОЙКИ", settingsBack: "← НАЗАД",
        musicLabel: "🎵 МУЗЫКА", sfxLabel: "🔊 ЗВУКИ",
        themeLabel: "🌙 ТЕМА МЕНЮ", themeRow: "Оформление:", themeClassic: "КЛАССИКА", themeMoon: "ЛУНА",
        onOff: "Вкл/Выкл:", volume: "Громкость:", trackSelect: "ВЫБОР ТРЕКА:",
        track0: "🏰 ПУТЬ МЕНЕСТРЕЛЯ", track1: "🌙 ДВОР ЗАМКА", track2: "🍂 У ОЧАГА ТАВЕРНЫ",
        fbPlayerJoined: "🎮 ИГРОК ПОДКЛЮЧИЛСЯ!", fbOpponent: "ИГРОК:",
        fbSelectMode: "ВЫБЕРИТЕ РЕЖИМ:", fbRace: "🏃 ГОНКА", fbBoss: "⚔️ БОССЫ",
        fbDifficulty: "СЛОЖНОСТЬ:", fbStart: "▶ СТАРТ",
        fbEasy: "🟢 EASY", fbHard: "🔴 HARD", fbMega: "💀 MEGA", fbInf: "♾ INF",
        fbSelectBoss: "ВЫБРАТЬ БОССА ⚔️",
        fbCreateRoom: "🔥 СОЗДАТЬ КОМНАТУ", fbJoinRoom: "🔗 ПРИСОЕДИНИТЬСЯ",
        fbRoomCode: "ВАШ КОД КОМНАТЫ (ОТПРАВЬТЕ ДРУГУ):",
        fbEnterCode: "КОД КОМНАТЫ", fbJoinFriend: "ВОЙТИ В КОМНАТУ ДРУГА:",
        fbServer: "🌐 ВЫБОР СЕРВЕРА", fbAutoSelect: "⚡ АВТО-ВЫБОР",
        fbSrv1: "🟢 СЕРВЕР 1", fbSrv2: "🔵 СЕРВЕР 2",
        // — Сервер-модал —
        serverTitle: "🌐 ВЫБОР СЕРВЕРА", serverClose: "✖ ЗАКРЫТЬ", serverBtn: "⚙ СЕРВЕР",
        // — Лобби / статусы —
        leaveRoom: "✖ ВЫЙТИ",
        p2pUnavailable: "⚠ P2P недоступен.<br>Попробуйте <span style=\"color:#e67e22;\">🔥 FIREBASE</span>",
        loading: "Загрузка...", copyCodeHint: "нажмите на код чтобы скопировать",
        copyCodeTitle: "Нажмите чтобы скопировать",
        p2pPlayerJoined: "✅ ИГРОК ПОДКЛЮЧИЛСЯ!", p2pDiffLabel: "СЛОЖНОСТЬ",
        p2pStart: "▶ СТАРТ", p2pBossLabel: "ВЫБЕРИТЕ БОССА", guestWait: "⏳ Ожидание хоста...",
        onlineLobbyBtn: "↩ ОНЛАЙН ЛОББИ",
        // — Босс —
        bossResume: "▶ ПРОДОЛЖИТЬ БОЙ", bossEnterHint: "НАЖМИТЕ ENTER ЧТОБЫ ПОПРОБОВАТЬ СНОВА",
        bossReviveAd: "СМОТРЕТЬ РЕКЛАМУ И ПРОДОЛЖИТЬ (необязательно)",
        replayTutorial: "ОБУЧЕНИЕ",
        adFishReward: "ПОСМОТРЕТЬ РЕКЛАМУ → +5🟠 +3🔵 +1🟡",
        ctrlJoyStyleLabel: "Стиль джойстика:", joyFixed: "📌 ФИКС.", joyFloat: "〰 ПЛАВАЮЩИЙ",
        // — Настройки —
        shopTitle: "🛒 МАГАЗИН СКИНОВ", shopEquipP1: "✅ П1 НАДЕТЬ", shopEquipP2: "✅ П2 НАДЕТЬ", shopBack: "← НАЗАД",
        shopSelected: "✓ ВЫБРАН", shopOwned: "✓ ЕСТЬ", shopDist: "ДИСТ. ",
        langSection: "🌐 ЯЗЫК / МОБИЛЬНЫЙ",
        ctrlSection: "🕹️ УПРАВЛЕНИЕ (МОБИЛЬНЫЙ)", ctrlTypeLabel: "Тип управления:",
        ctrlJoystick: "🕹️ ДЖОЙСТИК", ctrlDpad: "⬆ КНОПКИ",
        ctrlEdit: "✏️ РЕДАКТИРОВАТЬ РАСПОЛОЖЕНИЕ", ctrlDragHint: "Перетащите элементы управления",
        editorTitle: "✏️ РЕДАКТОР УПРАВЛЕНИЯ", editorHint: "Перетащи элементы куда удобно",
        editorReset: "↺ СБРОС", editorSave: "✓ СОХРАНИТЬ",
        edJoyP1: "ДЖОЙ P1", edJoyP1_2p: "ДЖОЙ P1 (2И)", edJoyP2_2p: "ДЖОЙ P2 (2И)", edAtkP1: "АТАКА P1", edWeapon: "ОРУЖИЕ P1", edAtkP2: "АТАКА P2", edWeapon2: "ОРУЖИЕ P2",
        // — Мобильный промпт —
        mobilePrompt: "Рекомендуется полноэкранный режим для удобства игры!",
        // — JS статусы P2P —
        statusInitializing: "⏳ Подключение к серверу...",
        statusAllDown: "⚠ Все серверы недоступны. Проверьте интернет или попробуйте позже.",
        statusTryBackup: "↻ Пробую резервный сервер",
        statusPeerJsFail: "⚠ Библиотека PeerJS не загружена. Проверьте интернет и обновите страницу.",
        statusPlayerConnected: "✅ Игрок подключился! Выберите режим и нажмите СТАРТ.",
        statusNotFound: "⚠ Игрок не найден. Проверьте ID.",
        statusConnErr: "⚠ Ошибка: ",
        statusReconnecting: "↻ Переподключение...",
        statusConnLostBoss: "⚠ Соединение разорвано. Вернитесь в лобби.",
        statusConnLostHint: "⚠ Соединение с партнёром разорвано",
        statusWaitInit: "⚠ Сначала дождитесь инициализации (ваш ID)",
        srvName1: "Сервер 1", srvName2: "Сервер 2",
        diffLabelPrefix: "РЕЖИМ: ",
        diffName: { easy: "ЛЁГКИЙ", hard: "СЛОЖНЫЙ", megahard: "МЕГА", infinity: "БЕСКОНЕЧНОСТЬ" },
        // Firebase статусы
        fbStatusSearching: "🔍 Поиск свободного сервера...",
        fbStatusReady: "✅ Готово. Создайте или войдите в комнату.",
        fbStatusSwitched: "🔄 Переключено на",
        fbStatusSrvReady: "✅ готов",
        fbStatusAllFull: "⚠️ Все серверы загружены",
        fbStatusOverloaded: "⚠️ Сервер переполнен! Переключение...",
        fbStatusUnavailable: "❌ Firebase недоступен: ",
        fbStatusCreating: "⏳ Создаём комнату...",
        fbStatusCreated: "✅ Комната создана! Отправьте код другу.",
        fbStatusPlayerConn: "✅ Игрок подключился! Выберите режим и нажмите СТАРТ.",
        fbStatusError: "❌ Ошибка Firebase: ",
        fbStatusEnterCode: "⚠ Введите код комнаты",
        fbStatusInvalidCode: "⚠ Неверный код комнаты",
        fbStatusSearchRoom: "🔍 Поиск комнаты",
        fbStatusRoomNotFound: "❌ Комната не найдена. Проверьте код.",
        fbStatusConnected: "🔗 Подключено! Ожидание хоста...",
        fbStatusPlayerLeft: "⚠ Игрок покинул комнату.",
        fbStatusPlayerLeftLobby: "⚠ Игрок покинул лобби. Создайте новую комнату.",
        fbStatusLeft: "⚠ Вы вышли из комнаты.",
        fbStatusConnLost: "⚠ Соединение разорвано. Создайте новую комнату или войдите снова.",
        fbStatusWaiting: "⏳ Ожидание хоста...",
        fbStatusPlayerConn2: "✅ Игрок подключён. Выберите режим и нажмите СТАРТ.",
        // Разное
        srvRooms: "комнат", srvUnavailable: "недоступен",
        srvCantSwitch: "Нельзя сменить сервер во время активного соединения!",
        codeCopied: "✅ скопировано!",
        relayOn: "🔴 РЕЛЕ: ВКЛ", relayOff: "⚪ РЕЛЕ: ВЫКЛ",
        btnReconnect: "↻ ПЕРЕПОДКЛЮЧИТЬСЯ",
        statusPlayerLeftRoom: "⚠ Игрок покинул комнату.",
        statusPlayerLeftCantStart: "⚠ Игрок покинул комнату. Начать невозможно.",
        statusRelayHint: "⚠ Не удалось подключиться. Попробуйте включить \"РЕЛЕ: ВКЛ\" и повторить.",
        bossBattleOnline: "⚔️ БИТВА С БОССОМ (ОНЛАЙН)",
        bossHostHint: "🌐 Партнёр присоединится автоматически",
        bossGuestHint: "⏳ Ожидание хоста... (хост выбирает босса)",
        bossGuestDesc: "Хост выберет этого босса",
        // — Аккаунты: авторизация —
        accLogin: "ВХОД", accRegister: "РЕГИСТРАЦИЯ",
        accLoginBtn: "ВОЙТИ", accRegisterBtn: "✅ СОЗДАТЬ",
        accLoggingIn: "⏳ Входим...", accCreating: "⏳ Создаём...",
        accBack: "← НАЗАД",
        accProfileTitle: "ПРОФИЛЬ",
        accSaveName: "✅ СОХРАНИТЬ ИМЯ", accSaveNameShort: "СОХРАНИТЬ ИМЯ", accSaving: "⏳ Сохранение...",
        accSaveCloud: "☁️ В ОБЛАКО", accSyncing: "⏳ Синхронизация...",
        accLogout: "🚪 ВЫЙТИ",
        accLoginBadge: "ВОЙТИ",
        accToastLogin: "✅ Вход выполнен! Прогресс загружен ☁️",
        accToastRegister: "✅ Аккаунт создан! Прогресс загружен ☁️",
        accToastSaved: "✅ Имя и прогресс сохранены ☁️",
        accToastCloud: "☁️ Прогресс сохранён в облаке!",
        accToastScore: "🏆 Рекорд сохранён!",
        accToastNeedLogin: "Войди в аккаунт!",
        accToastSyncErr: "Ошибка синхронизации",
        accNameShort: "Имя слишком короткое (мин. 2)",
        accNameLong: "Имя слишком длинное (макс. 16)",
        accErrEmailUsed: "Этот email уже занят",
        accErrInvalidEmail: "Некорректный email",
        accErrWeakPass: "Пароль слишком простой (мин. 6)",
        accErrNoUser: "Пользователь не найден",
        accErrWrongPass: "Неверный пароль",
        accErrInvalidCred: "Неверный email или пароль",
        accPassMin: "Пароль минимум 6 символов",
        // — Аккаунты: профиль / статы —
        accStatBest: "Лучший счёт", accStatInfinity: "Бесконечность",
        accStatFish: "Рыбки", accStatSkins: "Скины",
        accStatDiffs: "Сложности", accStatSync: "Синхронизация",
        accSyncAgoSec: "сек. назад", accSyncAgoMin: "мин. назад", accSyncAgoHour: "ч. назад",
        accDiffEasy: "Лёгкий", accDiffHard: "Сложный", accDiffMega: "Мега",
        // — Аккаунты: таблица рекордов —
        accBoardTitle: "ТАБЛИЦА РЕКОРДОВ",
        accBoardBtn: "РЕКОРДЫ",
        accBoardNormal: "ОБЫЧНЫЙ", accBoardInfinity: "БЕСКОНЕЧНЫЙ", accBoardBosses: "БОССЫ", accBoardGhost: "ПРИЗРАКИ",
        accBoardLoading: "Загрузка...", accBoardEmpty: "Пока нет рекордов",
        accBoardNoConn: "Нет соединения", accBoardErr: "Ошибка загрузки", noInternet: "Нет доступа к интернету",
        accBoardYou: "ты",
        accBoardColRank: "№", accBoardColName: "ИМЯ", accBoardColCat: "КОТ", accBoardColScore: "СЧЁТ", accBoardColBosses: "БОССЫ",
        // — Босс: уведомления во время боя —
        bossHintLeft: "→ СЛЕВА НАПРАВО", bossHintRight: "← СПРАВА НАЛЕВО",
        bossHintUp: "↑ СНИЗУ ВВЕРХ", bossHintDown: "↓ СВЕРХУ ВНИЗ",
        bossHintTalent: "💬 Ты талантлив, но это ещё не всё...",
        bossHintLastStage: "⚠️ ПОСЛЕДНЯЯ СТАДИЯ!",
        bossHintLaser: "ЛАЗЕР! УКЛОНЯЙСЯ!",
        bossHintLaserCross: "ЛАЗЕР КРЕСТ!",
        bossWaitHost: "⏳ Ожидание хоста для рестарта...",
        // — Статичный HTML модалей —
        accProfileTitle: "ПРОФИЛЬ",
        accNameLabel: "ИМЯ (2–16 символов)",
        accNamePlaceholder: "Введи имя...",
        accLoginPassPlaceholder: "Пароль",
        accRegNamePlaceholder: "Имя (ник)",
        accRegPassPlaceholder: "Пароль (мин. 6)",
        accBoardBack: "← НАЗАД",
        accAuthBack: "← НАЗАД",
        accSyncNever: "никогда"
    },
    en: {
        title: "PIXEL CATS", player1: "1 PLAYER", player2: "2 PLAYERS", mobileAuto: "MOBILE: AUTO", mobileOn: "MOBILE: ON",
        online: "ONLINE (beta)", fullscreen: "[ ] FULLSCREEN", player1Label: "PLAYER 1", player2Label: "PLAYER 2",
        easyMode: "EASY MODE", hardMode: "HARD MODE", megaHardMode: "MEGAHARD", infinityMode: "INFINITY",
        classicMode: "CLASSIC", minigamesMode: "MINIGAMES", classicHint: "Choose a mode",
        minigamesTitle: "MINIGAMES", minigamesDev: "More minigames soon",
        chess: { title: "CHESS", local: "LOCAL 2 PLAYERS", online: "ONLINE", lobbyInfo: "Classic chess. Host plays White.", move: "Move", white: "White", black: "Black", check: "Check!", mate: "Checkmate!", win: "win", stalemate: "Stalemate — draw", yourMove: "Your move", oppMove: "Opponent's move", resign: "RESIGN", rematch: "REMATCH", exit: "← EXIT", promoLabel: "Promote to:", queen: "Queen", rook: "Rook", bishop: "Bishop", knight: "Knight" },
        locked: "🔒", buy: "BUY", lockedBtn: "LOCKED", needDist: "NEED DIST", infScore: "INF SCORE", needGhost: "GHOSTS:",
        ghosthunt: {
            name: "GHOST HUNT", btn: "GHOST HUNT",
            hint: "Fight off the ghost cats and score points!",
            solo: "1 PLAYER — SURVIVAL", duo: "2 PLAYERS — DUEL",
            soloDesc: "3 lives. Survive as long as you can!",
            duoDesc: "120 seconds. Who scores more?",
            howtoTitle: "HOW TO PLAY",
            howto: 'Defeat ghost cats — each one gives <span style="color:#ffd700;">points</span>.<br>'
                + 'Every 30 seconds a <span style="color:#a88beb;">new wave</span>: more ghosts, faster ghosts.<br>'
                + '<span style="color:#7df9ff;">SURVIVAL:</span> 3 lives, a ghost touch costs one.<br>'
                + '<span style="color:#ffb86c;">DUEL:</span> 120 seconds, touch −10 points. Highest score wins!',
            controlsTitle: "CONTROLS",
            controlsInfo: 'P1: <span class="key-badge">A</span><span class="key-badge">D</span> move · <span class="key-badge">W</span> jump · <span class="key-badge">S</span> drop<br>'
                + '<span class="key-badge">F</span> attack · <span class="key-badge">G</span> switch weapon<br>'
                + 'P2: <span class="key-badge">◄►▲▼</span> move · <span class="key-badge">/</span> attack · <span class="key-badge">.</span> weapon<br>'
                + 'Mobile: joystick + attack and weapon-switch buttons',
            layoutBtn: "BUTTON LAYOUT",
            layoutBtn2: "LAYOUT (2 PLAYERS)",
            weaponsTitle: "WEAPONS",
            weapons: { claw: "CLAW", yarn: "BOUNCER", fish: "FISH BOOMERANG", laser: "LASER" },
            wd: { claw: "wide close swipe", yarn: "ricochet, up to 5 bounces", fish: "boomerang, pierces", laser: "beam across arena" },
            controls1: "P1: F — ATTACK · G — WEAPON · S — DROP",
            controls2: "P2: / — ATTACK · . — WEAPON",
            score: "SCORE:", wave: "WAVE", record: "BEST:", streak: "STREAK",
            lifeLost: "-1 LIFE",
            overSolo: "SURVIVAL OVER", overDuo: "ROUND OVER",
            winner: "WINNER:", drawRound: "DRAW!", you: "YOU",
            newRecord: "NEW RECORD!", again: "PLAY AGAIN",
            skinUnlocked: "GHOST SKIN UNLOCKED!",
            skinHint: "GHOST skin at 300 points",
            skinReady: "GHOST skin unlocked! Change its colour via CONFIGURE in the skin menu.",
            ghostModeInfo: "120-second duel: who scores more!",
            waitHost: "Please wait for the host's decision",
            pickTitle: "PICK 2 WEAPONS FOR BATTLE", pickHint: "Only the chosen 2 are usable in battle",
        },
        skinCfg: {
            configure: "CONFIGURE", title: "SKIN SETTINGS",
            hint: "Choose the ghost cat colouring",
            hintFrog: "Choose the frog style",
            auto: "AUTO (MATCH BG)", light: "LIGHT", dark: "DARK", done: "DONE",
            frogNormal: "NORMAL", frogBlue: "BLUE CAP", frogDivine: "DIVINE",
            gold: "GOLD", needGold: "Not enough gold fish",
        },
        onlineTitle: "ONLINE LOBBY", yourSkin: "YOUR SKIN", initializing: "Initializing P2P...", ready: "Ready to connect.",
        connected: "CONNECTED!", playerJoined: "PLAYER JOINED! Waiting for data...", yourId: "YOUR ID (SEND TO FRIEND):",
        waitFriend: "Wait for friend to join...", joinFriend: "JOIN FRIEND'S GAME:", pasteId: "PASTE ID HERE",
        joinGame: "JOIN GAME", back: "BACK", idCopied: "ID Copied!", enterId: "Enter ID", connectionLost: "Connection Lost",
        score: "SCORE:", infinityScore: "INFINITY SCORE:", best: "BEST:", menu: "Menu", p1Controls: "P1:", p2Controls: "P2:",
        jump: "Jump", move: "Move", arrows: "ARROWS", gameOver: "GAME OVER", distance: "DISTANCE:",
        tryAgainHint: "PRESS ENTER OR TRY AGAIN", tryAgain: "TRY AGAIN", menuBtn: "MENU",
        victory: "VICTORY!", reachedCastle: "You reached the Castle!", highScoreSaved: "HIGH SCORE SAVED!",
        nextLevel: "PLAY NEXT LEVEL", hardUnlocked: "HARD MODE UNLOCKED!", megaUnlocked: "MEGAHARD UNLOCKED!",
        infinityUnlocked: "INFINITY UNLOCKED!", secretUnlocked: "SECRET SAMURAI SKIN UNLOCKED!",
        skins: { white: "WHITE", orange: "ORANGE", black: "BLACK", calico: "CALICO", pink: "PINK", witch: "WITCH",
            cyber: "CYBER", froggy: "FROG", sims: "SIMS", newyear: "XMAS", angel: "ANGEL", samurai: "SAMURAI ★", foxcoat: "FULLMETAL", ghost: "GHOST" },
        npcMessage: "Your goal is to reach the castle!", npcMessageInfinity: "Your goal: ... a samurai has no goal, only the path.", rotate: "PLEASE ROTATE YOUR DEVICE", landscapeRequired: "Landscape mode required",
        notEnough: "NOT ENOUGH", fish: "FISH!",
        bossBattle: "BOSS BATTLE", bossSelectHint: "Select a boss to fight", bossBack: "BACK",
        bossWin: "BOSS DEFEATED!", bossLose: "DEFEAT", bossDefeated: "You defeated the boss!",
        bossLost: "The boss defeated you!", bossContinue: "CONTINUE", bossRetry: "TRY AGAIN",
        bossSelectOther: "SELECT ANOTHER BOSS", bossUnlocked: "New boss unlocked!",
        dodgeHint: "DODGE THE ATTACKS!", bosses: {
            fireGolem: { name: "FIRE GOLEM", desc: "Slow but powerful fireballs" },
            iceDragon: { name: "ICE DRAGON", desc: "Fast ice projectiles", locked: "Defeat Fire Golem" },
            alchemist: { name: "ALCHEMIST", desc: "Acid bombs, splitting projectiles & laser", locked: "Defeat Ice Dragon" },
            shadowLord: { name: "SHADOW LORD", desc: "Elusive shadow attacks", locked: "Defeat Alchemist" }
        },
        tut: {
            skip: 'Skip',
            next: 'Next',
            play: "Let's Play!",
            welcome: {
                title: 'Hi!',
                desc:  'A game about cats: run, jump, collect fish.<br>Here are the basics.'
            },
            movement: {
                title: 'Movement',
                desc:  '<kbd>A</kbd><kbd>D</kbd> or <kbd>←</kbd><kbd>→</kbd> — move.<br>'
                    + '<kbd>W</kbd> or <kbd>Space</kbd> — jump.<br>'
                    + 'On mobile — joystick on the left.'
            },
            collect: {
                title: 'Fish',
                desc:  'Touch fish to collect them. Jump to reach high ones.<br>'
                    + '<span class="or">Orange</span> · <span class="bl">Blue</span> · <span class="hl">Gold</span><br>'
                    + 'Fish are currency for skins.'
            },
            modes: {
                title: 'Modes',
                desc:  'Classic: <span class="gr">Easy</span> → <span class="hl">Hard</span> → <span class="or">Mega</span> → <span class="hl">∞</span>.<br>'
                    + 'Also: Boss Battle and Ghost Hunt.'
            },
            controls: {
                title: 'Custom controls',
                desc:  '<span class="hl">Settings → Controls Layout</span>.<br>'
                    + 'Drag buttons and resize (− / +).<br>'
                    + 'Especially handy on mobile.'
            },
            shop: {
                title: 'Shop',
                desc:  'Spend fish on skins.<br>'
                    + 'Some unlock via <span class="hl">records</span>, some are bought.'
            },
            online: {
                title: 'Online (beta)',
                desc:  'Press <span class="bl">ONLINE</span> in the menu.<br>'
                    + 'Create a room and share the code.'
            },
            ready: {
                title: 'Ready!',
                desc:  "That's all you need.<br><span class=\"gr\">Good luck!</span>"
            },
        },
        settings: "⚙ SETTINGS", settingsBack: "← BACK",
        musicLabel: "🎵 MUSIC", sfxLabel: "🔊 SOUND FX",
        themeLabel: "🌙 MENU THEME", themeRow: "Style:", themeClassic: "CLASSIC", themeMoon: "MOON",
        onOff: "On/Off:", volume: "Volume:", trackSelect: "SELECT TRACK:",
        track0: "🏰 MINSTREL'S PATH", track1: "🌙 CASTLE COURTYARD", track2: "🍂 TAVERN HEARTH",
        fbPlayerJoined: "🎮 PLAYER JOINED!", fbOpponent: "PLAYER:",
        fbSelectMode: "SELECT MODE:", fbRace: "🏃 RACE", fbBoss: "⚔️ BOSSES",
        fbDifficulty: "DIFFICULTY:", fbStart: "▶ START",
        fbEasy: "🟢 EASY", fbHard: "🔴 HARD", fbMega: "💀 MEGA", fbInf: "♾ INF",
        fbSelectBoss: "SELECT BOSS ⚔️",
        fbCreateRoom: "🔥 CREATE ROOM", fbJoinRoom: "🔗 JOIN ROOM",
        fbRoomCode: "YOUR ROOM CODE (SEND TO FRIEND):",
        fbEnterCode: "ROOM CODE", fbJoinFriend: "JOIN FRIEND'S ROOM:",
        fbServer: "🌐 SERVER SELECT", fbAutoSelect: "⚡ AUTO-SELECT",
        fbSrv1: "🟢 SERVER 1", fbSrv2: "🔵 SERVER 2",
        // — Server modal —
        serverTitle: "🌐 SERVER SELECT", serverClose: "✖ CLOSE", serverBtn: "⚙ SERVER",
        // — Lobby / statuses —
        leaveRoom: "✖ LEAVE",
        p2pUnavailable: "⚠ P2P unavailable.<br>Try <span style=\"color:#e67e22;\">🔥 FIREBASE</span>",
        loading: "Loading...", copyCodeHint: "click code to copy",
        copyCodeTitle: "Click to copy",
        p2pPlayerJoined: "✅ PLAYER JOINED!", p2pDiffLabel: "DIFFICULTY",
        p2pStart: "▶ START", p2pBossLabel: "SELECT BOSS", guestWait: "⏳ Waiting for host...",
        onlineLobbyBtn: "↩ ONLINE LOBBY",
        // — Boss —
        bossResume: "▶ RESUME BATTLE", bossEnterHint: "PRESS ENTER TO TRY AGAIN",
        bossReviveAd: "WATCH AD AND CONTINUE (optional)",
        replayTutorial: "TUTORIAL",
        adFishReward: "WATCH AD → +5🟠 +3🔵 +1🟡",
        ctrlJoyStyleLabel: "Joystick style:", joyFixed: "📌 FIXED", joyFloat: "〰 FLOATING",
        // — Shop & Settings —
        shopTitle: "🛒 SKIN SHOP", shopEquipP1: "✅ P1 EQUIP", shopEquipP2: "✅ P2 EQUIP", shopBack: "← BACK",
        shopSelected: "✓ SELECTED", shopOwned: "✓ OWNED", shopDist: "DIST. ",
        langSection: "🌐 LANGUAGE / MOBILE",
        ctrlSection: "🕹️ CONTROLS (MOBILE)", ctrlTypeLabel: "Control type:",
        ctrlJoystick: "🕹️ JOYSTICK", ctrlDpad: "⬆ D-PAD",
        ctrlEdit: "✏️ EDIT LAYOUT", ctrlDragHint: "Drag controls to reposition",
        editorTitle: "✏️ CONTROLS EDITOR", editorHint: "Drag elements where you like",
        editorReset: "↺ RESET", editorSave: "✓ SAVE",
        edJoyP1: "JOY P1", edJoyP1_2p: "JOY P1 (2P)", edJoyP2_2p: "JOY P2 (2P)", edAtkP1: "ATTACK P1", edWeapon: "WEAPON P1", edAtkP2: "ATTACK P2", edWeapon2: "WEAPON P2",
        // — Mobile prompt —
        mobilePrompt: "Fullscreen mode is recommended for the best experience!",
        // — JS P2P statuses —
        statusInitializing: "⏳ Connecting to server...",
        statusAllDown: "⚠ All servers unavailable. Check your internet or try later.",
        statusTryBackup: "↻ Trying backup server",
        statusPeerJsFail: "⚠ PeerJS library failed to load. Check your internet and reload.",
        statusPlayerConnected: "✅ Player connected! Select mode and press START.",
        statusNotFound: "⚠ Player not found. Check the ID.",
        statusConnErr: "⚠ Error: ",
        statusReconnecting: "↻ Reconnecting...",
        statusConnLostBoss: "⚠ Connection lost. Return to lobby.",
        statusConnLostHint: "⚠ Connection with partner lost",
        statusWaitInit: "⚠ Please wait for initialization (your ID)",
        srvName1: "Server 1", srvName2: "Server 2",
        diffLabelPrefix: "MODE: ",
        diffName: { easy: "EASY", hard: "HARD", megahard: "MEGA", infinity: "INFINITY" },
        // Firebase statuses
        fbStatusSearching: "🔍 Searching for available server...",
        fbStatusReady: "✅ Ready. Create or join a room.",
        fbStatusSwitched: "🔄 Switched to",
        fbStatusSrvReady: "✅ ready",
        fbStatusAllFull: "⚠️ All servers are busy",
        fbStatusOverloaded: "⚠️ Server overloaded! Switching...",
        fbStatusUnavailable: "❌ Firebase unavailable: ",
        fbStatusCreating: "⏳ Creating room...",
        fbStatusCreated: "✅ Room created! Send the code to your friend.",
        fbStatusPlayerConn: "✅ Player connected! Select mode and press START.",
        fbStatusError: "❌ Firebase error: ",
        fbStatusEnterCode: "⚠ Please enter a room code",
        fbStatusInvalidCode: "⚠ Invalid room code",
        fbStatusSearchRoom: "🔍 Searching for room",
        fbStatusRoomNotFound: "❌ Room not found. Check the code.",
        fbStatusConnected: "🔗 Connected! Waiting for host...",
        fbStatusPlayerLeft: "⚠ Player left the room.",
        fbStatusPlayerLeftLobby: "⚠ Player left the lobby. Create a new room.",
        fbStatusLeft: "⚠ You have left the room.",
        fbStatusConnLost: "⚠ Connection lost. Create a new room or rejoin.",
        fbStatusWaiting: "⏳ Waiting for host...",
        fbStatusPlayerConn2: "✅ Player connected. Select mode and press START.",
        // Misc
        srvRooms: "rooms", srvUnavailable: "unavailable",
        srvCantSwitch: "Cannot switch server during an active connection!",
        codeCopied: "✅ copied!",
        relayOn: "🔴 RELAY: ON", relayOff: "⚪ RELAY: OFF",
        btnReconnect: "↻ RECONNECT",
        statusPlayerLeftRoom: "⚠ Player left the room.",
        statusPlayerLeftCantStart: "⚠ Player left the room. Cannot start.",
        statusRelayHint: "⚠ Connection failed. Try enabling \"RELAY: ON\" and retry.",
        bossBattleOnline: "⚔️ BOSS BATTLE (ONLINE)",
        bossHostHint: "🌐 Partner will join automatically",
        bossGuestHint: "⏳ Waiting for host... (host selects boss)",
        bossGuestDesc: "Host will select this boss",
        // — Accounts: auth —
        accLogin: "LOGIN", accRegister: "REGISTER",
        accLoginBtn: "LOGIN", accRegisterBtn: "✅ CREATE",
        accLoggingIn: "⏳ Logging in...", accCreating: "⏳ Creating...",
        accBack: "← BACK",
        accProfileTitle: "PROFILE",
        accSaveName: "✅ SAVE NAME", accSaveNameShort: "SAVE NAME", accSaving: "⏳ Saving...",
        accSaveCloud: "☁️ SAVE TO CLOUD", accSyncing: "⏳ Syncing...",
        accLogout: "🚪 LOG OUT",
        accLoginBadge: "LOG IN",
        accToastLogin: "✅ Logged in! Progress loaded ☁️",
        accToastRegister: "✅ Account created! Progress loaded ☁️",
        accToastSaved: "✅ Name & progress saved ☁️",
        accToastCloud: "☁️ Progress saved to cloud!",
        accToastScore: "🏆 High score saved!",
        accToastNeedLogin: "Please log in first!",
        accToastSyncErr: "Sync error",
        accNameShort: "Name too short (min. 2)",
        accNameLong: "Name too long (max. 16)",
        accErrEmailUsed: "This email is already in use",
        accErrInvalidEmail: "Invalid email address",
        accErrWeakPass: "Password too weak (min. 6 chars)",
        accErrNoUser: "User not found",
        accErrWrongPass: "Wrong password",
        accErrInvalidCred: "Invalid email or password",
        accPassMin: "Password must be at least 6 characters",
        // — Accounts: profile / stats —
        accStatBest: "Best score", accStatInfinity: "Infinity",
        accStatFish: "Fish", accStatSkins: "Skins",
        accStatDiffs: "Difficulties", accStatSync: "Last sync",
        accSyncAgoSec: "sec. ago", accSyncAgoMin: "min. ago", accSyncAgoHour: "hr. ago",
        accDiffEasy: "Easy", accDiffHard: "Hard", accDiffMega: "Mega",
        // — Accounts: leaderboard —
        accBoardTitle: "LEADERBOARD",
        accBoardBtn: "RECORDS",
        accBoardNormal: "NORMAL", accBoardInfinity: "∞ INFINITY", accBoardBosses: "BOSSES", accBoardGhost: "GHOSTS",
        accBoardLoading: "Loading...", accBoardEmpty: "No records yet",
        accBoardNoConn: "No connection", accBoardErr: "Load error", noInternet: "No internet access",
        accBoardYou: "you",
        accBoardColRank: "№", accBoardColName: "NAME", accBoardColCat: "CAT", accBoardColScore: "SCORE", accBoardColBosses: "⚔️ BOSSES",
        // — Boss: in-battle notifications —
        bossHintLeft: "→ LEFT TO RIGHT", bossHintRight: "← RIGHT TO LEFT",
        bossHintUp: "↑ BOTTOM TO TOP", bossHintDown: "↓ TOP TO BOTTOM",
        bossHintTalent: "💬 You're talented, but there's more...",
        bossHintLastStage: "FINAL STAGE!",
        bossHintLaser: "LASER! DODGE!",
        bossHintLaserCross: "LASER CROSS!",
        bossWaitHost: "⏳ Waiting for host to restart...",
        // — Static modal HTML —
        accProfileTitle: "PROFILE",
        accNameLabel: "NAME (2–16 chars)",
        accNamePlaceholder: "Enter name...",
        accLoginPassPlaceholder: "Password",
        accRegNamePlaceholder: "Name (nickname)",
        accRegPassPlaceholder: "Password (min. 6)",
        accBoardBack: "← BACK",
        accAuthBack: "← BACK",
        accSyncNever: "never"
    }
};

// currentLang задаётся как свойство window — доступно без TDZ из любого скрипта
window.currentLang = window.currentLang || SafeStorage.get('pixelCatsLang') || 'ru';
let langClickCount = 0, lastLangClickTime = 0;
let samuraiUnlocked = SafeStorage.getBool('pixelCatsSamuraiUnlocked');

function t(key) {
    const keys = key.split('.');
    let value = translations[window.currentLang];
    for (const k of keys) { if (value && value[k] !== undefined) value = value[k]; else return key; }
    return value;
}

function toggleLanguage() {
    const now = Date.now();
    if (now - lastLangClickTime > 2000) langClickCount = 0;
    lastLangClickTime = now;
    langClickCount++;
    if (langClickCount >= 3 && !samuraiUnlocked) unlockSamuraiSkin();
    window.currentLang = window.currentLang === 'ru' ? 'en' : 'ru';
    SafeStorage.set('pixelCatsLang', window.currentLang);
    document.getElementById('btn-lang').innerText = window.currentLang.toUpperCase();
    updateAllTexts();
}

// Красивое пиксельное уведомление об открытии (вместо alert)
function showUnlockToast(html) {
    let el = document.getElementById('unlock-toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'unlock-toast';
        el.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%) translateY(-24px);'
            + 'background:#1a1426;border:4px solid #ffd700;box-shadow:6px 6px 0 #000;color:#ffd700;'
            + "font-family:'Press Start 2P',monospace;font-size:11px;line-height:1.7;padding:16px 22px;"
            + 'text-align:center;z-index:99999;max-width:90vw;opacity:0;pointer-events:none;'
            + 'transition:opacity .4s ease, transform .4s ease;';
        document.body.appendChild(el);
    }
    el.innerHTML = html;
    requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateX(-50%) translateY(0)'; });
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(-50%) translateY(-24px)'; }, 3600);
}

function unlockSamuraiSkin() {
    samuraiUnlocked = true;
    SafeStorage.set('pixelCatsSamuraiUnlocked', 'true');
    if (!unlockedSkins.includes('samurai')) { unlockedSkins.push('samurai'); saveGameData(); }
    const btnLang = document.getElementById('btn-lang');
    btnLang.classList.add('secret-unlock');
    showUnlockToast('<span style="color:#fff;">\u2605</span> ' + t('secretUnlocked') + ' <span style="color:#fff;">\u2605</span>');
    try { if (typeof AudioEngine !== 'undefined' && AudioEngine.sfx && AudioEngine.sfx.unlock) AudioEngine.sfx.unlock(); } catch (e) {}
    updateMenuButtons();
    setTimeout(() => btnLang.classList.remove('secret-unlock'), 1000);
}

function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}
function safeSetHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

function updateAllTexts() {
    safeSetText('btn-mode', numPlayers === 1 ? t('player1') : t('player2'));
    if (typeof updateMobileToggleUI === 'function') updateMobileToggleUI();
    safeSetText('btn-online-menu', t('online'));
    safeSetText('btn-replay-tutorial', t('replayTutorial'));
    safeSetText('btn-fullscreen', t('fullscreen'));
    safeSetText('p1-label', t('player1Label'));
    safeSetText('p2-label', t('player2Label'));
    safeSetText('btn-easy', t('easyMode'));
    // Новые кнопки/страницы меню режимов
    safeSetText('btn-classic', t('classicMode'));
    safeSetText('btn-minigames', t('minigamesMode'));
    safeSetText('classic-title', t('classicMode'));
    safeSetText('classic-hint', t('classicHint'));
    safeSetText('btn-classic-back', '← ' + t('back'));
    safeSetText('minigames-title', t('minigamesTitle'));
    safeSetText('minigames-dev', t('minigamesDev'));
    safeSetText('btn-minigames-back', '← ' + t('back'));
    safeSetText('btn-mg-chess', t('chess.title'));
    safeSetText('chess-menu-title', t('chess.title'));
    safeSetText('btn-chess-local', t('chess.local'));
    safeSetText('btn-chess-online', t('chess.online'));
    safeSetText('btn-chess-menu-back', '← ' + t('back'));
    safeSetText('fb-omode-chess', t('chess.title'));
    safeSetText('p2p-omode-chess', t('chess.title'));
    safeSetText('fb-chess-title', t('chess.title'));
    safeSetText('p2p-chess-title', t('chess.title'));
    safeSetText('fb-chess-info', t('chess.lobbyInfo'));
    safeSetText('p2p-chess-info', t('chess.lobbyInfo'));
    safeSetText('chess-promo-label', t('chess.promoLabel'));
    safeSetText('cp-q', t('chess.queen'));
    safeSetText('cp-r', t('chess.rook'));
    safeSetText('cp-b', t('chess.bishop'));
    safeSetText('cp-n', t('chess.knight'));
    safeSetText('btn-chess-resign', t('chess.resign'));
    safeSetText('btn-chess-rematch', t('chess.rematch'));
    safeSetText('btn-chess-exit', t('chess.exit'));
    // Охота на призраков
    if (typeof updateGhostHuntTexts === 'function') { try { updateGhostHuntTexts(); } catch (e) {} }
    safeSetText('fb-ghost-title', t('ghosthunt.name'));
    safeSetText('fb-ghost-info', t('ghosthunt.ghostModeInfo'));
    safeSetText('p2p-ghost-title', t('ghosthunt.name'));
    safeSetText('p2p-ghost-info', t('ghosthunt.ghostModeInfo'));
    const _ghIco = t('accBoardGhost');
    safeSetText('fb-omode-ghost', _ghIco);
    safeSetText('p2p-omode-ghost', _ghIco);
    // Настройка скина
    safeSetText('btn-skin-config', t('skinCfg.configure'));
    safeSetText('skin-config-title', t('skinCfg.title'));
    safeSetText('skin-config-hint', t('skinCfg.hint'));
    safeSetText('skin-var-auto', t('skinCfg.auto'));
    safeSetText('skin-var-light', t('skinCfg.light'));
    safeSetText('skin-var-dark', t('skinCfg.dark'));
    safeSetText('skin-config-close', t('skinCfg.done'));
    updateDifficultyButtons();
    safeSetText('online-title', t('onlineTitle'));
    safeSetText('your-skin-label', t('yourSkin'));
    safeSetText('your-id-label', t('yourId'));
    safeSetText('wait-friend-label', t('waitFriend'));
    safeSetText('join-friend-label', t('joinFriend'));
    const remoteInput = document.getElementById('remote-id-input');
    if (remoteInput) remoteInput.placeholder = t('pasteId');
    safeSetText('btn-join', t('joinGame'));
    safeSetText('btn-back', t('back'));
    safeSetText('score-label', t('score'));
    safeSetText('inf-score-label', t('infinityScore'));
    safeSetText('best-label', t('best'));
    safeSetText('inf-best-label', t('best'));
    safeSetText('menu-hint', t('menu'));
    // Игровой индикатор сложности (если игра идёт)
    if (typeof currentDifficulty !== 'undefined' && currentDifficulty) {
        const _dn = t('diffName.' + currentDifficulty);
        safeSetText('diff-label', t('diffLabelPrefix') + (_dn.indexOf('diffName.') === 0 ? currentDifficulty.toUpperCase() : _dn));
    }
    const p1Text = numPlayers === 1 ? `${t('p1Controls')} <span class="key-badge">WASD</span> / <span class="key-badge">${t('arrows')}</span>` :
        `${t('p1Controls')} <span class="key-badge">W</span> ${t('jump')} <span class="key-badge">A</span><span class="key-badge">D</span> ${t('move')}`;
    safeSetHTML('hint-p1', p1Text);
    safeSetHTML('hint-p2', `${t('p2Controls')} <span class="key-badge">▲</span> ${t('jump')} <span class="key-badge">◄</span><span class="key-badge">►</span> ${t('move')}`);
    safeSetText('game-over-title', t('gameOver'));
    safeSetText('distance-label', t('distance'));
    safeSetText('try-again-hint', t('tryAgainHint'));
    safeSetText('btn-try-again', t('tryAgain'));
    safeSetText('btn-game-ad-fish', t('adFishReward'));
    safeSetText('btn-menu-go', t('menuBtn'));
    safeSetText('win-title', t('victory'));
    safeSetText('win-message', t('reachedCastle'));
    safeSetText('highscore-saved', t('highScoreSaved'));
    safeSetText('btn-next-level', t('nextLevel'));
    safeSetText('btn-menu-win', t('menuBtn'));
    safeSetText('npc-text', t('npcMessage'));
    safeSetText('rotate-text', t('rotate'));
    safeSetText('rotate-hint', t('landscapeRequired'));
    // Boss screen translations
    safeSetText('boss-title', t('bossBattle'));
    safeSetText('boss-select-hint', t('bossSelectHint'));
    safeSetText('btn-boss-back', t('bossBack'));
    safeSetText('btn-boss', t('bossBattle'));
    safeSetText('boss-win-title', t('bossWin'));
    safeSetText('boss-win-msg', t('bossDefeated'));
    safeSetText('btn-boss-continue', t('bossContinue'));
    safeSetText('btn-boss-win-menu', t('menuBtn'));
    safeSetText('boss-lose-title', t('bossLose'));
    safeSetText('boss-lose-msg', t('bossLost'));
    safeSetText('btn-boss-retry', t('bossRetry'));
    safeSetText('btn-boss-revive', t('bossReviveAd'));
    safeSetText('btn-boss-lose-back', t('bossSelectOther'));
    safeSetText('dodge-hint', t('dodgeHint'));
    updateMenuButtons();
    renderBossList();
    // Settings screen
    safeSetText('settings-title', t('settings'));
    safeSetText('btn-settings-back', t('settingsBack'));
    safeSetText('btn-settings', t('settings'));
    safeSetText('set-music-label', t('musicLabel'));
    safeSetText('set-sfx-label', t('sfxLabel'));
    safeSetText('set-theme-label', t('themeLabel'));
    safeSetText('set-theme-row-label', t('themeRow'));
    safeSetText('theme-classic', t('themeClassic'));
    safeSetText('theme-moon', t('themeMoon'));
    safeSetText('set-music-on-label', t('onOff'));
    safeSetText('set-sfx-on-label', t('onOff'));
    safeSetText('set-music-vol-label', t('volume'));
    safeSetText('set-sfx-vol-label', t('volume'));
    const joy1Label = document.getElementById('joy1-label');
    if (joy1Label) joy1Label.innerText = isMobile ? 'MOVE/JUMP↑' : '';
    // Firebase server/room UI
    _updateFbTexts();
    // Server modal
    const _s = (id, txt) => { const el = document.getElementById(id); if (el) el.innerText = txt; };
    const _sh = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
    _s('server-modal-title',      t('serverTitle'));
    _s('server-auto-btn',         t('fbAutoSelect'));
    _s('server-modal-close',      t('serverClose'));
    _s('fb-server-btn',           t('serverBtn'));
    // Lobby
    _s('btn-leave-room',          t('leaveRoom'));
    _sh('firebase-hint-banner',   t('p2pUnavailable'));
    _s('fb-copy-hint',            t('copyCodeHint'));
    _s('p2p-player-joined-label', t('p2pPlayerJoined'));
    _s('p2p-diff-label',          t('p2pDiffLabel'));
    _s('btn-host-start-race',     t('p2pStart'));
    _s('btn-online-boss-start',   t('p2pStart'));
    _s('btn-p2p-boss-start',      t('p2pStart'));
    _s('p2p-boss-label',          t('p2pBossLabel'));
    _s('guest-wait-msg',          t('guestWait'));
    _s('btn-lobby-go',            '↩ ' + t('onlineTitle'));
    _s('btn-lobby-win',           '↩ ' + t('onlineTitle'));
    // Game over / win online lobby buttons  
    // Boss
    _s('btn-boss-resume',         t('bossResume'));
    _s('boss-enter-hint',         t('bossEnterHint'));
    // Settings — sections without IDs
    _s('set-lang-section',        t('langSection'));
    _s('set-ctrl-section',        t('ctrlSection'));
    _s('set-ctrl-type-label',     t('ctrlTypeLabel'));
    _s('ctrl-type-joy',           t('ctrlJoystick'));
    _s('ctrl-type-dpad',          t('ctrlDpad'));
    _s('set-joy-style-label',     t('ctrlJoyStyleLabel'));
    _s('joy-style-fixed',         t('joyFixed'));
    _s('joy-style-float',         t('joyFloat'));
    _s('btn-edit-controls',       t('ctrlEdit'));
    _s('set-ctrl-drag-hint',      t('ctrlDragHint'));
    // Shop
    _s('shop-title-text',         t('shopTitle'));
    _s('btn-shop',                t('shopTitle'));
    _s('btn-shop-equip-p1',       t('shopEquipP1'));
    _s('btn-shop-equip-p2',       t('shopEquipP2'));
    _s('btn-shop-back',           t('shopBack'));
    // Controls editor
    _s('editor-title-text',       t('editorTitle'));
    _s('editor-hint-text',        t('editorHint'));
    _s('btn-editor-reset',        t('editorReset'));
    _s('btn-editor-save',         t('editorSave'));
    // Mobile prompt
    const _fp = document.getElementById('fullscreen-prompt');
    if (_fp) _fp.textContent = t('mobilePrompt');
    // ── Accounts UI ─────────────────────────────────────────────
    const _s2 = (id, txt) => { const el = document.getElementById(id); if (el) el.innerText = txt; };
    const _ph = (id, txt) => { const el = document.getElementById(id); if (el) el.placeholder = txt; };
    // Auth modal
    _s2('auth-tab-login',    t('accLogin'));
    _s2('auth-tab-register', t('accRegister'));
    _s2('btn-do-login',      t('accLoginBtn'));
    _s2('btn-do-register',   t('accRegisterBtn'));
    _s2('btn-auth-back',     t('accAuthBack'));
    _ph('login-pass-field',  t('accLoginPassPlaceholder'));
    _ph('reg-name-field',    t('accRegNamePlaceholder'));
    _ph('reg-pass-field',    t('accRegPassPlaceholder'));
    // Profile modal
    _s2('acc-profile-title-el', t('accProfileTitle'));
    _s2('acc-name-label-el',    t('accNameLabel'));
    _ph('acc-name-input',       t('accNamePlaceholder'));
    _s2('btn-save-profile',     t('accSaveName'));
    _s2('btn-manual-sync',      t('accSaveCloud'));
    _s2('btn-profile-back',     t('accBack'));
    _s2('btn-profile-logout',   t('accLogout'));
    // Leaderboard modal
    _s2('acc-board-title-el',  t('accBoardTitle'));
    _s2('btn-open-leaderboard', t('accBoardBtn'));
    _s2('board-tab-bosses',   t('accBoardBosses'));
    _s2('board-tab-infinity',  t('accBoardInfinity'));
    _s2('board-tab-ghost',     t('accBoardGhost'));
    _s2('btn-board-back',      t('accBoardBack'));
    _s2('board-th-rank',       t('accBoardColRank'));
    _s2('board-th-name',       t('accBoardColName'));
    _s2('board-th-cat',        t('accBoardColCat'));
    _s2('board-th-score',      t('accBoardColScore'));
    // Leaderboard loading placeholder row
    const _blr = document.getElementById('board-loading-row');
    if (_blr) _blr.querySelector('td').innerText = t('accBoardLoading');
    // Badge in main menu (only if not logged in)
    if (typeof AccountSystem !== 'undefined' && typeof AccountSystem.isReady === 'function') {
        const badge = document.getElementById('acc-profile-badge');
        if (badge && !AccountSystem.isReady()) badge.textContent = t('accLoginBadge');
    }
    // Boss battle hint (only when battle is not running)
    const _dh = document.getElementById('dodge-hint');
    if (_dh && typeof bossBattleActive !== 'undefined' && !bossBattleActive) _dh.innerText = t('dodgeHint');
}

function _updateFbTexts() {
    const safe = (id, txt) => { const el = document.getElementById(id); if (el) el.innerText = txt; };
    const safePh = (id, txt) => { const el = document.getElementById(id); if (el) el.placeholder = txt; };
    safe('fb-player-joined-label', t('fbPlayerJoined'));
    safe('fb-select-mode-label',  t('fbSelectMode'));
    safe('fb-omode-race',         t('fbRace'));
    safe('fb-omode-boss',         t('fbBoss'));
    safe('fb-diff-label',         t('fbDifficulty'));
    safe('fb-diff-easy',          t('fbEasy'));
    safe('fb-diff-hard',          t('fbHard'));
    safe('fb-diff-megahard',      t('fbMega'));
    safe('fb-diff-infinity',      t('fbInf'));
    safe('fb-start-btn',          t('fbStart'));
    safe('fb-select-boss-btn',    t('fbSelectBoss'));
    safe('fb-room-code-label',    t('fbRoomCode'));
    safe('fb-create-room-btn',    t('fbCreateRoom'));
    safe('fb-join-friend-label',  t('fbJoinFriend'));
    safe('fb-join-room-btn',      t('fbJoinRoom'));
    safe('fb-server-label',       t('fbServer'));
    safe('fb-auto-select-btn',    t('fbAutoSelect'));
    safe('fb-srv-btn-0',          t('fbSrv1'));
    safe('fb-srv-btn-1',          t('fbSrv2'));
    safePh('fb-remote-id-input',  t('fbEnterCode'));
}

function updateDifficultyButtons() {
    const skinsReady = isSkinUnlocked(SKINS[p1SkinIndex].id) && (numPlayers === 1 || isSkinUnlocked(SKINS[p2SkinIndex].id));
    if (hardUnlocked && skinsReady) { btnHard.disabled = false; btnHard.classList.remove('btn-disabled'); btnHard.innerText = t('hardMode'); }
    else { btnHard.disabled = true; btnHard.classList.add('btn-disabled'); btnHard.innerHTML = t('hardMode') + ' <img src="' + IconGenerator.getIcon('lock') + '" class="pixel-icon">'; }
    if (megaHardUnlocked && skinsReady) { btnMega.disabled = false; btnMega.classList.remove('btn-disabled'); btnMega.innerText = t('megaHardMode'); }
    else { btnMega.disabled = true; btnMega.classList.add('btn-disabled'); btnMega.innerHTML = t('megaHardMode') + ' <img src="' + IconGenerator.getIcon('lock') + '" class="pixel-icon">'; }
    if (infinityUnlocked && skinsReady) { btnInfinity.disabled = false; btnInfinity.classList.remove('btn-disabled'); btnInfinity.innerText = t('infinityMode'); }
    else { btnInfinity.disabled = true; btnInfinity.classList.add('btn-disabled'); btnInfinity.innerHTML = t('infinityMode') + ' <img src="' + IconGenerator.getIcon('lock') + '" class="pixel-icon">'; }
}

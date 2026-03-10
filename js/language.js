// ============================================================
// LANGUAGE — Translation strings (RU/EN), t(), language toggle, UI text updates
// ============================================================

// --- LANGUAGE SYSTEM ---
const translations = {
    ru: {
        title: "PIXEL CATS", player1: "1 ИГРОК", player2: "2 ИГРОКА", mobileAuto: "МОБИЛЬНЫЙ: АВТО", mobileOn: "МОБИЛЬНЫЙ: ВКЛ",
        online: "ОНЛАЙН (бета)", fullscreen: "[ ] ПОЛНЫЙ ЭКРАН", player1Label: "ИГРОК 1", player2Label: "ИГРОК 2",
        easyMode: "ЛЁГКИЙ РЕЖИМ", hardMode: "СЛОЖНЫЙ РЕЖИМ", megaHardMode: "МЕГАСЛОЖНО", infinityMode: "БЕСКОНЕЧНОСТЬ",
        locked: "🔒", buy: "КУПИТЬ", lockedBtn: "ЗАБЛОКИРОВАНО", needDist: "НУЖНО ДИСТ.", infScore: "БЕСК. СЧЁТ",
        onlineTitle: "ОНЛАЙН ЛОББИ", yourSkin: "ВАШ СКИН", initializing: "Инициализация P2P...", ready: "Готов к подключению.",
        connected: "ПОДКЛЮЧЕНО!", playerJoined: "ИГРОК ПОДКЛЮЧИЛСЯ! Ожидание данных...", yourId: "ВАШ ID (ОТПРАВЬТЕ ДРУГУ):",
        waitFriend: "Ждите подключения друга...", joinFriend: "ПРИСОЕДИНИТЬСЯ К ДРУГУ:", pasteId: "ВСТАВЬТЕ ID СЮДА",
        joinGame: "ПРИСОЕДИНИТЬСЯ", back: "НАЗАД", idCopied: "ID скопирован!", enterId: "Введите ID", connectionLost: "Соединение потеряно",
        score: "СЧЁТ:", infinityScore: "БЕСК. СЧЁТ:", best: "РЕКОРД:", menu: "Меню", p1Controls: "ИГРОК 1:", p2Controls: "ИГРОК 2:",
        jump: "Прыжок", move: "Движение", gameOver: "ИГРА ОКОНЧЕНА", distance: "ДИСТАНЦИЯ:",
        tryAgainHint: "НАЖМИТЕ ENTER ИЛИ ПОПРОБУЙТЕ СНОВА", tryAgain: "ПОПРОБОВАТЬ СНОВА", menuBtn: "МЕНЮ",
        victory: "ПОБЕДА!", reachedCastle: "Вы достигли Замка!", highScoreSaved: "РЕКОРД СОХРАНЁН!",
        nextLevel: "СЛЕДУЮЩИЙ УРОВЕНЬ", hardUnlocked: "СЛОЖНЫЙ РЕЖИМ ОТКРЫТ!", megaUnlocked: "МЕГАСЛОЖНО ОТКРЫТО!",
        infinityUnlocked: "БЕСКОНЕЧНОСТЬ ОТКРЫТА!", secretUnlocked: "СЕКРЕТНЫЙ СКИН САМУРАЯ ОТКРЫТ!",
        skins: { white: "БЕЛЫЙ", orange: "РЫЖИЙ", black: "ЧЁРНЫЙ", calico: "ТРЁХЦВЕТНЫЙ", pink: "РОЗОВЫЙ", witch: "ВЕДЬМА",
            cyber: "КИБЕР", froggy: "ЛЯГУШКА", sims: "СИМС", newyear: "НОВОГОДНИЙ", angel: "АНГЕЛ", samurai: "САМУРАЙ ★", foxcoat: "ЭДВАРД" },
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
                title: 'Добро пожаловать в Pixel Cats!',
                desc:  'Онлайн-игра про котов, рыбок и боссов.<br>Давай покажем тебе, как всё работает!'
            },
            movement: {
                title: 'Управление',
                desc:  '<kbd>A</kbd><kbd>D</kbd> или <kbd>←</kbd><kbd>→</kbd> — движение<br>'
                    + '<kbd>W</kbd> или <kbd>Space</kbd> — прыжок<br>'
                    + 'На мобиле — джойстик слева.'
            },
            collect: {
                title: 'Собирай рыбок',
                desc:  'Прыгай на рыбок, чтобы собирать очки.<br>'
                    + '<span class="or">Оранжевые</span> · <span class="bl">Синие</span> · <span class="hl">Золотые</span><br>'
                    + 'Рыбки = валюта для скинов!'
            },
            modes: {
                title: 'Режимы игры',
                desc:  '<span class="gr">Easy</span> → победи, чтобы открыть <span class="hl">Hard</span><br>'
                    + '<span class="hl">Hard</span> → победи, чтобы открыть <span class="or">Mega</span><br>'
                    + '<span class="or">Mega</span> → открывает режим <span class="hl">∞ Infinity</span>'
            },
            controls: {
                title: 'Настрой кнопки под себя!',
                desc:  'Зайди в <span class="hl">⚙ Настройки → Расположение кнопок</span>.<br>'
                    + 'Перетаскивай кнопки <span class="gr">в любое место экрана</span>.<br>'
                    + 'Меняй их <span class="or">размер</span> кнопками − и +.<br>'
                    + '<span class="hl">Особенно важно для мобильных игроков!</span>'
            },
            shop: {
                title: 'Магазин скинов',
                desc:  'Трать рыбок на новые скины для котиков.<br>'
                    + 'Некоторые скины открываются за <span class="hl">рекорды</span>,<br>'
                    + 'другие — купить в магазине.'
            },
            online: {
                title: 'Онлайн-игра',
                desc:  'Нажми <span class="bl">ОНЛАЙН</span> в главном меню.<br>'
                    + 'Создай комнату и отправь код другу.<br>'
                    + 'Поддержка <span class="hl">P2P</span> и <span class="or">Firebase</span> соединений.'
            },
            ready: {
                title: 'Готов к игре!',
                desc:  'Теперь ты знаешь всё необходимое.<br>'
                    + 'Не забудь настроить управление в <span class="hl">⚙ Настройках</span>.<br>'
                    + '<span class="gr">Удачи и хорошей игры!</span>'
            },
        },
        settings: "⚙ НАСТРОЙКИ", settingsBack: "← НАЗАД",
        musicLabel: "🎵 МУЗЫКА", sfxLabel: "🔊 ЗВУКИ",
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
        // — Настройки —
        shopTitle: "🛒 МАГАЗИН СКИНОВ", shopEquipP1: "✅ П1 НАДЕТЬ", shopEquipP2: "✅ П2 НАДЕТЬ", shopBack: "← НАЗАД",
        shopSelected: "✓ ВЫБРАН", shopOwned: "✓ ЕСТЬ", shopDist: "ДИСТ. ",
        langSection: "🌐 ЯЗЫК / МОБИЛЬНЫЙ",
        ctrlSection: "🕹️ УПРАВЛЕНИЕ (МОБИЛЬНЫЙ)", ctrlTypeLabel: "Тип управления:",
        ctrlJoystick: "🕹️ ДЖОЙСТИК", ctrlDpad: "⬆ КНОПКИ",
        ctrlEdit: "✏️ РЕДАКТИРОВАТЬ РАСПОЛОЖЕНИЕ", ctrlDragHint: "Перетащите элементы управления",
        editorTitle: "✏️ РЕДАКТОР УПРАВЛЕНИЯ", editorHint: "Перетащи элементы куда удобно",
        editorReset: "↺ СБРОС", editorSave: "✓ СОХРАНИТЬ",
        // — Мобильный промпт —
        mobilePrompt: "📱 Рекомендуется полноэкранный режим для удобства игры!",
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
        accLoginBtn: "▶ ВОЙТИ", accRegisterBtn: "✅ СОЗДАТЬ",
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
        accBoardNormal: "ОБЫЧНЫЙ", accBoardInfinity: "БЕСКОНЕЧНЫЙ", accBoardBosses: "БОССЫ",
        accBoardLoading: "Загрузка...", accBoardEmpty: "Пока нет рекордов",
        accBoardNoConn: "Нет соединения", accBoardErr: "Ошибка загрузки",
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
        locked: "🔒", buy: "BUY", lockedBtn: "LOCKED", needDist: "NEED DIST", infScore: "INF SCORE",
        onlineTitle: "ONLINE LOBBY", yourSkin: "YOUR SKIN", initializing: "Initializing P2P...", ready: "Ready to connect.",
        connected: "CONNECTED!", playerJoined: "PLAYER JOINED! Waiting for data...", yourId: "YOUR ID (SEND TO FRIEND):",
        waitFriend: "Wait for friend to join...", joinFriend: "JOIN FRIEND'S GAME:", pasteId: "PASTE ID HERE",
        joinGame: "JOIN GAME", back: "BACK", idCopied: "ID Copied!", enterId: "Enter ID", connectionLost: "Connection Lost",
        score: "SCORE:", infinityScore: "INFINITY SCORE:", best: "BEST:", menu: "Menu", p1Controls: "P1:", p2Controls: "P2:",
        jump: "Jump", move: "Move", gameOver: "GAME OVER", distance: "DISTANCE:",
        tryAgainHint: "PRESS ENTER OR TRY AGAIN", tryAgain: "TRY AGAIN", menuBtn: "MENU",
        victory: "VICTORY!", reachedCastle: "You reached the Castle!", highScoreSaved: "HIGH SCORE SAVED!",
        nextLevel: "PLAY NEXT LEVEL", hardUnlocked: "HARD MODE UNLOCKED!", megaUnlocked: "MEGAHARD UNLOCKED!",
        infinityUnlocked: "INFINITY UNLOCKED!", secretUnlocked: "SECRET SAMURAI SKIN UNLOCKED!",
        skins: { white: "WHITE", orange: "ORANGE", black: "BLACK", calico: "CALICO", pink: "PINK", witch: "WITCH",
            cyber: "CYBER", froggy: "FROG", sims: "SIMS", newyear: "XMAS", angel: "ANGEL", samurai: "SAMURAI ★", foxcoat: "FULLMETAL" },
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
                title: 'Welcome to Pixel Cats!',
                desc:  'An online game about cats, fish and bosses.<br>Let us show you how everything works!'
            },
            movement: {
                title: 'Controls',
                desc:  '<kbd>A</kbd><kbd>D</kbd> or <kbd>←</kbd><kbd>→</kbd> — move<br>'
                    + '<kbd>W</kbd> or <kbd>Space</kbd> — jump<br>'
                    + 'On mobile — use the joystick on the left.'
            },
            collect: {
                title: 'Collect Fish',
                desc:  'Jump onto fish to score points.<br>'
                    + '<span class="or">Orange</span> · <span class="bl">Blue</span> · <span class="hl">Gold</span><br>'
                    + 'Fish = score points AND shop currency!'
            },
            modes: {
                title: 'Game Modes',
                desc:  '<span class="gr">Easy</span> → win to unlock <span class="hl">Hard</span><br>'
                    + '<span class="hl">Hard</span> → win to unlock <span class="or">Mega</span><br>'
                    + '<span class="or">Mega</span> → unlocks <span class="hl">∞ Infinity</span> mode'
            },
            controls: {
                title: 'Customize Your Controls!',
                desc:  'Go to <span class="hl">⚙ Settings → Controls Layout</span>.<br>'
                    + 'Drag buttons <span class="gr">anywhere on the screen</span>.<br>'
                    + 'Use − and + to <span class="or">resize</span> them freely.<br>'
                    + '<span class="hl">Essential for mobile players!</span>'
            },
            shop: {
                title: 'Skin Shop',
                desc:  'Spend your fish on new cat skins.<br>'
                    + 'Some skins unlock via <span class="hl">high scores</span>,<br>'
                    + 'others are available to buy in the shop.'
            },
            online: {
                title: 'Online Play',
                desc:  'Press <span class="bl">ONLINE</span> in the main menu.<br>'
                    + 'Create a room and share the code with a friend.<br>'
                    + 'Supports <span class="hl">P2P</span> and <span class="or">Firebase</span> connections.'
            },
            ready: {
                title: 'Ready to Play!',
                desc:  "Now you know everything you need.<br>"
                    + 'Don\'t forget to customize controls in <span class="hl">⚙ Settings</span>.<br>'
                    + '<span class="gr">Good luck and happy fish hunting!</span>'
            },
        },
        settings: "⚙ SETTINGS", settingsBack: "← BACK",
        musicLabel: "🎵 MUSIC", sfxLabel: "🔊 SOUND FX",
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
        // — Shop & Settings —
        shopTitle: "🛒 SKIN SHOP", shopEquipP1: "✅ P1 EQUIP", shopEquipP2: "✅ P2 EQUIP", shopBack: "← BACK",
        shopSelected: "✓ SELECTED", shopOwned: "✓ OWNED", shopDist: "DIST. ",
        langSection: "🌐 LANGUAGE / MOBILE",
        ctrlSection: "🕹️ CONTROLS (MOBILE)", ctrlTypeLabel: "Control type:",
        ctrlJoystick: "🕹️ JOYSTICK", ctrlDpad: "⬆ D-PAD",
        ctrlEdit: "✏️ EDIT LAYOUT", ctrlDragHint: "Drag controls to reposition",
        editorTitle: "✏️ CONTROLS EDITOR", editorHint: "Drag elements where you like",
        editorReset: "↺ RESET", editorSave: "✓ SAVE",
        // — Mobile prompt —
        mobilePrompt: "📱 Fullscreen mode is recommended for the best experience!",
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
        accLoginBtn: "▶ LOGIN", accRegisterBtn: "✅ CREATE",
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
        accBoardNormal: "NORMAL", accBoardInfinity: "∞ INFINITY", accBoardBosses: "BOSSES",
        accBoardLoading: "Loading...", accBoardEmpty: "No records yet",
        accBoardNoConn: "No connection", accBoardErr: "Load error",
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

let currentLang = localStorage.getItem('pixelCatsLang') || 'ru';
let langClickCount = 0, lastLangClickTime = 0;
let samuraiUnlocked = localStorage.getItem('pixelCatsSamuraiUnlocked') === 'true';

function t(key) {
    const keys = key.split('.');
    let value = translations[currentLang];
    for (const k of keys) { if (value && value[k] !== undefined) value = value[k]; else return key; }
    return value;
}

function toggleLanguage() {
    const now = Date.now();
    if (now - lastLangClickTime > 2000) langClickCount = 0;
    lastLangClickTime = now;
    langClickCount++;
    if (langClickCount >= 3 && !samuraiUnlocked) unlockSamuraiSkin();
    currentLang = currentLang === 'ru' ? 'en' : 'ru';
    localStorage.setItem('pixelCatsLang', currentLang);
    document.getElementById('btn-lang').innerText = currentLang.toUpperCase();
    updateAllTexts();
}

function unlockSamuraiSkin() {
    samuraiUnlocked = true;
    localStorage.setItem('pixelCatsSamuraiUnlocked', 'true');
    if (!unlockedSkins.includes('samurai')) { unlockedSkins.push('samurai'); saveGameData(); }
    const btnLang = document.getElementById('btn-lang');
    btnLang.classList.add('secret-unlock');
    alert(t('secretUnlocked'));
    updateMenuButtons();
    setTimeout(() => btnLang.classList.remove('secret-unlock'), 1000);
}

function updateAllTexts() {
    document.getElementById('btn-mode').innerText = numPlayers === 1 ? t('player1') : t('player2');
    const mobileBtn = document.getElementById('btn-mobile-toggle');
    mobileBtn.innerText = forceMobile ? t('mobileOn') : t('mobileAuto');
    document.getElementById('btn-online-menu').innerText = t('online');
    document.getElementById('btn-fullscreen').innerText = t('fullscreen');
    document.getElementById('p1-label').innerText = t('player1Label');
    document.getElementById('p2-label').innerText = t('player2Label');
    document.getElementById('btn-easy').innerText = t('easyMode');
    updateDifficultyButtons();
    document.getElementById('online-title').innerText = t('onlineTitle');
    document.getElementById('your-skin-label').innerText = t('yourSkin');
    document.getElementById('your-id-label').innerText = t('yourId');
    document.getElementById('wait-friend-label').innerText = t('waitFriend');
    document.getElementById('join-friend-label').innerText = t('joinFriend');
    document.getElementById('remote-id-input').placeholder = t('pasteId');
    document.getElementById('btn-join').innerText = t('joinGame');
    document.getElementById('btn-back').innerText = t('back');
    document.getElementById('score-label').innerText = t('score');
    document.getElementById('inf-score-label').innerText = t('infinityScore');
    document.getElementById('best-label').innerText = t('best');
    document.getElementById('inf-best-label').innerText = t('best');
    document.getElementById('menu-hint').innerText = t('menu');
    const p1Text = numPlayers === 1 ? `${t('p1Controls')} <span class="key-badge">WASD</span> / <span class="key-badge">ARROWS</span>` :
        `${t('p1Controls')} <span class="key-badge">W</span> ${t('jump')} <span class="key-badge">A</span><span class="key-badge">D</span> ${t('move')}`;
    document.getElementById('hint-p1').innerHTML = p1Text;
    document.getElementById('hint-p2').innerHTML = `${t('p2Controls')} <span class="key-badge">▲</span> ${t('jump')} <span class="key-badge">◄</span><span class="key-badge">►</span> ${t('move')}`;
    document.getElementById('game-over-title').innerText = t('gameOver');
    document.getElementById('distance-label').innerText = t('distance');
    document.getElementById('try-again-hint').innerText = t('tryAgainHint');
    document.getElementById('btn-try-again').innerText = t('tryAgain');
    document.getElementById('btn-menu-go').innerText = t('menuBtn');
    document.getElementById('win-title').innerText = t('victory');
    document.getElementById('win-message').innerText = t('reachedCastle');
    document.getElementById('highscore-saved').innerText = t('highScoreSaved');
    document.getElementById('btn-next-level').innerText = t('nextLevel');
    document.getElementById('btn-menu-win').innerText = t('menuBtn');
    document.getElementById('npc-text').innerText = t('npcMessage');
    document.getElementById('rotate-text').innerText = t('rotate');
    document.getElementById('rotate-hint').innerText = t('landscapeRequired');
    // Boss screen translations
    document.getElementById('boss-title').innerText = t('bossBattle');
    document.getElementById('boss-select-hint').innerText = t('bossSelectHint');
    document.getElementById('btn-boss-back').innerText = t('bossBack');
    document.getElementById('btn-boss').innerText = '⚔️ ' + t('bossBattle');
    document.getElementById('boss-win-title').innerText = t('bossWin');
    document.getElementById('boss-win-msg').innerText = t('bossDefeated');
    document.getElementById('btn-boss-continue').innerText = t('bossContinue');
    document.getElementById('btn-boss-win-menu').innerText = t('menuBtn');
    document.getElementById('boss-lose-title').innerText = t('bossLose');
    document.getElementById('boss-lose-msg').innerText = t('bossLost');
    document.getElementById('btn-boss-retry').innerText = t('bossRetry');
    document.getElementById('btn-boss-lose-back').innerText = t('bossSelectOther');
    document.getElementById('dodge-hint').innerText = t('dodgeHint');
    updateMenuButtons();
    renderBossList();
    // Settings screen
    document.getElementById('settings-title').innerText = t('settings');
    document.getElementById('btn-settings-back').innerText = t('settingsBack');
    document.getElementById('btn-settings').innerText = t('settings');
    document.getElementById('set-music-label').innerText = t('musicLabel');
    document.getElementById('set-sfx-label').innerText = t('sfxLabel');

    document.getElementById('set-music-on-label').innerText = t('onOff');
    document.getElementById('set-sfx-on-label').innerText = t('onOff');
    document.getElementById('set-music-vol-label').innerText = t('volume');
    document.getElementById('set-sfx-vol-label').innerText = t('volume');
    if (document.getElementById('joy1-label')) document.getElementById('joy1-label').innerText = isMobile ? 'MOVE/JUMP↑' : '';
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
    if (_fp) { const inner = _fp.querySelector('span,div') || _fp; if (_fp.childNodes.length) _fp.childNodes[0].textContent = t('mobilePrompt'); }
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

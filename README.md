# Pixel Cats: Online — Структура проекта

## 📁 Файловая структура

```
pixel-cats/
├── index.html          ← Главный файл (HTML + подключение всех скриптов)
├── css/
│   └── styles.css      ← Все стили
├── js/
│   ├── audio.js        ← Аудиодвижок + фоновая музыка меню (HTML Audio)
│   ├── controls.js     ← Редактор расположения кнопок
│   ├── settings.js     ← Экран настроек + магазин скинов
│   ├── language.js     ← Переводы (RU/EN), функция t()
│   ├── globals.js      ← Глобальные переменные, константы, SKINS
│   ├── networking.js   ← Сеть: Firebase + PeerJS + онлайн лобби
│   ├── game.js         ← Игровая логика, рендеринг, игровой цикл
│   ├── boss.js         ← Боссы: данные, бой, рисование, победа/поражение
│   ├── accounts.js     ← Аккаунты: Firebase Auth + синхронизация прогресса
│   ├── tutorial.js     ← Обучение: первый запуск, анимированные шаги
│   └── main.js         ← Инициализация приложения
├── media/
│   ├── Pixelcats.ico               ← Фавикон сайта
│   └── vospominaniya-o-bylom.mp3   ← Фоновая музыка главного меню и лобби
└── README.md
```

## 📦 Описание модулей

### `js/audio.js`
- `AudioEngine` — IIFE-модуль, весь Web Audio API
- SFX: прыжок, сбор рыбок, победа, поражение, клик кнопки
- Музыка боссов: Fire Golem, Ice Dragon, Alchemist, Shadow Lord (синтез через Web Audio)
- **Фоновая музыка меню:** HTML `<audio>` элемент (`menu-music`), воспроизводится на главном экране и в онлайн-лобби, автоматически глушится при старте боссовой музыки и возобновляется после
- Громкость mp3 = `masterVol × musicVol × 0.2` (в 5× тише боссов), синхронизируется через `applyVol()`
- `startMenuMusic()` — запустить фоновый трек
- `stopMusic() / stopAllMusic()` — останавливают в том числе HTML-аудио
- Управление громкостью, вкл/выкл музыки и звуков

### `js/controls.js`
- `CTRL_STORAGE_KEY` — ключ сохранения в localStorage
- `loadLayout() / applyLayout()` — загрузка/применение расположения кнопок
- `openControlsEditor() / closeControlsEditor()` — редактор drag&drop
- `saveControlsLayout() / resetControlsLayout()`

### `js/settings.js`
- `openSettings() / closeSettings()` — экран настроек
- `openShop() / closeShop() / renderShop()` — магазин скинов
- `shopBuySkin() / shopEquipP1() / shopEquipP2()`
- Обёртки над AudioEngine для UI: `setMusicOn()`, `setSfxOn()`, etc.

### `js/language.js`
- `translations` — объект со всеми строками (RU + EN)
- `t(key)` — получить перевод по ключу
- `toggleLanguage()` — переключение языка
- `updateAllTexts()` — обновить весь UI
- `updateDifficultyButtons()` — обновить кнопки сложности
- Добавлены ключи: `accBoardBosses`, `accBoardColBosses` — вкладка и колонка «Боссы» в лидерборде

### `js/globals.js`
- `canvas`, `ctx` — ссылки на canvas и контекст
- Глобальные переменные игры: `score`, `cameraX`, `players`, `isGameOver`, etc.
- `SKINS` — массив всех скинов с параметрами пикселей
- `resizeCanvas()`, `checkMobile()`, `toggleMobileMode()`
- `seedRng() / rng()` — детерминированный генератор случайных чисел
- `getWorldGround()`, `toggleFullscreen()`

### `js/networking.js`
- **Firebase:** `fbCreateRoom()`, `fbJoinRoom()`, `FB_SERVERS[]`
- **PeerJS P2P:** `initPeer()`, `setupPeerConnection()`, `handlePeerData()`
- **Лобби:** `openOnlineMenu()`, `showOnlineLobby()`, `switchConnMode()`
- **Данные игры:** `saveGameData()`, `updateFishUI()`, `isSkinUnlocked()`, `buySkin()`
- `saveGameData()` теперь также сохраняет `defeatedBosses` → автоматически пушится в облако через патч AccountSystem
- **Скины в меню:** `changeSkin()`, `updateMenuButtons()`
- **Мобильное управление:** `setupMobileControls()`, `dpDown/dpUp()`

### `js/game.js`
- `drawPixelCat()` — рисование пиксельного кота
- `drawMenuScene() / menuLoop()` — анимация главного меню
- `initWorld() / addTerrainBlock() / manageChunks()` — генерация мира
- `drawForest() / drawWorld() / drawCastle()` — рендеринг мира
- `init(difficulty)` — инициализация игровой сессии
- `checkCollisions() / triggerWin() / endGame()` — игровая логика
- `showMenu()` — возврат в меню, запускает `startMenuMusic()`
- `startGame()` — старт любого режима, останавливает музыку меню (`stopMusic()`)

### `js/boss.js`
- `BOSSES[]` — массив данных о боссах (Fire Golem, Ice Dragon, Alchemist, Shadow Lord)
- `defeatedBosses` — массив ID побеждённых боссов, хранится в localStorage
- `startBossBattle() / bossLoop()` — запуск и цикл боя с боссом
- `updateBossPlayer() / updateBossEntity()` — физика персонажей
- `spawnBossProjectile() / updateBossProjectiles() / checkBossCollisions()`
- `drawBossBattle() / drawBossModelTopDown() / drawPixelCatTopDown()`
- `bossWin()` — после победы вызывает `saveGameData()` и `AccountSystem.submitBossProgress(count)` для синхронизации с облаком и лидербордом
- `bossLose() / restartBossBattle()` — результаты боя

### `js/accounts.js`
- `AccountSystem` — IIFE-модуль, Firebase Auth + Realtime Database
- `register() / login() / logout()` — регистрация, вход, выход
- `submitScore()` — отправка рекорда (normal / infinity)
- **`submitBossProgress(count)`** — записывает количество побеждённых боссов в лидерборд (только если новый результат лучше)
- `fetchLeaderboard(mode)` — загрузка таблицы, mode: `'bosses'` | `'infinity'`
- Таблица лидеров по умолчанию открывается на вкладке **«Боссы»** (`bossCount`)
- `_collect()` включает `defeatedBossIds[]` и `defeatedBossCount` — синхронизируются между устройствами
- `_applyProgress()` — мёрджит победы над боссами через union массивов (прогресс никогда не уменьшается)
- `_push()` — синхронизация прогресса (рыбки, скины, рекорды, боссы) в облако
- `_patchSaveGameData()` — автоматический пуш при каждом `saveGameData()`

### `js/tutorial.js`
- `TutorialSystem` — IIFE-модуль, обучение при первом запуске
- `shouldShow() / show() / skip() / next() / prev() / goTo(i)` — управление шагами
- 8 анимированных шагов: welcome, movement, collect, modes, controls, shop, online, ready
- Стили: полупрозрачный фон как у главного меню (`backdrop-filter: blur`), белая рамка
- Физика прыжка в анимации точно соответствует игровой: `jumpVy = -7`, `gravity = 0.3` (масштабировано под канвас 172px)
- При открытии вызывает `AudioEngine.startMenuMusic()`

### `js/main.js`
- Инициализация: `resizeCanvas()`, `showMenu()`, `applyLayout()`
- При первом клике/тапе: `AudioEngine.boot()` + `AudioEngine.startMenuMusic()` — музыка стартует сразу

---

## 🔧 Порядок загрузки скриптов
Важен! Каждый файл зависит от предыдущих:
```
audio → controls → settings → language → globals → networking → game → boss → accounts → tutorial → main
```

---

## 🎵 Логика музыки

| Экран | Музыка |
|---|---|
| Главное меню | mp3 фон (тихо, 0.2× от настройки) |
| Онлайн-лобби | mp3 фон продолжается |
| Режимы Easy/Hard/Mega/Infinity | mp3 останавливается при старте |
| Обучение | mp3 фон играет |
| Бой с боссом | mp3 стоп → синтезированный трек босса |
| После босса (победа/поражение) | трек босса стоп → mp3 возобновляется |

---

## 🏆 Таблица лидеров

| Вкладка | Поле в Firebase | Отображение |
|---|---|---|
| ⚔️ Боссы (по умолчанию) | `bossCount` | `⚔️ N / 4` |
| ∞ Бесконечный | `scoreInfinity` | числовой счёт |

> Вкладка «Обычный» удалена — заменена вкладкой «Боссы». Поле `scoreNormal` в базе сохранено, данные не удалялись.

---

## 💡 Советы по доработке

| Хочу изменить | Файл |
|---|---|
| Фоновую музыку меню | заменить `media/vospominaniya-o-bylom.mp3` |
| Громкость фоновой музыки | `js/audio.js` → множитель `0.2` в `applyVol()` |
| Звук прыжка, боссовую музыку | `js/audio.js` |
| Добавить нового скина | `js/globals.js` → массив `SKINS` |
| Переводы, новый язык | `js/language.js` → объект `translations` |
| Физику прыжка, скорость | `js/game.js` → `init()`, класс игрока |
| Нового босса | `js/boss.js` → массив `BOSSES` |
| Онлайн протокол | `js/networking.js` → `handlePeerData()` |
| Аккаунты, таблицу рекордов | `js/accounts.js` → `AccountSystem` |
| Стили кнопок, экранов | `css/styles.css` |
| Обучение (текст, шаги) | `js/tutorial.js` |
| Структуру HTML | `index.html` |
| Иконку сайта | `media/Pixelcats.ico` |

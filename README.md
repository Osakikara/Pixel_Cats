# Pixel Cats: Online — Структура проекта

## 📁 Файловая структура

```
pixel-cats/
├── index.html          ← Главный файл (HTML + подключение всех скриптов)
├── css/
│   └── styles.css      ← Все стили (639 строк)
├── js/
│   ├── audio.js        ← Аудиодвижок
│   ├── controls.js     ← Редактор расположения кнопок
│   ├── settings.js     ← Экран настроек + магазин скинов
│   ├── language.js     ← Переводы (RU/EN), функция t()
│   ├── globals.js      ← Глобальные переменные, константы, SKINS
│   ├── networking.js   ← Сеть: Firebase + PeerJS + онлайн лобби
│   ├── game.js         ← Игровая логика, рендеринг, игровой цикл
│   ├── boss.js         ← Боссы: данные, бой, рисование, победа/поражение
│   └── main.js         ← Инициализация приложения (3 строки)
└── README.md
```

## 📦 Описание модулей

### `js/audio.js` (~600 строк)
- `AudioEngine` — IIFE-модуль, весь Web Audio API
- SFX: прыжок, сбор рыбок, победа, поражение, клик кнопки
- Музыка боссов: Fire Golem, Ice Dragon, Shadow Lord
- Управление громкостью, вкл/выкл музыки и звуков

### `js/controls.js` (~200 строк)
- `CTRL_STORAGE_KEY` — ключ сохранения в localStorage
- `loadLayout() / applyLayout()` — загрузка/применение расположения кнопок
- `openControlsEditor() / closeControlsEditor()` — редактор drag&drop
- `saveControlsLayout() / resetControlsLayout()`

### `js/settings.js` (~190 строк)
- `openSettings() / closeSettings()` — экран настроек
- `openShop() / closeShop() / renderShop()` — магазин скинов
- `shopBuySkin() / shopEquipP1() / shopEquipP2()`
- Обёртки над AudioEngine для UI: `setMusicOn()`, `setSfxOn()`, etc.

### `js/language.js` (~425 строк)
- `translations` — объект со всеми строками (RU + EN)
- `t(key)` — получить перевод по ключу
- `toggleLanguage()` — переключение языка
- `updateAllTexts()` — обновить весь UI
- `updateDifficultyButtons()` — обновить кнопки сложности

### `js/globals.js` (~220 строк)
- `canvas`, `ctx` — ссылки на canvas и контекст
- Глобальные переменные игры: `score`, `cameraX`, `players`, `isGameOver`, etc.
- `SKINS` — массив всех скинов с параметрами пикселей
- `resizeCanvas()`, `checkMobile()`, `toggleMobileMode()`
- `seedRng() / rng()` — детерминированный генератор случайных чисел
- `getWorldGround()`, `toggleFullscreen()`

### `js/networking.js` (~1840 строк)
- **Firebase:** `fbCreateRoom()`, `fbJoinRoom()`, `FB_SERVERS[]`
- **PeerJS P2P:** `initPeer()`, `setupPeerConnection()`, `handlePeerData()`
- **Лобби:** `openOnlineMenu()`, `showOnlineLobby()`, `switchConnMode()`
- **Данные игры:** `saveGameData()`, `updateFishUI()`, `isSkinUnlocked()`, `buySkin()`
- **Скины в меню:** `changeSkin()`, `updateMenuButtons()`
- **Мобильное управление:** `setupMobileControls()`, `dpDown/dpUp()`

### `js/game.js` (~1230 строк)
- `drawPixelCat()` — рисование пиксельного кота (огромная функция)
- `drawMenuScene() / menuLoop()` — анимация главного меню
- `initWorld() / addTerrainBlock() / manageChunks()` — генерация мира
- `drawForest() / drawWorld() / drawCastle()` — рендеринг мира
- `init(difficulty)` — инициализация игровой сессии
- `checkCollisions() / triggerWin() / endGame()` — игровая логика
- `drawBackground() / drawSun() / drawBehelit() / drawRainbow()`
- `showMenu() / loop() / startGame()` — основной игровой цикл

### `js/boss.js` (~1710 строк)
- `BOSSES[]` — массив данных о боссах (Fire Golem, Ice Dragon, Shadow Lord)
- `startBossBattle() / bossLoop()` — запуск и цикл боя с боссом
- `updateBossPlayer() / updateBossEntity()` — физика персонажей
- `spawnBossProjectile() / updateBossProjectiles() / checkBossCollisions()`
- `drawBossBattle() / drawBossModelTopDown() / drawPixelCatTopDown()`
- `bossWin() / bossLose() / restartBossBattle()` — результаты боя

### `js/main.js` (3 строки)
- Инициализация: `resizeCanvas()`, `showMenu()`, `applyLayout()`
- Подписка на первый тач/клик для старта AudioEngine

---

## 🔧 Порядок загрузки скриптов
Важен! Каждый файл зависит от предыдущих:
```
audio → controls → settings → language → globals → networking → game → boss → main
```

## 💡 Советы по доработке

| Хочу изменить | Файл |
|---|---|
| Звук прыжка, музыку | `js/audio.js` |
| Добавить нового скина | `js/globals.js` → массив `SKINS` |
| Переводы, новый язык | `js/language.js` → объект `translations` |
| Физику прыжка, скорость | `js/game.js` → `init()`, класс игрока |
| Нового босса | `js/boss.js` → массив `BOSSES` |
| Онлайн протокол | `js/networking.js` → `handlePeerData()` |
| Стили кнопок, экранов | `css/styles.css` |
| Структуру HTML | `index.html` |

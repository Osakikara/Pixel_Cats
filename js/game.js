// ============================================================
// GAME — drawPixelCat, world rendering, game logic, collision, game loop, menus
// ============================================================


// ============================================================
// drawPixelCat — рисует пиксельного кота
//
// Порядок отрисовки (снизу вверх по слоям):
//   1. Катана (samurai, за спиной)
//   2. Хвост
//   3. Крылья сзади (angel)
//   4. Тело / костюм
//   5. Голова
//   6. Уши
//   7. Аксессуары на голове (антенна, горб)
//   8. Морда / глаза / нос
//   9. Шляпы и аксессуары
//  10. Ноги
//
// Скины и их типы:
//   solid   → white, orange, black, pink, sims, angel, witch
//   calico  → calico
//   tabby   → froggy, newyear
//   cyber   → cyber
//   samurai → samurai
//   foxcoat → foxcoat (Edward Elric coat)
// ============================================================
// Тёмный ли сейчас фон (для адаптивного окраса скина-призрака):
// тёмные — арена «Охоты на призраков», бои с боссами, infinity и луна (megahard);
// светлые — меню, магазин, easy, hard.
function _ghostSkinOnDarkBg() {
    // Светлый фон только в дневной классике (easy/hard) — там кот тёмный.
    // Меню, магазин, таблица, охота, боссы, infinity, megahard — тёмный фон → кот светлый.
    if (isPlaying && (currentDifficulty === 'easy' || currentDifficulty === 'hard')) return false;
    return true;
}

function drawPixelCat(drawCtx, x, y, skin, facingRight, controls, isPlayer1, isJumping = false, forcedMoving = null) {
    const size = 3;
    const width = 10 * size;
    const drawX = -width / 2;
    const drawY = 0;

    drawCtx.save();
    drawCtx.translate(x + width / 2, y);
    if (!facingRight) drawCtx.scale(-1, 1);

    // --- ghost: окрас по настройке игрока (авто / светлый / тёмный),
    //     парение, полупрозрачность и контурное свечение ---
    if (skin.type === 'ghost') {
        // skin._variant — явное переопределение (таблица лидеров и т.п.),
        // иначе настройка игрока (своя или удалённого в онлайне)
        let _v = skin._variant || getSkinVariant(skin.id, isPlayer1);
        if (_v === 'auto') _v = _ghostSkinOnDarkBg() ? 'light' : 'dark';
        const _light = (_v !== 'dark');
        skin = Object.assign({}, skin, _light
            ? { body: '#f4f8ff', nose: '#9bb8d3', eye: '#7df9ff' }    // белый призрак (базовый)
            : { body: '#2e2e44', nose: '#191926', eye: '#7df9ff' }); // тёмный призрак
        drawCtx.translate(0, Math.sin(gameTime * 0.12) * 2.5);
        drawCtx.globalAlpha = drawCtx.globalAlpha * 0.85;
        // Контурное свечение: тень повторяет каждый пиксельный прямоугольник кота
        drawCtx.shadowColor = _light ? 'rgba(125,249,255,0.85)' : 'rgba(120,90,220,0.85)';
        drawCtx.shadowBlur = 10 + Math.sin(gameTime * 0.1) * 4;
    }

    // --- froggy: вариант окраса (обычный / голубая шапочка) ---
    let frogVariant = null;
    if (skin.id === 'froggy') {
        frogVariant = skin._variant || getSkinVariant('froggy', isPlayer1);
        if (frogVariant !== 'bluehat') frogVariant = 'normal';
    }

    // Определяем, движется ли кот
    let isMoving = false;
    if (forcedMoving !== null) {
        isMoving = forcedMoving;
    } else if (controls) {
        if (numPlayers === 1 && isPlayer1)
            isMoving = keys['KeyA'] || keys['ArrowLeft'] || keys['KeyD'] || keys['ArrowRight'];
        else
            isMoving = keys[controls.left] || keys[controls.right];
    } else {
        isMoving = true;
    }

    // ----------------------------------------------------------------
    // ----------------------------------------------------------------
    // 2. ХВОСТ
    // ----------------------------------------------------------------
    {
        const tailBaseX = drawX + 2.2 * size;
        for (let i = 0; i < 6; i++) {
            const wag = Math.sin(gameTime * (isMoving ? 0.3 : 0.08) + i * 0.2)
                      * ((isMoving ? 0.4 : 0.1) * size);
            const segX = tailBaseX - size + (-Math.sin(i * 1.1) * 2 * size) + wag + (-i * 1.6 * size);
            const segY = drawY + 11 * size + (-i * 1.5 * size);

            // --- calico: двухцветный хвост ---
            if (skin.type === 'calico')
                drawCtx.fillStyle = (i % 2 === 0) ? '#e67e22' : '#2c3e50';
            // --- tabby: полосатый хвост ---
            else if (skin.type === 'tabby') {
                const stripe = (skin.id === 'newyear') ? '#e67e22' : '#2f3542';
                drawCtx.fillStyle = (i % 2 === 0) ? stripe : skin.body;
            }
            // --- samurai: тёмный с алым кончиком ---
            else if (skin.type === 'samurai')
                drawCtx.fillStyle = (i < 4) ? skin.body : '#8b0000';
            // --- foxcoat: золотой хвост ---
            else if (skin.type === 'foxcoat')
                drawCtx.fillStyle = '#fdd16a';
            // --- все остальные: цвет тела ---
            else
                drawCtx.fillStyle = skin.body;

            drawCtx.fillRect(segX, segY, 2.5 * size, 2.5 * size);
        }
    }

    // ----------------------------------------------------------------
    // 3. КРЫЛЬЯ — вспомогательная функция + задние крылья (angel)
    // ----------------------------------------------------------------
    const drawDetailedWing = (dx, dy, isBack, mirror) => {
        drawCtx.save();
        drawCtx.translate(dx, dy);
        if (mirror) drawCtx.scale(-1, 1);
        const cFill = '#ffffff', cOut = '#b2bec3', cShad = '#82ccdd';
        drawCtx.fillStyle = cFill;
        drawCtx.fillRect(1*size, -1*size, 4*size, 4*size);
        drawCtx.fillRect(0, 1*size, 1*size, 2*size);
        drawCtx.fillRect(0, -0.5*size, 1*size, 1.5*size);
        drawCtx.fillRect(2*size, -2*size, 4*size, 1*size);
        drawCtx.fillRect(4*size, -3*size, 3*size, 1*size);
        drawCtx.fillRect(6*size, -2*size, 1*size, 2*size);
        drawCtx.fillRect(5*size, 0, 1*size, 2*size);
        drawCtx.fillStyle = cOut;
        drawCtx.fillRect(0, 0, 1*size, 1*size);
        drawCtx.fillRect(1*size, -1*size, 1*size, 1*size);
        drawCtx.fillRect(2*size, -2*size, 1*size, 1*size);
        drawCtx.fillRect(3*size, -3*size, 2*size, 1*size);
        drawCtx.fillRect(5*size, -4*size, 2*size, 1*size);
        drawCtx.fillRect(7*size, -3*size, 1*size, 2*size);
        drawCtx.fillRect(6*size, -1*size, 1*size, 1*size);
        drawCtx.fillRect(6*size, 0, 1*size, 1*size);
        drawCtx.fillRect(5*size, 1*size, 1*size, 1*size);
        drawCtx.fillRect(5*size, 2*size, 1*size, 1*size);
        drawCtx.fillRect(2*size, 3*size, 3*size, 1*size);
        drawCtx.fillRect(1*size, 2*size, 1*size, 1*size);
        drawCtx.fillRect(0, 1*size, 1*size, 1*size);
        drawCtx.fillRect(0, -1*size, 1*size, 2*size);
        drawCtx.fillStyle = cShad;
        drawCtx.fillRect(4*size, -1*size, 2*size, 1*size);
        drawCtx.fillRect(3*size, 1*size, 2*size, 1*size);
        drawCtx.fillRect(1*size, 1*size, 1*size, 1*size);
        drawCtx.restore();
    };

    // --- angel: заднее крыло (левое) ---
    if (skin.acc === 'wings') {
        const flap = Math.sin(gameTime * (isJumping ? 0.8 : 0.5)) * 2;
        if (isJumping) {
            drawDetailedWing(drawX + 6*size, drawY + 4*size + flap, true, false);
        } else {
            const wx = drawX + 7*size, wy = drawY + 5*size + flap;
            drawCtx.fillStyle = '#b2bec3';
            drawCtx.fillRect(wx, wy, 4*size, 1*size);
            drawCtx.fillRect(wx + 3*size, wy + 1*size, 1*size, 3*size);
            drawCtx.fillRect(wx, wy + 1*size, 1*size, 2*size);
            drawCtx.fillRect(wx + 1*size, wy + 3*size, 2*size, 1*size);
        }
    }

    // ----------------------------------------------------------------
    // 4. ТЕЛО
    // ----------------------------------------------------------------

    // === foxcoat (Edward Elric red coat) ===
    if (skin.type === 'foxcoat') {
        const redMain  = '#a01101';
        const redDark  = '#7b0000';
        const blackBase = '#1e272e';
        const whiteTrim = '#ffffff';

        // Задний воротник (рисуется перед телом)
        drawCtx.fillStyle = redMain;
        drawCtx.fillRect(drawX - 0.75*size, drawY + 3.5*size, 3*size, 2.5*size);
        drawCtx.fillRect(drawX + 7.5*size,  drawY + 3.5*size, 3*size, 2.5*size);

        // Чёрная одежда (база)
        drawCtx.fillStyle = blackBase;
        drawCtx.fillRect(drawX + 3.5*size, drawY + 5*size, 5*size, 8*size);

        // Белые детали: молния, воротник, пояс
        drawCtx.fillStyle = whiteTrim;
        drawCtx.fillRect(drawX + 6*size,   drawY + 7*size,  0.6*size, 6*size);   // молния
        drawCtx.fillRect(drawX + 3.5*size, drawY + 6.5*size, 5*size, 1*size);    // воротник
        drawCtx.fillRect(drawX + 3.5*size, drawY + 12*size,  5*size, 1*size);    // пояс
        // V-вырез
        drawCtx.fillStyle = blackBase;
        drawCtx.fillRect(drawX + 4.5*size, drawY + 5*size, 1.2*size, 1*size);

        // Красный плащ — левая сторона
        drawCtx.fillStyle = redDark;
        drawCtx.fillRect(drawX - 0.5*size,  drawY + 5*size,  5.5*size, 6*size);
        drawCtx.fillRect(drawX - 1.25*size, drawY + 11*size, 6*size,   2*size);
        drawCtx.fillStyle = redMain;
        drawCtx.fillRect(drawX - 1.5*size,  drawY + 12*size, 5.5*size, 1.5*size);

        // Красный плащ — правая сторона
        drawCtx.fillStyle = redDark;
        drawCtx.fillRect(drawX + 7.5*size, drawY + 5*size,  3*size, 6*size);
        drawCtx.fillRect(drawX + 8*size,   drawY + 11*size, 3*size, 2*size);
        drawCtx.fillStyle = redMain;
        drawCtx.fillRect(drawX + 8.25*size, drawY + 12*size, 3.25*size, 1.5*size);

        // Передний и задний воротник
        drawCtx.fillStyle = redMain;
        drawCtx.fillRect(drawX - 1.5*size, drawY + 5*size, 5.5*size, 2*size);
        drawCtx.fillRect(drawX + 8.5*size, drawY + 5*size, 3*size,   2*size);

    // === cyber ===
    } else if (skin.type === 'cyber') {
        // Тело cyber полностью перерисовывается в секции FACE,
        // здесь только цвет тела как база (перекрывается ниже)
        drawCtx.fillStyle = skin.body;
        drawCtx.fillRect(drawX, drawY + 5*size, 10*size, 8*size);

    // === все остальные (solid, calico, tabby, samurai) ===
    } else {
        // Базовое тело
        drawCtx.fillStyle = skin.body;
        drawCtx.fillRect(drawX, drawY + 5*size, 10*size, 8*size);

        // --- calico: цветные пятна на теле ---
        if (skin.type === 'calico') {
            drawCtx.fillStyle = '#e67e22';
            drawCtx.fillRect(drawX + 4*size, drawY + 5*size, 4*size, 3*size);
            drawCtx.fillStyle = '#2c3e50';
            drawCtx.fillRect(drawX + 1*size, drawY + 8*size, 3*size, 3*size);
        }

        // --- tabby: полоски на теле ---
        if (skin.type === 'tabby') {
            const stripe = (skin.id === 'newyear') ? '#e67e22' : '#2f3542';
            drawCtx.fillStyle = stripe;
            if (skin.id === 'newyear') {
                drawCtx.fillRect(drawX - 1*size, drawY + 6*size, 3*size, 1.5*size);
                drawCtx.fillRect(drawX - 1*size, drawY + 9*size, 3*size, 1.5*size);
            } else {
                // froggy и другие tabby
                drawCtx.fillRect(drawX + 1*size, drawY + 6*size, 2*size, 1*size);
                drawCtx.fillRect(drawX + 1*size, drawY + 8*size, 2*size, 1*size);
                drawCtx.fillRect(drawX + 7*size, drawY + 6*size, 2*size, 1*size);
                drawCtx.fillRect(drawX + 7*size, drawY + 8*size, 2*size, 1*size);
            }
        }

        // --- samurai: броня поверх тела ---
        if (skin.type === 'samurai') {
            drawCtx.fillStyle = '#111111';
            drawCtx.fillRect(drawX, drawY + 5*size, 10*size, 8*size);
            // Пластины доспеха
            drawCtx.fillStyle = '#0a0a0a';
            drawCtx.fillRect(drawX + 3*size,   drawY + 5*size, 1.5*size, 5*size);
            drawCtx.fillRect(drawX + 5.5*size, drawY + 5*size, 1.5*size, 5*size);
            // Нагрудник
            drawCtx.fillStyle = '#d0d0d0';
            drawCtx.fillRect(drawX + 3.5*size, drawY + 5*size, 3*size, 1.5*size);
            // Пояс
            drawCtx.fillStyle = '#6b0000';
            drawCtx.fillRect(drawX, drawY + 9*size, 10*size, 2*size);
            drawCtx.fillStyle = '#8b0000';
            drawCtx.fillRect(drawX + 4*size, drawY + 9*size, 2*size, 2*size);
            // Застёжка
            drawCtx.fillStyle = '#b8860b';
            drawCtx.fillRect(drawX + 4.5*size, drawY + 9.5*size, 1*size, 1*size);
        }
    }

    // ----------------------------------------------------------------
    // 5. ГОЛОВА
    // ----------------------------------------------------------------
    {
        const headColor = (skin.type === 'foxcoat') ? '#fdd16a' : skin.body;
        drawCtx.fillStyle = headColor;
        drawCtx.fillRect(drawX,           drawY,          10*size, 5.5*size);
        drawCtx.fillRect(drawX + 3.75*size, drawY + 5*size, 4.5*size, 1.5*size);

        // --- calico: пятна на голове ---
        if (skin.type === 'calico') {
            drawCtx.fillStyle = '#2c3e50';
            drawCtx.fillRect(drawX, drawY, 4*size, 2*size);
            drawCtx.fillStyle = '#e67e22';
            drawCtx.fillRect(drawX + 6*size, drawY + 1*size, 4*size, 2*size);
        }

        // --- tabby (не newyear): полоски на голове ---
        if (skin.type === 'tabby' && skin.id !== 'newyear') {
            drawCtx.fillStyle = '#2f3542';
            drawCtx.fillRect(drawX,            drawY + 3*size,   2*size, 1*size);
            drawCtx.fillRect(drawX + 8*size,   drawY + 3*size,   2*size, 1*size);
            drawCtx.fillRect(drawX + 4.5*size, drawY + 0.5*size, 1*size, 1.5*size);
        }

        // --- samurai: затылочные пластины ---
        if (skin.type === 'samurai') {
            drawCtx.fillStyle = '#111111';
            drawCtx.fillRect(drawX,         drawY - 2*size, 3*size, 2*size);
            drawCtx.fillRect(drawX + 7*size, drawY - 2*size, 3*size, 2*size);
        }
    }

    // ----------------------------------------------------------------
    // 6. УШИ
    // ----------------------------------------------------------------
    {
        const headColor = (skin.type === 'foxcoat') ? '#fdd16a' : skin.body;

        // Левое ухо
        drawCtx.fillStyle = (skin.type === 'calico') ? '#2c3e50' : headColor;
        drawCtx.fillRect(drawX,          drawY - 2*size, 3*size, 2*size);
        drawCtx.fillRect(drawX,          drawY - 3*size, 1*size, 1*size);

        // Правое ухо
        drawCtx.fillStyle = (skin.type === 'calico') ? '#e67e22' : headColor;
        drawCtx.fillRect(drawX + 7*size, drawY - 2*size, 3*size, 2*size);
        drawCtx.fillRect(drawX + 9*size, drawY - 3*size, 1*size, 1*size);

        // --- newyear / angel: розовые внутренности ушей ---
        if (skin.id === 'newyear' || skin.id === 'angel') {
            drawCtx.fillStyle = '#ffafcc';
            drawCtx.fillRect(drawX + 1*size, drawY - 1.5*size, 1*size, 1*size);
            drawCtx.fillRect(drawX + 8*size, drawY - 1.5*size, 1*size, 1*size);
        }
    }

    // ----------------------------------------------------------------
    // 7. АНТЕННА / ОСОБЫЕ ЭЛЕМЕНТЫ НА ГОЛОВЕ
    // ----------------------------------------------------------------

    // --- foxcoat: аникэ-антенна (волосинка в форме дуги) ---
    if (skin.type === 'foxcoat') {
        drawCtx.fillStyle = '#fdd16a';
        drawCtx.fillRect(drawX + 4.5*size, drawY - 1*size,   1*size,   1*size);    // основание
        drawCtx.fillRect(drawX + 5.0*size, drawY - 2.5*size, 1*size,   1.5*size);  // середина
        drawCtx.fillRect(drawX + 4.0*size, drawY - 3.5*size, 1.5*size, 1*size);    // верх
        drawCtx.fillRect(drawX + 3.5*size, drawY - 4*size,   1*size,   1*size);    // кончик
    }

    // ----------------------------------------------------------------
    // 8. МОРДА (глаза, нос, специальные лица)
    // ----------------------------------------------------------------

    // === cyber: полностью кастомная морда + детали тела ===
    if (skin.type === 'cyber') {
        // Переопределяем голову в цвет схемы
        drawCtx.fillStyle = '#1abc9c';
        drawCtx.fillRect(drawX, drawY, 10*size, 5*size);
        drawCtx.fillRect(drawX, drawY - 2*size, 3*size, 2*size);
        drawCtx.fillRect(drawX + 7*size, drawY - 2*size, 3*size, 2*size);
        drawCtx.fillRect(drawX, drawY - 3*size, 1*size, 1*size);
        drawCtx.fillRect(drawX + 9*size, drawY - 3*size, 1*size, 1*size);
        // Рот — сканер
        drawCtx.fillStyle = '#ffffff';
        drawCtx.fillRect(drawX + 2*size, drawY + 3*size, 6*size, 2*size);
        drawCtx.fillStyle = '#2c3e50';
        drawCtx.fillRect(drawX + 4.5*size, drawY + 3.5*size, 1*size, 0.5*size);
        // Три глаза
        drawCtx.fillStyle = '#2c3e50';
        drawCtx.fillRect(drawX + 1.5*size, drawY + 1*size,   2*size, 2*size);
        drawCtx.fillRect(drawX + 4*size,   drawY + 0.5*size, 2*size, 2*size);
        drawCtx.fillRect(drawX + 6.5*size, drawY + 1*size,   2*size, 2*size);
        drawCtx.fillStyle = '#34495e';
        drawCtx.fillRect(drawX + 2*size,   drawY + 1.5*size, 1*size, 1*size);
        drawCtx.fillRect(drawX + 4.5*size, drawY + 1*size,   1*size, 1*size);
        drawCtx.fillRect(drawX + 7*size,   drawY + 1.5*size, 1*size, 1*size);
        // Блики
        drawCtx.fillStyle = '#81ecec';
        drawCtx.fillRect(drawX + 2.2*size, drawY + 1.5*size, 0.4*size, 0.4*size);
        drawCtx.fillRect(drawX + 4.7*size, drawY + 1*size,   0.4*size, 0.4*size);
        drawCtx.fillRect(drawX + 7.2*size, drawY + 1.5*size, 0.4*size, 0.4*size);
        // Боковая панель
        drawCtx.fillStyle = '#2d3436';
        drawCtx.fillRect(drawX - 1*size, drawY + 1*size, 1.5*size, 3*size);
        drawCtx.fillStyle = '#00ff00';
        drawCtx.fillRect(drawX - 1*size, drawY + 2*size, 1*size, 1*size);
        // Детали тела
        drawCtx.fillStyle = '#ff0099';
        drawCtx.fillRect(drawX + 3*size, drawY + 6*size, 6*size, 2.5*size);
        drawCtx.fillStyle = '#00ffff';
        drawCtx.fillRect(drawX + 4.5*size, drawY + 6*size, 1*size, 2.5*size);
        drawCtx.fillRect(drawX + 7*size,   drawY + 6*size, 1*size, 2.5*size);
        drawCtx.fillStyle = '#e67e22';
        drawCtx.fillRect(drawX + 9*size,   drawY + 6.5*size, 1*size, 1.5*size);
        drawCtx.fillStyle = '#2d3436';
        drawCtx.fillRect(drawX, drawY + 11*size, 10*size, 1*size);
        drawCtx.fillStyle = '#8e44ad';
        drawCtx.fillRect(drawX + 4*size, drawY + 11*size, 2*size, 1.5*size);
        drawCtx.fillStyle = '#00ff00';
        drawCtx.fillRect(drawX + 4.5*size, drawY + 11.2*size, 1*size, 0.5*size);

    // === samurai: маска, глаза-щели, наплечники ===
    } else if (skin.type === 'samurai') {
        // Маска
        drawCtx.fillStyle = '#2a2a2a';
        drawCtx.fillRect(drawX + 1*size, drawY + 1*size, 8*size, 4*size);
        // Глаза
        drawCtx.fillStyle = skin.eye;
        drawCtx.fillRect(drawX + 2*size,   drawY + 2*size, 2.5*size, 1*size);
        drawCtx.fillRect(drawX + 6.5*size, drawY + 2*size, 2.5*size, 1*size);
        // Свечение глаз
        drawCtx.fillStyle = 'rgba(255,0,0,0.25)';
        drawCtx.fillRect(drawX + 2*size,   drawY + 1.5*size, 2.5*size, 2*size);
        drawCtx.fillRect(drawX + 6.5*size, drawY + 1.5*size, 2.5*size, 2*size);
        drawCtx.fillStyle = '#ff3333';
        drawCtx.fillRect(drawX + 2.5*size, drawY + 2*size, 1*size, 0.8*size);
        drawCtx.fillRect(drawX + 7*size,   drawY + 2*size, 1*size, 0.8*size);
        drawCtx.fillStyle = '#8b0000';
        drawCtx.fillRect(drawX + 2*size,   drawY + 1.5*size, 0.5*size, 0.8*size);
        drawCtx.fillRect(drawX + 8*size,   drawY + 1.5*size, 0.5*size, 0.8*size);
        // Рот
        drawCtx.fillStyle = '#3d1010';
        drawCtx.fillRect(drawX + 3.5*size, drawY + 4*size, 3*size, 0.5*size);
        // Наплечники
        drawCtx.fillStyle = '#c8c8c8';
        drawCtx.fillRect(drawX - 0.5*size, drawY, 1*size, 5*size);
        drawCtx.fillRect(drawX + 10*size,  drawY, 1*size, 5*size);

    // === все остальные: стандартные глаза и нос ===
    } else {
        // foxcoat имеет золотые глаза
        const eyeColor = (skin.type === 'foxcoat') ? '#f39c12' : skin.eye;
        // --- ghost: свечение вокруг глаз ---
        if (skin.type === 'ghost') {
            drawCtx.fillStyle = 'rgba(125,249,255,0.30)';
            drawCtx.fillRect(drawX + 1.5*size, drawY + 1.5*size, 3*size, 3*size);
            drawCtx.fillRect(drawX + 6.5*size, drawY + 1.5*size, 3*size, 3*size);
        }
        drawCtx.fillStyle = eyeColor;
        drawCtx.fillRect(drawX + 2*size, drawY + 2*size, 2*size, 2*size);
        drawCtx.fillRect(drawX + 7*size, drawY + 2*size, 2*size, 2*size);
        // Блик
        drawCtx.fillStyle = 'white';
        drawCtx.fillRect(drawX + 2*size, drawY + 2*size, 1*size, 1*size);
        drawCtx.fillRect(drawX + 7*size, drawY + 2*size, 1*size, 1*size);
        // Нос
        drawCtx.fillStyle = skin.nose;
        drawCtx.fillRect(drawX + 5*size, drawY + 4*size, 1*size, 0.5*size);
    }

    // ----------------------------------------------------------------
    // 9. АКСЕССУАРЫ (шляпы, ободки, гирлянды)
    // ----------------------------------------------------------------

    // --- newyear: шапка Санты ---
    if (skin.hat === 'santa') {
        drawCtx.fillStyle = '#ffffff';
        drawCtx.fillRect(drawX, drawY - 2*size, 10*size, 1.5*size);
        drawCtx.fillStyle = '#d63031';
        drawCtx.fillRect(drawX + 1*size, drawY - 5*size, 8*size, 3*size);
        drawCtx.fillRect(drawX - 1*size, drawY - 4*size, 2*size, 3*size);
        drawCtx.fillRect(drawX - 2*size, drawY - 2*size, 2*size, 2*size);
        drawCtx.fillStyle = '#ffffff';
        drawCtx.fillRect(drawX - 3.5*size, drawY - 1*size, 2*size, 2*size);
    }

    // --- newyear: гирлянда на теле ---
    if (skin.acc === 'garland') {
        drawCtx.fillStyle = '#1e272e';
        drawCtx.fillRect(drawX - 1*size, drawY + 6*size, 2*size, 1*size);
        drawCtx.fillRect(drawX + 1*size, drawY + 7*size, 2*size, 1*size);
        drawCtx.fillRect(drawX + 3*size, drawY + 8*size, 2*size, 1*size);
        drawCtx.fillRect(drawX + 5*size, drawY + 9*size, 2*size, 1*size);
        drawCtx.fillRect(drawX + 7*size, drawY + 8*size, 2*size, 1*size);
        drawCtx.fillRect(drawX + 9*size, drawY + 7*size, 2*size, 1*size);
        const tick = Math.floor(gameTime / 15);
        const xmasColors = ['#f1c40f', '#2ecc71', '#e74c3c', '#3498db'];
        const drawLight = (lx, ly, col) => {
            drawCtx.fillStyle = col;
            drawCtx.fillRect(lx, ly - 0.5*size, 1*size, 2*size);
            drawCtx.fillRect(lx - 0.5*size, ly, 2*size, 1*size);
        };
        drawLight(drawX,          drawY + 6*size, xmasColors[tick % 4]);
        drawLight(drawX + 3*size, drawY + 8*size, xmasColors[(tick + 1) % 4]);
        drawLight(drawX + 6*size, drawY + 9*size, xmasColors[(tick + 2) % 4]);
        drawLight(drawX + 9*size, drawY + 7*size, xmasColors[(tick + 3) % 4]);
    }

    // --- angel: нимб ---
    if (skin.hat === 'halo') {
        const floatY = Math.sin(gameTime * 0.15) * 2;
        drawCtx.fillStyle = '#f1c40f';
        drawCtx.fillRect(drawX + 2*size, drawY - 7*size + floatY, 6*size, 1*size);
        drawCtx.fillRect(drawX + 2*size, drawY - 5*size + floatY, 6*size, 1*size);
        drawCtx.fillRect(drawX + 1*size, drawY - 6*size + floatY, 1*size, 1*size);
        drawCtx.fillRect(drawX + 8*size, drawY - 6*size + floatY, 1*size, 1*size);
    }

    // --- angel: переднее крыло (правое) ---
    if (skin.acc === 'wings') {
        const flap = Math.sin(gameTime * (isJumping ? 0.8 : 0.5)) * 2;
        if (isJumping) {
            drawDetailedWing(drawX + 1*size, drawY + 4*size + flap, false, true);
        } else {
            const wx = drawX - 3*size, wy = drawY + 5*size + flap;
            drawCtx.fillStyle = '#b2bec3';
            drawCtx.fillRect(wx + 1*size, wy,          3*size, 1*size);
            drawCtx.fillRect(wx,          wy + 1*size,  1*size, 4*size);
            drawCtx.fillRect(wx + 4*size, wy + 1*size,  1*size, 2*size);
            drawCtx.fillRect(wx + 3*size, wy + 3*size,  1*size, 2*size);
            drawCtx.fillRect(wx + 1*size, wy + 4*size,  1*size, 1*size);
            drawCtx.fillStyle = '#ffffff';
            drawCtx.fillRect(wx + 1*size, wy + 1*size,  3*size, 2*size);
            drawCtx.fillRect(wx + 1*size, wy + 3*size,  2*size, 1*size);
            drawCtx.fillStyle = '#b2bec3';
            drawCtx.fillRect(wx + 2*size, wy + 1.5*size, 1*size, 0.5*size);
            drawCtx.fillRect(wx + 1.5*size, wy + 3*size, 1*size, 0.5*size);
        }
    }

    // --- witch: ведьминская шляпа ---
    if (skin.hat === 'witch') {
        drawCtx.fillStyle = '#2c2c2c';
        drawCtx.fillRect(drawX - 2*size, drawY - 1*size,  14*size, 1.5*size);
        drawCtx.fillRect(drawX + 1*size, drawY - 3*size,   8*size, 2*size);
        drawCtx.fillStyle = '#8e44ad';
        drawCtx.fillRect(drawX + 1*size, drawY - 2.5*size, 8*size, 1*size);
        drawCtx.fillStyle = '#2c2c2c';
        drawCtx.fillRect(drawX + 2*size, drawY - 5*size,   6*size, 2*size);
        drawCtx.fillRect(drawX + 3*size, drawY - 7*size,   4*size, 2*size);
        drawCtx.fillRect(drawX + 4*size, drawY - 8*size,   2*size, 1*size);
    }

    // --- sims: плумбоб ---
    if (skin.hat === 'plumbob') {
        const bobY = drawY - 12*size + Math.sin(gameTime * 0.1) * 3;
        const bobX = drawX + 3.5*size;
        drawCtx.fillStyle = '#2ecc71';
        drawCtx.beginPath();
        drawCtx.moveTo(bobX + 1.5*size, bobY);
        drawCtx.lineTo(bobX + 3*size,   bobY + 3*size);
        drawCtx.lineTo(bobX,            bobY + 3*size);
        drawCtx.fill();
        drawCtx.fillStyle = '#27ae60';
        drawCtx.beginPath();
        drawCtx.moveTo(bobX,          bobY + 3*size);
        drawCtx.lineTo(bobX + 3*size, bobY + 3*size);
        drawCtx.lineTo(bobX + 1.5*size, bobY + 6*size);
        drawCtx.fill();
    }

    // --- froggy: шапка-лягушка ---
    if (skin.hat === 'frog') {
        const green = (frogVariant === 'bluehat') ? '#5fb0f0' : '#badc58';
        const white = '#ffffff', black = '#000000';
        drawCtx.fillStyle = green;
        drawCtx.fillRect(drawX - 1*size,   drawY - 1.5*size, 12*size, 3.5*size);
        drawCtx.fillRect(drawX - 1.5*size, drawY + 1*size,    3*size, 5*size);
        drawCtx.fillRect(drawX + 8.5*size, drawY + 1*size,    3*size, 5*size);
        drawCtx.fillRect(drawX + 1*size,   drawY + 4.5*size,  8*size, 1.5*size);
        // Левый глаз лягушки
        drawCtx.fillStyle = green;
        drawCtx.fillRect(drawX + 0.5*size, drawY - 4*size, 3.5*size, 3*size);
        drawCtx.fillStyle = white;
        drawCtx.fillRect(drawX + 1*size,   drawY - 3.5*size, 2.5*size, 2.5*size);
        drawCtx.fillStyle = black;
        drawCtx.fillRect(drawX + 2*size,   drawY - 3*size, 1*size, 1*size);
        // Правый глаз лягушки
        drawCtx.fillStyle = green;
        drawCtx.fillRect(drawX + 6*size,   drawY - 4*size, 3.5*size, 3*size);
        drawCtx.fillStyle = white;
        drawCtx.fillRect(drawX + 6.5*size, drawY - 3.5*size, 2.5*size, 2.5*size);
        drawCtx.fillStyle = black;
        drawCtx.fillRect(drawX + 7*size,   drawY - 3*size, 1*size, 1*size);
        // Ноздри
        drawCtx.fillStyle = '#2d3436';
        drawCtx.fillRect(drawX + 4*size,   drawY - 0.5*size, 0.5*size, 0.5*size);
        drawCtx.fillRect(drawX + 5.5*size, drawY - 0.5*size, 0.5*size, 0.5*size);
    }

    // --- samurai: шлем-кабуто ---
    if (skin.hat === 'samurai') {
        const hatY = drawY - 2*size;
        // Тень под шлемом
        drawCtx.fillStyle = 'rgba(0,0,0,0.55)';
        drawCtx.fillRect(drawX, drawY - 0.5*size, 10*size, 3*size);
        // Поля (широкий флэнж)
        drawCtx.fillStyle = '#1a1008';
        drawCtx.fillRect(drawX - 5*size, hatY + 0.5*size, 20*size, 3*size);
        drawCtx.fillStyle = '#2d1f0e';
        drawCtx.fillRect(drawX - 4*size, hatY, 18*size, 2.5*size);
        drawCtx.fillStyle = '#4a3015';
        drawCtx.fillRect(drawX - 3*size, hatY, 16*size, 0.8*size);
        // Ламинарные пластины
        drawCtx.fillStyle = '#1a1008';
        for (let ti = 0; ti < 9; ti++)
            drawCtx.fillRect(drawX - 3*size + ti * 2*size, hatY + 0.8*size, 0.4*size, 1.8*size);
        // Купол шлема
        drawCtx.fillStyle = '#2d1f0e';
        drawCtx.fillRect(drawX - 2*size, hatY - 0.5*size, 14*size, 1*size);
        drawCtx.fillRect(drawX - 1*size, hatY - 1.5*size, 12*size, 1*size);
        drawCtx.fillStyle = '#261a0a';
        drawCtx.fillRect(drawX + 1*size, hatY - 3*size, 8*size, 2*size);
        drawCtx.fillStyle = '#1e1206';
        drawCtx.fillRect(drawX + 2*size, hatY - 4*size, 6*size, 2*size);
        drawCtx.fillRect(drawX + 3*size, hatY - 5*size,   4*size, 1.5*size);
        drawCtx.fillRect(drawX + 4*size, hatY - 6*size, 2*size, 1.2*size);
        drawCtx.fillRect(drawX + 4.5*size, hatY - 7*size, 1*size, 1*size);
        // Обводка
        drawCtx.fillStyle = '#0a0500';
        drawCtx.fillRect(drawX, hatY - 1.5*size, 10*size, 0.8*size);
        // Красная лента
        drawCtx.fillStyle = '#8b0000';
        drawCtx.fillRect(drawX - 1*size, hatY - 1*size, 12*size, 0.5*size);
    }

    // ----------------------------------------------------------------
    // 9.5 КАТАНА (samurai — рисуется НА ПЕРЕДНЕМ ПЛАНЕ, поверх тела)
    // ----------------------------------------------------------------
    if (skin.acc === 'katana') {
        const bob = Math.sin(gameTime * 0.15);
        drawCtx.save();
        drawCtx.translate(drawX - 2 * size, drawY + 10 * size + bob);
        drawCtx.rotate(1.2);

        // Лезвие
        drawCtx.fillStyle = '#1a1a1a';
        drawCtx.fillRect(-1 * size, -6 * size, 2.5 * size, 10 * size);
        drawCtx.fillRect(-1 * size, -6 * size, 1.7 * size, 11 * size);
        drawCtx.fillRect(-1 * size, -6 * size, 0.9 * size, 12 * size);
        // Кровосток
        drawCtx.fillStyle = '#8b0000';
        // drawCtx.fillRect(-1.2 * size, -6 * size, 0.5 * size, 10 * size);
        drawCtx.fillRect( 1.2 * size, -6 * size, 0.5 * size, 9 * size);
        // Гарда
        drawCtx.fillStyle = '#ffd700';
        drawCtx.fillRect(-2 * size, -6.5 * size, 4.5 * size, 1.5 * size);
        drawCtx.fillStyle = '#8b0000';
        drawCtx.fillRect(-0.5 * size, -6.3 * size, 1.5 * size, 1 * size);
        // Рукоять
        drawCtx.fillStyle = '#0a0a0a';
        drawCtx.fillRect(-0.8 * size, -9 * size, 2 * size, 3 * size);
        drawCtx.fillStyle = '#333';
        for (let k = 0; k < 3; k++)
            drawCtx.fillRect(-0.5 * size, -8.5 * size + k * size, 1.2 * size, 0.3 * size);
        // Навершие
        drawCtx.fillStyle = '#ffd700';
        drawCtx.fillRect(-1 * size, -10 * size, 2.5 * size, 1.5 * size);
        // Аура при движении
        // if (isMoving) {
        //     drawCtx.fillStyle = 'rgba(255,0,0,0.15)';
        //     drawCtx.fillRect(-2.5 * size, -7 * size, 5.5 * size, 16 * size);
        //     drawCtx.fillStyle = 'rgba(255,0,0,0.3)';
        //     drawCtx.fillRect(-1.5 * size, -6 * size, 3.5 * size, 14 * size);
        // }
        drawCtx.restore();
    }

    // ----------------------------------------------------------------
    // 10. НОГИ
    // ----------------------------------------------------------------
    if (skin.type === 'ghost') {
        // У призрака вместо ног — волнистый призрачный шлейф
        const ph = Math.floor(gameTime / 10) % 2;
        drawCtx.fillStyle = skin.body;
        for (let i = 0; i < 5; i++) {
            drawCtx.fillRect(drawX + i * 2 * size, drawY + 12.6 * size + ((i + ph) % 2) * size, 2 * size, 1.6 * size);
        }
        // Лёгкая дымка под шлейфом (цвет зависит от варианта окраса)
        drawCtx.fillStyle = (skin.body === '#2e2e44') ? 'rgba(70,70,110,0.45)' : 'rgba(207,232,245,0.35)';
        for (let i = 0; i < 3; i++) {
            const wob = Math.sin(gameTime * 0.15 + i * 2.1) * size;
            drawCtx.fillRect(drawX + (1.5 + i * 3) * size + wob, drawY + 14.6 * size, 1.5 * size, 1 * size);
        }
    } else {
        let legColor;

        // --- samurai ---
        if (skin.id === 'samurai')
            legColor = '#1a1a1a';
        // --- foxcoat (Edward): чёрные штаны ---
        else if (skin.type === 'foxcoat')
            legColor = '#1e272e';
        // --- newyear: жёлтые лапки ---
        else if (skin.id === 'newyear')
            legColor = '#ffeaa7';
        // --- angel: светлые лапки ---
        else if (skin.id === 'angel')
            legColor = '#dcdde1';
        // --- cyber: тёмные ---
        else if (skin.type === 'cyber')
            legColor = '#1e272e';
        // --- calico / sims / белые тела: серые лапки ---
        else if (skin.body === '#fff' || skin.type === 'calico' || skin.nameKey === 'skins.sims')
            legColor = '#ccc';
        // --- тёмные тела (#2c3e50): чуть светлее ---
        else if (skin.body === '#2c3e50')
            legColor = '#34495e';
        // --- tabby: цвет тела ---
        else if (skin.type === 'tabby')
            legColor = skin.body;
        // --- остальные ---
        else
            legColor = '#fff';

        drawCtx.fillStyle = legColor;
        const legOff = (isMoving && Math.floor(gameTime / 10) % 2 === 0) ? size : 0;
        drawCtx.fillRect(drawX + 2*size, drawY + 13*size - legOff, 2*size, 2*size);
        drawCtx.fillRect(drawX + 7*size, drawY + 13*size + legOff, 2*size, 2*size);
    }

    drawCtx.restore();
}

function drawMenuScene() {
    if (menuTheme === 'moon') { drawMenuMoonScene(); return; }
    let grad = ctx.createLinearGradient(0, 0, 0, LOGICAL_H); grad.addColorStop(0, "#87CEEB"); grad.addColorStop(1, "#E0F7FA"); ctx.fillStyle = grad; ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    drawRainbow(ctx, -LOGICAL_W / 2); drawSun(ctx, LOGICAL_W - 150, 100, 40, "#f1c40f", "#f39c12");
    ctx.fillStyle = "rgba(255,255,255,0.6)"; let cloudOff = (gameTime * 0.5) % 2000; ctx.fillRect(200 - cloudOff, 100, 100, 30); ctx.fillRect(1500 - cloudOff, 150, 80, 25);
    let groundY = LOGICAL_H - 100;
    const bgS = Math.max(0.55, Math.min(1, Math.min(LOGICAL_W / 1000, LOGICAL_H / 640))); // адаптация под мобилки
    drawPixelGround(ctx, 0, groundY, LOGICAL_W, 500);
    const menuScale = Math.max(2, Math.round(4 * bgS));
    const menuStep = (TREE_SPRITE_LEAVES[0].length + 1) * menuScale;
    for (let tx = 0; tx < LOGICAL_W + menuStep; tx += menuStep) {
        if (tx > LOGICAL_W / 2 - 200 && tx < LOGICAL_W / 2 + 200) continue;
        drawPixelTree(ctx, tx, LOGICAL_H - 100, menuScale, Math.sin(tx * 0.37) * 999);
    }
    ctx.save(); ctx.translate(LOGICAL_W / 2, groundY); ctx.scale(bgS, bgS); drawCastle(ctx, 0, 0); ctx.restore();
    menuPixies.forEach(p => p.draw(ctx));
}

// ---- Лунная тема главного меню: космос, звёзды, Земля, лунная поверхность, замок ----
const MENU_EARTH_GRID = [
    "________________________________________","________________________________________",
    "_______________5111111225_______________","_____________55511111222255_____________",
    "___________544551112222225556___________","_________5544455112222222225666_________",
    "________555444551122222222224666________","_______55544445511222222222244466_______",
    "______5655444455112222222222544666______","_____665544445511122222222225554466_____",
    "_____665544445511122222222211555445_____","____66554444551111222222221111554455____",
    "____66554444661111222222221116444455____","___6665544446611112222222111644444555___",
    "___3665544445511112222222115444444556___","__333665544555111222222211555444445566__",
    "__333665555555442222222211555555445566__","__333336655554442222222211555555445566__",
    "__333336666644442222222211555444445566__","__333333366644442222222211554444445566__",
    "__333333333333111222222211554444445566__","__333333333333111122222221155444445566__",
    "__333333333333666662222221155444445566__","__333333333336666666222222115544455666__",
    "__333333333336655555122222115544455666__","___3333333366555555511222221154455666___",
    "___3333333366554455566222221155555666___","____33333366554444556622222221555566____",
    "____33333366554444556622222222255566____","_____333333665544455622222222222556_____",
    "_____333333665544455222222222223335_____","______3333333665445522222222223333______",
    "_______33333366555552222222222333_______","________333333366555222222222333________",
    "_________3333336655522222223333_________","___________333333655222223333___________",
    "_____________33333332222233_____________","_______________3333322223_______________",
    "________________________________________","________________________________________"
];
const MENU_EARTH_COLORS = { '1':'#5bafff','2':'#2f74ff','3':'#1c3cc7','4':'#b5e61d','5':'#2db43e','6':'#12742d' };
let _menuEarthCacheW = 0;
function drawMenuEarth(ex, ey, ew) {
    const cells = 40, cs = Math.max(2, Math.round(ew / cells)), bw = cs * cells;
    if (!_menuEarthCache || _menuEarthCacheW !== bw) {
        _menuEarthCacheW = bw;
        _menuEarthCache = document.createElement('canvas');
        _menuEarthCache.width = bw; _menuEarthCache.height = bw;
        const ec = _menuEarthCache.getContext('2d');
        ec.imageSmoothingEnabled = false;
        for (let r = 0; r < cells; r++) for (let c = 0; c < cells; c++) {
            const ch = MENU_EARTH_GRID[r][c]; if (ch === '_') continue;
            ec.fillStyle = MENU_EARTH_COLORS[ch]; ec.fillRect(c * cs, r * cs, cs, cs);
        }
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(_menuEarthCache, Math.round(ex), Math.round(ey), bw, bw);
}
// Наведение на флаг Перми -> плавное появление perm.jpg (за флагом, чуть за поверхностью)
let _permImg = null, _permHover = false, _permAlpha = 0, _permFlagRect = null, _permHoverBound = false, _permLastT = 0, _permTapShow = false;
function _bindPermHover() {
    if (_permHoverBound) return;
    _permHoverBound = true;
    window.addEventListener('mousemove', (e) => {
        if (menuTheme !== 'moon' || isPlaying || !_permFlagRect) { _permHover = false; return; }
        const rc = canvas.getBoundingClientRect();
        if (!rc.width || !rc.height) { _permHover = false; return; }
        const lx = (e.clientX - rc.left) * (LOGICAL_W / rc.width);
        const ly = (e.clientY - rc.top) * (LOGICAL_H / rc.height);
        const fr = _permFlagRect;
        _permHover = (lx >= fr.x && lx <= fr.x + fr.w && ly >= fr.y && ly <= fr.y + fr.h);
    });
    // Тап/клик по флагу — показать/скрыть картинку (для мобилок без наведения)
    window.addEventListener('pointerdown', (e) => {
        if (menuTheme !== 'moon' || isPlaying || !_permFlagRect) return;
        const rc = canvas.getBoundingClientRect();
        if (!rc.width || !rc.height) return;
        const lx = (e.clientX - rc.left) * (LOGICAL_W / rc.width);
        const ly = (e.clientY - rc.top) * (LOGICAL_H / rc.height);
        const fr = _permFlagRect;
        const onFlag = (lx >= fr.x && lx <= fr.x + fr.w && ly >= fr.y && ly <= fr.y + fr.h);
        _permTapShow = onFlag ? !_permTapShow : false;
    });
}
function drawPermImage(flagBaseX, groundY, fs, availRight) {
    fs = fs || 1; availRight = availRight || LOGICAL_W;
    if (!_permImg) { _permImg = new Image(); _permImg.src = 'media/Perm.jpg'; }
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const dt = _permLastT ? Math.min(0.1, (now - _permLastT) / 1000) : 0;
    _permLastT = now;
    // плавный переход за ~1 секунду (0 -> 0.5), независимо от FPS
    _permAlpha = Math.max(0, Math.min(0.5, _permAlpha + ((_permHover || _permTapShow) ? 1 : -1) * 0.5 * dt));
    if (_permAlpha < 0.004) return;
    if (!_permImg.complete || !_permImg.naturalWidth) return;
    const nW = _permImg.naturalWidth, nH = _permImg.naturalHeight;
    const poleW = Math.max(2, Math.round(3 * fs)), fw = Math.round(76 * fs);
    const flagCx = flagBaseX + poleW + fw / 2;
    const _ppW = Math.max(4, Math.round(10 * fs));
    const leftLimit = 8 + _ppW, rightLimit = Math.max(leftLimit + 40, availRight - 6);
    let imgW = Math.min(6 * fw, LOGICAL_W * 0.9);
    let ix = Math.round(flagCx - imgW / 2);
    if (ix < leftLimit) ix = leftLimit;
    if (ix + imgW > rightLimit) imgW = rightLimit - ix;       // ужать, чтобы не залезть под меню
    if (imgW < 40) return;
    const imgH = imgW * (nH / nW);
    const iy = Math.round(groundY - Math.round(30 * fs) - imgH);
    const ampMax = imgH * 0.018;
    // полупрозрачное древко на левом крае картинки (масштабируется)
    const _ppX = ix - _ppW, _ppTop = iy - Math.round(12 * fs), _ppBot = groundY + 8, _ppHl = Math.max(1, Math.round(3 * fs));
    ctx.save();
    ctx.globalAlpha = Math.min(0.45, _permAlpha);
    ctx.fillStyle = '#c9c9d4'; ctx.fillRect(_ppX, _ppTop, _ppW, _ppBot - _ppTop);
    ctx.fillStyle = '#eef0f6'; ctx.fillRect(_ppX + 1, _ppTop, _ppHl, _ppBot - _ppTop);
    ctx.fillStyle = '#9a9aa8'; ctx.fillRect(_ppX + _ppW - 3, _ppTop, 3, _ppBot - _ppTop);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(_ppX - 2, _ppTop - 9, _ppW + 4, 9);
    ctx.restore();
    // полотно — развевается (спокойнее слева, развевается справа)
    ctx.save();
    ctx.globalAlpha = Math.min(0.5, _permAlpha);
    ctx.imageSmoothingEnabled = true;
    const strip = 3;
    for (let sx = 0; sx < imgW; sx += strip) {
        const tt = sx / imgW;
        const wob = Math.sin(sx * 0.045 - gameTime * 0.05) * (ampMax * tt) + Math.sin(gameTime * 0.025) * 1.2 * tt;
        const sw = Math.min(strip, imgW - sx);
        ctx.drawImage(_permImg, (sx / imgW) * nW, 0, (sw / imgW) * nW, nH, ix + sx, iy + wob, sw, imgH);
    }
    ctx.restore();
    ctx.imageSmoothingEnabled = false;
}

// Кометы лунной темы: летят по диагонали (слева-сверху → справа-вниз), место — случайное
function drawMenuComets() {
    const groundY = LOGICAL_H - 100;
    const diag = LOGICAL_W + LOGICAL_H + 400;
    for (let i = 0; i < 3; i++) {
        const speed = 0.004 + i * 0.0013, phase = i * 0.41;
        const raw = gameTime * speed + phase;
        const cyc = Math.floor(raw), tt = raw - cyc;
        const hh = Math.sin((cyc * 7 + i * 131) * 12.9898) * 43758.5453;
        const lane = hh - Math.floor(hh);
        const startX = -200 + lane * (LOGICAL_W + 200), startY = -220;
        const x = startX + tt * diag, y = startY + tt * diag;
        if (y > groundY + 20 || x > LOGICAL_W + 60 || x < -80) continue;
        for (let k = 10; k >= 1; k--) {                      // хвост (вверх-влево)
            const a = (1 - k / 10) * 0.55, sz = Math.max(1, Math.round(6 - k * 0.5));
            ctx.fillStyle = 'rgba(150,220,255,' + a.toFixed(3) + ')';
            ctx.fillRect((x - k * 6) | 0, (y - k * 6) | 0, sz, sz);
        }
        ctx.fillStyle = 'rgba(200,240,255,0.6)'; ctx.fillRect((x - 5) | 0, (y - 5) | 0, 11, 11);
        ctx.fillStyle = '#ffffff'; ctx.fillRect((x - 2) | 0, (y - 2) | 0, 6, 6);
    }
}
// Пиксельный овал (ячейки выровнены по сетке P)
function _pixOval(cx, cy, rx, ry, P, col) {
    ctx.fillStyle = col;
    const x0 = Math.round((cx - rx) / P) * P, x1 = Math.round((cx + rx) / P) * P;
    const y0 = Math.round((cy - ry) / P) * P, y1 = Math.round((cy + ry) / P) * P;
    for (let py = y0; py <= y1; py += P) for (let px = x0; px <= x1; px += P) {
        const nx = (px + P / 2 - cx) / rx, ny = (py + P / 2 - cy) / ry;
        if (nx * nx + ny * ny <= 1) ctx.fillRect(px, py, P, P);
    }
}
// Декоративные пиксельные кратеры на лунной поверхности
function drawMoonCraters(groundY) {
    const W = LOGICAL_W, P = 4;
    const craters = [[W * 0.10, groundY + 55, 30], [W * 0.46, groundY + 36, 19], [W * 0.64, groundY + 66, 38], [W * 0.84, groundY + 44, 24], [W * 0.93, groundY + 74, 30]];
    for (const cr of craters) {
        const cx = cr[0], cy = cr[1], r = cr[2], ry = r * 0.45;
        _pixOval(cx, cy, r, ry, P, '#8a8a98');                                  // светлый обод
        _pixOval(cx, cy + P, r - P, ry - P, P, '#50505f');                      // тёмная чаша
        _pixOval(cx, cy + 2 * P, (r - P) * 0.62, (ry - P) * 0.5, P, '#3e3e4a'); // тень в центре
    }
}
// Статичный пиксельный флаг «Пермь / Perm», воткнутый в поверхность
function drawMoonFlag(baseX, groundY, fs) {
    fs = fs || 1;
    const poleW = Math.max(2, Math.round(3 * fs));
    const poleH = Math.round(92 * fs), poleTop = groundY - poleH;
    const fw = Math.round(76 * fs), fh = Math.round(40 * fs);
    _permFlagRect = { x: baseX - 6, y: poleTop - 8, w: poleW + fw + 16, h: poleH + 22 };  // зона наведения/тапа
    ctx.fillStyle = '#d7d7e0'; ctx.fillRect(baseX, poleTop, poleW, poleH + 10);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(baseX - 1, poleTop - 4, poleW + 2, 5);
    const fx = baseX + poleW, fy = poleTop + 2;
    const edge = Math.max(2, Math.round(5 * fs)), tr = Math.max(2, Math.round(3 * fs));
    ctx.fillStyle = '#c0392b'; ctx.fillRect(fx, fy, fw, fh);                 // тело флага
    ctx.fillStyle = '#9c2b1e'; ctx.fillRect(fx + fw - edge, fy, edge, fh);   // тень у свободного края
    ctx.fillStyle = '#f5f5ef'; ctx.fillRect(fx, fy, fw, tr); ctx.fillRect(fx, fy + fh - tr, fw, tr); // белые полосы
    const label = (typeof window !== 'undefined' && window.currentLang === 'en') ? 'PERM' : 'ПЕРМЬ';
    ctx.save();
    ctx.font = Math.max(7, Math.round(12 * fs)) + "px 'Press Start 2P', monospace";
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, fx + fw / 2, fy + fh / 2);
    ctx.restore();
}

function drawMenuMoonScene() {
    // Космический градиент (как на megahard)
    let g = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
    g.addColorStop(0, "#000008"); g.addColorStop(0.5, "#050520"); g.addColorStop(1, "#0a0a30");
    ctx.fillStyle = g; ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    // Звёзды (мерцают), заполняют весь экран — одинаково на ПК и телефоне
    const starField = Math.max(40, LOGICAL_H * 0.74);
    for (let i = 0; i < 110; i++) {
        const hx = Math.sin(i * 12.9898 + 4.1) * 43758.5453, hy = Math.sin(i * 78.233 + 1.7) * 12543.1234;
        const fx = hx - Math.floor(hx), fy = hy - Math.floor(hy);
        const on = Math.sin(gameTime * 0.04 + i * 2.13) > 0.28;
        ctx.fillStyle = on ? '#ffffff' : '#6677aa';
        const sx = 3 + fx * Math.max(10, LOGICAL_W - 6), sy = 3 + fy * starField;
        ctx.fillRect(sx | 0, sy | 0, on ? 2 : 1, on ? 2 : 1);
    }
    // Кометы (диагональ: слева-сверху → справа-вниз) вместо фей
    drawMenuComets();
    // Земля — справа сверху, размер пропорционален меньшей стороне (адаптация под телефон)
    const bgS = Math.max(0.55, Math.min(1, Math.min(LOGICAL_W / 1000, LOGICAL_H / 640))); // адаптация под мобилки
    const ew = Math.round(160 * bgS); // планета (на мобиле уменьшается; на десктопе как в мегахарде)
    const ex = Math.round(LOGICAL_W - ew - Math.max(18, LOGICAL_W * 0.05));
    const ey = Math.round(Math.max(20, LOGICAL_H * 0.06));
    const ecx = ex + ew / 2, ecy = ey + ew / 2;
    const glow = ctx.createRadialGradient(ecx, ecy, ew * 0.06, ecx, ecy, ew * 0.82);
    glow.addColorStop(0, 'rgba(255,255,255,0)'); glow.addColorStop(0.30, 'rgba(220,235,255,0.13)');
    glow.addColorStop(0.65, 'rgba(255,255,255,0.10)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(ecx, ecy, ew * 0.82, 0, Math.PI * 2); ctx.fill();
    drawMenuEarth(ex, ey, ew);
    // Лунная поверхность + кратеры + флаг + замок
    const groundY = LOGICAL_H - 100;
    // Зона слева от центрального меню — флаг и картинка не должны попадать под панель
    let availRight = LOGICAL_W * 0.5;
    const _panel = document.getElementById('start-screen');
    if (_panel && _panel.style.display !== 'none') {
        const pr = _panel.getBoundingClientRect(), rc = canvas.getBoundingClientRect();
        if (rc.width && pr.width) availRight = Math.max(150, Math.min(LOGICAL_W, (pr.left - rc.left) * (LOGICAL_W / rc.width) - 12));
    }
    const flagFs = bgS;                                   // флаг масштабируется как фон
    const flagW = Math.round(76 * flagFs);
    const flagBaseX = Math.max(8, Math.round(Math.min(LOGICAL_W * 0.16, availRight - flagW - 12)));
    _bindPermHover();
    drawPermImage(flagBaseX, groundY, flagFs, availRight); // фото за флагом, левее меню (наведение/тап)
    drawMoonGround(ctx, 0, groundY, LOGICAL_W, 500);
    drawMoonCraters(groundY);
    ctx.save(); ctx.translate(LOGICAL_W / 2, groundY); ctx.scale(bgS, bgS); drawCastle(ctx, 0, 0); ctx.restore();
    drawMoonFlag(flagBaseX, groundY, flagFs);
}

function menuLoop() {
    if (isPlaying) return;
    // rAF планируем ПЕРВЫМ — даже если кадр упадёт, анимация меню не «зависнет» навсегда
    menuAnimationId = requestAnimationFrame(menuLoop);
    try {
        p1PreviewCtx.clearRect(0, 0, 100, 80); p2PreviewCtx.clearRect(0, 0, 100, 80); onlineSkinCtx.clearRect(0, 0, 100, 80);
        gameTime += 0.5;
        const p1Y = 30, p2Y = 30;
        // Подстраховка от некорректного индекса скина (рассинхрон в онлайне и т.п.)
        const _s1 = SKINS[p1SkinIndex] || SKINS[0];
        const _s2 = SKINS[p2SkinIndex] || SKINS[1] || SKINS[0];
        drawPixelCat(p1PreviewCtx, 35, p1Y, _s1, true, null, true); drawPixelCat(onlineSkinCtx, 35, p1Y, _s1, true, null, true);
        if (numPlayers === 2) drawPixelCat(p2PreviewCtx, 35, p2Y, _s2, true, null, false);
        ctx.setTransform(RS, 0, 0, RS, 0, 0); ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
        menuPixies.forEach(p => p.update(0.5, -100)); drawMenuScene();
    } catch (e) { /* не роняем анимацию меню из-за единичной ошибки кадра */ }
}

function initWorld() {
    // Инициализируем seeded RNG — у обоих игроков одинаковый seed
    seedRng(net.isOnline ? net.worldSeed : Math.floor(Math.random() * 0x7FFFFFFF));
    terrain = []; items = []; pixies = []; nextTerrainX = 0; floatingTexts = [];
    // FIX #1: используем getWorldGround() — в онлайне у обоих одно значение (от хоста)
    lastHeight = getWorldGround();
    blocksSinceLastGap = 10; consecutiveGaps = 0; blocksSinceLastCactus = 5; lastBlockWasGap = false;
    castleGenerated = false; inCastle = false;
    for (let i = 0; i < 15; i++) addTerrainBlock(false);
    if (currentDifficulty !== 'easy') {
        for (let i = 0; i < 3; i++) {
            const p = new Pixie();
            p.x = camera.x + (LOGICAL_W * (i / 3)) + rng() * (LOGICAL_W / 3);
            pixies.push(p);
        }
    }
    // FIX #1: позиция NPC кота привязана к реальной земле
    const worldGround = getWorldGround();
    npcCat = new NPCCat(250, worldGround - 45);
    npcDialogShown = false; npcFadeOut = false; npcOpacity = 1;
    // NPC dialog style and message per mode
    const dlg = document.getElementById('npc-dialog');
    if (currentDifficulty === 'infinity') {
        dlg.classList.add('evil');
        document.getElementById('npc-text').innerText = t('npcMessageInfinity');
    } else {
        dlg.classList.remove('evil');
        document.getElementById('npc-text').innerText = t('npcMessage');
    }
}

function addTerrainBlock(canHaveHazards = true) {
    const w = blockSize;
    if (currentDifficulty !== 'infinity') {
        if (!castleGenerated && nextTerrainX > CASTLE_START_X) castleGenerated = true;
        if (castleGenerated) { lastHeight = getWorldGround(); let blockType = 'castle_area', isCenter = false; if (nextTerrainX >= CASTLE_START_X + 1000 && nextTerrainX < CASTLE_START_X + 1000 + w) isCenter = true; terrain.push({ x: nextTerrainX, y: lastHeight, w: w, h: 2000, type: blockType, isCastleCenter: isCenter }); nextTerrainX += w; return; }
    }
    let createGap = false, diffSettings;
    if (currentDifficulty === 'easy') diffSettings = { gapChance: 0.12, maxGapSize: 2, minSafe: 3, cactusChance: 0.15, minCactus: 4, heightChange: 0.3 };
    else if (currentDifficulty === 'hard') diffSettings = { gapChance: 0.15, maxGapSize: 2, minSafe: 2, cactusChance: 0.18, minCactus: 4, heightChange: 0.35 };
    else if (currentDifficulty === 'megahard') diffSettings = { gapChance: 0.20, maxGapSize: 2, minSafe: 2, cactusChance: 0.11, minCactus: 4, heightChange: 0.42 };
    else if (currentDifficulty === 'infinity') diffSettings = { gapChance: 0.20, maxGapSize: 2, minSafe: 2, cactusChance: 0.22, minCactus: 2, heightChange: 0.42 };
    if (canHaveHazards && !lastBlockWasGap && rng() < diffSettings.heightChange) lastHeight += (Math.floor(rng() * 3) - 1) * 60;
    // FIX #1: границы высоты привязаны к getWorldGround(), а не к LOGICAL_H
    const _wg = getWorldGround();
    if (lastHeight < _wg - 350) lastHeight = _wg - 350;
    if (lastHeight > _wg + 50) lastHeight = _wg + 50;
    if (canHaveHazards && blocksSinceLastGap > diffSettings.minSafe && blocksSinceLastCactus > 1 && rng() < diffSettings.gapChance) createGap = true;
    if (lastBlockWasGap && consecutiveGaps < diffSettings.maxGapSize && rng() < 0.6) createGap = true; else if (lastBlockWasGap) createGap = false;
    // MEGAHARD (moon): no gaps — flat craters only
    if (currentDifficulty === 'megahard') createGap = false;
    if (createGap) {
        lastBlockWasGap = true; consecutiveGaps++; blocksSinceLastGap = 0; blocksSinceLastCactus++;
        // HARD (desert): fill gap with decorative sand
        if (currentDifficulty === 'hard') {
            items.push({ x: nextTerrainX, y: lastHeight, w: blockSize, h: 40, type: 'sand_fill', falling: false, triggered: false, particles: [] });
        }
    }
    else {
        // FIX #1: h:2000 — фиксированная высота, не зависит от LOGICAL_H
        terrain.push({ x: nextTerrainX, y: lastHeight, w: w, h: 2000 });
        lastBlockWasGap = false; consecutiveGaps = 0; blocksSinceLastGap++; blocksSinceLastCactus++;
        if (canHaveHazards) {
            let rand = rng(); if (currentDifficulty === 'easy' && rng() < 0.15) items.push({ x: nextTerrainX + 5, y: lastHeight, w: 40, h: 60, type: 'tree' });
            if (rand > (1 - diffSettings.cactusChance) && blocksSinceLastCactus > diffSettings.minCactus && blocksSinceLastGap > 1) {
                let type;
                if (currentDifficulty === 'easy') {
                    type = (rng() < 0.5) ? 'stump' : 'rock';
                } else if (currentDifficulty === 'hard') {
                    type = (rng() < 0.55) ? 'cactus' : 'tumbleweed';
                } else if (currentDifficulty === 'megahard') {
                    type = 'alien_walk';
                } else {
                    type = (rng() < 0.3) ? 'rock' : (rng() < 0.6 ? 'stump' : 'cactus');
                }
                const _alienItem = { x: nextTerrainX + 5, y: lastHeight, w: 30, h: 30, type: type, dir: (rng() < 0.5 ? 1 : -1), speed: 0.5 + rng() * 0.8, baseX: nextTerrainX + 5 };
                if (type === 'alien_walk') {
                    _alienItem.baseY = lastHeight;
                    _alienItem.teleportPhase = null;
                    _alienItem.teleportTimer = 0;
                    _alienItem.teleportCooldown = 240 + Math.floor(rng() * 280);
                    _alienItem.teleportDisplayY = lastHeight;
                    _alienItem.teleportGlow = 0;
                }
                items.push(_alienItem);
                blocksSinceLastCactus = 0;
                // Spawn occasional flying alien for megahard
                if (currentDifficulty === 'megahard' && rng() < 0.4) {
                    items.push({ x: nextTerrainX + 60, y: lastHeight - 80 - rng() * 100, w: 32, h: 28, type: 'alien_fly', dir: (rng() < 0.5 ? 1 : -1), speed: 1.0 + rng() * 1.2, baseX: nextTerrainX + 60, amplitude: 30 + rng() * 50 });
                }
            }
            else if (rng() < 0.3) { let fishType = 'fish', rFish = rng(); if (rFish < 0.05) fishType = 'gold-fish'; else if (rFish < 0.25) fishType = 'blue-fish'; items.push({ x: nextTerrainX + 15, y: lastHeight - 50 - rng() * 80, w: 20, h: 15, type: fishType, taken: false }); }
        }
    }
    nextTerrainX += w;
}

function manageChunks() {
    const lookAhead = 400 * (1 / zoomFactor);
    let _tk = 0; while (_tk < terrain.length && terrain[_tk].x + terrain[_tk].w <= camera.x - 200) _tk++; if (_tk > 0) terrain.splice(0, _tk);
    let _ik = 0; while (_ik < items.length && items[_ik].x + items[_ik].w <= camera.x - 200) _ik++; if (_ik > 0) items.splice(0, _ik);
    while (nextTerrainX < camera.x + (LOGICAL_W / zoomFactor) + lookAhead) addTerrainBlock(true);
}



// ---- Pixel-art fir tree — sprite-based (Gemini V4) ----
const TREE_SPRITE_LEAVES = [
    ".....0.....",
    ".....2.....",
    "....040....",
    "....242....",
    "....3470...",
    "....3742...",
    "...037440..",
    "...334742..",
    "...373442..",
    "..03374740.",
    "..0334742..",
    "..33734472.",
    ".0333744420",
    ".037347442.",
    "03333447422",
    ".0.0.0.0.0."
];

const TREE_PALETTE = {
    '0': '#1d3d1d',
    '2': '#2a702a',
    '3': '#205220',
    '4': '#32962a',
    '7': '#5db051',
    '5': '#422f1f',
    '6': '#664a30',
    '8': '#82654b'
};

function pseudoRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function drawPixelTree(targetCtx, baseX, baseY, baseScale, seed) {
    const leavesW = TREE_SPRITE_LEAVES[0].length;
    const leavesH = TREE_SPRITE_LEAVES.length;

    const sizeMultiplier = 0.9 + (Math.abs(Math.sin(seed * 0.5)) * 0.2);
    const currentScale = baseScale * sizeMultiplier;

    const baseTrunkLen = 2.5 + (pseudoRandom(seed * 1.5) * 2.0);
    const trunkLen = Math.round(baseTrunkLen * sizeMultiplier);
    const trunkW = 3;

    const trunkStartX = baseX - Math.floor((trunkW * currentScale) / 2);
    const trunkStartY = baseY - trunkLen * currentScale;

    for (let ty = 0; ty < trunkLen; ty++) {
        const isLight = (pseudoRandom(seed + ty) > 0.5);
        const yOffset = trunkStartY + ty * currentScale;
        targetCtx.fillStyle = TREE_PALETTE['5'];
        targetCtx.fillRect(trunkStartX, yOffset, currentScale + 0.5, currentScale + 0.5);
        targetCtx.fillStyle = isLight ? TREE_PALETTE['8'] : TREE_PALETTE['6'];
        targetCtx.fillRect(trunkStartX + currentScale, yOffset, currentScale + 0.5, currentScale + 0.5);
        targetCtx.fillStyle = TREE_PALETTE['6'];
        targetCtx.fillRect(trunkStartX + 2 * currentScale, yOffset, currentScale + 0.5, currentScale + 0.5);
    }

    const leavesStartX = baseX - Math.floor((leavesW * currentScale) / 2);
    const leavesStartY = trunkStartY - (leavesH - 1) * currentScale;

    for (let row = 0; row < leavesH; row++) {
        for (let col = 0; col < leavesW; col++) {
            const char = TREE_SPRITE_LEAVES[row][col];
            if (TREE_PALETTE[char]) {
                const isEdge = (col === 0 || col === leavesW - 1 || row === 0);
                const jitter = isEdge ? (pseudoRandom(seed + row + col) > 0.15) : true;
                if (jitter) {
                    targetCtx.fillStyle = TREE_PALETTE[char];
                    targetCtx.fillRect(
                        leavesStartX + col * currentScale,
                        leavesStartY + row * currentScale,
                        currentScale + 0.5,
                        currentScale + 0.5
                    );
                }
            }
        }
    }
}

// Кеш дерева-предмета: спрайт рисуется один раз в финальном масштабе, дальше блитится.
function _treeItemCanvas(item, seed) {
    const sc = RS * zoomFactor;
    if (item._tc && item._tcSc === sc && item._tcSeed === seed) return item._tc;
    const BW = 64, BH = 120;
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil(BW * sc));
    cv.height = Math.max(1, Math.ceil(BH * sc));
    const gx = cv.getContext('2d');
    gx.imageSmoothingEnabled = false;
    gx.setTransform(sc, 0, 0, sc, 0, 0);
    drawPixelTree(gx, BW / 2, 110, 4, seed); // baseX=центр, baseY=110 (дерево растёт вверх)
    item._tc = cv; item._tcSc = sc; item._tcSeed = seed;
    return cv;
}

// ---- drawForest: cached to offscreen canvas in world-space (static, no animation) ----
function drawForest(ctx) {
    // FOREST_MIN сдвинут на ~50px правее старого -950 → первое дерево появляется
    // чуть позже начала castle_area платформы, без заметного сдвига всего леса.
    const CASTLE_CENTER = CASTLE_START_X + 1000, FOREST_MIN = CASTLE_CENTER - 900, FOREST_MAX = CASTLE_CENTER + 1100; // +150px ≈ 3 ёлки на правом краю
    if (currentDifficulty === 'infinity' || currentDifficulty === 'hard' || currentDifficulty === 'megahard') return;
    if (camera.x + LOGICAL_W / zoomFactor < FOREST_MIN - 200 || camera.x > FOREST_MAX + 200) return;
    const _forestGroundY = getWorldGround();
    const _forestW = FOREST_MAX - FOREST_MIN + 400, _forestH = LOGICAL_H + 300;
    const _fsc = RS * zoomFactor; // финальный экранный масштаб → лес 1:1 (одинаково на ПК и телефоне)
    if (!_forestCache || _forestCacheH !== LOGICAL_H || _forestCacheGround !== _forestGroundY || _forestCacheSc !== _fsc) {
        _forestCacheH = LOGICAL_H;
        _forestCacheGround = _forestGroundY;
        _forestCacheSc = _fsc;
        _forestCache = document.createElement('canvas');
        _forestCache.width = Math.ceil(_forestW * _fsc);
        _forestCache.height = Math.ceil(_forestH * _fsc);
        const fctx = _forestCache.getContext('2d');
        fctx.imageSmoothingEnabled = false;
        fctx.setTransform(_fsc, 0, 0, _fsc, 0, 0);   // рисуем в финальном экранном масштабе
        const forestScale = 4;
        const step = (TREE_SPRITE_LEAVES[0].length + 1) * forestScale;
        for (let tx = FOREST_MIN; tx < FOREST_MAX; tx += step) {
            if (tx > CASTLE_CENTER - 150 && tx < CASTLE_CENTER + 150) continue;
            const dtx = tx - (FOREST_MIN - 200);
            const seed = Math.sin(tx * 0.37) * 999;
            drawPixelTree(fctx, dtx, _forestGroundY, forestScale, seed);
        }
    }
    ctx.drawImage(_forestCache, FOREST_MIN - 200, 0, _forestW, _forestH);
}

// Точные цвета с референс-арта:
// Земля:  #7a4030 (основная), #5a2e1a (тёмная зона под травой)
// Трава слой 1 (самый низ/тень): #1e3d10
// Трава слой 2 (тёмный):        #2a5c18
// Трава слой 3 (средний):       #3a8c28
// Трава слой 4 (светлый верх):  #4ec430
// Волна: период 16px (4 «мегапикселя» по 4px), форма — горка с 3 ступенями
// Паттерн высот (0=вершина горки, 3=самая глубокая впадина):
// col 0..3: высота 0 (вершина)
// col 4..7: высота 1
// col 8..11: высота 2
// col 12..15: высота 3 (впадина)
// col 16..19: высота 2
// col 20..23: высота 1
// → период 24px = 6 столбцов по 4px

const GP = 4;
// Паттерн волны под травой: значения = глубина впадины в мегапикселях (1 = 4px вниз)
// Чтобы изменить форму волны — редактируй GW
const GW = [1, 1, 1, 1, 1, 1, 1, 0.5];
// Глубина одного шага волны в пикселях
const WAVE_DIP = GP;
const DARK_STRIPE_OFFSET_Y = 5;

function drawPixelGround(c, bx, by, bw, bh) {
    const period = GW.length;

    // --- 1. Земля ---
    c.fillStyle = "#6d4c41";
    c.fillRect(bx, by, bw, bh);

    // Точки-текстура на земле
    c.fillStyle = "#5d4037";
    for (let dx = 10; dx < bw; dx += 60) {
        c.fillRect(bx + dx, by + 30, 6, 6);
    }

    // --- 2. Плоская трава (как в старой версии) ---
    const grassTop = by - 0; // верх травы чуть выше блока
    c.fillStyle = "#66bb6a"; c.fillRect(bx, grassTop,          bw, GP * 3 + DARK_STRIPE_OFFSET_Y); // светло-зелёный (3 слоя)
    c.fillStyle = "#43a047"; c.fillRect(bx, grassTop + GP * 3 + DARK_STRIPE_OFFSET_Y, bw, GP);     // тёмно-зелёная полоска

    // --- 3. Волна из тёмных цветов под травой ---
    // Рисуется сразу под плоской травой, впадины уходят вниз
    const waveTop = grassTop + GP * 4; // начало волны = конец плоской травы

    // Столбцы одинаковой глубины рисуем одним широким прямоугольником (меньше fillRect, та же картинка)
    let col = 0;
    while (col < bw) {
        const depth = Math.round(GW[Math.floor((bx + col) / GP) % period] * WAVE_DIP);
        let end = col + GP;
        while (end < bw && Math.round(GW[Math.floor((bx + end) / GP) % period] * WAVE_DIP) === depth) end += GP;
        const runW = end - col;
        c.fillStyle = "#2a5c18"; c.fillRect(bx + col, waveTop + depth, runW, GP);
        c.fillStyle = "#1e3d10"; c.fillRect(bx + col, waveTop + depth + GP, runW, GP);
        col = end;
    }
}

// ---- Desert sand ground for HARD difficulty ----
function drawSandGround(c, bx, by, bw, bh) {
    // Main sandy body
    c.fillStyle = "#c2a050";
    c.fillRect(bx, by, bw, bh);

    // Sandstone horizontal lines — use ABSOLUTE world-Y so every block at the same
    // height shares identical stripe positions and adjacent blocks tile seamlessly.
    const _stripeStep = 18;
    c.fillStyle = "#b08030";
    // First stripe at the nearest world-grid line at or below (by + 4)
    const _firstStripe = Math.ceil((by + 4) / _stripeStep) * _stripeStep;
    const _sandBot = by + Math.min(bh, (LOGICAL_H / zoomFactor) + 150); // полоски только в видимой глубине
    for (let _sy = _firstStripe; _sy < _sandBot; _sy += _stripeStep) {
        c.fillRect(bx, _sy, bw, 3);
    }

    // Sand texture dots — also world-space so they tile across blocks
    c.fillStyle = "#d4b060";
    const _dotStep = 20;
    const _firstDotX = Math.ceil(bx / _dotStep) * _dotStep;
    for (let _dx = _firstDotX; _dx < bx + bw; _dx += _dotStep) {
        // offset within stripe band: dots between surface layers and first stripe
        const _dotY = _firstStripe - _stripeStep + 8; // between surface cap and first stripe
        if (_dotY > by + GP * 4 && _dotY < by + bh)
            c.fillRect(_dx, _dotY, 4, 4);
    }

    // Top sand surface: warm orange-yellow layers
    c.fillStyle = "#e8c060"; c.fillRect(bx, by, bw, GP * 2);
    c.fillStyle = "#d4a848"; c.fillRect(bx, by + GP * 2, bw, GP);
    c.fillStyle = "#b89030"; c.fillRect(bx, by + GP * 3, bw, GP);
    // Ripple wave on surface
    let _scol = 0;
    while (_scol < bw) {
        const _d = Math.round(GW[Math.floor((bx + _scol) / GP) % GW.length] * WAVE_DIP);
        let _send = _scol + GP;
        while (_send < bw && Math.round(GW[Math.floor((bx + _send) / GP) % GW.length] * WAVE_DIP) === _d) _send += GP;
        const _w = _send - _scol;
        c.fillStyle = "#a07828"; c.fillRect(bx + _scol, by + GP * 4 + _d, _w, GP);
        c.fillStyle = "#8a6020"; c.fillRect(bx + _scol, by + GP * 4 + _d + GP, _w, GP);
        _scol = _send;
    }
}

// ---- Moon grey ground for MEGAHARD difficulty ----
// Пиксельный декоративный кратер (рисует в переданный контекст c)
function _pixCraterC(c, cx, cy, r, P) {
    const ry = r * 0.5;
    const ov = (rx2, ryy, col, oy) => {
        c.fillStyle = col;
        const x0 = Math.round((cx - rx2) / P) * P, x1 = Math.round((cx + rx2) / P) * P;
        const y0 = Math.round((cy + oy - ryy) / P) * P, y1 = Math.round((cy + oy + ryy) / P) * P;
        for (let py = y0; py <= y1; py += P) for (let px = x0; px <= x1; px += P) {
            const nx = (px + P / 2 - cx) / rx2, ny = (py + P / 2 - (cy + oy)) / ryy;
            if (nx * nx + ny * ny <= 1) c.fillRect(px, py, P, P);
        }
    };
    ov(r, ry, '#8a8a98', 0);          // светлый обод
    ov(r - P, ry - P, '#48485a', 0);  // тёмная чаша
}
function drawMoonGround(c, bx, by, bw, bh) {
    // Dark grey regolith body
    c.fillStyle = "#606070";
    c.fillRect(bx, by, bw, bh);
    // Lighter texture patches
    c.fillStyle = "#707280";
    for (let dx = 5; dx < bw; dx += 24) {
        c.fillRect(bx + dx, by + 20, 8, 5);
    }
    c.fillStyle = "#555565";
    for (let dx = 14; dx < bw; dx += 32) {
        c.fillRect(bx + dx, by + 35, 5, 4);
    }
    // Craters (small circles via rectangles)
    for (let dx = 20; dx < bw; dx += 60 + ((bx + dx) % 31)) {
        const cr = 4 + ((bx + dx) % 5);
        const cy2 = 12 + ((bx + dx) % 10);
        c.fillStyle = "#50505f";
        c.fillRect(bx + dx - cr, by + cy2, cr * 2, 4);
        c.fillRect(bx + dx - cr + 2, by + cy2 - 2, cr * 2 - 4, 2);
        c.fillStyle = "#888898";
        c.fillRect(bx + dx - cr + 2, by + cy2 - 1, 3, 2); // crater rim highlight
    }
    // Moon surface top strip
    c.fillStyle = "#8090a0"; c.fillRect(bx, by, bw, GP * 2);
    c.fillStyle = "#707080"; c.fillRect(bx, by + GP * 2, bw, GP);
    c.fillStyle = "#606070"; c.fillRect(bx, by + GP * 3, bw, GP);
    // Subtle top wave
    let _mcol = 0;
    while (_mcol < bw) {
        const _d = Math.round(GW[Math.floor((bx + _mcol) / GP) % GW.length] * (WAVE_DIP * 0.5));
        let _mend = _mcol + GP;
        while (_mend < bw && Math.round(GW[Math.floor((bx + _mend) / GP) % GW.length] * (WAVE_DIP * 0.5)) === _d) _mend += GP;
        c.fillStyle = "#505060"; c.fillRect(bx + _mcol, by + GP * 4 + _d, _mend - _mcol, GP);
        _mcol = _mend;
    }
}

// ---- Pixel Tumbleweed for HARD difficulty — porous thorny bush, no animation ----
function drawTumbleweed(c, x, y) {
    const px = x + 3, py = y - 26;
    const tw = '#8B6914', tl = '#A0812A', td = '#6B4F0A', tg = '#5a8a20', ts = '#c49a3a';

    // === Bare branchy skeleton (no solid ball) ===
    // Central hub
    c.fillStyle = tw;
    c.fillRect(px + 9, py + 9, 4, 4);

    // Main branches radiating from center
    c.fillStyle = tw;
    c.fillRect(px + 10, py + 2, 2, 7);   // top
    c.fillRect(px + 10, py + 13, 2, 7);  // bottom
    c.fillRect(px + 2, py + 10, 8, 2);   // left
    c.fillRect(px + 12, py + 10, 8, 2);  // right

    // Diagonal branches
    c.fillStyle = tl;
    c.fillRect(px + 4, py + 4, 3, 2);
    c.fillRect(px + 4, py + 3, 2, 3);
    c.fillRect(px + 15, py + 4, 3, 2);
    c.fillRect(px + 16, py + 3, 2, 3);
    c.fillRect(px + 4, py + 16, 3, 2);
    c.fillRect(px + 4, py + 15, 2, 3);
    c.fillRect(px + 15, py + 16, 3, 2);
    c.fillRect(px + 16, py + 15, 2, 3);

    // Sub-branches (add visual porosity / gaps)
    c.fillStyle = tl;
    c.fillRect(px + 7, py + 5, 2, 2);
    c.fillRect(px + 13, py + 5, 2, 2);
    c.fillRect(px + 7, py + 15, 2, 2);
    c.fillRect(px + 13, py + 15, 2, 2);
    c.fillRect(px + 5, py + 7, 2, 2);
    c.fillRect(px + 5, py + 13, 2, 2);
    c.fillRect(px + 15, py + 7, 2, 2);
    c.fillRect(px + 15, py + 13, 2, 2);

    // Tiny thorn tips (dark)
    c.fillStyle = td;
    c.fillRect(px + 10, py, 2, 2);      // top tip
    c.fillRect(px + 10, py + 20, 2, 2); // bottom tip
    c.fillRect(px, py + 10, 2, 2);      // left tip
    c.fillRect(px + 20, py + 10, 2, 2); // right tip
    c.fillRect(px + 3, py + 3, 2, 2);   // corners
    c.fillRect(px + 17, py + 3, 2, 2);
    c.fillRect(px + 3, py + 17, 2, 2);
    c.fillRect(px + 17, py + 17, 2, 2);

    // Green leaf tufts at tips (clearly a plant, not a ball)
    c.fillStyle = tg;
    c.fillRect(px + 9, py - 1, 4, 3);
    c.fillRect(px + 9, py + 20, 4, 3);
    c.fillRect(px - 1, py + 9, 3, 4);
    c.fillRect(px + 20, py + 9, 3, 4);
    // Leaf clusters on diagonal branch tips
    c.fillRect(px + 2, py + 2, 3, 2);
    c.fillRect(px + 17, py + 2, 3, 2);
    c.fillRect(px + 2, py + 18, 3, 2);
    c.fillRect(px + 17, py + 18, 3, 2);
}

// ---- Pixel Walking Cyber-Cat for MEGAHARD difficulty ----
function drawWalkingAlien(c, x, y, dir) {
    // Feet are at y; character is ~38px tall
    const px = x + 2, py = y - 38;
    const anim = Math.floor(gameTime * 0.1) % 2;

    // --- Palette (cyber cat) ---
    const teal   = '#1abc9c';
    const dark   = '#1e272e';
    const cyan   = '#00ffff';
    const mag    = '#ff0099';
    const eyeBg  = '#2c3e50';
    const eyeFg  = '#34495e';
    const eyeGl  = '#81ecec';
    const panel  = '#2d3436';
    const green  = '#00ff00';

    // --- Tail (behind body) ---
    c.fillStyle = teal;
    if (!dir || dir > 0) {
        c.fillRect(px,     py + 20, 3, 2);
        c.fillRect(px - 2, py + 18, 2, 3);
        c.fillRect(px - 3, py + 16, 2, 2);
    } else {
        c.fillRect(px + 18, py + 20, 3, 2);
        c.fillRect(px + 21, py + 18, 2, 3);
        c.fillRect(px + 22, py + 16, 2, 2);
    }

    // --- Body (dark with magenta chest stripe + cyan accents) ---
    c.fillStyle = dark;
    c.fillRect(px + 2, py + 14, 18, 16);
    // Chest stripe
    c.fillStyle = mag;
    c.fillRect(px + 4, py + 15, 14, 5);
    // Cyan circuit lines
    c.fillStyle = cyan;
    c.fillRect(px + 6,  py + 15, 2, 5);
    c.fillRect(px + 14, py + 15, 2, 5);
    // Belt line
    c.fillStyle = panel;
    c.fillRect(px + 2, py + 25, 18, 2);
    c.fillStyle = '#8e44ad';
    c.fillRect(px + 9, py + 25, 4, 2);

    // --- Head (teal) ---
    c.fillStyle = teal;
    c.fillRect(px + 1, py + 2, 20, 14);

    // --- Ears ---
    c.fillStyle = teal;
    c.fillRect(px + 1, py,     4, 3);
    c.fillRect(px,     py - 2, 2, 2);
    c.fillRect(px + 17, py,    4, 3);
    c.fillRect(px + 20, py - 2, 2, 2);

    // --- Scanner mouth (white panel on lower head) ---
    c.fillStyle = '#ffffff';
    c.fillRect(px + 4, py + 10, 14, 4);
    c.fillStyle = eyeBg;
    c.fillRect(px + 10, py + 11, 2, 1);

    // --- Three square eyes ---
    c.fillStyle = eyeBg;
    c.fillRect(px + 2,  py + 3, 5, 5);
    c.fillRect(px + 9,  py + 2, 5, 5);
    c.fillRect(px + 16, py + 3, 5, 5);
    // Inner darker pupil
    c.fillStyle = eyeFg;
    c.fillRect(px + 3,  py + 4, 3, 3);
    c.fillRect(px + 10, py + 3, 3, 3);
    c.fillRect(px + 17, py + 4, 3, 3);
    // Teal glow highlights
    c.fillStyle = eyeGl;
    c.fillRect(px + 3,  py + 4, 1, 1);
    c.fillRect(px + 10, py + 3, 1, 1);
    c.fillRect(px + 17, py + 4, 1, 1);

    // --- Side panel (circuit board detail) ---
    c.fillStyle = panel;
    if (!dir || dir > 0) {
        c.fillRect(px, py + 3, 2, 7);
        c.fillStyle = green;
        c.fillRect(px, py + 4, 2, 2);
    } else {
        c.fillRect(px + 20, py + 3, 2, 7);
        c.fillStyle = green;
        c.fillRect(px + 20, py + 4, 2, 2);
    }

    // --- Legs (dark, walking animation) ---
    c.fillStyle = dark;
    if (anim === 0) {
        c.fillRect(px + 5,  py + 30, 5, 7);
        c.fillRect(px + 12, py + 30, 5, 5);
    } else {
        c.fillRect(px + 5,  py + 30, 5, 5);
        c.fillRect(px + 12, py + 30, 5, 7);
    }
    // Feet (teal)
    c.fillStyle = teal;
    c.fillRect(px + 4,  py + 37 - (anim === 0 ? 0 : 2), 7, 3);
    c.fillRect(px + 11, py + 37 - (anim === 1 ? 0 : 2), 7, 3);
}

// ---- Pixel Flying Alien for MEGAHARD difficulty ----
function drawFlyingAlien(c, x, y) {
    const px = x, py = y;
    const wave = Math.sin(gameTime * 0.12) * 4;
    const flap = Math.floor(gameTime * 0.18) % 2;
    // UFO saucer body
    c.fillStyle = '#888899'; c.fillRect(px + 6, py + 10 + wave, 20, 8);
    c.fillStyle = '#aabbcc'; c.fillRect(px + 8, py + 9 + wave, 16, 6);
    c.fillStyle = '#6677aa'; c.fillRect(px + 4, py + 14 + wave, 24, 4);
    // Dome top
    c.fillStyle = '#9ab0e0'; c.fillRect(px + 10, py + 4 + wave, 12, 6);
    c.fillStyle = '#c0d8ff'; c.fillRect(px + 12, py + 2 + wave, 8, 4);
    // Alien inside dome (visible through glass)
    c.fillStyle = '#60dd60'; c.fillRect(px + 13, py + 5 + wave, 6, 4);
    c.fillStyle = '#ff3030'; c.fillRect(px + 13, py + 5 + wave, 2, 2);
    c.fillStyle = '#ff3030'; c.fillRect(px + 17, py + 5 + wave, 2, 2);
    // Beam below
    const beamAlpha = 0.2 + Math.sin(gameTime * 0.09) * 0.1;
    c.fillStyle = `rgba(100,200,255,${beamAlpha})`;
    c.fillRect(px + 10, py + 18 + wave, 12, 20);
    c.fillRect(px + 8, py + 22 + wave, 16, 8);
    // Lights: blinking colours
    const lc = ['#ff4444','#44ff44','#4444ff','#ffff44'];
    const li = Math.floor(gameTime * 0.05) % 4;
    c.fillStyle = lc[li]; c.fillRect(px + 6, py + 16 + wave, 3, 3);
    c.fillStyle = lc[(li+1)%4]; c.fillRect(px + 14, py + 17 + wave, 3, 3);
    c.fillStyle = lc[(li+2)%4]; c.fillRect(px + 22, py + 16 + wave, 3, 3);
    // Wings/fins (flapping)
    c.fillStyle = '#5566aa';
    if (flap === 0) {
        c.fillRect(px - 4, py + 12 + wave, 8, 3);
        c.fillRect(px + 28, py + 12 + wave, 8, 3);
    } else {
        c.fillRect(px - 2, py + 14 + wave, 6, 3);
        c.fillRect(px + 28, py + 14 + wave, 6, 3);
    }
}

// ---- Update alien positions in items array ----
function updateAliens(timeScale) {
    items.forEach(item => {
        if (item.type === 'alien_walk') {
            // Init teleport fields if alien was spawned without them
            if (item.teleportDisplayY === undefined) {
                item.teleportDisplayY = item.y;
                item.teleportPhase = null;
                item.teleportTimer = 0;
                item.teleportGlow = 0;
                item.teleportTargetY = item.y;
            }

            const PHASE_LEN = 16; // frames per half-transition

            if (!item.teleportPhase) {
                // --- Normal walking ---
                item.x += item.dir * item.speed * timeScale;
                if (Math.abs(item.x - item.baseX) > 60) item.dir *= -1;

                // Find terrain block below alien
                const midX = item.x + 11;
                let found = false;
                for (let i = 0; i < terrain.length; i++) {
                    const b = terrain[i];
                    if (midX >= b.x && midX < b.x + b.w) {
                        const dy = b.y - item.y;
                        if (Math.abs(dy) > 20) {
                            // Terrain step detected → start teleport-out
                            item.teleportPhase = 'step_out';
                            item.teleportTimer = 0;
                            item.teleportGlow = 0;
                            item.teleportDisplayY = item.y;
                            item.teleportTargetY = b.y;
                        } else {
                            item.y = b.y;
                            item.teleportDisplayY = item.y;
                        }
                        found = true;
                        break;
                    }
                }
                if (!found) item.dir *= -1;

            } else if (item.teleportPhase === 'step_out') {
                // Glow builds up, alien fades to invisible at old Y
                item.teleportTimer += timeScale;
                item.teleportGlow = Math.min(1, item.teleportTimer / PHASE_LEN);
                item.teleportDisplayY = item.y; // stay at old Y
                if (item.teleportTimer >= PHASE_LEN) {
                    // Snap to new Y, start fade-in
                    item.y = item.teleportTargetY;
                    item.teleportDisplayY = item.teleportTargetY;
                    item.teleportPhase = 'step_in';
                    item.teleportTimer = 0;
                    item.teleportGlow = 1;
                }

            } else if (item.teleportPhase === 'step_in') {
                // Glow fades, alien fades in at new Y
                item.teleportTimer += timeScale;
                item.teleportGlow = Math.max(0, 1 - item.teleportTimer / PHASE_LEN);
                item.teleportDisplayY = item.y; // already at new Y
                if (item.teleportTimer >= PHASE_LEN) {
                    item.teleportPhase = null;
                    item.teleportGlow = 0;
                }
            }

        } else if (item.type === 'alien_fly') {
            item.x += item.dir * item.speed * timeScale;
            if (Math.abs(item.x - item.baseX) > 80) item.dir *= -1;
        }
    });
}

// ---- Update sand fill items: trigger fall when player nearby ----
function updateSandFills(timeScale) {
    if (currentDifficulty !== 'hard') return;
    items.forEach(item => {
        if (item.type !== 'sand_fill') return;
        // Trigger sand fall when any cat enters the gap area
        if (!item.triggered) {
            for (const cat of cats) {
                if (cat.x + cat.width > item.x && cat.x < item.x + item.w &&
                    cat.y + cat.height > item.y - 10) {
                    item.triggered = true;
                    item.falling = true;
                    // Create sand particles
                    item.particles = [];
                    const cols = Math.floor(item.w / 8);
                    for (let i = 0; i < cols; i++) {
                        for (let j = 0; j < 3; j++) {
                            item.particles.push({
                                x: item.x + i * 8 + (Math.random() * 4),
                                y: item.y + j * 8,
                                vy: 0.5 + Math.random() * 1.5,
                                vx: (Math.random() - 0.5) * 0.8,
                                w: 4 + Math.floor(Math.random() * 4),
                                h: 3 + Math.floor(Math.random() * 3),
                                col: ['#e8c060','#d4a848','#c49030','#b07830'][Math.floor(Math.random() * 4)]
                            });
                        }
                    }
                    break;
                }
            }
        }
        // Animate falling block + particles
        if (item.falling && item.particles) {
            // Init falling block position on first frame after trigger
            if (item.blockVY === undefined) {
                item.blockVY = 0;
                let _lY = item.y, _rY = item.y;
                for (let _ti = 0; _ti < terrain.length; _ti++) {
                    const _tb = terrain[_ti];
                    if (_tb.x + _tb.w <= item.x && _tb.x + _tb.w >= item.x - blockSize - 4) _lY = _tb.y;
                    if (_tb.x >= item.x + item.w && _tb.x <= item.x + item.w + blockSize + 4) { _rY = _tb.y; break; }
                }
                item.blockY = Math.max(_lY, _rY);
            }
            // Apply gravity to the falling block (same feel as player fall)
            item.blockVY += 0.55 * timeScale;
            item.blockY  += item.blockVY * timeScale;
            // Scatter particles around the falling block
            item.particles.forEach(p => {
                p.vy += 0.4 * timeScale;
                p.y += p.vy * timeScale;
                p.x += p.vx * timeScale;
            });
            item.particles = item.particles.filter(p => p.y < item.y + 500);
        }
    });
}

function drawWorld() {
    drawForest(ctx); const renderWidth = LOGICAL_W / zoomFactor;
    const _scov = zoomFactor * RS;
    // целый масштаб (ПК) → 1px; дробный (мобила) → ≥2 экранных пикселя, чтобы убрать сабпиксельные швы на плоской земле (луна)
    const _gov = Number.isInteger(_scov) ? 1 : Math.max(2, Math.ceil(2 / _scov));
    terrain.forEach(block => {
        let renderMargin = block.isCastleCenter ? 400 : 0; if (block.x > camera.x + renderWidth + renderMargin || block.x + block.w < camera.x - renderMargin) return;
        if (currentDifficulty === 'infinity') { ctx.fillStyle = "#1a1a1a"; ctx.fillRect(block.x, block.y, block.w + _gov, block.h); ctx.fillStyle = "#2d3436"; ctx.fillRect(block.x, block.y, block.w + _gov, 15); ctx.fillStyle = "#636e72"; ctx.fillRect(block.x, block.y + 12, block.w + _gov, 3); ctx.fillStyle = "#b2bec3"; ctx.fillRect(block.x + 10, block.y + 30, 4, 4); }
        else if (currentDifficulty === 'hard') { drawSandGround(ctx, block.x, block.y, block.w + _gov, block.h); }
        else if (currentDifficulty === 'megahard') { drawMoonGround(ctx, block.x, block.y, block.w + _gov, block.h); }
        else {
            drawPixelGround(ctx, block.x, block.y, block.w + _gov, block.h);
        }
        if (block.type === 'castle_area' && block.isCastleCenter) drawCastle(ctx, block.x, block.y);
    });
    items.forEach(item => {
        if (item.x > camera.x + renderWidth || item.x + item.w < camera.x) return;
        if (item.type === 'tree') {
            if (currentDifficulty === 'infinity') {
                // Infinity mode: dead/dark tree silhouette
                let tx = item.x + 10, ty = item.y;
                ctx.fillStyle = "#000000"; ctx.fillRect(tx + 2, ty - 80, 6, 80); ctx.fillRect(tx - 2, ty - 5, 14, 5);
                ctx.fillRect(tx - 15, ty - 40, 17, 4); ctx.fillRect(tx - 15, ty - 55, 3, 15);
                ctx.fillRect(tx + 8, ty - 60, 15, 4); ctx.fillRect(tx + 23, ty - 70, 3, 10); ctx.fillRect(tx + 4, ty - 90, 2, 10);
            } else {
                const seed = item.seed !== undefined ? item.seed : item.x;
                ctx.drawImage(_treeItemCanvas(item, seed), item.x - 12, item.y - 110, 64, 120);
            }
            return;
        }
        if (item.type.includes('fish')) { if (item.taken) return; let fy = item.y + Math.sin(gameTime * 0.1 + item.x) * 5; if (item.type === 'blue-fish') ctx.fillStyle = "#29b6f6"; else if (item.type === 'gold-fish') ctx.fillStyle = "#ffd700"; else ctx.fillStyle = "#ffa726"; ctx.fillRect(item.x, fy, 20, 12); if (item.type === 'blue-fish') ctx.fillStyle = "#0288d1"; else if (item.type === 'gold-fish') ctx.fillStyle = "#e6c200"; else ctx.fillStyle = "#f57c00"; ctx.fillRect(item.x - 5, fy + 2, 5, 8); ctx.fillStyle = "white"; ctx.fillRect(item.x + 14, fy + 2, 4, 4); ctx.fillStyle = "black"; ctx.fillRect(item.x + 16, fy + 3, 2, 2); }
        else {
            let yPos = item.y - 40;
            if (currentDifficulty === 'infinity' && (item.type === 'rock' || item.type === 'stump')) { const sx = item.x + 5, sy = item.y - 25; if (item.type === 'stump') { ctx.fillStyle = "#333"; ctx.fillRect(sx + 8, sy + 20, 4, 10); } ctx.fillStyle = "#bdc3c7"; ctx.fillRect(sx, sy, 20, 20); ctx.fillStyle = "#000"; ctx.fillRect(sx + 4, sy + 8, 4, 4); ctx.fillRect(sx + 12, sy + 8, 4, 4); ctx.fillRect(sx + 8, sy + 16, 4, 4); ctx.fillStyle = "#bdc3c7"; ctx.fillRect(sx + 2, sy + 22, 4, 4); ctx.fillRect(sx + 8, sy + 22, 4, 4); ctx.fillRect(sx + 14, sy + 22, 4, 4); }
            else if (item.type === 'cactus') {
                if (currentDifficulty === 'infinity') { ctx.fillStyle = "#0a0a0a"; ctx.fillRect(item.x + 12, yPos, 10, 40); ctx.fillStyle = "#1a1a1a"; ctx.fillRect(item.x + 14, yPos + 2, 6, 36); ctx.fillStyle = "#0a0a0a"; ctx.fillRect(item.x + 4, yPos + 15, 8, 4); ctx.fillRect(item.x + 4, yPos + 5, 4, 10); ctx.fillRect(item.x + 22, yPos + 20, 8, 4); ctx.fillRect(item.x + 26, yPos + 10, 4, 10); ctx.fillStyle = "#444"; ctx.fillRect(item.x + 12, yPos + 5, 2, 2); ctx.fillRect(item.x + 20, yPos + 15, 2, 2); ctx.fillRect(item.x + 14, yPos + 30, 2, 2); }
                else { ctx.fillStyle = "#2e7d32"; ctx.fillRect(item.x + 12, yPos, 10, 40); ctx.fillStyle = "#4caf50"; ctx.fillRect(item.x + 14, yPos + 2, 6, 36); ctx.fillStyle = "#2e7d32"; ctx.fillRect(item.x + 4, yPos + 15, 8, 4); ctx.fillRect(item.x + 4, yPos + 5, 4, 10); ctx.fillRect(item.x + 22, yPos + 20, 8, 4); ctx.fillRect(item.x + 26, yPos + 10, 4, 10); ctx.fillStyle = "#a5d6a7"; ctx.fillRect(item.x + 12, yPos + 5, 2, 2); ctx.fillRect(item.x + 20, yPos + 15, 2, 2); ctx.fillRect(item.x + 14, yPos + 30, 2, 2); }
            }
            else if (item.type === 'tumbleweed') { drawTumbleweed(ctx, item.x, item.y); }
            else if (item.type === 'alien_walk') {
                const _drawY = (item.teleportDisplayY !== undefined) ? item.teleportDisplayY : item.y;
                const _glow  = item.teleportGlow || 0;
                const _phase = item.teleportPhase;

                // Alpha: fade out during step_out (glow 0→1 = alpha 1→0),
                //        fade in during step_in (glow 1→0 = alpha 0→1)
                let _alpha = 1;
                if (_phase === 'step_out') _alpha = 1 - _glow;
                else if (_phase === 'step_in') _alpha = 1 - _glow;

                // Circular green teleport glow — arc fill, no rectangle clipping
                if (_glow > 0.03) {
                    const _ax = item.x + 16, _ay = _drawY - 19;
                    const _gr = ctx.createRadialGradient(_ax, _ay, 0, _ax, _ay, 28 + _glow * 22);
                    _gr.addColorStop(0,    `rgba(80,255,120,${0.70 * _glow})`);
                    _gr.addColorStop(0.35, `rgba(0,255,80,${0.45 * _glow})`);
                    _gr.addColorStop(0.70, `rgba(0,200,60,${0.18 * _glow})`);
                    _gr.addColorStop(1,    'rgba(0,255,80,0)');
                    ctx.fillStyle = _gr;
                    ctx.beginPath();
                    ctx.arc(_ax, _ay, 28 + _glow * 22, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Draw alien with alpha fade
                ctx.save();
                ctx.globalAlpha = Math.max(0, Math.min(1, _alpha));
                drawWalkingAlien(ctx, item.x, _drawY, item.dir || 1);
                ctx.restore();
            }
            else if (item.type === 'alien_fly') { drawFlyingAlien(ctx, item.x, item.y); }
            else if (item.type === 'sand_fill') {
                if (!item.triggered) {
                    // Find Y of terrain block to the left and to the right of the gap
                    let leftY = item.y, rightY = item.y;
                    for (let ti = 0; ti < terrain.length; ti++) {
                        const tb = terrain[ti];
                        if (tb.x + tb.w <= item.x && tb.x + tb.w >= item.x - blockSize - 4) leftY = tb.y;
                        if (tb.x >= item.x + item.w && tb.x <= item.x + item.w + blockSize + 4) { rightY = tb.y; break; }
                    }
                    const surfY = Math.max(leftY, rightY);
                    // Plain solid sand fill from surfY downward (no pattern, no gaps)
                    ctx.fillStyle = '#c2a050';
                    ctx.fillRect(item.x, surfY, item.w, 2000);
                    // Sand cap on top (matches ground surface style)
                    ctx.fillStyle = '#e8c060'; ctx.fillRect(item.x, surfY, item.w, GP * 2);
                    ctx.fillStyle = '#d4a848'; ctx.fillRect(item.x, surfY + GP * 2, item.w, GP);
                    ctx.fillStyle = '#c49030'; ctx.fillRect(item.x, surfY + GP * 3, item.w, GP);
                } else if (item.blockY !== undefined && item.blockY < item.y + 600) {
                    // Draw the whole sand block falling as a unit (moves with player)
                    const _by = item.blockY;
                    ctx.fillStyle = '#e8c060'; ctx.fillRect(item.x, _by, item.w, GP * 2);
                    ctx.fillStyle = '#d4a848'; ctx.fillRect(item.x, _by + GP * 2, item.w, GP);
                    ctx.fillStyle = '#c49030'; ctx.fillRect(item.x, _by + GP * 3, item.w, GP);
                    ctx.fillStyle = '#b07828'; ctx.fillRect(item.x, _by + GP * 4, item.w, GP);
                }
                // Draw scattering sand particles on top
                if (item.particles) {
                    item.particles.forEach(p => {
                        ctx.fillStyle = p.col;
                        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.w, p.h);
                    });
                }
            }
            else if (item.type === 'rock') { let ry = item.y - 25; ctx.fillStyle = "#7f8c8d"; ctx.fillRect(item.x + 5, ry, 25, 25); ctx.fillStyle = "#95a5a6"; ctx.fillRect(item.x + 8, ry + 3, 15, 15); ctx.fillStyle = "#34495e"; ctx.fillRect(item.x + 25, ry + 20, 5, 5); }
            else if (item.type === 'stump') { let sy = item.y - 20; ctx.fillStyle = "#5d4037"; ctx.fillRect(item.x + 5, sy, 25, 20); ctx.fillStyle = "#8d6e63"; ctx.fillRect(item.x + 5, sy, 25, 5); ctx.fillStyle = "#3e2723"; ctx.fillRect(item.x + 12, sy + 1, 10, 2); ctx.fillStyle = "#5d4037"; ctx.fillRect(item.x, sy + 15, 5, 5); ctx.fillRect(item.x + 30, sy + 15, 5, 5); }
        }
    });
    // ── Анимация подбора рыбки: всплывающий «+1» в цвете рыбки ──
    for (const ft of floatingTexts) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = (ft.size || 13) + "px 'Press Start 2P', monospace";
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000';
        ctx.fillText(ft.text, ft.x + 1.5, ft.y + 1.5);
        ctx.fillStyle = ft.color || '#ffffff';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
    }
}

function drawCastle(ctx, x, y) {
            const s = 4;
            // Старые цвета
            const cMain = "#b0dfff", cLight = "#d0efff", cShadow = "#8ab0d4";
            const cRoof = "#ff5e5e", cRoofDark = "#c43c3c", cFlag = "#ff3333";
            const cTree = "#76c442", cTreeDark = "#5da130";
            
            // Новые цвета для логичных деталей
            const cHole = "#1a2433";        // Проем ворот/окон
            const cWindowLit = "#fef08a";   // Свет из окон
            const cIron = "#4a5568";        // Металл решетки
            const cIronDark = "#2d3748";    // Тень на металле
            const cStoneFrame = "#94a3b8";  // Каменная арка
            const cWood = "#78350f";        // Дерево моста
            
            // Базовая функция отрисовки (1 единица = s пикселей)
            const rect = (dx, dy, w, h, col) => { 
                ctx.fillStyle = col; 
                ctx.fillRect(x + dx * s, y - (dy + h) * s, w * s, h * s); 
            };

            // Упрощенная арка (скругление в 1 пиксель)
            const drawArch = (dx, dy, w, h, col) => {
                rect(dx, dy, w, h - 2, col);
                rect(dx + 1, dy + h - 2, w - 2, 1, col);
                rect(dx + 2, dy + h - 1, w - 4, 1, col);
            };

            // Окно с рамой и подоконником
            const drawWindow = (dx, dy, w, h, isLit) => {
                drawArch(dx, dy, w, h, isLit ? cWindowLit : cHole);
                rect(dx - 1, dy - 1, w + 2, 1, cShadow); // подоконник
                if (isLit) {
                    // Переплет окна (крест)
                    if (w % 2 === 1) {
                        rect(dx + Math.floor(w/2), dy, 1, h - 1, "#8c6e53");
                    } else {
                        rect(dx + w/2 - 1, dy, 2, h - 1, "#8c6e53");
                    }
                    rect(dx, dy + Math.floor(h/2), w, 1, "#8c6e53");
                }
            };

            const drawRoof = (dx, dy, width) => { 
                let rw = width, rh = 0; 
                while (rw > 0) { 
                    rect(dx + (width - rw) / 2, dy + rh, rw, 1, cRoof); 
                    rect(dx + (width - rw) / 2, dy + rh, 1, 1, cRoofDark);
                    rect(dx + (width + rw) / 2 - 1, dy + rh, 1, 1, "#fca5a5"); // блик справа
                    rw -= 2; rh += 1; 
                } 
            };

            const drawFlag = (dx, dy) => { 
                rect(dx, dy, 1, 9, "#64748b"); // древко
                rect(dx, dy + 9, 1, 1, "#eab308"); // золотое навершие
                let wave = Math.sin(gameTime * 0.15 + dx) > 0 ? 1 : 0; 
                let wave2 = Math.cos(gameTime * 0.15 + dx) > 0 ? 1 : 0;
                rect(dx + 1, dy + 6 + wave, 6, 3, cFlag); 
                rect(dx + 7, dy + 6 + wave + wave2, 2, 2, cFlag);
            };

            // Симметричные зубцы (улучшенные)
            const drawCrenellations = (dx, dy, w) => { 
                rect(dx - 1, dy, w + 2, 3, cMain); 
                rect(dx - 1, dy, 1, 3, cShadow); 
                for (let i = 0; i <= w - 2; i += 4) {
                    rect(dx + i, dy + 3, 2, 2, cMain);
                    rect(dx + i, dy + 3, 1, 2, cLight);
                }
            };

            // Детализация каменной кладки
            const drawBricks = (dx, dy, w, h, count) => {
                for(let i = 0; i < count; i++) {
                    let bx = dx + 1 + (Math.abs(Math.sin(i * 12.34)) * (w - 4)) | 0;
                    let by = dy + 1 + (Math.abs(Math.cos(i * 45.67)) * (h - 2)) | 0;
                    rect(bx, by, 3, 1, cShadow);
                    rect(bx, by + 1, 3, 1, cLight);
                }
            };

            // Главная Центральная Башня (Keep)
            rect(-17, 30, 34, 45, cMain); 
            rect(-17, 30, 3, 45, cShadow); 
            drawBricks(-17, 30, 34, 45, 20);
            drawWindow(-3, 48, 6, 14, true); // Центральное высокое окно
            drawCrenellations(-19, 75, 38); 
            drawRoof(-19, 80, 38); 
            drawFlag(0, 99);

            // Левая Внутренняя Башня
            rect(-39, 20, 18, 35, cMain); 
            rect(-39, 20, 2, 35, cShadow); 
            drawBricks(-39, 20, 18, 35, 12);
            drawWindow(-33, 35, 6, 10, true); 
            drawCrenellations(-41, 55, 22); 
            drawRoof(-41, 60, 22); 
            drawFlag(-30, 71);

            // Правая Внутренняя Башня
            rect(21, 20, 18, 35, cMain); 
            rect(21, 20, 2, 35, cShadow); 
            drawBricks(21, 20, 18, 35, 12);
            drawWindow(27, 35, 6, 10, true); 
            drawCrenellations(19, 55, 22); 
            drawRoof(19, 60, 22); 
            drawFlag(30, 71);

            // Главная стена (Main Wall)
            rect(-35, 0, 70, 30, cMain); 
            rect(-35, 0, 4, 30, cShadow); 
            rect(31, 0, 4, 30, cShadow); 
            drawBricks(-35, 0, 70, 30, 30);
            drawCrenellations(-35, 30, 70); 

            // Внешняя Левая Башня
            rect(-59, 0, 18, 45, cMain); 
            rect(-59, 0, 3, 45, cShadow); 
            drawBricks(-59, 0, 18, 45, 15);
            drawWindow(-53, 22, 6, 12, false);
            drawCrenellations(-61, 45, 22); 
            drawRoof(-61, 50, 22); 
            drawFlag(-50, 61);

            // Внешняя Правая Башня
            rect(41, 0, 18, 45, cMain); 
            rect(41, 0, 3, 45, cShadow); 
            drawBricks(41, 0, 18, 45, 15);
            drawWindow(47, 22, 6, 12, false);
            drawCrenellations(39, 45, 22); 
            drawRoof(39, 50, 22); 
            drawFlag(50, 61);

            // --- НОВЫЕ ВОРОТА И РЕШЕТКА (Portcullis) ---
            
            // Каменное обрамление (арка)
            drawArch(-14, 0, 28, 22, cStoneFrame);
            // Темный проход внутрь
            drawArch(-12, 0, 24, 20, cHole);

            let portcullisY = 4; // Решетка слегка приподнята
            let gridHeight = 22;

            // Вертикальные прутья с остриями
            for(let gx = -9; gx <= 9; gx += 3) {
                rect(gx, portcullisY, 1, gridHeight - portcullisY, cIron);
                rect(gx, portcullisY - 1, 1, 1, cIronDark); // Острие
            }
            // Горизонтальные прутья
            for(let gy = portcullisY + 2; gy < 19; gy += 4) {
                rect(-11, gy, 22, 1, cIron);
                rect(-11, gy - 1, 22, 1, cIronDark);
            }

            // Цепи подъемного механизма
            rect(-11, 18, 2, 4, cIronDark);
            rect(9, 18, 2, 4, cIronDark);

            // --- ОТКИДНОЙ МОСТ ЧЕРЕЗ РОВ ---
            rect(-15, -4, 30, 4, "#5c4033"); // Толщина
            rect(-15, -1, 30, 2, cWood);     // Доски
            
            // Цепи моста, идущие по диагонали к стене
            for(let i = 0; i < 12; i++) {
                rect(-15 + i, i - 1, 1, 1, cIron);
                rect(14 - i, i - 1, 1, 1, cIron);
            }
        }

// ============================================
// INIT GAME - Initialize game state for selected difficulty
// Инициализация игры для выбранной сложности
// ============================================
function init(difficulty) {
    // ============================================
    // SET DIFFICULTY
    // Установка сложности
    // ============================================
    currentDifficulty = difficulty;
    const _dn = t('diffName.' + difficulty);
    diffLabel.innerText = t('diffLabelPrefix') + (_dn.indexOf('diffName.') === 0 ? difficulty.toUpperCase() : _dn);
    // Moon physics: на луне низкая гравитация и высокий прыжок.
    // Переключаем глобальные gravity / jumpStrength, которые Cat.update() использует напрямую.
    if (difficulty === 'megahard') {
        gravity      = 0.4;   // падение в ~3× медленнее (0.6 * 0.3)
        jumpStrength = -17;    // прыжок в ~1.7× выше (-14 * 1.7)
    } else {
        gravity      = 0.6;    // земная гравитация
        jumpStrength = -14;    // обычный прыжок
    }
    window.moonGravityScale = (difficulty === 'megahard') ? 0.58 : 1.0;  // lower = slower fall
    window.moonJumpScale    = (difficulty === 'megahard') ? 1.4  : 1.0;  // higher = bigger jump
    
    // ============================================
    // UI SETUP - Score display based on mode
    // Настройка UI отображения очков
    // ============================================
    if (currentDifficulty === 'infinity') { 
        normalScoreBox.style.display = 'none'; 
        infinityScoreBox.style.display = 'block'; 
        infinityScoreEl.innerText = "0"; 
        normalBestBox.style.display = 'none'; 
        infinityBestBox.style.display = 'block'; 
        infinityHighScoreEl.innerText = infinityHighScore; 
    } else { 
        normalScoreBox.style.display = 'block'; 
        infinityScoreBox.style.display = 'none'; 
        scoreEl.innerText = "0"; 
        normalBestBox.style.display = 'block'; 
        infinityBestBox.style.display = 'none'; 
        highScoreEl.innerText = highScore; 
    }
    
    // ============================================
    // INITIALIZE WORLD AND PLAYERS
    // Инициализация мира и игроков
    // ============================================
    initWorld();
    // Онлайн — всегда два игрока: гарантируем создание второго кота,
    // иначе cats[1] окажется undefined и игровой цикл «зависает» (кадры замирают).
    if (net.isOnline) numPlayers = 2;
    // Подстраховка от некорректного индекса скина (например, рассинхрон скинов в онлайне),
    // иначе new Cat() с undefined-скином ломает отрисовку.
    if (!SKINS[p1SkinIndex]) p1SkinIndex = 0;
    if (numPlayers === 2 && !SKINS[p2SkinIndex]) p2SkinIndex = 1;
    cats = [];
    // Player 1 (always present)
    cats.push(new Cat(100, SKINS[p1SkinIndex], { up: 'KeyW', left: 'KeyA', right: 'KeyD' }, true));
    // Player 2 (if 2-player mode)
    if (numPlayers === 2) {
        cats.push(new Cat(160, SKINS[p2SkinIndex], { up: 'ArrowUp', left: 'ArrowLeft', right: 'ArrowRight' }, false));
        // Инициализация remote state для интерполяции
        if (net.isOnline) {
            const remoteCat = net.isHost ? cats[1] : cats[0];
            net.remote.x = remoteCat.x; net.remote.y = remoteCat.y;
            net.remote.vx = 0; net.remote.vy = 0;
            net.remote.lastTime = performance.now();
        }
    }
    
    // ============================================
    // RESET GAME STATE
    // Сброс состояния игры
    // ============================================
    camera.x = 0; 
    score = 0; 
    gameTime = 0; 
    isGameOver = false; 
    isPlaying = true; 
    isWin = false;
    net.gameStartTime = Date.now(); // фиксируем время старта для фильтрации устаревших пакетов
    
    // ============================================
    // HIDE ALL MENUS
    // Скрыть все меню
    // ============================================
    startScreen.style.display = 'none';
    onlineScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    winScreen.style.display = 'none';
    npcDialog.style.display = 'none';
    { const _cs = document.getElementById('classic-screen'); if (_cs) _cs.style.display = 'none'; }
    { const _ms = document.getElementById('minigames-screen'); if (_ms) _ms.style.display = 'none'; }
    { const _gs = document.getElementById('ghosthunt-screen'); if (_gs) _gs.style.display = 'none'; }
    { const _go = document.getElementById('ghosthunt-over-screen'); if (_go) _go.style.display = 'none'; }

    if (menuAnimationId) cancelAnimationFrame(menuAnimationId);
}

function updateNPCDialog() {
    if (!npcCat || npcDialogShown) return;
    let playerMoved = false; for (let cat of cats) { if (cat.x > npcCat.x + 10) { playerMoved = true; break; } }
    if (playerMoved) {
        npcDialogShown = true; npcDialog.style.opacity = '0';
        setTimeout(() => { npcDialog.style.display = 'none'; }, 500);
        if (npcCat) npcCat.startFadeOut();
        return;
    }
    const npcScreenX = (npcCat.x - camera.x - 130) * zoomFactor, npcScreenY = (npcCat.y - 100) * zoomFactor;
    npcDialog.style.left = npcScreenX + 'px'; npcDialog.style.top = npcScreenY + 'px'; npcDialog.style.display = 'block'; npcDialog.style.opacity = '1';
}

// ============================================
// CHECK COLLISIONS - Player vs items and hazards
// Проверка столкновений - игрок vs предметы и препятствия
// ============================================
function checkCollisions() {
    // В онлайне каждый проверяет только своего кота
    // ============================================
    // PLAYER VS ITEMS
    // ============================================
    cats.forEach(cat => {
        // Пропустить чужого кота в онлайн-режиме
        if (net.isOnline) {
            const isMycat = (net.isHost && cat.isPlayer1) || (!net.isHost && !cat.isPlayer1);
            if (!isMycat) return;
        }
        items.forEach(item => {
            // Hitbox calculation
            let hitX = item.x + 5, hitW = item.w - 10, hitY = item.y - 35, hitH = 35; 
            if (item.type.includes('fish')) { 
                hitX = item.x; hitW = item.w; hitY = item.y; hitH = item.h; 
            }
            if (item.type === 'alien_fly') {
                hitX = item.x + 4; hitW = item.w - 8; hitY = item.y; hitH = item.h;
            }
            
            // Skip trees and sand fills (decoration only)
            if (item.type === 'tree') return;
            if (item.type === 'sand_fill') return; // sand fill is visual only
            
            // Check collision — cat hitbox inset by 4px on sides for fair feel
            if (!item.taken && cat.x + 4 < hitX + hitW && cat.x + cat.width - 4 > hitX && 
                cat.y < hitY + hitH && cat.y + cat.height > hitY) {
                
                if (item.type.includes('fish')) { 
                    // Collect fish
                    item.taken = true;
                    let _isGold = false;
                    if (item.type === 'blue-fish') { fishWallet.blue++; AudioEngine.sfx.fishBlue(); }
                    else if (item.type === 'gold-fish') { fishWallet.gold++; AudioEngine.sfx.fishGold(); _isGold = true; }
                    else { fishWallet.orange++; AudioEngine.sfx.fishOrange(); }
                    // Всплывающий «+1» в цвете рыбки — анимация подбора
                    const _ftColor = item.type === 'gold-fish' ? '#ffd700' : item.type === 'blue-fish' ? '#29b6f6' : '#ffa726';
                    floatingTexts.push({ text: '+1', x: item.x + item.w / 2, y: item.y - 6, alpha: 1, dy: -1.5, size: _isGold ? 18 : 13, color: _ftColor });
                    saveGameData();
                    updateFishUI();
                } else { 
                    // Hit hazard (cactus, rock, stump)
                    if (!inCastle && !godMode) endGame(); 
                }
            }
        });
    });
    
    // ============================================
    // UPDATE SCORE
    // ============================================
    let maxDist = 0;
    if (net.isOnline) {
        // В онлайне — только свой кот
        const myCat = net.isHost ? cats[0] : cats[1];
        if (myCat) maxDist = myCat.x;
    } else {
        cats.forEach(c => { if (c.x > maxDist) maxDist = c.x; });
    }
    let newScore = Math.floor(maxDist / 50); 
    if (newScore > score) score = newScore;
    
    // Update score display
    if (currentDifficulty === 'infinity') {
        infinityScoreEl.innerText = score;
    } else { 
        scoreEl.innerText = score; 
        // Check if entered castle area
        if (maxDist > CASTLE_START_X + 500) inCastle = true; 
        // Check win condition (reached castle center)
        if (!isWin && maxDist > CASTLE_START_X + 1000) triggerWin(); 
    }
}

// ============================================
// TRIGGER WIN - Handle victory condition
// Обработка победы (достижение замка)
// ============================================
function triggerWin() {
    // isWin и isPlaying устанавливаются в setTimeout ниже, после показа UI
    AudioEngine.stopMusic();
    AudioEngine.sfx.victory(); 
    
    // ============================================
    // SAVE HIGH SCORE
    // Сохранение рекорда
    // ============================================
    if (score > highScore) { 
        highScore = score; 
        highScoreEl.innerText = highScore; 
    }
    
    if (typeof _accAutoSubmit === "function") _accAutoSubmit(score, "normal");

    // ============================================
    // UNLOCK NEXT DIFFICULTY
    // Открытие следующей сложности
    // ============================================
    let msg = "", nextBtnVisible = true;
    if (currentDifficulty === 'easy') { 
        if (!hardUnlocked) { 
            hardUnlocked = true; 
            msg = t('hardUnlocked'); 
        } 
    } else if (currentDifficulty === 'hard') { 
        if (!megaHardUnlocked) { 
            megaHardUnlocked = true; 
            msg = t('megaUnlocked'); 
        } 
    } else if (currentDifficulty === 'megahard') { 
        if (!infinityUnlocked) { 
            infinityUnlocked = true; 
            msg = t('infinityUnlocked'); 
        } 
    } else {
        nextBtnVisible = false;
    }
    
    // ============================================
    // SAVE PROGRESS AND SHOW WIN SCREEN
    // Сохранение прогресса и показ экрана победы
    // ============================================
    // 1. Сначала показываем UI — до любых опасных операций
    unlockMsg.innerText = msg; 
    const _btnNext = btnNextLevel || document.getElementById('btn-next-level') || document.getElementById('btn-next');
    if (_btnNext) _btnNext.style.display = nextBtnVisible ? 'block' : 'none';
    winScreen.style.display = 'block';
    _hideMobileControls(); // на экране победы скрываем джойстик/кнопки
    const _lobbyWin = document.getElementById('btn-lobby-win');
    if (_lobbyWin) _lobbyWin.style.display = net.isOnline ? 'block' : 'none';
    if (net.isOnline && net.conn && net.conn.open) net.conn.send({ type: 'WIN', score: score, _t: Date.now() });

    // 2. Через 10мс — сохраняем и останавливаем цикл (чтобы не зависнуть при ошибке)
    setTimeout(() => {
        try {
            saveGameData();
        } catch(e) {
            console.error('[triggerWin] Ошибка сохранения:', e);
        }
        isWin = true;
        isPlaying = false;
        cancelAnimationFrame(animationId);
    }, 10);


}

// ============================================
// UPDATE CAMERA - Follow player(s) smoothly
// Обновление камеры - плавное следование за игроком(ами)
// ============================================
function updateCamera() { 
    // В онлайне камера следует за своим котом
    let focusCat;
    if (net.isOnline) {
        focusCat = net.isHost ? cats[0] : cats[1];
    }
    
    let totalX = 0; 
    if (focusCat) {
        totalX = focusCat.x;
    } else {
        cats.forEach(c => totalX += c.x); 
        totalX /= cats.length;
        const midPoint = totalX;
        let targetX = midPoint - (LOGICAL_W / zoomFactor) / 2; 
        if (targetX < 0) targetX = 0;
        camera.x += (targetX - camera.x) * 0.1; 
        return;
    }

    let targetX = totalX - (LOGICAL_W / zoomFactor) / 2; 
    if (targetX < 0) targetX = 0;
    camera.x += (targetX - camera.x) * 0.1; 
}

// ============================================
// DRAW SUN - Pixel art sun
// Рисование пиксель-арт солнца
// ============================================
// ---- drawSun: cached to offscreen canvas, recreated only on radius/color change ----
function drawSun(ctx, cx, cy, radius, colorMain, colorSec) {
    const key = radius + '_' + colorMain;
    if (!_sunCaches[key]) {
        const pixelSize = 4, steps = Math.floor(radius / pixelSize);
        const size = (steps * 2 + 1) * pixelSize + 2;
        const sc = document.createElement('canvas'); sc.width = sc.height = Math.ceil(size * RS);
        const sctx = sc.getContext('2d'); sctx.setTransform(RS, 0, 0, RS, 0, 0); const mid = Math.floor(size / 2);
        for (let y = -steps; y <= steps; y++) { for (let x = -steps; x <= steps; x++) { if (x * x + y * y <= steps * steps) { sctx.fillStyle = (Math.abs(x) > steps - 2 || Math.abs(y) > steps - 2) ? colorSec : colorMain; sctx.fillRect(mid + x * pixelSize, mid + y * pixelSize, pixelSize, pixelSize); } } }
        _sunCaches[key] = { canvas: sc, mid, size };
    }
    const c = _sunCaches[key]; ctx.drawImage(c.canvas, cx - c.mid, cy - c.mid, c.size, c.size);
}

// ---- drawBehelit: cached to offscreen canvas, recreated only on radius change ----
function drawBehelit(ctx, cx, cy, radius) {
    if (!_behelitCache || _behelitCacheR !== radius) {
        _behelitCacheR = radius;
        const s = radius / 50;
        const W = Math.ceil(radius * 10), H = Math.ceil(radius * 14);
        const bc = document.createElement('canvas'); bc.width = Math.ceil(W * RS); bc.height = Math.ceil(H * RS);
        const bctx = bc.getContext('2d'); bctx.setTransform(RS, 0, 0, RS, 0, 0);
        const ocx = W / 2, ocy = H * 0.55;
        bctx.fillStyle = "#3e2723"; bctx.fillRect(ocx - 2 * s, ocy - 80 * s, 4 * s, 30 * s);
        bctx.fillStyle = "#c5a000"; bctx.beginPath(); bctx.moveTo(ocx - 15 * s, ocy - 50 * s); bctx.lineTo(ocx + 15 * s, ocy - 50 * s); bctx.lineTo(ocx + 20 * s, ocy - 40 * s); bctx.lineTo(ocx - 20 * s, ocy - 40 * s); bctx.fill();
        bctx.strokeStyle = "#c5a000"; bctx.lineWidth = 4 * s; bctx.beginPath(); bctx.arc(ocx, ocy - 55 * s, 8 * s, Math.PI, 0); bctx.stroke();
        bctx.fillStyle = "#a30000"; bctx.beginPath(); bctx.ellipse(ocx, ocy, radius, radius * 1.3, 0, 0, Math.PI * 2); bctx.fill();
        bctx.fillStyle = "rgba(0,0,0,0.2)"; bctx.beginPath(); bctx.arc(ocx, ocy, radius * 0.9, 0, Math.PI * 2); bctx.fill();
        bctx.fillStyle = "#ddd"; bctx.beginPath(); bctx.ellipse(ocx - 20 * s, ocy - 15 * s, 12 * s, 10 * s, -0.2, 0, Math.PI * 2); bctx.fill();
        bctx.fillStyle = "#4169e1"; bctx.beginPath(); bctx.arc(ocx - 20 * s, ocy - 15 * s, 4 * s, 0, Math.PI * 2); bctx.fill();
        bctx.fillStyle = "#000"; bctx.beginPath(); bctx.arc(ocx - 20 * s, ocy - 15 * s, 1.5 * s, 0, Math.PI * 2); bctx.fill();
        bctx.fillStyle = "#ddd"; bctx.beginPath(); bctx.ellipse(ocx + 25 * s, ocy - 20 * s, 11 * s, 9 * s, 0.2, 0, Math.PI * 2); bctx.fill();
        bctx.fillStyle = "#4169e1"; bctx.beginPath(); bctx.arc(ocx + 25 * s, ocy - 20 * s, 4 * s, 0, Math.PI * 2); bctx.fill();
        bctx.fillStyle = "#000"; bctx.beginPath(); bctx.arc(ocx + 25 * s, ocy - 20 * s, 1.5 * s, 0, Math.PI * 2); bctx.fill();
        bctx.fillStyle = "#4a0000"; bctx.beginPath(); bctx.moveTo(ocx - 25 * s, ocy - 10 * s); bctx.bezierCurveTo(ocx - 35 * s, ocy + 10 * s, ocx - 30 * s, ocy + 30 * s, ocx - 32 * s, ocy + 50 * s); bctx.lineTo(ocx - 28 * s, ocy + 50 * s); bctx.bezierCurveTo(ocx - 25 * s, ocy + 30 * s, ocx - 15 * s, ocy + 10 * s, ocx - 15 * s, ocy - 5 * s); bctx.fill();
        bctx.beginPath(); bctx.moveTo(ocx + 30 * s, ocy - 15 * s); bctx.bezierCurveTo(ocx + 40 * s, ocy + 10 * s, ocx + 35 * s, ocy + 40 * s, ocx + 38 * s, ocy + 60 * s); bctx.lineTo(ocx + 34 * s, ocy + 60 * s); bctx.bezierCurveTo(ocx + 30 * s, ocy + 40 * s, ocx + 20 * s, ocy + 10 * s, ocx + 20 * s, ocy - 10 * s); bctx.fill();
        bctx.fillStyle = "#7a0000"; bctx.beginPath(); bctx.moveTo(ocx - 5 * s, ocy + 10 * s); bctx.lineTo(ocx - 10 * s, ocy + 30 * s); bctx.lineTo(ocx, ocy + 35 * s); bctx.lineTo(ocx + 10 * s, ocy + 28 * s); bctx.lineTo(ocx + 5 * s, ocy + 10 * s); bctx.fill();
        bctx.fillStyle = "#600000"; bctx.beginPath(); bctx.ellipse(ocx, ocy + 55 * s, 22 * s, 15 * s, 0, 0, Math.PI * 2); bctx.fill();
        bctx.fillStyle = "#300000"; bctx.beginPath(); bctx.ellipse(ocx, ocy + 55 * s, 18 * s, 10 * s, 0, 0, Math.PI * 2); bctx.fill();
        bctx.fillStyle = "#eee"; for (let i = -3; i <= 3; i++) { bctx.fillRect(ocx + (i * 5 * s) - 2 * s, ocy + 46 * s, 4 * s, 5 * s); } for (let i = -3; i <= 3; i++) { bctx.fillRect(ocx + (i * 5 * s) - 2 * s, ocy + 58 * s, 4 * s, 5 * s); }
        bctx.fillStyle = "#a30000"; bctx.beginPath(); bctx.arc(ocx, ocy + 62 * s, 6 * s, Math.PI, 0); bctx.fill();
        _behelitCache = { canvas: bc, ox: ocx, oy: ocy, w: W, h: H };
    }
    ctx.drawImage(_behelitCache.canvas, cx - _behelitCache.ox, cy - _behelitCache.oy, _behelitCache.w, _behelitCache.h);
}

// ---- drawRainbow: cached to offscreen canvas, recreated only on screen size change ----
function drawRainbow(ctx, camX, vOffset) {
    const renderWidth = Math.ceil(LOGICAL_W / zoomFactor), renderHeight = Math.ceil(LOGICAL_H / zoomFactor);
    if (!_rainbowCache || _rainbowCacheW !== renderWidth || _rainbowCacheH !== renderHeight) {
        _rainbowCacheW = renderWidth; _rainbowCacheH = renderHeight;
        _rainbowCache = document.createElement('canvas'); _rainbowCache.width = Math.ceil(renderWidth * RS); _rainbowCache.height = Math.ceil(renderHeight * RS);
        const rctx = _rainbowCache.getContext('2d'); rctx.setTransform(RS, 0, 0, RS, 0, 0);
        const rcx = renderWidth / 2, rcy = renderHeight + 100, radius = 700;
        const colors = ["rgba(255, 0, 0, 0.2)", "rgba(255, 127, 0, 0.2)", "rgba(255, 255, 0, 0.2)", "rgba(0, 255, 0, 0.2)", "rgba(0, 187, 255, 0.2)", "rgba(0, 4, 255, 0.2)", "rgba(136, 0, 255, 0.2)"];
        for (let i = 0; i < 7; i++) { rctx.beginPath(); rctx.arc(rcx, rcy, radius - i * 15, Math.PI, 2 * Math.PI); rctx.strokeStyle = colors[i]; rctx.lineWidth = 15; rctx.stroke(); }
    }
    // На мобильных vOffset > 0: рисуем с поправкой чтобы радуга совпадала с фоном
    ctx.drawImage(_rainbowCache, camX, -(vOffset || 0), _rainbowCacheW, _rainbowCacheH);
}

function drawBackground(vOffset) {
    const renderWidth = LOGICAL_W / zoomFactor, renderHeight = LOGICAL_H / zoomFactor;
    // ---- Gradient cache: recreate only on difficulty or size change ----
    if (!_bgGrad || _bgGradDiff !== currentDifficulty || _bgGradH !== renderHeight || _bgGradOff !== vOffset) {
        _bgGradDiff = currentDifficulty; _bgGradH = renderHeight; _bgGradOff = vOffset;
        _bgGrad = ctx.createLinearGradient(0, -vOffset, 0, renderHeight - vOffset);
        if (currentDifficulty === 'infinity') { _bgGrad.addColorStop(0, "#000000"); _bgGrad.addColorStop(0.5, "#4a0404"); _bgGrad.addColorStop(1, "#800000"); }
        else if (currentDifficulty === 'hard') { _bgGrad.addColorStop(0, "#f8c291"); _bgGrad.addColorStop(0.5, "#f6e58d"); _bgGrad.addColorStop(1, "#f6e58d"); }
        else if (currentDifficulty === 'megahard') { _bgGrad.addColorStop(0, "#000008"); _bgGrad.addColorStop(0.5, "#050520"); _bgGrad.addColorStop(1, "#0a0a30"); }
        else { _bgGrad.addColorStop(0, "#87CEEB"); _bgGrad.addColorStop(1, "#E0F7FA"); }
    }
    ctx.fillStyle = _bgGrad;
    ctx.fillRect(camera.x, -vOffset, renderWidth, renderHeight);
    if (currentDifficulty === 'infinity') { drawBehelit(ctx, camera.x + renderWidth - 200, -vOffset + 150, 40); }
    else if (currentDifficulty === 'megahard') {
        // Draw stars (static, seeded by position)
        for (let i = 0; i < 60; i++) {
            const on = Math.sin(gameTime * 0.04 + i * 2.13) > 0.28;
            ctx.fillStyle = on ? '#ffffff' : '#6677aa';
            const sx = camera.x + ((i * 163 + 11) % (renderWidth - 6)) + 3;
            const sy = -vOffset + ((i * 71 + 7) % (renderHeight * 0.7)) + 3;
            ctx.fillRect(sx, sy, on ? 2 : 1, on ? 2 : 1);
        }
        // Draw pixel Earth — rendered in pure screen space so it never shakes with the camera
        {
            const _earthGrid = [
                "________________________________________",
                "________________________________________",
                "_______________5111111225_______________",
                "_____________55511111222255_____________",
                "___________544551112222225556___________",
                "_________5544455112222222225666_________",
                "________555444551122222222224666________",
                "_______55544445511222222222244466_______",
                "______5655444455112222222222544666______",
                "_____665544445511122222222225554466_____",
                "_____665544445511122222222211555445_____",
                "____66554444551111222222221111554455____",
                "____66554444661111222222221116444455____",
                "___6665544446611112222222111644444555___",
                "___3665544445511112222222115444444556___",
                "__333665544555111222222211555444445566__",
                "__333665555555442222222211555555445566__",
                "__333336655554442222222211555555445566__",
                "__333336666644442222222211555444445566__",
                "__333333366644442222222211554444445566__",
                "__333333333333111222222211554444445566__",
                "__333333333333111122222221155444445566__",
                "__333333333333666662222221155444445566__",
                "__333333333336666666222222115544455666__",
                "__333333333336655555122222115544455666__",
                "___3333333366555555511222221154455666___",
                "___3333333366554455566222221155555666___",
                "____33333366554444556622222221555566____",
                "____33333366554444556622222222255566____",
                "_____333333665544455622222222222556_____",
                "_____333333665544455222222222223335_____",
                "______3333333665445522222222223333______",
                "_______33333366555552222222222333_______",
                "________333333366555222222222333________",
                "_________3333336655522222223333_________",
                "___________333333655222223333___________",
                "_____________33333332222233_____________",
                "_______________3333322223_______________",
                "________________________________________",
                "________________________________________"
            ];
            const _earthColors = {
                '1': '#5bafff', '2': '#2f74ff', '3': '#1c3cc7',
                '4': '#b5e61d', '5': '#2db43e', '6': '#12742d'
            };
            // Switch to screen space — completely bypasses camera translate → zero jitter
            ctx.save();
            ctx.setTransform(zoomFactor * RS, 0, 0, zoomFactor * RS, 0, 0);
            const _cs = 4;           // 4px/cell × 40 cells = 160px (= 2× sun diameter)
            const _ew = 40 * _cs;    // 160
            // Fixed screen position (integers → no sub-pixel gaps between cells)
            const _ex = Math.round(renderWidth - 290);
            const _ey = 90;
            const _ecx = _ex + _ew / 2, _ecy = _ey + _ew / 2;

            // Outer glow only — circular arc fill, starts just outside the planet edge
            const _glowOuter = ctx.createRadialGradient(_ecx, _ecy, _ew * 0.06, _ecx, _ecy, _ew * 0.82);
            _glowOuter.addColorStop(0,    'rgba(255,255,255,0)');
            _glowOuter.addColorStop(0.30, 'rgba(220,235,255,0.13)');
            _glowOuter.addColorStop(0.65, 'rgba(255,255,255,0.10)');
            _glowOuter.addColorStop(1,    'rgba(255,255,255,0)');
            ctx.fillStyle = _glowOuter;
            ctx.beginPath();
            ctx.arc(_ecx, _ecy, _ew * 0.82, 0, Math.PI * 2);
            ctx.fill();

            // Earth — кешируем спрайт (ячейки впритык в offscreen) и блитим целиком,
            // иначе на дробном экранном масштабе между ячейками видны швы-сетка.
            if (!_earthCache || _earthCacheRS !== RS) {
                _earthCacheRS = RS;
                _earthCache = document.createElement('canvas');
                _earthCache.width = _ew * RS; _earthCache.height = _ew * RS;
                const _ectx = _earthCache.getContext('2d');
                _ectx.imageSmoothingEnabled = false;
                _ectx.setTransform(RS, 0, 0, RS, 0, 0);
                for (let _r = 0; _r < 40; _r++) {
                    for (let _c = 0; _c < 40; _c++) {
                        const _ch = _earthGrid[_r][_c];
                        if (_ch === '_') continue;
                        _ectx.fillStyle = _earthColors[_ch];
                        _ectx.fillRect(_c * _cs, _r * _cs, _cs, _cs);
                    }
                }
            }
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(_earthCache, _ex, _ey, _ew, _ew);

            ctx.restore(); // back to world (camera-translated) space
        }
    }
    else if (currentDifficulty === 'hard') {
        drawRainbow(ctx, camera.x, vOffset);
        drawSun(ctx, camera.x + renderWidth - 150, -vOffset + 100, 40, "#f1c40f", "#f39c12");
        drawSun(ctx, camera.x + renderWidth - 250, -vOffset + 180, 20, "#ecf0f1", "#e67e22");
    }
    else {
        if (currentDifficulty !== 'easy') { drawRainbow(ctx, camera.x, vOffset); drawSun(ctx, camera.x + renderWidth - 150, -vOffset + 100, 40, "#f1c40f", "#f39c12"); }
        else drawSun(ctx, camera.x + renderWidth - 150, -vOffset + 100, 40, "#f1c40f", "#f39c12");
    }
    // Облака: плывут справа налево, начало — за правым краем экрана
    // No clouds on moon (megahard)
    if (currentDifficulty !== 'megahard') {
        const cloudCycleW = renderWidth + 200; // полный цикл чуть шире экрана
        const cloudScroll1 = (gameTime * 0.4) % cloudCycleW;
        const cloudScroll2 = (gameTime * 0.25 + cloudCycleW * 0.55) % cloudCycleW;
        const cloud1X = camera.x + renderWidth - cloudScroll1;
        const cloud2X = camera.x + renderWidth - cloudScroll2;
        if (currentDifficulty === 'infinity') ctx.fillStyle = "rgba(0,0,0,0.5)"; else ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillRect(cloud1X, -vOffset + 100, 100, 30);
        ctx.fillRect(cloud2X, -vOffset + 150, 80, 25);
    }
    if (currentDifficulty === 'hard') pixies.forEach(pixie => pixie.draw(ctx));
    if (godMode) { ctx.fillStyle = "red"; ctx.font = "20px 'Press Start 2P'"; ctx.fillText("GOD MODE ON", camera.x + 20, -vOffset + 80); }
}

// ============================================
// END GAME - Handle game over
// Обработка окончания игры (проигрыш)
// ============================================
function endGame() {
    if (isGameOver || isWin) return; 
    isGameOver = true; 
    isPlaying = false;
    AudioEngine.stopMusic();
    AudioEngine.sfx.defeat();
    
    // Уведомить партнёра (оба могут слать DEAD)
    if (net.isOnline && net.conn && net.conn.open) {
        net.conn.send({ type: 'DEAD', score: score, _t: Date.now() });
    }
    
    // ============================================
    // SAVE HIGH SCORE
    // Сохранение рекорда
    // ============================================
    if (currentDifficulty === 'infinity') { 
        if (score > infinityHighScore) { 
            infinityHighScore = score; 
            saveGameData(); 
            infinityHighScoreEl.innerText = infinityHighScore; 
        } 
    } else { 
        if (score > highScore) { 
            highScore = score; 
            saveGameData(); 
            highScoreEl.innerText = highScore; 
        } 
    }
    
    // ============================================
    // SHOW GAME OVER SCREEN
    // Показать экран проигрыша
    // ============================================
    if (typeof _accAutoSubmit === "function") _accAutoSubmit(score, currentDifficulty === "infinity" ? "infinity" : "normal");

    finalScoreEl.innerText = score; 
    gameOverScreen.style.display = 'block'; 
    npcDialog.style.display = 'none'; 
    cancelAnimationFrame(animationId);
    // В онлайн режиме — показать кнопку возврата в лобби
    const _lobbyGo = document.getElementById('btn-lobby-go');
    if (_lobbyGo) _lobbyGo.style.display = net.isOnline ? 'block' : 'none';
    // Гость не может самостоятельно перезапустить — только хост
    const _tryAgain = document.getElementById('btn-try-again');
    if (_tryAgain) _tryAgain.style.display = (net.isOnline && !net.isHost) ? 'none' : '';

    // Кнопка «рыбки за рекламу» — только в одиночной игре, если SDK доступен
    const _adFishBtn = document.getElementById('btn-game-ad-fish');
    const _adRewardMsg = document.getElementById('game-ad-reward-msg');
    if (_adFishBtn) _adFishBtn.style.display = (!net.isOnline && YandexSDK.ready) ? 'block' : 'none';
    if (_adRewardMsg) _adRewardMsg.style.display = 'none';
    _hideMobileControls(); // на экране проигрыша скрываем джойстик/кнопки


}

function showMenu() {
    isGameOver = false; isPlaying = false; isWin = false;
    // Уведомить партнёра о выходе из лобби ДО закрытия соединения
    if (net.conn && net.isOnline) {
        try { net.conn.send({ type: 'LEAVE' }); } catch(e) {}
    }
    // Закрываем соединение если было, но НЕ уничтожаем peer —
    // пользователь может вернуться в онлайн и использовать тот же ID
    if (net.conn) { try { net.conn.close(); } catch(e){} net.conn = null; }
    // Восстановить собственный скин гостя ДО обнуления онлайн-состояния
    if (_guestOwnSkin !== null) {
        p1SkinIndex = _guestOwnSkin;
    }
    // Гарантируем что скин разблокирован у текущего игрока
    if (!isSkinUnlocked(SKINS[p1SkinIndex].id)) {
        for (let i = 0; i < SKINS.length; i++) {
            if (isSkinUnlocked(SKINS[i].id)) { p1SkinIndex = i; break; }
        }
    }
    // Сбрасываем в одиночный режим ТОЛЬКО если были в онлайне
    if (net.isOnline) numPlayers = 1;
    _fbReset(); // удаляем комнату из Firebase ПОКА net.isHost ещё true
    _fbRestoreCreateSection(); // сбрасываем UI лобби — убираем "игрок подключился", показываем форму создания комнаты
    net.isHost = false; net.isOnline = false;
    net.worldSeed = 0; net.worldGroundBase = 0;
    net.bossOnline = false;
    net.remote = { x: 160, y: 100, vx: 0, vy: 0, dir: true, lastTime: 0 };
    _hideLeaveBtn(); // скрываем кнопку выхода из комнаты
    _pendingGuestSkin = null; // сброс запомненного скина гостя
    _guestOwnSkin = null;     // сброс собственного скина гостя
    document.getElementById('online-host-start').style.display = 'none';
    document.getElementById('online-guest-wait').style.display = 'none';
    gameOverScreen.style.display = 'none'; winScreen.style.display = 'none'; startScreen.style.display = 'block'; onlineScreen.style.display = 'none'; npcDialog.style.display = 'none';
    document.getElementById('shop-screen').style.display = 'none';
    { const _cs = document.getElementById('classic-screen'); if (_cs) _cs.style.display = 'none'; }
    { const _ms = document.getElementById('minigames-screen'); if (_ms) _ms.style.display = 'none'; }
    { const _gs = document.getElementById('ghosthunt-screen'); if (_gs) _gs.style.display = 'none'; }
    { const _go = document.getElementById('ghosthunt-over-screen'); if (_go) _go.style.display = 'none'; }
    if (typeof GH !== 'undefined' && GH.active) { GH.active = false; if (typeof ghAnimationId !== 'undefined' && ghAnimationId) cancelAnimationFrame(ghAnimationId); if (typeof ghShowMobileButtons === 'function') ghShowMobileButtons(false); }
    // Скрыть кнопки лобби
    const _lg = document.getElementById('btn-lobby-go'); if (_lg) _lg.style.display = 'none';
    const _lw = document.getElementById('btn-lobby-win'); if (_lw) _lw.style.display = 'none';
    const _ta = document.getElementById('btn-try-again'); if (_ta) _ta.style.display = '';
    if (animationId) cancelAnimationFrame(animationId); if (menuAnimationId) cancelAnimationFrame(menuAnimationId);
    ctx.setTransform(RS, 0, 0, RS, 0, 0); ctx.fillStyle = "#202028"; ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    updateFishUI(); updatePlayerModeUI(); normalBestBox.style.display = 'block'; infinityBestBox.style.display = 'block'; highScoreEl.innerText = highScore;
    menuPixies = []; for (let i = 0; i < 8; i++) menuPixies.push(new Pixie()); menuLoop();
    AudioEngine.startMenuMusic();
    _hideMobileControls();
}

// ============================================
// КЛАССИКА — отдельная страница выбора режима/сложности
// ============================================
function openClassic() {
    startScreen.style.display = 'none';
    const ms = document.getElementById('minigames-screen'); if (ms) ms.style.display = 'none';
    const cs = document.getElementById('classic-screen'); if (cs) cs.style.display = 'block';
    updateDifficultyButtons(); // обновляем блокировки режимов при каждом открытии
}
function closeClassic() {
    const cs = document.getElementById('classic-screen'); if (cs) cs.style.display = 'none';
    startScreen.style.display = 'block';
}

// ============================================
// МИНИ-ИГРЫ — страница-заглушка «раздел в разработке»
// ============================================
function openMinigames() {
    startScreen.style.display = 'none';
    const cs = document.getElementById('classic-screen'); if (cs) cs.style.display = 'none';
    const ms = document.getElementById('minigames-screen'); if (ms) ms.style.display = 'block';
}
function closeMinigames() {
    const ms = document.getElementById('minigames-screen'); if (ms) ms.style.display = 'none';
    startScreen.style.display = 'block';
}


// ============================================
// LEAVE ROOM — выйти из комнаты (остаться в онлайн-экране)
// ============================================
function leaveRoom() {
    if (net.conn && net.isOnline) {
        try { net.conn.send({ type: 'LEAVE' }); } catch(e) {}
        try { net.conn.close(); } catch(e) {}
        net.conn = null;
    }
    _fbReset();
    _hideLeaveBtn();
    net.isOnline = false; net.isHost = false;
    numPlayers = 1; net.bossOnline = false; bossBattleActive = false;
    document.getElementById('online-host-start').style.display = 'none';
    document.getElementById('online-guest-wait').style.display = 'none';
    if (connMode === 'firebase') {
        _fbRestoreCreateSection();
        _fbSetStatus(t('fbStatusLeft'), '#e74c3c');
    } else {
        const st = document.getElementById('online-status');
        if (st) st.innerText = t('ready');
    }
}

// ============================================
// SHOW ONLINE LOBBY — возврат в лобби без разрыва соединения
// ============================================
function showOnlineLobby() {
    isGameOver = false; isPlaying = false; isWin = false;
    bossBattleActive = false; bossBattlePaused = false; bossBattleSuspended = false;
    net.bossOnline = false;
    // selectedOnlineBoss сохраняется при возврате в лобби
    if (bossAnimationId) cancelAnimationFrame(bossAnimationId);
    if (animationId) cancelAnimationFrame(animationId);
    if (menuAnimationId) cancelAnimationFrame(menuAnimationId);
    // Скрыть все экраны игры
    gameOverScreen.style.display = 'none';
    winScreen.style.display = 'none';
    startScreen.style.display = 'none';
    npcDialog.style.display = 'none';
    document.getElementById('shop-screen').style.display = 'none';
    document.getElementById('boss-screen').style.display = 'none';
    document.getElementById('boss-battle-screen').style.display = 'none';
    document.getElementById('boss-win-screen').style.display = 'none';
    document.getElementById('boss-lose-screen').style.display = 'none';
    // Скрыть кнопки лобби
    const _lg = document.getElementById('btn-lobby-go'); if (_lg) _lg.style.display = 'none';
    const _lw = document.getElementById('btn-lobby-win'); if (_lw) _lw.style.display = 'none';
    // Восстановить кнопку "попробовать снова"
    const _ta = document.getElementById('btn-try-again'); if (_ta) _ta.style.display = '';
    // Сбросить numPlayers если соединение потеряно
    if (!net.isOnline || !net.conn || !net.conn.open) {
        numPlayers = 1;
        net.isOnline = false;
        net.isHost = false;
    }
    // Аудио
    AudioEngine.stopAllMusic();
    AudioEngine.startMenuMusic();
    // Канвас
    ctx.setTransform(RS, 0, 0, RS, 0, 0);
    ctx.fillStyle = "#202028";
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    updateFishUI(); updatePlayerModeUI();

    // Если гость возвращается в лобби — восстановить его собственный скин
    // (INIT перезаписал p1SkinIndex скином хоста во время игры)
    if (net.isOnline && !net.isHost) {
        if (_guestOwnSkin !== null) {
            p1SkinIndex = _guestOwnSkin;
        }
        // Убедиться что скин разблокирован у гостя; если нет — найти первый разблокированный
        if (!isSkinUnlocked(SKINS[p1SkinIndex].id)) {
            for (let i = 0; i < SKINS.length; i++) {
                if (isSkinUnlocked(SKINS[i].id)) { p1SkinIndex = i; break; }
            }
            _guestOwnSkin = p1SkinIndex;
        }
    }
    menuPixies = []; for (let i = 0; i < 8; i++) menuPixies.push(new Pixie());
    menuLoop();
    // Показать онлайн-лобби
    onlineScreen.style.display = 'block';
    // Восстановить панели подключения
    if (net.isOnline && net.conn && net.conn.open) {
        if (net.isHost) {
            try { net.conn.send({ type: 'LOBBY' }); } catch(e) {}
            if (connMode === 'firebase') {
                document.getElementById('online-host-start').style.display = 'none';
                fbSetMode(onlineMode);
                if (onlineMode === 'race') fbSetDiff(onlineDifficulty);
                else if (onlineMode === 'boss' && selectedOnlineBoss !== null) {
                    buildOnlineBossList('fb-boss-list-items');
                }
            } else {
                document.getElementById('online-host-start').style.display = 'block';
                // P2P: восстановить сложность
                setOnlineDiff(onlineDifficulty);
                setOnlineMode(onlineMode);
            }
            document.getElementById('online-guest-wait').style.display = 'none';
            document.getElementById('online-status').innerText = t('statusPlayerConnected');
            _fbSetStatus(t('fbStatusPlayerConn2'), '#2ecc71');
        } else {
            document.getElementById('online-host-start').style.display = 'none';
            document.getElementById('online-guest-wait').style.display = 'block';
            const pingEl = document.getElementById('ping-display');
            if (pingEl) pingEl.style.display = 'block';
            document.getElementById('online-status').innerText = '⏳ Ожидание хоста для нового старта...';
            _fbSetStatus(t('fbStatusWaiting'), '#aaa');
        }
    } else {
        // Соединение потеряно — подсказать создать новую комнату
        document.getElementById('online-host-start').style.display = 'none';
        document.getElementById('online-guest-wait').style.display = 'none';
        if (connMode === 'firebase') {
            _fbRestoreCreateSection();
            _fbSetStatus(t('fbStatusConnLost'), '#e74c3c');
        } else {
            const statusEl = document.getElementById('online-status');
            if (statusEl) statusEl.innerText = '⚠ Соединение разорвано. Попробуйте подключиться снова.';
        }
    }
    _hideMobileControls();
}

// Безопасный перезапуск: в онлайне только хост может рестартовать
function onlineSafeRestart() {
    if (net.isOnline && !net.isHost) {
        // Гость — подсказываем что нужно ждать хоста
        const hint = document.getElementById('try-again-hint');
        if (hint) hint.innerText = '⏳ Ожидание хоста...';
        return;
    }
    if (net.isOnline && net.isHost && net.conn && net.conn.open) {
        // Хост онлайн — отправляем гостю новый INIT, затем стартуем у себя
        net.worldSeed = Math.floor(Math.random() * 0x7FFFFFFF);
        net.worldGroundBase = LOGICAL_H - 100;
        p2SkinIndex = net.remoteSkin;
        // Скрыть экраны проигрыша/победы у хоста
        gameOverScreen.style.display = 'none';
        winScreen.style.display = 'none';
        // Восстановить подсказку
        const hint = document.getElementById('try-again-hint');
        if (hint) hint.innerText = t('tryAgainHint');
        const _ta = document.getElementById('btn-try-again');
        if (_ta) _ta.style.display = '';
        const _lg = document.getElementById('btn-lobby-go');
        if (_lg) _lg.style.display = 'none';
        const _lw = document.getElementById('btn-lobby-win');
        if (_lw) _lw.style.display = 'none';
        setTimeout(() => {
            if (!net.conn || !net.conn.open) { restartGame(); return; }
            net.conn.send({
                type: 'INIT',
                diff: currentDifficulty,
                seed: net.worldSeed,
                hostSkin: p1SkinIndex,
                hostVariant: mySkinVariants[SKINS[p1SkinIndex].id] || 'auto',
                guestSkin: net.remoteSkin,
                groundBase: net.worldGroundBase
            });
            numPlayers = 2;
            // Задержка первого POS на 1с — иначе POS перезапишет INIT в Firebase
            // до того как гость успеет его прочитать
            net.lastSentTime = performance.now() + 1000;
            startGame(currentDifficulty);
        }, 300);
    } else {
        // Оффлайн или соединение потеряно — обычный рестарт
        restartGame();
    }
}

// ============================================
// MAIN GAME LOOP - Core game update loop
// Основной игровой цикл - обновление всех систем
// ============================================
function loop(timestamp) {
    // ============================================
    // GAME STATE CHECK - Stop if game over or win
    // ============================================
    if (isGameOver || isWin) return; 
    animationId = requestAnimationFrame(loop);
    try {
    
    // ============================================
    // DELTA TIME CALCULATION - For smooth animation
    // Расчет времени между кадрами для плавной анимации
    // ============================================
    let deltaTime = timestamp - lastTime; 
    lastTime = timestamp; 
    if (deltaTime > 100) deltaTime = 100; // Cap at 100ms (10fps minimum)
    let timeScale = deltaTime / 16.666; // Normalize to 60fps
    gameTime += timeScale;
    
    // ============================================
    // FPS COUNTER - Display frames per second
    // ============================================
    if (timestamp > fpsDisplayTime + 1000) { 
        const fps = Math.round((fpsFrames * 1000) / (timestamp - fpsDisplayTime));
        fpsCounter.innerText = net.isOnline 
            ? "FPS: " + fps + " | PING: " + net.ping + "ms"
            : "FPS: " + fps;
        fpsDisplayTime = timestamp; 
        fpsFrames = 0; 
    }
    fpsFrames++;
    
    // ============================================
    // ONLINE MULTIPLAYER SYNC
    // Синхронизация онлайн мультиплеера
    // ============================================
    // ============================================
    // ONLINE SYNC (P2P — каждый шлёт только свою позицию)
    // ============================================
    if (net.isOnline && net.conn && net.conn.open) {
        if (timestamp - net.lastSentTime > net.tickRate) {
            // Определить своего кота
            const myCat = net.isHost ? cats[0] : cats[1];
            // Guard: если кот ещё не создан — пропускаем кадр, не роняя игровой цикл
            if (myCat) {
                try {
                    net.conn.send({ type: 'POS', x: myCat.x, y: myCat.y, dir: myCat.facingRight });
                    net.lastSentTime = timestamp;
                    // Пинг раз в 3 секунды
                    if (timestamp - net.lastPingTime > 3000) {
                        net.conn.send({ type: 'PING', time: timestamp });
                        net.lastPingTime = timestamp;
                    }
                } catch (e) { /* соединение могло закрыться между проверкой и отправкой */ }
            }
        }
        // Применяем интерполяцию к чужому коту (без velocity prediction)
        if (cats.length >= 2) {
            const remoteCat = net.isHost ? cats[1] : cats[0];
            const _dx = net.remote.x - remoteCat.x;
            const _dy = net.remote.y - remoteCat.y;
            const _dist = Math.sqrt(_dx * _dx + _dy * _dy);
            if (_dist > 300) {
                // Большой разрыв (смена уровня/респаун) — снап без артефактов
                remoteCat.x = net.remote.x;
                remoteCat.y = net.remote.y;
            } else {
                const alpha = Math.min(0.2 * timeScale, 1);
                remoteCat.x = lerp(remoteCat.x, net.remote.x, alpha);
                remoteCat.y = lerp(remoteCat.y, net.remote.y, alpha);
            }
            remoteCat.facingRight = net.remote.dir;
        }
    }
    
    // ============================================
    // MOBILE ZOOM OFFSET - Adjust for mobile view
    // Смещение для мобильного зума
    // ============================================
    let verticalOffset = 0; 
    if (zoomFactor < 1) verticalOffset = (LOGICAL_H / zoomFactor) - LOGICAL_H;

    // FIX #1: для гостя добавляем вертикальный сдвиг, чтобы земля
    // хоста (worldGroundBase) совпала с землёй гостя на экране.
    // У хоста сдвиг = 0 (его worldGroundBase = LOGICAL_H - 100).
    const groundSyncOffset = (net.isOnline && !net.isHost && net.worldGroundBase > 0)
        ? (LOGICAL_H - 100) - net.worldGroundBase
        : 0;

    // ============================================
    // CLEAR CANVAS - Prepare for new frame
    // Очистка канваса перед новым кадром
    // ============================================
    ctx.setTransform(zoomFactor * RS, 0, 0, zoomFactor * RS, 0, 0); 
    ctx.clearRect(0, 0, LOGICAL_W / zoomFactor, LOGICAL_H / zoomFactor);
    
    // ============================================
    // UPDATE GAME OBJECTS
    // Обновление игровых объектов
    // ============================================
    frameCount++;
    if (frameCount % 3 === 0) manageChunks(); // Управление чанками мира (не каждый кадр — экономия CPU)
    cats.forEach(c => c.update(timeScale)); // Обновление котов
    // Анимация подбора рыбки: всплывающий текст поднимается вверх и затухает
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.dy * timeScale;
        ft.alpha -= 0.02 * timeScale;
        if (ft.alpha <= 0) floatingTexts.splice(i, 1);
    }
    if (npcCat) npcCat.update(timeScale); // Обновление NPC
    if (currentDifficulty === 'hard') pixies.forEach(pixie => pixie.update(timeScale, camera.x - 50)); // Обновление фей только для hard
    if (currentDifficulty === 'megahard') updateAliens(timeScale); // Обновление инопланетян
    updateSandFills(timeScale); // Обновление падающего песка (hard)
    
    // ============================================
    // COLLISIONS AND CAMERA
    // Проверка столкновений и камера
    // ============================================
    checkCollisions(); // Проверка столкновений
    updateCamera(); // Обновление камеры
    if (npcCat && !npcDialogShown) updateNPCDialog(); // Обновление диалога NPC
    // В P2P каждый управляет своей камерой (updateCamera уже сделал это)
    
    // ============================================
    // RENDER GAME
    // Отрисовка игры
    // ============================================
    // FIX SEAMS: округляем камеру чтобы блоки земли всегда рисовались
    // в целых пикселях → никаких разрывов при дробных значениях camera.x
    const _scSnap = zoomFactor * RS; // мир выравниваем по целым ЭКРАННЫМ пикселям → нет дрожащих стыков
    const snapCamX = Math.round(camera.x * _scSnap) / _scSnap;
    const snapVOff  = Math.round((verticalOffset + groundSyncOffset) * _scSnap) / _scSnap;
    ctx.translate(-snapCamX, snapVOff); 
    drawBackground(snapVOff); // Фон
    drawWorld(); // Мир (блоки, предметы)
    if (npcCat) npcCat.draw(ctx); // NPC
    cats.forEach(c => c.draw()); // Коты
    } catch (e) {
        // Ошибка кадра не должна морозить игру — логируем один раз и продолжаем
        if (!window._loopErrLogged) { console.error('[loop] ошибка кадра, игра продолжается:', e); window._loopErrLogged = true; }
    }
}

function startGame(difficulty) {
    // В онлайн режиме пропускаем проверку скинов — скины назначены хостом,
    // и клиент может не иметь скин хоста в своей коллекции (это нормально).
    if (!net.isOnline) {
        const p1Ok = isSkinUnlocked(SKINS[p1SkinIndex].id);
        const p2Ok = (numPlayers === 1) ? true : isSkinUnlocked(SKINS[p2SkinIndex].id);
        if (!p1Ok || !p2Ok) return;
    }
    if (animationId) cancelAnimationFrame(animationId); if (menuAnimationId) cancelAnimationFrame(menuAnimationId); init(difficulty);
    _showMobileControls();
    AudioEngine.stopMusic();
    lastTime = performance.now(); fpsDisplayTime = lastTime; loop(lastTime);
}
function restartGame() { startGame(currentDifficulty); }

// ============================================
// BOSS BATTLE SYSTEM - SIDE-SCROLLER FORMAT
// Битва с боссом в формате side-scroller (как основной режим)
// ============================================

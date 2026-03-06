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
function drawPixelCat(drawCtx, x, y, skin, facingRight, controls, isPlayer1, isJumping = false, forcedMoving = null) {
    const size = 3;
    const width = 10 * size;
    const drawX = -width / 2;
    const drawY = 0;

    drawCtx.save();
    drawCtx.translate(x + width / 2, y);
    if (!facingRight) drawCtx.scale(-1, 1);

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
        const green = '#badc58', white = '#ffffff', black = '#000000';
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
    {
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
    let grad = ctx.createLinearGradient(0, 0, 0, canvas.height); grad.addColorStop(0, "#87CEEB"); grad.addColorStop(1, "#E0F7FA"); ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawRainbow(ctx, -canvas.width / 2); drawSun(ctx, canvas.width - 150, 100, 40, "#f1c40f", "#f39c12");
    ctx.fillStyle = "rgba(255,255,255,0.6)"; let cloudOff = (gameTime * 0.5) % 2000; ctx.fillRect(200 - cloudOff, 100, 100, 30); ctx.fillRect(1500 - cloudOff, 150, 80, 25);
    let groundY = canvas.height - 100; ctx.fillStyle = "#6d4c41"; ctx.fillRect(0, groundY, canvas.width, 500); ctx.fillStyle = "#66bb6a"; ctx.fillRect(0, groundY, canvas.width, 15); ctx.fillStyle = "#43a047"; ctx.fillRect(0, groundY + 12, canvas.width, 3);
    for (let tx = 0; tx < canvas.width; tx += 40) {
        if (tx > canvas.width / 2 - 200 && tx < canvas.width / 2 + 200) continue;
        let seed = Math.sin(tx), height = 60 + Math.abs(seed) * 40, yBase = canvas.height - 100;
        ctx.fillStyle = "#3e2723"; ctx.fillRect(tx + 15, yBase - 20, 10, 20); ctx.fillStyle = "#1b4d3e";
        ctx.beginPath(); ctx.moveTo(tx, yBase - 20); ctx.lineTo(tx + 20, yBase - 20 - height * 0.4); ctx.lineTo(tx + 40, yBase - 20); ctx.fill();
        ctx.beginPath(); ctx.moveTo(tx + 5, yBase - 20 - height * 0.2); ctx.lineTo(tx + 20, yBase - 20 - height * 0.7); ctx.lineTo(tx + 35, yBase - 20 - height * 0.2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(tx + 10, yBase - 20 - height * 0.5); ctx.lineTo(tx + 20, yBase - 20 - height); ctx.lineTo(tx + 30, yBase - 20 - height * 0.5); ctx.fill();
    }
    drawCastle(ctx, canvas.width / 2, groundY); menuPixies.forEach(p => p.draw(ctx));
}

function menuLoop() {
    if (isPlaying) return;
    p1PreviewCtx.clearRect(0, 0, 100, 80); p2PreviewCtx.clearRect(0, 0, 100, 80); onlineSkinCtx.clearRect(0, 0, 100, 80);
    gameTime += 0.5;
    const p1Y = 30, p2Y = 30;
    drawPixelCat(p1PreviewCtx, 35, p1Y, SKINS[p1SkinIndex], true, null, true); drawPixelCat(onlineSkinCtx, 35, p1Y, SKINS[p1SkinIndex], true, null, true);
    if (numPlayers === 2) drawPixelCat(p2PreviewCtx, 35, p2Y, SKINS[p2SkinIndex], true, null, false);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    menuPixies.forEach(p => p.update(0.5, -100)); drawMenuScene(); menuAnimationId = requestAnimationFrame(menuLoop);
}

function initWorld() {
    // Инициализируем seeded RNG — у обоих игроков одинаковый seed
    seedRng(net.isOnline ? net.worldSeed : Math.floor(Math.random() * 0x7FFFFFFF));
    terrain = []; items = []; pixies = []; nextTerrainX = 0;
    // FIX #1: используем getWorldGround() — в онлайне у обоих одно значение (от хоста)
    lastHeight = getWorldGround();
    blocksSinceLastGap = 10; consecutiveGaps = 0; blocksSinceLastCactus = 5; lastBlockWasGap = false;
    castleGenerated = false; inCastle = false;
    for (let i = 0; i < 15; i++) addTerrainBlock(false);
    if (currentDifficulty !== 'easy') {
        for (let i = 0; i < 3; i++) {
            const p = new Pixie();
            p.x = camera.x + (canvas.width * (i / 3)) + rng() * (canvas.width / 3);
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
    else if (currentDifficulty === 'megahard') diffSettings = { gapChance: 0.20, maxGapSize: 2, minSafe: 2, cactusChance: 0.22, minCactus: 2, heightChange: 0.42 };
    else if (currentDifficulty === 'infinity') diffSettings = { gapChance: 0.20, maxGapSize: 2, minSafe: 2, cactusChance: 0.22, minCactus: 2, heightChange: 0.42 };
    if (canHaveHazards && !lastBlockWasGap && rng() < diffSettings.heightChange) lastHeight += (Math.floor(rng() * 3) - 1) * 60;
    // FIX #1: границы высоты привязаны к getWorldGround(), а не к canvas.height
    const _wg = getWorldGround();
    if (lastHeight < _wg - 350) lastHeight = _wg - 350;
    if (lastHeight > _wg + 50) lastHeight = _wg + 50;
    if (canHaveHazards && blocksSinceLastGap > diffSettings.minSafe && blocksSinceLastCactus > 1 && rng() < diffSettings.gapChance) createGap = true;
    if (lastBlockWasGap && consecutiveGaps < diffSettings.maxGapSize && rng() < 0.6) createGap = true; else if (lastBlockWasGap) createGap = false;
    if (createGap) { lastBlockWasGap = true; consecutiveGaps++; blocksSinceLastGap = 0; blocksSinceLastCactus++; }
    else {
        // FIX #1: h:2000 — фиксированная высота, не зависит от canvas.height
        terrain.push({ x: nextTerrainX, y: lastHeight, w: w, h: 2000 });
        lastBlockWasGap = false; consecutiveGaps = 0; blocksSinceLastGap++; blocksSinceLastCactus++;
        if (canHaveHazards) {
            let rand = rng(); if (rng() < 0.15) items.push({ x: nextTerrainX + 5, y: lastHeight, w: 40, h: 60, type: 'tree' });
            if (rand > (1 - diffSettings.cactusChance) && blocksSinceLastCactus > diffSettings.minCactus && blocksSinceLastGap > 1) { let type = (rng() < 0.3) ? 'rock' : (rng() < 0.6 ? 'stump' : 'cactus'); items.push({ x: nextTerrainX + 5, y: lastHeight, w: 30, h: 30, type: type }); blocksSinceLastCactus = 0; }
            else if (rng() < 0.3) { let fishType = 'fish', rFish = rng(); if (rFish < 0.05) fishType = 'gold-fish'; else if (rFish < 0.25) fishType = 'blue-fish'; items.push({ x: nextTerrainX + 15, y: lastHeight - 50 - rng() * 80, w: 20, h: 15, type: fishType, taken: false }); }
        }
    }
    nextTerrainX += w;
}

function manageChunks() {
    const lookAhead = 400 * (1 / zoomFactor);
    terrain = terrain.filter(b => b.x + b.w > camera.x - 200); items = items.filter(i => i.x + i.w > camera.x - 200);
    while (nextTerrainX < camera.x + (canvas.width / zoomFactor) + lookAhead) addTerrainBlock(true);
}

// ---- drawForest: cached to offscreen canvas in world-space (static, no animation) ----
function drawForest(ctx) {
    const CASTLE_CENTER = CASTLE_START_X + 1000, FOREST_MIN = CASTLE_CENTER - 950, FOREST_MAX = CASTLE_CENTER + 950;
    if (currentDifficulty === 'infinity') return; if (camera.x + canvas.width / zoomFactor < FOREST_MIN - 200 || camera.x > FOREST_MAX + 200) return;
    const _forestGroundY = getWorldGround();
    if (!_forestCache || _forestCacheH !== canvas.height || _forestCacheGround !== _forestGroundY) {
        _forestCacheH = canvas.height;
        _forestCacheGround = _forestGroundY;
        const fW = FOREST_MAX - FOREST_MIN + 400;
        _forestCache = document.createElement('canvas'); _forestCache.width = fW; _forestCache.height = canvas.height + Math.abs((canvas.height - 100) - _forestGroundY) + 200;
        const fctx = _forestCache.getContext('2d');
        const yBase = _forestGroundY;
        for (let tx = FOREST_MIN; tx < FOREST_MAX; tx += 40) {
            if (tx > CASTLE_CENTER - 150 && tx < CASTLE_CENTER + 150) continue;
            const dtx = tx - (FOREST_MIN - 200); // offset into cache canvas
            let seed = Math.sin(tx * 0.1), height = 60 + Math.abs(seed) * 40;
            fctx.fillStyle = "#3e2723"; fctx.fillRect(dtx + 15, yBase - 20, 10, 20); fctx.fillStyle = "#1b4d3e";
            fctx.beginPath(); fctx.moveTo(dtx, yBase - 20); fctx.lineTo(dtx + 20, yBase - 20 - height * 0.4); fctx.lineTo(dtx + 40, yBase - 20); fctx.fill();
            fctx.beginPath(); fctx.moveTo(dtx + 5, yBase - 20 - height * 0.2); fctx.lineTo(dtx + 20, yBase - 20 - height * 0.7); fctx.lineTo(dtx + 35, yBase - 20 - height * 0.2); fctx.fill();
            fctx.beginPath(); fctx.moveTo(dtx + 10, yBase - 20 - height * 0.5); fctx.lineTo(dtx + 20, yBase - 20 - height); fctx.lineTo(dtx + 30, yBase - 20 - height * 0.5); fctx.fill();
        }
    }
    ctx.drawImage(_forestCache, FOREST_MIN - 200, 0);
}

function drawWorld() {
    drawForest(ctx); const renderWidth = canvas.width / zoomFactor;
    terrain.forEach(block => {
        let renderMargin = block.isCastleCenter ? 400 : 0; if (block.x > camera.x + renderWidth + renderMargin || block.x + block.w < camera.x - renderMargin) return;
        if (currentDifficulty === 'infinity') { ctx.fillStyle = "#1a1a1a"; ctx.fillRect(block.x, block.y, block.w + 1, block.h); ctx.fillStyle = "#2d3436"; ctx.fillRect(block.x, block.y, block.w + 1, 15); ctx.fillStyle = "#636e72"; ctx.fillRect(block.x, block.y + 12, block.w + 1, 3); ctx.fillStyle = "#b2bec3"; ctx.fillRect(block.x + 10, block.y + 30, 4, 4); }
        else { ctx.fillStyle = "#6d4c41"; ctx.fillRect(block.x, block.y, block.w + 1, block.h); ctx.fillStyle = "#66bb6a"; ctx.fillRect(block.x, block.y, block.w + 1, 15); ctx.fillStyle = "#43a047"; ctx.fillRect(block.x, block.y + 12, block.w + 1, 3); ctx.fillStyle = "#5d4037"; ctx.fillRect(block.x + 10, block.y + 30, 6, 6); }
        if (block.type === 'castle_area' && block.isCastleCenter) drawCastle(ctx, block.x, block.y);
    });
    items.forEach(item => {
        if (item.x > camera.x + renderWidth || item.x + item.w < camera.x) return;
        if (item.type === 'tree') {
            let tx = item.x + 10, ty = item.y;
            if (currentDifficulty === 'infinity') { ctx.fillStyle = "#000000"; ctx.fillRect(tx + 2, ty - 80, 6, 80); ctx.fillRect(tx - 2, ty - 5, 14, 5); ctx.fillRect(tx - 15, ty - 40, 17, 4); ctx.fillRect(tx - 15, ty - 55, 3, 15); ctx.fillRect(tx + 8, ty - 60, 15, 4); ctx.fillRect(tx + 23, ty - 70, 3, 10); ctx.fillRect(tx + 4, ty - 90, 2, 10); }
            else { ctx.fillStyle = "#4e342e"; ctx.fillRect(tx + 5, ty - 20, 10, 20); ctx.fillStyle = "#2e7d32"; ctx.beginPath(); ctx.moveTo(tx - 10, ty - 20); ctx.lineTo(tx + 10, ty - 50); ctx.lineTo(tx + 30, ty - 20); ctx.fill(); ctx.beginPath(); ctx.moveTo(tx - 8, ty - 40); ctx.lineTo(tx + 10, ty - 70); ctx.lineTo(tx + 28, ty - 40); ctx.fill(); ctx.beginPath(); ctx.moveTo(tx - 5, ty - 60); ctx.lineTo(tx + 10, ty - 90); ctx.lineTo(tx + 25, ty - 60); ctx.fill(); }
            return;
        }
        if (item.type.includes('fish')) { if (item.taken) return; let fy = item.y + Math.sin(gameTime * 0.1 + item.x) * 5; if (item.type === 'blue-fish') ctx.fillStyle = "#29b6f6"; else if (item.type === 'gold-fish') ctx.fillStyle = "#ffd700"; else ctx.fillStyle = "#ffa726"; ctx.fillRect(item.x, fy, 20, 12); if (item.type === 'blue-fish') ctx.fillStyle = "#0288d1"; else if (item.type === 'gold-fish') ctx.fillStyle = "#e6c200"; else ctx.fillStyle = "#f57c00"; ctx.fillRect(item.x - 5, fy + 2, 5, 8); ctx.fillStyle = "white"; ctx.fillRect(item.x + 14, fy + 2, 4, 4); ctx.fillStyle = "black"; ctx.fillRect(item.x + 16, fy + 3, 2, 2); }
        else {
            let yPos = item.y - 40;
            if (currentDifficulty === 'infinity' && (item.type === 'rock' || item.type === 'stump')) { const sx = item.x + 5, sy = item.y - 25; if (item.type === 'stump') { ctx.fillStyle = "#333"; ctx.fillRect(sx + 8, sy + 20, 4, 10); } ctx.fillStyle = "#bdc3c7"; ctx.fillRect(sx, sy, 20, 20); ctx.fillStyle = "#000"; ctx.fillRect(sx + 4, sy + 8, 4, 4); ctx.fillRect(sx + 12, sy + 8, 4, 4); ctx.fillRect(sx + 8, sy + 16, 4, 4); ctx.fillStyle = "#bdc3c7"; ctx.fillRect(sx + 2, sy + 22, 4, 4); ctx.fillRect(sx + 8, sy + 22, 4, 4); ctx.fillRect(sx + 14, sy + 22, 4, 4); }
            else if (item.type === 'cactus') {
                if (currentDifficulty === 'infinity') { ctx.fillStyle = "#0a0a0a"; ctx.fillRect(item.x + 12, yPos, 10, 40); ctx.fillStyle = "#1a1a1a"; ctx.fillRect(item.x + 14, yPos + 2, 6, 36); ctx.fillStyle = "#0a0a0a"; ctx.fillRect(item.x + 4, yPos + 15, 8, 4); ctx.fillRect(item.x + 4, yPos + 5, 4, 10); ctx.fillRect(item.x + 22, yPos + 20, 8, 4); ctx.fillRect(item.x + 26, yPos + 10, 4, 10); ctx.fillStyle = "#444"; ctx.fillRect(item.x + 12, yPos + 5, 2, 2); ctx.fillRect(item.x + 20, yPos + 15, 2, 2); ctx.fillRect(item.x + 14, yPos + 30, 2, 2); }
                else { ctx.fillStyle = "#2e7d32"; ctx.fillRect(item.x + 12, yPos, 10, 40); ctx.fillStyle = "#4caf50"; ctx.fillRect(item.x + 14, yPos + 2, 6, 36); ctx.fillStyle = "#2e7d32"; ctx.fillRect(item.x + 4, yPos + 15, 8, 4); ctx.fillRect(item.x + 4, yPos + 5, 4, 10); ctx.fillRect(item.x + 22, yPos + 20, 8, 4); ctx.fillRect(item.x + 26, yPos + 10, 4, 10); ctx.fillStyle = "#a5d6a7"; ctx.fillRect(item.x + 12, yPos + 5, 2, 2); ctx.fillRect(item.x + 20, yPos + 15, 2, 2); ctx.fillRect(item.x + 14, yPos + 30, 2, 2); }
            } else if (item.type === 'rock') { let ry = item.y - 25; ctx.fillStyle = "#7f8c8d"; ctx.fillRect(item.x + 5, ry, 25, 25); ctx.fillStyle = "#95a5a6"; ctx.fillRect(item.x + 8, ry + 3, 15, 15); ctx.fillStyle = "#34495e"; ctx.fillRect(item.x + 25, ry + 20, 5, 5); }
            else if (item.type === 'stump') { let sy = item.y - 20; ctx.fillStyle = "#5d4037"; ctx.fillRect(item.x + 5, sy, 25, 20); ctx.fillStyle = "#8d6e63"; ctx.fillRect(item.x + 5, sy, 25, 5); ctx.fillStyle = "#3e2723"; ctx.fillRect(item.x + 12, sy + 1, 10, 2); ctx.fillStyle = "#5d4037"; ctx.fillRect(item.x, sy + 15, 5, 5); ctx.fillRect(item.x + 30, sy + 15, 5, 5); }
        }
    });
}

function drawCastle(ctx, x, y) {
    const s = 4, cMain = "#b0dfff", cLight = "#d0efff", cShadow = "#8ab0d4", cRoof = "#ff5e5e", cRoofDark = "#c43c3c", cFlag = "#ff3333", cDoor = "#5a7ca6", cDoorDark = "#3a506b", cTree = "#76c442", cTreeDark = "#5da130";
    const rect = (dx, dy, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x + dx * s, y - (dy + h) * s, w * s, h * s); };
    const drawRoof = (dx, dy, width) => { let rw = width, rh = 0; while (rw > 0) { rect(dx + (width - rw) / 2, dy + rh, rw, 1, cRoof); rect(dx + (width - rw) / 2, dy + rh, 1, 1, cRoofDark); rw -= 2; rh += 1; } };
    const drawFlag = (dx, dy) => { rect(dx, dy, 1, 6, "#555"); let wave = Math.sin(gameTime * 0.2 + dx) > 0 ? 1 : 0; rect(dx + 1, dy + 4 + wave, 5, 3, cFlag); };
    const drawCrenellations = (dx, dy, w) => { rect(dx - 1, dy, w + 2, 3, cMain); rect(dx - 1, dy, 1, 3, cShadow); for (let i = 0; i < w; i += 4) rect(dx + i, dy + 3, 2, 2, cMain); };
    const drawTree = (tx) => { rect(tx, 0, 2, 4, "#8d6e63"); rect(tx - 3, 4, 8, 8, cTree); rect(tx - 2, 5, 2, 2, cTreeDark); rect(tx + 2, 9, 2, 2, cTreeDark); };
    drawTree(-45); drawTree(45); rect(-30, 0, 60, 30, cMain); rect(-30, 0, 4, 30, cShadow); rect(26, 0, 4, 30, cShadow); rect(-10, 0, 20, 15, cDoor); rect(-10, 15, 20, 2, cDoor); rect(-8, 17, 16, 1, cDoor); rect(-8, 0, 1, 15, cDoorDark); rect(0, 0, 1, 15, cDoorDark); rect(-20, 10, 3, 2, cShadow); rect(15, 20, 3, 2, cShadow); rect(10, 5, 2, 2, cLight); rect(-15, 25, 2, 2, cLight);
    rect(-12, 30, 24, 35, cMain); rect(-12, 30, 3, 35, cShadow); rect(-4, 45, 8, 10, cDoorDark); drawCrenellations(-14, 65, 28); drawRoof(-14, 70, 28); drawFlag(-1, 84);
    rect(-35, 20, 14, 25, cMain); rect(-35, 20, 2, 25, cShadow); drawCrenellations(-37, 45, 18); drawRoof(-37, 50, 18); drawFlag(-29, 59);
    rect(20, 20, 14, 35, cMain); rect(20, 20, 2, 35, cShadow); rect(24, 40, 6, 6, cDoorDark); drawCrenellations(18, 55, 18); drawRoof(18, 60, 18); drawFlag(26, 69);
    rect(-55, 0, 12, 40, cMain); rect(-55, 0, 2, 40, cShadow); rect(-52, 20, 2, 6, cDoorDark); drawCrenellations(-57, 40, 16); drawRoof(-57, 45, 16); drawFlag(-49, 53);
    rect(45, 0, 12, 35, cMain); rect(45, 0, 2, 35, cShadow); rect(48, 15, 2, 6, cDoorDark); drawCrenellations(43, 35, 16); drawRoof(43, 40, 16); drawFlag(51, 48);
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
    diffLabel.innerText = t('diffLabelPrefix') + difficulty.toUpperCase();
    
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
            
            // Skip trees (decoration only)
            if (item.type === 'tree') return;
            
            // Check collision — cat hitbox inset by 4px on sides for fair feel
            if (!item.taken && cat.x + 4 < hitX + hitW && cat.x + cat.width - 4 > hitX && 
                cat.y < hitY + hitH && cat.y + cat.height > hitY) {
                
                if (item.type.includes('fish')) { 
                    // Collect fish
                    item.taken = true; 
                    if (item.type === 'blue-fish') { fishWallet.blue++; AudioEngine.sfx.fishBlue(); }
                    else if (item.type === 'gold-fish') { fishWallet.gold++; AudioEngine.sfx.fishGold(); }
                    else { fishWallet.orange++; AudioEngine.sfx.fishOrange(); }
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
        maxDist = myCat.x;
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
    isWin = true; 
    isPlaying = false;
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
    saveGameData(); 
    unlockMsg.innerText = msg; 
    if (nextBtnVisible) btnNextLevel.style.display = 'block'; 
    else btnNextLevel.style.display = 'none';
    winScreen.style.display = 'block'; 
    cancelAnimationFrame(animationId);
    // В онлайн режиме — показать кнопку возврата в лобби
    const _lobbyWin = document.getElementById('btn-lobby-win');
    if (_lobbyWin) _lobbyWin.style.display = net.isOnline ? 'block' : 'none';
    // Уведомить партнёра о победе
    if (net.isOnline && net.conn && net.conn.open) net.conn.send({ type: 'WIN', score: score, _t: Date.now() });
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
        let targetX = midPoint - (canvas.width / zoomFactor) / 2; 
        if (targetX < 0) targetX = 0;
        camera.x += (targetX - camera.x) * 0.1; 
        return;
    }

    let targetX = totalX - (canvas.width / zoomFactor) / 2; 
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
        const sc = document.createElement('canvas'); sc.width = sc.height = size;
        const sctx = sc.getContext('2d'); const mid = Math.floor(size / 2);
        for (let y = -steps; y <= steps; y++) { for (let x = -steps; x <= steps; x++) { if (x * x + y * y <= steps * steps) { sctx.fillStyle = (Math.abs(x) > steps - 2 || Math.abs(y) > steps - 2) ? colorSec : colorMain; sctx.fillRect(mid + x * pixelSize, mid + y * pixelSize, pixelSize, pixelSize); } } }
        _sunCaches[key] = { canvas: sc, mid };
    }
    const c = _sunCaches[key]; ctx.drawImage(c.canvas, cx - c.mid, cy - c.mid);
}

// ---- drawBehelit: cached to offscreen canvas, recreated only on radius change ----
function drawBehelit(ctx, cx, cy, radius) {
    if (!_behelitCache || _behelitCacheR !== radius) {
        _behelitCacheR = radius;
        const s = radius / 50;
        const W = Math.ceil(radius * 10), H = Math.ceil(radius * 14);
        const bc = document.createElement('canvas'); bc.width = W; bc.height = H;
        const bctx = bc.getContext('2d');
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
        _behelitCache = { canvas: bc, ox: ocx, oy: ocy };
    }
    ctx.drawImage(_behelitCache.canvas, cx - _behelitCache.ox, cy - _behelitCache.oy);
}

// ---- drawRainbow: cached to offscreen canvas, recreated only on screen size change ----
function drawRainbow(ctx, camX, vOffset) {
    const renderWidth = Math.ceil(canvas.width / zoomFactor), renderHeight = Math.ceil(canvas.height / zoomFactor);
    if (!_rainbowCache || _rainbowCacheW !== renderWidth || _rainbowCacheH !== renderHeight) {
        _rainbowCacheW = renderWidth; _rainbowCacheH = renderHeight;
        _rainbowCache = document.createElement('canvas'); _rainbowCache.width = renderWidth; _rainbowCache.height = renderHeight;
        const rctx = _rainbowCache.getContext('2d');
        const rcx = renderWidth / 2, rcy = renderHeight + 100, radius = 700;
        const colors = ["rgba(255, 0, 0, 0.2)", "rgba(255, 127, 0, 0.2)", "rgba(255, 255, 0, 0.2)", "rgba(0, 255, 0, 0.2)", "rgba(0, 0, 255, 0.2)", "rgba(75, 0, 130, 0.2)", "rgba(148, 0, 211, 0.2)"];
        for (let i = 0; i < 7; i++) { rctx.beginPath(); rctx.arc(rcx, rcy, radius - i * 15, Math.PI, 2 * Math.PI); rctx.strokeStyle = colors[i]; rctx.lineWidth = 15; rctx.stroke(); }
    }
    // На мобильных vOffset > 0: рисуем с поправкой чтобы радуга совпадала с фоном
    ctx.drawImage(_rainbowCache, camX, -(vOffset || 0));
}

function drawBackground(vOffset) {
    const renderWidth = canvas.width / zoomFactor, renderHeight = canvas.height / zoomFactor;
    // ---- Gradient cache: recreate only on difficulty or size change ----
    if (!_bgGrad || _bgGradDiff !== currentDifficulty || _bgGradH !== renderHeight || _bgGradOff !== vOffset) {
        _bgGradDiff = currentDifficulty; _bgGradH = renderHeight; _bgGradOff = vOffset;
        _bgGrad = ctx.createLinearGradient(0, -vOffset, 0, renderHeight - vOffset);
        if (currentDifficulty === 'infinity') { _bgGrad.addColorStop(0, "#000000"); _bgGrad.addColorStop(0.5, "#4a0404"); _bgGrad.addColorStop(1, "#800000"); }
        else if (currentDifficulty === 'hard') { _bgGrad.addColorStop(0, "#f8c291"); _bgGrad.addColorStop(0.5, "#f6e58d"); _bgGrad.addColorStop(1, "#badc58"); }
        else if (currentDifficulty === 'megahard') { _bgGrad.addColorStop(0, "#2c0000"); _bgGrad.addColorStop(0.5, "#800000"); _bgGrad.addColorStop(1, "#202028"); }
        else { _bgGrad.addColorStop(0, "#87CEEB"); _bgGrad.addColorStop(1, "#E0F7FA"); }
    }
    ctx.fillStyle = _bgGrad;
    ctx.fillRect(camera.x, -vOffset, renderWidth, renderHeight);
    if (currentDifficulty === 'infinity') { drawBehelit(ctx, camera.x + renderWidth - 200, -vOffset + 150, 40); }
    else {
        if (currentDifficulty !== 'easy') { drawRainbow(ctx, camera.x, vOffset); drawSun(ctx, camera.x + renderWidth - 150, -vOffset + 100, 40, "#f1c40f", "#f39c12"); if (currentDifficulty === 'hard') drawSun(ctx, camera.x + renderWidth - 250, -vOffset + 180, 20, "#ecf0f1", "#e67e22"); }
        else drawSun(ctx, camera.x + renderWidth - 150, -vOffset + 100, 40, "#f1c40f", "#f39c12");
    }
    // Облака: плывут справа налево, начало — за правым краем экрана
    const cloudCycleW = renderWidth + 200; // полный цикл чуть шире экрана
    const cloudScroll1 = (gameTime * 0.4) % cloudCycleW;
    const cloudScroll2 = (gameTime * 0.25 + cloudCycleW * 0.55) % cloudCycleW;
    const cloud1X = camera.x + renderWidth - cloudScroll1;
    const cloud2X = camera.x + renderWidth - cloudScroll2;
    if (currentDifficulty === 'infinity') ctx.fillStyle = "rgba(0,0,0,0.5)"; else ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillRect(cloud1X, -vOffset + 100, 100, 30);
    ctx.fillRect(cloud2X, -vOffset + 150, 80, 25);
    if (currentDifficulty !== 'easy') pixies.forEach(pixie => pixie.draw(ctx));
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
    // Скрыть кнопки лобби
    const _lg = document.getElementById('btn-lobby-go'); if (_lg) _lg.style.display = 'none';
    const _lw = document.getElementById('btn-lobby-win'); if (_lw) _lw.style.display = 'none';
    const _ta = document.getElementById('btn-try-again'); if (_ta) _ta.style.display = '';
    if (animationId) cancelAnimationFrame(animationId); if (menuAnimationId) cancelAnimationFrame(menuAnimationId);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#202028"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    updateFishUI(); updatePlayerModeUI(); normalBestBox.style.display = 'block'; infinityBestBox.style.display = 'block'; highScoreEl.innerText = highScore;
    menuPixies = []; for (let i = 0; i < 8; i++) menuPixies.push(new Pixie()); menuLoop();
    AudioEngine.startMenuMusic();
    _hideMobileControls();
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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#202028";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
        net.worldGroundBase = canvas.height - 100;
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
            net.conn.send({ 
                type: 'POS', 
                x: myCat.x, 
                y: myCat.y, 
                dir: myCat.facingRight 
            });
            net.lastSentTime = timestamp;

            // Пинг раз в 3 секунды
            if (timestamp - net.lastPingTime > 3000) {
                net.conn.send({ type: 'PING', time: timestamp });
                net.lastPingTime = timestamp;
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
    if (zoomFactor < 1) verticalOffset = (canvas.height / zoomFactor) - canvas.height;

    // FIX #1: для гостя добавляем вертикальный сдвиг, чтобы земля
    // хоста (worldGroundBase) совпала с землёй гостя на экране.
    // У хоста сдвиг = 0 (его worldGroundBase = canvas.height - 100).
    const groundSyncOffset = (net.isOnline && !net.isHost && net.worldGroundBase > 0)
        ? (canvas.height - 100) - net.worldGroundBase
        : 0;

    // ============================================
    // CLEAR CANVAS - Prepare for new frame
    // Очистка канваса перед новым кадром
    // ============================================
    ctx.setTransform(zoomFactor, 0, 0, zoomFactor, 0, 0); 
    ctx.clearRect(0, 0, canvas.width / zoomFactor, canvas.height / zoomFactor);
    
    // ============================================
    // UPDATE GAME OBJECTS
    // Обновление игровых объектов
    // ============================================
    frameCount++;
    if (frameCount % 3 === 0) manageChunks(); // Управление чанками мира (не каждый кадр — экономия CPU)
    cats.forEach(c => c.update(timeScale)); // Обновление котов
    if (npcCat) npcCat.update(timeScale); // Обновление NPC
    if (currentDifficulty !== 'easy') pixies.forEach(pixie => pixie.update(timeScale, camera.x - 50)); // Обновление фей
    
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
    const snapCamX = Math.round(camera.x);
    const snapVOff  = Math.round(verticalOffset + groundSyncOffset);
    ctx.translate(-snapCamX, snapVOff); 
    drawBackground(snapVOff); // Фон
    drawWorld(); // Мир (блоки, предметы)
    if (npcCat) npcCat.draw(ctx); // NPC
    cats.forEach(c => c.draw()); // Коты
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

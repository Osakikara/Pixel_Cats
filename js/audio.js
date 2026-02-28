// ============================================================
// AUDIO ENGINE — Web Audio API, SFX, Music, Boss Music
// ============================================================

const AudioEngine = (() => {
    let actx = null;
    let masterGain, musicGain, musicFadeGain, sfxGain;
    // musicFadeGain — отдельный узел ТОЛЬКО для музыки.
    // При остановке он мгновенно глушится → все живые ноты замолкают.
    let musicGen = 0; // счётчик поколений — старые таймеры видят устаревший gen и умирают
    let musicTimerId = null;

    const S = {
        masterVol: parseFloat(localStorage.getItem('pcMasterVol') ?? '0.7'),
        musicVol:  parseFloat(localStorage.getItem('pcMusicVol')  ?? '0.4'),
        sfxVol:    parseFloat(localStorage.getItem('pcSfxVol')    ?? '0.8'),
        musicOn:   localStorage.getItem('pcMusicOn')  !== 'false',
        sfxOn:     localStorage.getItem('pcSfxOn')    !== 'false',
        trackId:   parseInt(localStorage.getItem('pcTrackId') ?? '0'),
    };

    function boot() {
        if (actx && actx.state !== 'closed') {
            // Resume if suspended (common on mobile after sleep)
            if (actx.state === 'suspended') actx.resume().catch(() => {});
            return;
        }
        actx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain    = actx.createGain();
        musicFadeGain = actx.createGain();
        musicGain     = actx.createGain();
        sfxGain       = actx.createGain();
        musicGain.connect(musicFadeGain);
        musicFadeGain.connect(masterGain);
        sfxGain.connect(masterGain);
        masterGain.connect(actx.destination);
        musicFadeGain.gain.value = 1;
        // Reset boss music gain reference since context was recreated
        bossMusicGain = null;
        applyVol();
    }

    function applyVol() {
        if (!actx) return;
        masterGain.gain.value = S.masterVol;
        musicGain.gain.value  = S.musicOn ? S.musicVol : 0;
        sfxGain.gain.value    = S.sfxOn   ? S.sfxVol   : 0;
    }

    function saveS() {
        localStorage.setItem('pcMasterVol', S.masterVol);
        localStorage.setItem('pcMusicVol',  S.musicVol);
        localStorage.setItem('pcSfxVol',    S.sfxVol);
        localStorage.setItem('pcMusicOn',   S.musicOn);
        localStorage.setItem('pcSfxOn',     S.sfxOn);
    }

    // ── утилита: одна нота через sfxGain ──
    function beep(freq, dur, type, vol, delay, dest) {
        if (!actx || actx.state === 'closed') return;
        const osc = actx.createOscillator(), g = actx.createGain();
        osc.connect(g); g.connect(dest || sfxGain);
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        const t = actx.currentTime + (delay || 0);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.start(t); osc.stop(t + dur + 0.02);
    }

    // ======================================================
    // SFX
    // ======================================================
    const sfx = {
        jump() {
            boot(); if (!actx) return;
            const osc = actx.createOscillator(), g = actx.createGain();
            osc.connect(g); g.connect(sfxGain); osc.type = 'sine';
            const t = actx.currentTime;
            osc.frequency.setValueAtTime(320, t);
            osc.frequency.exponentialRampToValueAtTime(180, t+0.06);
            osc.frequency.exponentialRampToValueAtTime(250, t+0.14);
            osc.frequency.exponentialRampToValueAtTime(200, t+0.24);
            g.gain.setValueAtTime(0.12, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t+0.27);
            osc.start(t); osc.stop(t+0.29);
        },
        land() {
            boot(); if (!actx) return;
            const osc = actx.createOscillator(), g = actx.createGain();
            osc.connect(g); g.connect(sfxGain); osc.type = 'sine';
            const t = actx.currentTime;
            osc.frequency.setValueAtTime(140, t);
            osc.frequency.exponentialRampToValueAtTime(70, t+0.06);
            g.gain.setValueAtTime(0.05, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t+0.07);
            osc.start(t); osc.stop(t+0.08);
        },
        click() {
            boot(); if (!actx) return;
            const osc = actx.createOscillator(), g = actx.createGain();
            osc.connect(g); g.connect(sfxGain); osc.type = 'sine';
            const t = actx.currentTime;
            osc.frequency.setValueAtTime(580, t);
            osc.frequency.exponentialRampToValueAtTime(340, t+0.055);
            g.gain.setValueAtTime(0.08, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t+0.06);
            osc.start(t); osc.stop(t+0.07);
        },
        fish() {
            boot(); if (!actx) return;
            const osc = actx.createOscillator(), g = actx.createGain();
            osc.connect(g); g.connect(sfxGain); osc.type = 'sine';
            const t = actx.currentTime;
            osc.frequency.setValueAtTime(500, t);
            osc.frequency.exponentialRampToValueAtTime(660, t+0.09);
            g.gain.setValueAtTime(0.08, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t+0.12);
            osc.start(t); osc.stop(t+0.13);
        },
        goldFish() {
            boot(); if (!actx) return;
            [523, 659, 784].forEach((f, i) => {
                const osc = actx.createOscillator(), g = actx.createGain();
                osc.connect(g); g.connect(sfxGain); osc.type = 'sine';
                const t = actx.currentTime + i*0.09;
                osc.frequency.value = f;
                g.gain.setValueAtTime(0.10, t);
                g.gain.exponentialRampToValueAtTime(0.0001, t+0.13);
                osc.start(t); osc.stop(t+0.14);
            });
        },
        victory() {
            boot(); if (!actx) return;
            // нежная восходящая мелодия синусом
            [[523,0],[659,0.30],[784,0.60],[1047,0.95],[880,1.35],[784,1.65]].forEach(([f,d]) => beep(f, 0.55, 'sine', 0.13, d));
            // тёплый пад снизу
            [[262,0],[330,0],[392,0],[523,0]].forEach(([f]) => beep(f, 2.2, 'sine', 0.06, 0));
            // мягкий финальный тон
            beep(1047, 1.0, 'triangle', 0.05, 1.9);
        },
        defeat() {
            boot(); if (!actx) return;
            // медленный нисходящий вздох
            [[440,0],[370,0.4],[294,0.8],[220,1.2],[196,1.7]].forEach(([f,d]) => {
                beep(f,   0.6, 'sine',     0.10, d);
                beep(f/2, 0.8, 'triangle', 0.04, d);
            });
            beep(98, 1.5, 'sine', 0.07, 0.5);
        },
        unlock() {
            boot(); if (!actx) return;
            [523,659,784,880].forEach((f,i) => beep(f, 0.18, 'sine', 0.11, i*0.1));
        },
    };

    // ======================================================
    // НОТНЫЙ ХЕЛПЕР
    // ======================================================
    const n = (note, oct) => {
        const map = {C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};
        return 440 * Math.pow(2, (map[note] + (oct-4)*12 - 9) / 12);
    };
    const R = null; // пауза






    function startMusic() { /* menu music removed */ }

    function stopMusic() {
        musicGen++;
        if (musicTimerId) { clearTimeout(musicTimerId); musicTimerId = null; }
        if (!actx) return;
        musicFadeGain.gain.cancelScheduledValues(actx.currentTime);
        musicFadeGain.gain.setValueAtTime(musicFadeGain.gain.value, actx.currentTime);
        musicFadeGain.gain.linearRampToValueAtTime(0, actx.currentTime + 0.4);
    }

    function setTrack(id) { S.trackId = id; localStorage.setItem('pcTrackId', id); }

    function setMusicOn(v) { S.musicOn = v; applyVol(); saveS(); if (!v) stopBossMusic(false); }
    function setMusicVol(v) { S.musicVol = v/100; applyVol(); saveS(); }
    function setSfxOn(v)    { S.sfxOn = v; applyVol(); saveS(); }
    function setSfxVol(v)   { S.sfxVol = v/100; applyVol(); saveS(); }
    function setMasterVol(v){ S.masterVol = v/100; applyVol(); saveS(); }

    // ======================================================
    // BOSS MUSIC ENGINE — рок/метал синтез для каждого босса
    // Дисторшн-гитара (sawtooth + WaveShaper) + барабаны + бас
    // ======================================================
    let bossGen = 0;
    let bossTimerId = null;
    let bossMusicGain = null;
    let bossIsActive = false; // флаг: сейчас играет босс-музыка

    function ensureBossMusicGain() {
        // startBossMusic пересоздаёт узел сам — этот хелпер больше не нужен
        // оставляем пустым для обратной совместимости
    }

    // Кривая дисторшна — мягкий овердрайв (amount 4-10, НЕ 100+)
    function makeDist(amount) {
        const n = 1024, curve = new Float32Array(n);
        const k = amount; // 4-10: мягкое насыщение без квадратной волны
        for (let i = 0; i < n; i++) {
            const x = (i * 2) / n - 1;
            // Кубическая кривая насыщения — добавляет тепло без шума
            if (x >= 0) curve[i] = 1 - Math.exp(-k * x);
            else        curve[i] = -(1 - Math.exp(k * x));
        }
        const ws = actx.createWaveShaper();
        ws.curve = curve; ws.oversample = '2x';
        return ws;
    }

    // Тяжёлый дрон — низкий гул создаёт давящую атмосферу
    function bDrone(freq, dur, startT, vol) {
        if (!actx || !bossMusicGain || freq === null) return;
        const osc1 = actx.createOscillator();
        const osc2 = actx.createOscillator();
        const dist = makeDist(2);           // минимальный овердрайв
        const lp = actx.createBiquadFilter();
        const g = actx.createGain();
        lp.type = 'lowpass'; lp.frequency.value = 220; lp.Q.value = 0.2;
        osc1.type = 'sine'; osc1.frequency.value = freq;           // синус — чище сайн-волна
        osc2.type = 'sine'; osc2.frequency.value = freq * 1.004;
        osc1.connect(dist); osc2.connect(dist);
        dist.connect(lp); lp.connect(g); g.connect(bossMusicGain);
        const att = 1.0, rel = 1.5;
        g.gain.setValueAtTime(0.0001, startT);
        g.gain.linearRampToValueAtTime(vol, startT + att);
        g.gain.setValueAtTime(vol, startT + dur - rel);
        g.gain.exponentialRampToValueAtTime(0.0001, startT + dur);
        osc1.start(startT); osc1.stop(startT + dur + 0.1);
        osc2.start(startT); osc2.stop(startT + dur + 0.1);
    }

    // Гитара — синус через лёгкое насыщение, без "пердящего" пилообразного
    function gNote(freq, dur, startT, vol) {
        if (!actx || !bossMusicGain || freq === null) return;
        // Two slightly detuned sine oscillators — warmer, less distorted
        [1, 1.004].forEach(det => {
            const osc = actx.createOscillator();
            const dist = makeDist(2);    // очень мягкое насыщение
            const lp = actx.createBiquadFilter();
            const g = actx.createGain();
            lp.type = 'lowpass'; lp.frequency.value = 1200; lp.Q.value = 0.3;
            osc.type = 'triangle'; // triangle = теплее чем sawtooth, меньше высоких
            osc.frequency.value = freq * det;
            osc.connect(dist); dist.connect(lp); lp.connect(g); g.connect(bossMusicGain);
            const att = 0.025, rel = Math.min(dur * 0.12, 0.06);
            g.gain.setValueAtTime(0.0001, startT);
            g.gain.linearRampToValueAtTime(vol * 0.7, startT + att);
            g.gain.setValueAtTime(vol * 0.7, startT + dur - rel);
            g.gain.exponentialRampToValueAtTime(0.0001, startT + dur);
            osc.start(startT); osc.stop(startT + dur + 0.04);
        });
    }

    // Бас — синус через мягкий lowpass
    function bNote(freq, dur, startT, vol) {
        if (!actx || !bossMusicGain || freq === null) return;
        const osc = actx.createOscillator(), lp = actx.createBiquadFilter(), g = actx.createGain();
        lp.type = 'lowpass'; lp.frequency.value = 280; lp.Q.value = 0.2;
        osc.type = 'sine'; osc.frequency.value = freq;
        osc.connect(lp); lp.connect(g); g.connect(bossMusicGain);
        g.gain.setValueAtTime(0.0001, startT);
        g.gain.linearRampToValueAtTime(vol, startT + 0.025); // 25мс — без щелчка
        g.gain.setValueAtTime(vol, startT + dur - 0.06);
        g.gain.exponentialRampToValueAtTime(0.0001, startT + dur);
        osc.start(startT); osc.stop(startT + dur + 0.04);
    }

    // Бочка (kick) — синус, питч вниз
    function bKick(t, vol) {
        if (!actx || !bossMusicGain) return;
        const osc = actx.createOscillator(), g = actx.createGain();
        osc.connect(g); g.connect(bossMusicGain); osc.type = 'sine';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(36, t + 0.10);
        // Рампа с 0 → избегаем щелчка от мгновенного скачка gain
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(vol || 0.28, t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        osc.start(t); osc.stop(t + 0.20);
    }

    // Малый (snare) — шум + удар на ~200 Гц
    function bSnare(t, vol) {
        if (!actx || !bossMusicGain) return;
        const v = vol || 0.15;
        // Тело малого
        const osc = actx.createOscillator(), go = actx.createGain();
        osc.type = 'triangle'; osc.frequency.value = 180;
        osc.connect(go); go.connect(bossMusicGain);
        go.gain.setValueAtTime(0.0001, t);
        go.gain.linearRampToValueAtTime(v, t + 0.004);
        go.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        osc.start(t); osc.stop(t + 0.11);
        // Шелест — уменьшен уровень чтобы не резал
        const buf = actx.createBuffer(1, Math.ceil(actx.sampleRate * 0.12), actx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = actx.createBufferSource();
        src.buffer = buf;
        const hp = actx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3500; hp.Q.value = 0.3;
        const gn = actx.createGain();
        src.connect(hp); hp.connect(gn); gn.connect(bossMusicGain);
        gn.gain.setValueAtTime(0.0001, t);
        gn.gain.linearRampToValueAtTime(v * 0.5, t + 0.003);
        gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        src.start(t); src.stop(t + 0.14);
    }

    // Хай-хет (hi-hat) — отфильтрованный шум
    function bHat(t, vol, open) {
        if (!actx || !bossMusicGain) return;
        const buf = actx.createBuffer(1, Math.ceil(actx.sampleRate * (open ? 0.12 : 0.04)), actx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = actx.createBufferSource();
        src.buffer = buf;
        const hp = actx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5500;
        const gn = actx.createGain();
        src.connect(hp); hp.connect(gn); gn.connect(bossMusicGain);
        const v = vol || 0.03;
        gn.gain.setValueAtTime(v, t);
        gn.gain.exponentialRampToValueAtTime(0.0001, t + (open ? 0.12 : 0.04));
        src.start(t); src.stop(t + (open ? 0.14 : 0.06));
    }

    // ── ТРЕК БОССА: ОГНЕННЫЙ ГОЛЕМ ──
    // Em, 140 BPM — тяжёлый классический хэви-метал
    function scheduleBossFireGolem(gen, T0) {
        const B = 60/140, e = B/2, q = B, h = B*2;
        const loopDur = B * 16;

        // E power chord риф с движением по пентатонике Em
        const riff = [
            [n('E',2),e],[n('E',2),e],[n('G',2),e],[n('A',2),e],
            [n('B',2),e],[n('A',2),e],[n('G',2),e],[n('E',2),e],
            [n('E',2),e],[n('E',2),e],[n('G',2),e],[n('A',2),e],
            [n('B',2),h],[R,e],[n('D',3),e],
            [n('E',3),e],[n('E',3),e],[n('D',3),e],[n('C',3),e],
            [n('B',2),e],[n('G',2),e],[n('A',2),e],[n('B',2),e],
            [n('G',2),h],[n('A',2),e],[n('B',2),e],
            [n('E',2),h],[n('E',2),h],
        ];
        let gt = T0;
        riff.forEach(([f,d]) => { gNote(f, d*0.85, gt, 0.18); gt += d; });

        // Бас дублирует риф
        const bassRiff = riff.map(([f,d]) => [f ? f/2 : null, d]);
        let bt = T0;
        bassRiff.forEach(([f,d]) => { bNote(f, d*0.9, bt, 0.22); bt += d; });

        // Барабаны: kick 1,3 / snare 2,4 / хэты на каждую восьмую
        for (let bar = 0; bar < 4; bar++) {
            const b0 = T0 + bar * B * 4;
            bKick(b0); bKick(b0 + B*2);
            bSnare(b0 + B); bSnare(b0 + B*3);
            for (let i = 0; i < 8; i++) bHat(b0 + i * e, 0.06);
        }

        if (bossGen === gen) bossTimerId = setTimeout(() => scheduleBossFireGolem(gen, T0 + loopDur), (loopDur - 0.5) * 1000);
    }

    // ── ТРЕК БОССА: ЛЕДЯНОЙ ДРАКОН ──
    // Dm, 160 BPM — эпичный power/symphonic metal, гимн дракона
    function scheduleBossIceDragon(gen, T0) {
        const B = 60/160, e = B/2, s = B/4, q = B, h = B*2;
        const loopDur = B * 16;

        // Восходящая героическая мелодия в Dm
        const mel = [
            [n('D',3),e],[n('F',3),e],[n('A',3),q],
            [n('C',4),e],[n('A',3),e],[n('F',3),e],[n('G',3),e],
            [n('A',3),h],
            [n('A',3),e],[n('C',4),e],[n('E',4),q],
            [n('D',4),e],[n('C',4),e],[n('B',3),e],[n('A',3),e],
            [n('G',3),h],
            [n('F',3),e],[n('A',3),e],[n('C',4),q],
            [n('D',4),e],[n('E',4),e],[n('F',4),e],[n('E',4),e],
            [n('D',4),q],[n('C',4),q],
            [n('A',3),q],[n('G',3),e],[n('F',3),e],
            [n('D',3),h],
        ];
        let gt = T0;
        mel.forEach(([f,d]) => { gNote(f, d*0.82, gt, 0.20); gt += d; });

        // Гармония параллельными терциями — оркестровый объём
        const harmony = [
            [n('F',3),e],[n('A',3),e],[n('C',4),q],
            [n('E',4),e],[n('C',4),e],[n('A',3),e],[n('B',3),e],
            [n('C',4),h],
            [n('C',4),e],[n('E',4),e],[n('G',4),q],
            [n('F',4),e],[n('E',4),e],[n('D',4),e],[n('C',4),e],
            [n('B',3),h],
            [n('A',3),e],[n('C',4),e],[n('E',4),q],
            [n('F',4),e],[n('G',4),e],[n('A',4),e],[n('G',4),e],
            [n('F',4),q],[n('E',4),q],
            [n('C',4),q],[n('B',3),e],[n('A',3),e],
            [n('F',3),h],
        ];
        let ht = T0;
        harmony.forEach(([f,d]) => { gNote(f, d*0.65, ht, 0.16); ht += d; });

        // Бас — мощный, движущийся
        const bass = [
            [n('D',2),q],[n('D',2),q],[n('F',2),q],[n('G',2),q],
            [n('A',2),q],[n('A',2),q],[n('G',2),q],[n('F',2),q],
            [n('D',2),q],[n('F',2),q],[n('A',2),q],[n('C',3),q],
            [n('D',3),e],[n('C',3),e],[n('B',2),q],[n('A',2),q],
        ];
        let bt = T0;
        bass.forEach(([f,d]) => { bNote(f, d*0.88, bt, 0.24); bt += d; });

        // Gallop ритм — классика power metal
        for (let bar = 0; bar < 4; bar++) {
            const b0 = T0 + bar * B * 4;
            bKick(b0); bKick(b0 + e); bKick(b0 + q + e);
            bKick(b0 + B*2); bKick(b0 + B*2 + e); bKick(b0 + B*3);
            bSnare(b0 + B); bSnare(b0 + B*3);
            for (let i = 0; i < 4; i++) bHat(b0 + i*q, 0.07, i%2===0);
        }

        if (bossGen === gen) bossTimerId = setTimeout(() => scheduleBossIceDragon(gen, T0 + loopDur), (loopDur - 0.5) * 1000);
    }

    // ── ТРЕК БОССА: ТЕНЕВОЙ ЛОРД ──
    // Bm, 72 BPM — оркестровый метал, финальный босс, Two Steps From Hell стиль
    function scheduleBossShadowLord(gen, T0) {
        const B = 60/72, e = B/2, s = B/4, q = B, h = B*2, w = B*4, dq = B*1.5;
        const loopDur = B * 20;

        // Зловещая нисходящая тема в Bm — финальный босс
        const mel = [
            [n('B',3), dq],[n('A',3), e],[n('G',3), q],
            [n('F#',3),h ],[n('E',3), e],[n('D',3), e],
            [n('G',3), dq],[n('F#',3),e],[n('E',3), q],
            [n('D',3), h ],[n('C#',3),q],
            [n('B',2), h ],[n('D',3), e],[n('F#',3),e],
            [n('A',3), dq],[n('G',3), e],[n('F#',3),q],
            [n('E',3), h ],[n('D',3), h],
            [n('C#',3),e],[n('D',3), e],[n('E',3), e],[n('F#',3),e],
            [n('G',3), q ],[n('A',3), q],
            [n('B',3), dq],[n('A',3), e],[n('G',3), q],
            [n('F#',3),w],
        ];
        let gt = T0;
        mel.forEach(([f,d]) => { gNote(f, d*0.88, gt, 0.22); gt += d; });

        // Контр-голос — тревожные синкопы в квартах
        const counter = [
            [n('E',3), dq],[n('D',3), e],[n('C#',3),q],
            [n('B',2), h ],[n('A',2), e],[n('G',2), e],
            [n('C#',3),dq],[n('B',2), e],[n('A',2), q],
            [n('G',2), h ],[n('F#',2),q],
            [n('E',2), h ],[n('G',2), e],[n('B',2), e],
            [n('D',3), dq],[n('C#',3),e],[n('B',2), q],
            [n('A',2), h ],[n('G',2), h],
            [n('F#',2),e],[n('G',2), e],[n('A',2), e],[n('B',2), e],
            [n('C#',3),q],[n('D',3), q],
            [n('E',3), dq],[n('D',3), e],[n('C#',3),q],
            [n('B',2), w],
        ];
        let ct = T0;
        counter.forEach(([f,d]) => { gNote(f, d*0.65, ct, 0.18); ct += d; });

        // Бас — глубокий, зловещий пульс
        const bass = [
            [n('B',1), q],[n('B',1),e],[n('C#',2),e],[n('D',2),q],[n('E',2),q],
            [n('G',2), h],[n('F#',2),h],
            [n('E',2), q],[n('E',2),e],[n('F#',2),e],[n('G',2),q],[n('A',2),q],
            [n('B',2), h],[n('A',2),q],[n('G',2),q],
            [n('F#',2),w],
        ];
        let bIdx = 0, bTime = T0;
        const totalMelDur = mel.reduce((s,[,d])=>s+d,0);
        while (bTime < T0 + totalMelDur + 1) {
            const [f,d] = bass[bIdx % bass.length];
            bNote(f, d*0.92, bTime, 0.28);
            bTime += d; bIdx++;
        }

        // Барабаны: маршевые, тяжёлые — как армия
        const bars = Math.ceil(loopDur / (B*4));
        for (let bar = 0; bar < bars; bar++) {
            const b0 = T0 + bar * B * 4;
            bKick(b0, 0.60); bKick(b0 + e*0.5, 0.45); bKick(b0 + e, 0.38);
            bKick(b0 + B*2, 0.60); bKick(b0 + B*2 + e, 0.38);
            bSnare(b0 + B, 0.28); bSnare(b0 + B*3 - e, 0.18); bSnare(b0 + B*3, 0.28);
            bHat(b0, 0.09, true); bHat(b0 + B*2, 0.09, true);
            bHat(b0 + B + e, 0.05); bHat(b0 + B*3 + e, 0.05);
        }

        if (bossGen === gen) bossTimerId = setTimeout(() => scheduleBossShadowLord(gen, T0 + loopDur), (loopDur - 0.5) * 1000);
    }

    function startBossMusic(bossId) {
        if (!S.musicOn) return;
        boot();
        // Resume suspended AudioContext (iOS/mobile common issue on retry)
        if (actx.state === 'suspended') {
            actx.resume().catch(() => {});
        }
        bossIsActive = true;

        // Stop menu music
        musicGen++;
        if (musicTimerId) { clearTimeout(musicTimerId); musicTimerId = null; }
        musicFadeGain.gain.cancelScheduledValues(actx.currentTime);
        musicFadeGain.gain.setValueAtTime(0, actx.currentTime);

        // Kill old boss music gen so its timers die
        bossGen++;
        const gen = bossGen;
        if (bossTimerId) { clearTimeout(bossTimerId); bossTimerId = null; }

        // Recreate bossMusicGain — physically disconnects old oscillators
        if (bossMusicGain) { try { bossMusicGain.disconnect(); } catch(e){} }
        bossMusicGain = actx.createGain();
        const bossComp = actx.createDynamicsCompressor();
        bossComp.threshold.value = -8;
        bossComp.knee.value      = 12;
        bossComp.ratio.value     = 5;
        bossComp.attack.value    = 0.005;
        bossComp.release.value   = 0.2;
        bossMusicGain.connect(bossComp);
        bossComp.connect(masterGain);
        // Re-ensure sfxGain is connected (can get lost after context operations)
        try { sfxGain.disconnect(); } catch(e) {}
        sfxGain.connect(masterGain);
        bossMusicGain.gain.setValueAtTime(0, actx.currentTime);
        bossMusicGain.gain.linearRampToValueAtTime(S.musicVol * 0.5, actx.currentTime + 0.4);

        const T0 = actx.currentTime + 0.1;
        if (bossId === 'fireGolem')      scheduleBossFireGolem(gen, T0);
        else if (bossId === 'iceDragon') scheduleBossIceDragon(gen, T0);
        else                             scheduleBossShadowLord(gen, T0);
    }

    function stopBossMusic(resume) {
        bossIsActive = false;
        bossGen++;
        if (bossTimerId) { clearTimeout(bossTimerId); bossTimerId = null; }
        // Физически отключаем старый узел — все осцилляторы подключённые к нему замолкают
        if (bossMusicGain) { try { bossMusicGain.disconnect(); } catch(e){} }
        bossMusicGain = null;
        // Обычная музыка стартует чуть позже — даём время аудио-движку успокоиться
        if (resume && S.musicOn) setTimeout(() => startMusic(), 200);
    }

    function setSfxOn(v)    { S.sfxOn = v; applyVol(); saveS(); }
    function setSfxVol(v)   { S.sfxVol = v/100; applyVol(); saveS(); }
    function setMasterVol(v){ S.masterVol = v/100; applyVol(); saveS(); }

    function stopAllMusic() {
        // Убиваем ВСЁ — и обычную и боссовую — мгновенно
        bossIsActive = false;
        // обычная
        musicGen++;
        if (musicTimerId) { clearTimeout(musicTimerId); musicTimerId = null; }
        if (actx) { musicFadeGain.gain.cancelScheduledValues(actx.currentTime); musicFadeGain.gain.setValueAtTime(0, actx.currentTime); }
        // боссовая
        bossGen++;
        if (bossTimerId) { clearTimeout(bossTimerId); bossTimerId = null; }
        if (bossMusicGain) { try { bossMusicGain.disconnect(); } catch(e){} bossMusicGain = null; }
    }

    // Aliases for compatibility
    sfx.fishOrange = sfx.fish;
    sfx.fishBlue   = sfx.fish;
    sfx.fishGold   = sfx.goldFish;
    sfx.bossHit    = function() {
        boot(); if (!actx) return;
        const osc = actx.createOscillator(), g = actx.createGain();
        osc.connect(g); g.connect(sfxGain); osc.type = 'sine';
        const t = actx.currentTime;
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(55, t + 0.22);
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        osc.start(t); osc.stop(t + 0.27);
    };
    function startMenuMusic() { /* no menu music */ }
    return { sfx, settings: S, stopMusic, stopAllMusic,
             startMenuMusic,
             startBossMusic, stopBossMusic,
             setMusicOn, setMusicVol, setSfxOn, setSfxVol, setMasterVol,
             applyVol, boot };
})();

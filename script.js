'use strict';
/* =====================================================================
   Flappy Bird Deluxe
   - fixed logical height (720) canvas, any width, retina aware
   - day / sunset / night / dawn cycle with parallax scenery
   - coins, power-ups (shield, slow-mo, double), moving pipes, 3 difficulties
   - bird skins (bought with coins), achievements, local leaderboard
   - synthesized sound + optional music (no audio files needed)
   - English / Arabic UI (RTL)
   ===================================================================== */
(() => {

/* ------------------------------ helpers ------------------------------ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;
const smooth = t => t * t * (3 - 2 * t);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mixC = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

/* ------------------------------ profile ------------------------------ */
const KEY = 'flappy-deluxe-v2';
const defaults = () => ({
    coins: 0, skin: 0, owned: [0], diff: 'normal', sound: true, music: false, lang: null,
    best: { easy: 0, normal: 0, hard: 0 },
    stats: { games: 0, flaps: 0, pipes: 0, coins: 0, perfects: 0, shields: 0 },
    ach: {}, scores: []
});
function load() {
    const d = defaults();
    try {
        const r = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (r && typeof r === 'object') {
            Object.assign(d, r);
            d.best = { ...defaults().best, ...r.best };
            d.stats = { ...defaults().stats, ...r.stats };
            if (!Array.isArray(d.owned) || !d.owned.includes(0)) d.owned = [0, ...(d.owned || [])];
        }
    } catch { /* storage unavailable */ }
    return d;
}
let P = load();
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch { /* ignore */ } };
if (!P.lang) P.lang = (navigator.language || '').toLowerCase().startsWith('ar') ? 'ar' : 'en';

/* -------------------------------- i18n -------------------------------- */
const I18N = {
    en: {
        title1: 'Flappy', title2: 'Bird', tagline: 'Tap to soar. Dodge the pipes.',
        play: 'Play', easy: 'Easy', normal: 'Normal', hard: 'Hard', best: 'Best', coins: 'Coins', score: 'Score',
        getReady: 'Get Ready!', tapHint: 'Tap, click or press Space to flap',
        paused: 'Paused', resume: 'Resume', restart: 'Restart', menu: 'Menu',
        gameOver: 'Game Over', newBest: 'New Best!', playAgain: 'Play Again', share: 'Share score',
        statsTitle: 'Stats & Achievements', helpTitle: 'How to play',
        help1: 'Tap, click or press Space / ↑ / W to flap. Fly through the gaps without touching the pipes.',
        pu_shield: 'Shield', pu_shield_d: 'Absorbs one hit.',
        pu_slow: 'Slow-Mo', pu_slow_d: 'Time slows down for a few seconds.',
        pu_dbl: 'Double', pu_dbl_d: 'Every pipe is worth 2 points.',
        help_coin: 'Collect them to unlock new birds. Fly through the gap centre for a PERFECT bonus!',
        k_flap: 'Flap', k_pause: 'Pause', k_mute: 'Mute',
        unlock: 'Unlock', equipped: 'Equipped', owned: 'Owned', locked: 'Locked',
        s_classic: 'Classic', s_ruby: 'Ruby', s_mint: 'Mint', s_ocean: 'Ocean', s_royal: 'Royal', s_ghost: 'Ghost',
        perfect: 'PERFECT!', sunrise: 'Good morning!',
        st_games: 'Games', st_flaps: 'Flaps', st_pipes: 'Pipes', st_coins: 'Coins found', st_perfect: 'Perfects', st_shield: 'Shields used',
        overall: 'Overall', achievements: 'Achievements', top: 'Top scores', noScores: 'No scores yet — go fly!',
        a_first: 'First Flight', a_first_d: 'Play your first game',
        a_s10: 'Getting Warm', a_s10_d: 'Score 10 points', a_s25: 'High Flyer', a_s25_d: 'Score 25 points', a_s50: 'Legend', a_s50_d: 'Score 50 points',
        a_c100: 'Pocket Change', a_c100_d: 'Collect 100 coins in total', a_c500: 'Treasure Hunter', a_c500_d: 'Collect 500 coins in total',
        a_perf: 'Sharpshooter', a_perf_d: '10 PERFECT passes in total', a_shield: 'Saved!', a_shield_d: 'Survive a hit with a shield',
        a_night: 'Night Owl', a_night_d: 'Reach the night in a single run', a_hard: 'Daredevil', a_hard_d: 'Score 15 on Hard', a_skin: 'Fashionista', a_skin_d: 'Own 3 different birds',
        achUnlocked: 'Achievement unlocked', copied: 'Score copied to clipboard!', notEnough: 'Not enough coins', skinUnlocked: 'New bird unlocked!',
        shareText: s => `I scored ${s} in Flappy Bird Deluxe! Can you beat me?`
    },
    ar: {
        title1: 'فلابي', title2: 'بيرد', tagline: 'اضغط عشان تطير.. وتفادى المواسير',
        play: 'العب', easy: 'سهل', normal: 'عادي', hard: 'صعب', best: 'الأفضل', coins: 'العملات', score: 'النتيجة',
        getReady: 'استعد!', tapHint: 'اضغط أو كليك أو Space عشان تطير',
        paused: 'إيقاف مؤقت', resume: 'كمّل', restart: 'إعادة', menu: 'القائمة',
        gameOver: 'انتهت اللعبة', newBest: 'رقم قياسي!', playAgain: 'العب تاني', share: 'شارك نتيجتك',
        statsTitle: 'الإحصائيات والإنجازات', helpTitle: 'طريقة اللعب',
        help1: 'اضغط أو كليك أو Space / ↑ / W عشان تطير. عدّي من الفتحات من غير ما تلمس المواسير.',
        pu_shield: 'درع', pu_shield_d: 'بيحميك من ضربة واحدة.',
        pu_slow: 'تباطؤ', pu_slow_d: 'الوقت بيبطّأ لثواني.',
        pu_dbl: 'مضاعفة', pu_dbl_d: 'كل ماسورة بنقطتين.',
        help_coin: 'اجمعها وافتح بها طيور جديدة. عدّي من نص الفتحة بالظبط وخد مكافأة ممتاز!',
        k_flap: 'طيران', k_pause: 'إيقاف', k_mute: 'كتم',
        unlock: 'افتح', equipped: 'مستخدم', owned: 'مملوك', locked: 'مقفول',
        s_classic: 'كلاسيك', s_ruby: 'ياقوت', s_mint: 'نعناع', s_ocean: 'محيط', s_royal: 'ملكي', s_ghost: 'شبح',
        perfect: 'ممتاز!', sunrise: 'صباح الخير!',
        st_games: 'مرات اللعب', st_flaps: 'رفرفات', st_pipes: 'مواسير', st_coins: 'عملات', st_perfect: 'ممتاز', st_shield: 'دروع مستخدمة',
        overall: 'عام', achievements: 'الإنجازات', top: 'أفضل النتائج', noScores: 'لسه مفيش نتائج — اطلع طير!',
        a_first: 'أول طيرة', a_first_d: 'العب أول لعبة',
        a_s10: 'سخنّا', a_s10_d: 'هات 10 نقاط', a_s25: 'طيار محترف', a_s25_d: 'هات 25 نقطة', a_s50: 'أسطورة', a_s50_d: 'هات 50 نقطة',
        a_c100: 'فكّة', a_c100_d: 'اجمع 100 عملة', a_c500: 'صائد الكنوز', a_c500_d: 'اجمع 500 عملة',
        a_perf: 'قنّاص', a_perf_d: '10 عبورات ممتازة', a_shield: 'اتنقذت!', a_shield_d: 'انجُ من ضربة بالدرع',
        a_night: 'بومة الليل', a_night_d: 'وصّل لليل في لعبة واحدة', a_hard: 'مغامر', a_hard_d: 'هات 15 في الصعب', a_skin: 'شيك', a_skin_d: 'امتلك 3 طيور مختلفة',
        achUnlocked: 'إنجاز جديد', copied: 'تم نسخ النتيجة!', notEnough: 'العملات مش كفاية', skinUnlocked: 'طير جديد اتفتح!',
        shareText: s => `جبت ${s} نقطة في Flappy Bird Deluxe! تقدر تغلبني؟`
    }
};
const t = k => (I18N[P.lang] || I18N.en)[k] ?? I18N.en[k] ?? k;

/* ------------------------------ DOM refs ------------------------------ */
const gameEl = $('#game'), canvas = $('#gameCanvas'), ctx = canvas.getContext('2d');
const fxCanvas = $('#fxCanvas'), fxc = fxCanvas.getContext('2d');
const hud = $('#hud'), hudScore = $('#hudScore'), hudCoins = $('#hudCoins'), powerupsEl = $('#powerups');
const menuScreen = $('#menuScreen'), pauseScreen = $('#pauseScreen'), overScreen = $('#overScreen'), readyScreen = $('#readyScreen');
const countdownEl = $('#countdown'), countNum = $('#countNum'), flashEl = $('#flash');
const skinCanvas = $('#skinCanvas'), sctx = skinCanvas.getContext('2d');

/* ------------------------------- audio -------------------------------- */
const Sound = (() => {
    let ac = null, master = null, musicBus = null, timer = null, step = 0;
    function init() {
        if (ac) return;
        try {
            ac = new (window.AudioContext || window.webkitAudioContext)();
            master = ac.createGain(); master.gain.value = .55; master.connect(ac.destination);
            musicBus = ac.createGain(); musicBus.gain.value = .5; musicBus.connect(master);
        } catch { ac = null; }
    }
    function resume() { init(); if (ac && ac.state === 'suspended') ac.resume(); if (P.music) startMusic(); }
    function tone({ f = 440, f2 = 0, type = 'sine', dur = .15, vol = .25, delay = 0, bus = null }) {
        if (!ac) return;
        const t0 = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
        o.type = type; o.frequency.setValueAtTime(f, t0);
        if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
        g.gain.setValueAtTime(.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol, t0 + .008);
        g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
        o.connect(g); g.connect(bus || master); o.start(t0); o.stop(t0 + dur + .03);
    }
    function noise(dur = .25, vol = .3, freq = 900) {
        if (!ac) return;
        const n = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
        const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
        s.buffer = buf; f.type = 'lowpass'; f.frequency.value = freq; g.gain.value = vol;
        s.connect(f); f.connect(g); g.connect(master); s.start();
    }
    const on = fn => (...a) => { if (P.sound && ac) fn(...a); };
    const sfx = {
        flap: on(() => tone({ f: 380, f2: 720, type: 'square', dur: .09, vol: .08 })),
        score: on(() => { tone({ f: 880, dur: .1, vol: .22 }); tone({ f: 1318, dur: .2, vol: .2, delay: .07 }); }),
        perfect: on(() => [880, 1109, 1318, 1760].forEach((f, i) => tone({ f, type: 'triangle', dur: .2, vol: .2, delay: i * .06 }))),
        coin: on((n = 0) => { const k = 1 + Math.min(n, 8) * .06; tone({ f: 1250 * k, type: 'triangle', dur: .08, vol: .18 }); tone({ f: 1900 * k, type: 'triangle', dur: .16, vol: .16, delay: .06 }); }),
        power: on(() => [523, 659, 784, 1046, 1318].forEach((f, i) => tone({ f, type: 'square', dur: .12, vol: .1, delay: i * .05 }))),
        shield: on(() => { tone({ f: 300, f2: 900, type: 'sawtooth', dur: .25, vol: .15 }); noise(.2, .15, 3000); }),
        hit: on(() => { noise(.3, .4, 1400); tone({ f: 220, f2: 60, type: 'square', dur: .25, vol: .2 }); }),
        die: on(() => tone({ f: 520, f2: 90, type: 'sawtooth', dur: .6, vol: .14 })),
        thud: on(() => { noise(.15, .35, 500); tone({ f: 110, f2: 45, dur: .15, vol: .3 }); }),
        click: on(() => tone({ f: 640, f2: 420, type: 'triangle', dur: .07, vol: .14 })),
        unlock: on(() => [659, 784, 988, 1318, 1568].forEach((f, i) => tone({ f, type: 'triangle', dur: .25, vol: .17, delay: i * .08 }))),
        win: on(() => [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone({ f, type: 'triangle', dur: .22, vol: .18, delay: i * .09 }))),
        tick: on(n => tone({ f: n ? 880 : 660, type: 'sine', dur: .14, vol: .2 })),
        woosh: on(() => noise(.18, .12, 2500))
    };
    // relaxed pentatonic loop
    const scale = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];
    const pattern = [0, 2, 4, 2, 5, 4, 2, 3, 0, 2, 4, 6, 5, 4, 2, 1];
    function startMusic() {
        if (!ac || timer) return;
        timer = setInterval(() => {
            if (!P.music || document.hidden) return;
            const i = step++ % pattern.length;
            tone({ f: scale[pattern[i]], type: 'triangle', dur: .45, vol: .08, bus: musicBus });
            if (i % 4 === 0) tone({ f: scale[pattern[i] % 3] / 2, type: 'sine', dur: .9, vol: .1, bus: musicBus });
        }, 240);
    }
    function stopMusic() { clearInterval(timer); timer = null; }
    return { resume, sfx, startMusic, stopMusic };
})();
const sfx = Sound.sfx;

/* --------------------------- bird sprite / skins --------------------------- */
// 17x12 pixel-art grid. a=outline b=body c=beak d=belly w=white
const SPRITE = [
    '......aaaaaa.....',
    '....aabbbbawa....',
    '...abbbbbawwwa...',
    '.aaaabbbbawwawa..',
    'awwwwabbbawwawa..',
    'awwwwwabbbawwwa..',
    'abwwwbabbbbaaaaa.',
    '.abbbabbbbaccccca',
    '..aaaddddacaaaaa.',
    '....adddddacccca.',
    '.....aaddddaaaaa.',
    '.......aaaa......'
];
const BASE = { a: [7, 3, 8], b: [247, 255, 0], c: [255, 85, 23], d: [255, 184, 43], w: [255, 255, 255] };
function rgb2hsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
    if (mx !== mn) {
        const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
        h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60;
    }
    return [h, s, l];
}
function hsl2rgb([h, s, l]) {
    h = ((h % 360) + 360) % 360 / 360;
    if (!s) return [l * 255, l * 255, l * 255];
    const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = x => { x = (x + 1) % 1; return x < 1 / 6 ? p + (q - p) * 6 * x : x < .5 ? q : x < 2 / 3 ? p + (q - p) * (2 / 3 - x) * 6 : p; };
    return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}
const SKINS = [
    { id: 'classic', price: 0, hue: 0, accent: [255, 235, 60] },
    { id: 'ruby', price: 40, hue: -52, accent: [255, 90, 90] },
    { id: 'mint', price: 80, hue: 78, accent: [110, 240, 140] },
    { id: 'ocean', price: 140, hue: 150, accent: [90, 200, 255] },
    { id: 'royal', price: 220, hue: 205, accent: [170, 130, 255] },
    { id: 'ghost', price: 320, ghost: true, accent: [235, 240, 255] }
];
function buildSkin(def) {
    const pal = { ...BASE };
    for (const k of ['b', 'd']) {
        if (def.ghost) { const [h, s, l] = rgb2hsl(BASE[k]); pal[k] = hsl2rgb([210, .25, k === 'b' ? .93 : .74]); }
        else if (def.hue) { const [h, s, l] = rgb2hsl(BASE[k]); pal[k] = hsl2rgb([h + def.hue, s, l]); }
    }
    if (def.ghost) pal.c = [255, 170, 190];
    const S = 12, c = document.createElement('canvas');
    c.width = 17 * S; c.height = 12 * S;
    const x = c.getContext('2d');
    SPRITE.forEach((row, y) => [...row].forEach((ch, i) => {
        if (ch === '.') return;
        x.fillStyle = css(pal[ch]); x.fillRect(i * S, y * S, S, S);
    }));
    return c;
}
SKINS.forEach(s => { s.img = buildSkin(s); });

/* ------------------------- scenery palettes (time of day) ------------------------- */
// order: 0 day, 1 sunset, 2 night, 3 dawn
const PAL = {
    top:   [[63, 169, 245], [86, 56, 140], [8, 12, 40], [86, 100, 200]],
    bot:   [[189, 233, 255], [255, 150, 100], [38, 62, 124], [255, 200, 175]],
    hillF: [[132, 206, 176], [140, 86, 130], [26, 42, 86], [150, 150, 195]],
    hillN: [[96, 183, 105], [105, 64, 92], [18, 32, 64], [112, 140, 150]],
    city:  [[130, 180, 208], [95, 56, 104], [14, 22, 52], [112, 124, 176]],
    cloud: [[255, 255, 255], [255, 205, 190], [96, 108, 170], [255, 228, 238]],
    grass: [[120, 205, 62], [100, 150, 60], [44, 96, 70], [108, 170, 80]],
    grassD:[[98, 184, 48], [84, 132, 50], [36, 84, 60], [92, 152, 66]],
    dirt:  [[224, 186, 112], [194, 142, 100], [82, 72, 98], [192, 162, 134]],
    pipe:  [[96, 196, 54], [88, 148, 62], [44, 100, 78], [88, 158, 74]],
    sun:   [[255, 244, 170], [255, 140, 70], [255, 200, 120], [255, 190, 150]],
    scal:  [0, .15, 1, .25],          // star alpha
    win:   [0, .5, 1, .3],            // lit windows
    cloudA:[.92, .85, .4, .8]
};
const palNow = {};
function computePal(tod) {
    const i = Math.floor(tod) % 4, j = (i + 1) % 4, f = smooth(tod - Math.floor(tod));
    for (const k in PAL) {
        const a = PAL[k];
        palNow[k] = Array.isArray(a[0]) ? mixC(a[i], a[j], f) : lerp(a[i], a[j], f);
    }
    const p = palNow.pipe;
    palNow.pipeL = mixC(p, [255, 255, 255], .38);
    palNow.pipeD = mixC(p, [0, 0, 0], .32);
    palNow.pipeO = mixC(p, [0, 0, 0], .62);
    return palNow;
}

/* ------------------------------ game constants ------------------------------ */
const H = 720, GROUND_H = 100;
let W = 480, SC = 1;
const groundY = H - GROUND_H;
const GRAV = .46, JUMP = -7.9, MAXV = 10.5;
const PIPE_W = 74, CAP_H = 32;
const DIFF = {
    easy:   { gap: 215, speed: 2.5, spacing: 275, movers: 0,   moverFrom: 99, grow: .006 },
    normal: { gap: 188, speed: 3.0, spacing: 255, movers: .35, moverFrom: 8,  grow: .008 },
    hard:   { gap: 162, speed: 3.5, spacing: 235, movers: .6,  moverFrom: 3,  grow: .010 }
};
const POWER = {
    shield: { label: 'pu_shield', svg: '<svg viewBox="0 0 24 24"><path d="M12 2.5l8 3v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10v-6z"/></svg>' },
    slow:   { label: 'pu_slow', svg: '<svg viewBox="0 0 24 24" style="fill:none;stroke-width:2.6;stroke-linecap:round"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3.5 2"/></svg>' },
    dbl:    { label: 'pu_dbl', svg: '<svg viewBox="0 0 24 24"><text x="12" y="17.5" text-anchor="middle" font-size="14" font-weight="800" stroke="none" font-family="Fredoka,Arial">x2</text></svg>' }
};
const POWER_COLORS = { shield: [92, 207, 255], slow: [154, 134, 255], dbl: [255, 210, 61] };
const SLOW_FRAMES = 360, DBL_FRAMES = 600;

/* --------------------------------- state --------------------------------- */
let state = 'menu';        // menu | ready | play | dying | over
let paused = false, counting = false, countTimer = null, modalOpen = false;
let time = 0, ambient = 0, scrollX = 0, ts = 1;
let tod = 0, todBase = 0, lastTod = 0;
const bird = { x: 140, y: H / 2, vy: 0, rot: 0, flap: 0, r: 13, invul: 0, landed: false };
let pipes = [], items = [], parts = [], texts = [];
let run = newRun();
const power = { shield: false, slow: 0, dbl: 0 };
const fx = { shake: 0, flash: 0 };
let overShown = false, overAt = 0, coinCombo = 0, comboTimer = 0;

function newRun() { return { score: 0, coins: 0, perfects: 0, spawned: 0, shieldSaves: 0, flaps: 0, reachedNight: false }; }

/* ------------------------------- layout ------------------------------- */
function resize() {
    const r = gameEl.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = fxCanvas.width = Math.round(r.width * dpr);
    canvas.height = fxCanvas.height = Math.round(r.height * dpr);
    SC = canvas.height / H;
    W = Math.max(300, Math.round(H * r.width / r.height));
    bird.x = W * .3;
}
addEventListener('resize', resize);
if ('ResizeObserver' in window) new ResizeObserver(resize).observe(gameEl);

/* ------------------------------ scenery data ------------------------------ */
const clouds = Array.from({ length: 10 }, (_, i) => ({
    x: rand(0, 600), y: rand(40, 330), s: rand(.6, 1.5), v: rand(.12, .45), layer: i % 2
}));
const stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random() * .55, r: rand(.6, 1.9), p: rand(0, TAU) }));
const CITY_TILE = 960;
const buildings = (() => {
    const out = []; let x = 0;
    while (x < CITY_TILE) {
        const w = Math.min(CITY_TILE - x, rand(36, 74) | 0), h = rand(70, 190) | 0;
        out.push({ x, w, h, roof: Math.random() < .3, seed: (Math.random() * 1000) | 0 });
        x += w + (rand(0, 6) | 0);
    }
    return out;
})();

/* ------------------------------- particles ------------------------------- */
function addPart(o) {
    if (parts.length > 450) parts.shift();
    parts.push({ x: 0, y: 0, vx: 0, vy: 0, g: 0, size: 4, rot: 0, vr: 0, drag: 1, shape: 'circle', color: [255, 255, 255], a: 1, age: 0, max: 40, grow: 0, ...o });
}
function burst(n, x, y, o = {}) {
    if (reduceMotion) n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) {
        const a = rand(0, TAU), sp = rand(o.min ?? 1, o.max ?? 4);
        addPart({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, rot: rand(0, TAU), vr: rand(-.3, .3), ...o, size: rand(o.s0 ?? 3, o.s1 ?? 6), max: rand(o.l0 ?? 25, o.l1 ?? 50) });
    }
}
function floatText(text, x, y, color = '#fff', size = 30) { texts.push({ text, x, y, color, size, age: 0, max: 55 }); }
function updateParticles(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.age += dt;
        if (p.age >= p.max) { parts.splice(i, 1); continue; }
        p.vx *= Math.pow(p.drag, dt); p.vy = p.vy * Math.pow(p.drag, dt) + p.g * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.size += p.grow * dt;
    }
    for (let i = texts.length - 1; i >= 0; i--) { const q = texts[i]; q.age += dt; q.y -= .9 * dt; if (q.age >= q.max) texts.splice(i, 1); }
}
function drawParticles() {
    for (const p of parts) {
        const k = p.age / p.max, a = p.a * (1 - k * k);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = Math.max(0, a); ctx.fillStyle = css(p.color);
        switch (p.shape) {
            case 'feather': ctx.beginPath(); ctx.ellipse(0, 0, p.size * 1.6, p.size * .6, 0, 0, TAU); ctx.fill(); break;
            case 'star': {
                const s = p.size * (1 - k * .5);
                ctx.beginPath(); ctx.moveTo(0, -s * 1.6); ctx.quadraticCurveTo(0, 0, s * 1.6, 0); ctx.quadraticCurveTo(0, 0, 0, s * 1.6);
                ctx.quadraticCurveTo(0, 0, -s * 1.6, 0); ctx.quadraticCurveTo(0, 0, 0, -s * 1.6); ctx.fill(); break;
            }
            case 'ring': ctx.strokeStyle = css(p.color); ctx.lineWidth = 3 * (1 - k); ctx.beginPath(); ctx.arc(0, 0, p.size, 0, TAU); ctx.stroke(); break;
            case 'square': ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * .6); break;
            default: ctx.beginPath(); ctx.arc(0, 0, Math.max(.1, p.size * (1 - k * .6)), 0, TAU); ctx.fill();
        }
        ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    for (const q of texts) {
        const k = q.age / q.max, pop = k < .15 ? .6 + k / .15 * .5 : 1.1 - Math.min(.1, (k - .15));
        ctx.save(); ctx.translate(q.x, q.y); ctx.scale(pop, pop); ctx.globalAlpha = 1 - Math.pow(k, 3);
        ctx.font = `700 ${q.size}px Fredoka, Cairo, sans-serif`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,30,60,.9)';
        ctx.strokeText(q.text, 0, 0); ctx.fillStyle = q.color; ctx.fillText(q.text, 0, 0); ctx.restore();
    }
    ctx.globalAlpha = 1;
}

/* ------------------------------ confetti (overlay) ------------------------------ */
let confetti = [], confettiOn = false;
function launchConfetti() {
    const w = fxCanvas.width, h = fxCanvas.height, cols = ['#ff5c7a', '#ffd43b', '#4cd964', '#39a2f2', '#b48cff', '#ff9a3c'];
    for (let i = 0; i < 140; i++) confetti.push({
        x: w / 2 + rand(-60, 60), y: h * .45, vx: rand(-9, 9) * SC * .6, vy: rand(-16, -4) * SC * .6, g: .35 * SC * .6,
        s: rand(6, 12) * SC * .6, r: rand(0, TAU), vr: rand(-.3, .3), c: cols[i % cols.length], life: rand(100, 170)
    });
    if (!confettiOn) { confettiOn = true; requestAnimationFrame(confettiLoop); }
}
function confettiLoop() {
    fxc.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    confetti = confetti.filter(p => p.life > 0 && p.y < fxCanvas.height + 30);
    for (const p of confetti) {
        p.vy += p.g; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life--;
        fxc.save(); fxc.translate(p.x, p.y); fxc.rotate(p.r); fxc.scale(1, Math.cos(p.r * 2)); fxc.fillStyle = p.c;
        fxc.globalAlpha = Math.min(1, p.life / 30); fxc.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); fxc.restore();
    }
    if (confetti.length) requestAnimationFrame(confettiLoop);
    else { confettiOn = false; fxc.clearRect(0, 0, fxCanvas.width, fxCanvas.height); }
}

/* --------------------------------- toasts --------------------------------- */
function toast(icon, title, text) {
    const d = document.createElement('div');
    d.className = 'toast';
    d.innerHTML = `<span class="ti">${icon}</span><div><small>${title}</small><b>${text}</b></div>`;
    $('#toasts').appendChild(d);
    setTimeout(() => d.remove(), 4100);
}

/* ----------------------------- achievements ----------------------------- */
const ACH = [
    { id: 'first', ic: '🐣', test: () => P.stats.games >= 1 },
    { id: 's10', ic: '🔥', test: () => bestOverall() >= 10 },
    { id: 's25', ic: '🚀', test: () => bestOverall() >= 25 },
    { id: 's50', ic: '👑', test: () => bestOverall() >= 50 },
    { id: 'c100', ic: '🪙', test: () => P.stats.coins >= 100 },
    { id: 'c500', ic: '💰', test: () => P.stats.coins >= 500 },
    { id: 'perf', ic: '🎯', test: () => P.stats.perfects >= 10 },
    { id: 'shield', ic: '🛡️', test: () => P.stats.shields >= 1 },
    { id: 'night', ic: '🦉', test: () => run.reachedNight },
    { id: 'hard', ic: '😈', test: () => P.best.hard >= 15 },
    { id: 'skin', ic: '👗', test: () => P.owned.length >= 3 }
];
const bestOverall = () => Math.max(P.best.easy, P.best.normal, P.best.hard);
function checkAch() {
    let delay = 0;
    for (const a of ACH) {
        if (!P.ach[a.id] && a.test()) {
            P.ach[a.id] = Date.now();
            setTimeout(() => { toast(a.ic, t('achUnlocked'), t('a_' + a.id)); sfx.unlock(); }, delay);
            delay += 1200;
        }
    }
}

/* ------------------------------- HUD helpers ------------------------------- */
function setScoreHUD(v, pop = true) {
    hudScore.textContent = v;
    if (pop && !reduceMotion) hudScore.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 280, easing: 'ease-out' });
}
function setCoinsHUD(v, pop = true) {
    hudCoins.textContent = v;
    if (pop && !reduceMotion) $('#hudCoinChip').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 220 });
}
const pills = {};
function pill(type) {
    if (!pills[type]) {
        const d = document.createElement('div');
        d.className = 'pill ' + type + (type === 'shield' ? ' pulse' : '');
        d.innerHTML = `<span class="pi">${POWER[type].svg}</span><span class="pl">${t(POWER[type].label)}</span><i class="bar"><b></b></i>`;
        powerupsEl.appendChild(d); pills[type] = d;
    }
    return pills[type];
}
function dropPill(type) { if (pills[type]) { pills[type].remove(); delete pills[type]; } }
function clearPills() { Object.keys(pills).forEach(dropPill); }
function syncPills() {
    if (power.shield) pill('shield').querySelector('b').style.transform = 'scaleX(1)'; else dropPill('shield');
    if (power.slow > 0) pill('slow').querySelector('b').style.transform = `scaleX(${power.slow / SLOW_FRAMES})`; else dropPill('slow');
    if (power.dbl > 0) pill('dbl').querySelector('b').style.transform = `scaleX(${power.dbl / DBL_FRAMES})`; else dropPill('dbl');
}
function doFlash(a = .8) { fx.flash = a; }

/* ------------------------------ screens / flow ------------------------------ */
function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }
function resetBird() {
    bird.x = W * .3; bird.y = H * .42; bird.vy = 0; bird.rot = 0; bird.flap = 0; bird.invul = 0; bird.landed = false;
}
function resetTod() { todBase = Math.ceil((tod - .02) / 4) * 4; todTarget = todBase; }

function goMenu() {
    cancelCountdown(); paused = false;
    state = 'menu'; hide(hud); hide(pauseScreen); hide(overScreen); hide(readyScreen); show(menuScreen);
    pipes = []; items = []; clearPills(); power.shield = false; power.slow = 0; power.dbl = 0; gameEl.classList.remove('slowmo');
    resetTod(); skinIdx = P.skin; renderMenu();
}
function startGame() {
    Sound.resume(); sfx.click();
    run = newRun(); pipes = []; items = []; texts = [];
    power.shield = false; power.slow = 0; power.dbl = 0; ts = 1; overShown = false; coinCombo = 0;
    gameEl.classList.remove('slowmo'); clearPills();
    resetBird(); resetTod();
    setScoreHUD(0, false); setCoinsHUD(0, false);
    hide(menuScreen); hide(overScreen); hide(pauseScreen); show(hud); show(readyScreen);
    state = 'ready';
    document.activeElement?.blur?.();
}
function beginPlay() {
    state = 'play'; hide(readyScreen);
    bird.vy = JUMP;
}
function flap() {
    if (paused || counting || modalOpen) return;
    if (state === 'ready') beginPlay();
    if (state !== 'play') return;
    bird.vy = JUMP; bird.flap = 0; bird.rot = -.5; run.flaps++; P.stats.flaps++;
    sfx.flap();
    if (!reduceMotion) {
        burst(4, bird.x - 14, bird.y + 8, { min: .4, max: 1.8, s0: 3, s1: 5, l0: 14, l1: 26, color: [255, 255, 255], a: .8, vy: 1, drag: .95 });
        if (Math.random() < .5) addPart({ x: bird.x - 10, y: bird.y, vx: rand(-2.5, -.8), vy: rand(-1, 1), g: .05, shape: 'feather', size: 4, color: SKINS[P.skin].accent, rot: rand(0, TAU), vr: rand(-.2, .2), max: 40, a: .9 });
    }
}

function pause() {
    if (state !== 'play' || paused || counting) return;
    paused = true; show(pauseScreen); sfx.click();
}
function resumeGame() {
    if (!paused) return;
    sfx.click(); hide(pauseScreen);
    startCountdown(() => { paused = false; });
}
function startCountdown(done) {
    counting = true; show(countdownEl);
    let n = 3;
    const tick = () => {
        if (n === 0) { hide(countdownEl); counting = false; countTimer = null; done(); return; }
        countNum.textContent = n; countNum.style.animation = 'none'; void countNum.offsetWidth; countNum.style.animation = '';
        sfx.tick(n === 1); n--; countTimer = setTimeout(tick, 800);
    };
    tick();
}
function cancelCountdown() { clearTimeout(countTimer); countTimer = null; counting = false; hide(countdownEl); }

/* ---------------------------------- spawning ---------------------------------- */
function spawnPipe() {
    const cfg = DIFF[P.diff];
    const gap = cfg.gap - Math.min(run.score, 30) * .6;
    const prev = pipes[pipes.length - 1];
    const mover = run.score >= cfg.moverFrom && Math.random() < cfg.movers;
    const amp = mover ? rand(26, 52) : 0;
    const margin = 64;
    const lo = margin + gap / 2 + amp, hi = groundY - margin - gap / 2 - amp;
    let gy = rand(lo, hi);
    if (prev) gy = clamp(gy, prev.gy - 230, prev.gy + 230);
    gy = clamp(gy, lo, hi);
    const x = prev ? prev.x + cfg.spacing : W + 120;
    const p = { x, gy, cy: gy, gap, amp, phase: rand(0, TAU), scored: false };
    // collectibles between previous pipe and this one
    if (prev) {
        const ax = prev.x + PIPE_W / 2, bx = x + PIPE_W / 2;
        const withPower = run.spawned >= 3 && Math.random() < .17;
        if (Math.random() < .85) for (let i = 0; i < 3; i++) {
            const u = .3 + i * .2, uy = (i + 1) / 4;
            const y = clamp(lerp(prev.gy, gy, smooth(uy)) - Math.sin(uy * Math.PI) * 30, 70, groundY - 70);
            const isPower = withPower && i === 1;
            const types = ['shield', 'slow', 'dbl'];
            const type = isPower ? (power.shield ? types[1 + (Math.random() * 2 | 0)] : types[Math.random() * 3 | 0]) : 'coin';
            items.push({ type, x: lerp(ax, bx, u), y, ph: rand(0, TAU), taken: false });
        }
    }
    pipes.push(p); run.spawned++;
}

/* -------------------------------- collisions -------------------------------- */
function circleRect(cx, cy, r, rx, ry, rw, rh) {
    const nx = clamp(cx, rx, rx + rw), ny = clamp(cy, ry, ry + rh), dx = cx - nx, dy = cy - ny;
    return dx * dx + dy * dy < r * r;
}
function hitsPipe(p) {
    const top = p.cy - p.gap / 2, bot = p.cy + p.gap / 2, x = p.x;
    if (bird.x + bird.r < x - 8 || bird.x - bird.r > x + PIPE_W + 8) return false;
    const r = bird.r;
    return circleRect(bird.x, bird.y, r, x, -60, PIPE_W, top + 60) || circleRect(bird.x, bird.y, r, x - 6, top - CAP_H, PIPE_W + 12, CAP_H) ||
        circleRect(bird.x, bird.y, r, x, bot, PIPE_W, groundY - bot) || circleRect(bird.x, bird.y, r, x - 6, bot, PIPE_W + 12, CAP_H);
}

/* ---------------------------------- gameplay ---------------------------------- */
function consumeShield(x, y) {
    power.shield = false; bird.invul = 75; run.shieldSaves++; P.stats.shields++;
    sfx.shield(); doFlash(.35); fx.shake = reduceMotion ? 0 : 7;
    burst(26, x, y, { min: 2, max: 7, shape: 'ring', s0: 6, s1: 22, color: [110, 220, 255], l0: 20, l1: 40, grow: .6 });
    burst(18, x, y, { min: 2, max: 6, shape: 'star', s0: 3, s1: 6, color: [200, 245, 255] });
    checkAch();
}
function collect(it) {
    it.taken = true;
    if (it.type === 'coin') {
        run.coins++; P.coins++; P.stats.coins++; coinCombo++; comboTimer = 50;
        sfx.coin(coinCombo); setCoinsHUD(run.coins);
        burst(8, it.x, it.y, { min: 1, max: 4, shape: 'star', s0: 2.5, s1: 5, color: [255, 220, 80], l0: 18, l1: 32 });
        checkAch();
    } else {
        sfx.power(); doFlash(.25);
        burst(26, it.x, it.y, { min: 2, max: 7, shape: 'star', s0: 3, s1: 7, color: POWER_COLORS[it.type] });
        burst(1, it.x, it.y, { min: 0, max: 0, shape: 'ring', s0: 10, grow: 2.4, color: POWER_COLORS[it.type], l0: 28, l1: 28 });
        floatText(t(POWER[it.type].label), it.x, it.y - 30, css(POWER_COLORS[it.type]), 28);
        if (it.type === 'shield') power.shield = true;
        if (it.type === 'slow') { power.slow = SLOW_FRAMES; gameEl.classList.add('slowmo'); }
        if (it.type === 'dbl') power.dbl = DBL_FRAMES;
        syncPills();
    }
}
function scorePipe(p) {
    p.scored = true;
    const pts = power.dbl > 0 ? 2 : 1;
    run.score += pts; P.stats.pipes++;
    const perfect = Math.abs(bird.y - p.cy) < p.gap * .11;
    setScoreHUD(run.score);
    if (perfect) {
        run.perfects++; P.stats.perfects++; run.coins++; P.coins++; P.stats.coins++; setCoinsHUD(run.coins, false);
        sfx.perfect(); floatText(t('perfect'), bird.x + 40, bird.y - 36, '#ffe066', 30);
        burst(16, bird.x + 20, bird.y, { min: 2, max: 6, shape: 'star', s0: 3, s1: 6, color: [255, 230, 90] });
    } else {
        sfx.score(); floatText('+' + pts, bird.x + 36, bird.y - 30, pts > 1 ? '#ffe066' : '#fff', 26);
    }
    // time of day follows score
    todTarget = todBase + Math.floor(run.score / 10);
    if (run.score >= 20) run.reachedNight = true;
    checkAch();
}
let todTarget = 0;

function updatePlay(dt) {
    const cfg = DIFF[P.diff];
    ts += ((power.slow > 0 ? .58 : 1) - ts) * Math.min(1, .08 * dt);
    const sdt = dt * ts;
    const speed = cfg.speed * (1 + Math.min(run.score, 50) * cfg.grow) * sdt;
    if (power.slow > 0) { power.slow -= dt; if (power.slow <= 0) { power.slow = 0; gameEl.classList.remove('slowmo'); } }
    if (power.dbl > 0) power.dbl = Math.max(0, power.dbl - dt);
    if (comboTimer > 0 && (comboTimer -= dt) <= 0) coinCombo = 0;
    if (bird.invul > 0) bird.invul -= dt;

    bird.vy = Math.min(bird.vy + GRAV * sdt, MAXV);
    bird.y += bird.vy * sdt;
    bird.flap += dt * (bird.vy < 0 ? .5 : .22);
    bird.rot = clamp(lerp(bird.rot, bird.vy * .085, .18 * dt), -.55, 1.15);
    if (bird.y < bird.r) { bird.y = bird.r; if (bird.vy < 0) bird.vy = 0; }
    if (bird.y + bird.r >= groundY) {
        bird.y = groundY - bird.r;
        if (power.shield) { consumeShield(bird.x, bird.y); bird.vy = JUMP * 1.15; }
        else { die('ground'); return; }
    }
    scrollX += speed;

    // trail
    if (!reduceMotion && Math.floor(time) % 3 === 0) addPart({ x: bird.x - 16, y: bird.y + rand(-3, 6), vx: -1, vy: 0, size: 4, max: 22, a: .35, color: power.slow > 0 ? [154, 134, 255] : SKINS[P.skin].accent });

    // pipes
    const last = pipes[pipes.length - 1];
    if (!last || last.x <= W + 120 - cfg.spacing) spawnPipe();
    for (const p of pipes) {
        p.x -= speed; p.phase += .032 * sdt;
        p.cy = p.gy + Math.sin(p.phase) * p.amp;
        if (bird.invul <= 0 && hitsPipe(p)) {
            if (power.shield) { consumeShield(bird.x, bird.y); bird.vy = -5; }
            else { die('pipe'); return; }
        }
        if (!p.scored && bird.x > p.x + PIPE_W / 2) scorePipe(p);
    }
    pipes = pipes.filter(p => p.x + PIPE_W + 20 > 0);

    // items
    for (const it of items) {
        it.x -= speed;
        if (!it.taken) {
            const dx = bird.x - it.x, dy = bird.y - it.y, rr = bird.r + (it.type === 'coin' ? 15 : 20);
            if (dx * dx + dy * dy < rr * rr) collect(it);
        }
    }
    items = items.filter(it => !it.taken && it.x > -40);
    syncPills();
}

function die(cause) {
    if (state !== 'play') return;
    state = 'dying'; hide(readyScreen);
    sfx.hit(); setTimeout(sfx.die, 130);
    fx.shake = reduceMotion ? 0 : 16; doFlash(.85);
    navigator.vibrate?.(70);
    burst(24, bird.x, bird.y, { min: 1.5, max: 7, shape: 'feather', s0: 3, s1: 6, color: SKINS[P.skin].accent, g: .18, drag: .97, l0: 40, l1: 70 });
    burst(14, bird.x, bird.y, { min: 2, max: 8, shape: 'star', s0: 3, s1: 6, color: [255, 255, 255] });
    bird.vy = cause === 'ground' ? 0 : -5.5;
    clearPills(); gameEl.classList.remove('slowmo'); power.slow = 0; power.dbl = 0; power.shield = false;
    finalizeRun();
    if (cause === 'ground') { bird.landed = true; bird.rot = 1.3; overAt = performance.now() + 700; }
}
function finalizeRun() {
    const d = P.diff;
    P.stats.games++;
    run.isNew = run.score > P.best[d] && run.score > 0;
    if (run.isNew) P.best[d] = run.score;
    if (run.score > 0) {
        P.scores.push({ s: run.score, d, t: Date.now() });
        P.scores.sort((a, b) => b.s - a.s || a.t - b.t); P.scores = P.scores.slice(0, 5);
    }
    checkAch(); persist();
}
function updateDying(dt) {
    bird.vy = Math.min(bird.vy + GRAV * 1.25 * dt, 13);
    bird.y += bird.vy * dt;
    bird.rot = lerp(bird.rot, 1.45, .14 * dt);
    if (bird.y + bird.r >= groundY) {
        bird.y = groundY - bird.r; bird.vy = 0;
        if (!bird.landed) {
            bird.landed = true; sfx.thud(); fx.shake = Math.max(fx.shake, reduceMotion ? 0 : 6);
            burst(12, bird.x, groundY, { min: .5, max: 3, s0: 4, s1: 8, color: [235, 220, 190], vy: -1, g: .05, a: .8 });
            overAt = performance.now() + 650;
        }
    }
    if (bird.landed && !overShown && performance.now() >= overAt) showOver();
}

/* ----------------------------------- game over ----------------------------------- */
function medalFor(s) { return s >= 40 ? 'platinum' : s >= 30 ? 'gold' : s >= 20 ? 'silver' : s >= 10 ? 'bronze' : 'none'; }
function countUp(el, to, ms = 700) {
    if (!to) { el.textContent = 0; return; }
    const t0 = performance.now();
    const f = now => { const k = clamp((now - t0) / ms, 0, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
}
function showOver() {
    overShown = true; state = 'over';
    hide(hud);
    const m = medalFor(run.score);
    $('#medal').className = 'medal ' + m;
    $('#newBadge').classList.toggle('hidden', !run.isNew);
    countUp($('#overScore'), run.score); $('#overBest').textContent = P.best[P.diff]; countUp($('#overCoins'), run.coins, 600);
    show(overScreen);
    if (run.isNew) { setTimeout(() => { launchConfetti(); sfx.win(); }, 500); }
    overShownAt = performance.now();
}
let overShownAt = 0;
function shareScore() {
    const text = I18N[P.lang].shareText(run.score);
    if (navigator.share) navigator.share({ title: 'Flappy Bird Deluxe', text }).catch(() => { });
    else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('📋', '✓', t('copied'))).catch(() => { });
}

/* ------------------------------------ update ------------------------------------ */
function update(dt) {
    time += dt; ambient += dt;
    // time of day
    if (state === 'play' || state === 'dying' || state === 'over') todTarget = todBase + Math.floor(run.score / 10);
    else todTarget = todBase;
    const diff = todTarget - tod;
    if (Math.abs(diff) > .001) tod += diff * Math.min(1, .018 * dt) + Math.sign(diff) * .0004 * dt;
    for (const c of clouds) { c.x -= c.v * (c.layer ? 1 : .6) * dt * (state === 'play' ? 1.3 : 1); if (c.x < -180) { c.x = W + rand(40, 200); c.y = rand(40, 330); } }

    if (!paused && !counting) {
        switch (state) {
            case 'menu': scrollX += .7 * dt; break;
            case 'ready': scrollX += 1 * dt; bird.y = H * .42 + Math.sin(time * .1) * 9; bird.flap += dt * .25; bird.rot = Math.sin(time * .1) * .08; break;
            case 'play': updatePlay(dt); break;
            case 'dying': updateDying(dt); break;
            case 'over': scrollX += .15 * dt; break;
        }
        updateParticles(dt);
    }
    fx.shake *= Math.pow(.88, dt); if (fx.shake < .2) fx.shake = 0;
    if (fx.flash > 0) { fx.flash = Math.max(0, fx.flash - .045 * dt); flashEl.style.opacity = fx.flash; }
}

/* ------------------------------------ render ------------------------------------ */
function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
function drawCloud(c, pal) {
    const s = c.s * (c.layer ? 1 : .75);
    ctx.globalAlpha = pal.cloudA * (c.layer ? 1 : .7); ctx.fillStyle = css(pal.cloud);
    circle(c.x, c.y, 20 * s); circle(c.x + 24 * s, c.y - 12 * s, 27 * s); circle(c.x + 54 * s, c.y - 2 * s, 22 * s); circle(c.x + 28 * s, c.y + 8 * s, 22 * s); circle(c.x + 8 * s, c.y + 8 * s, 16 * s);
    ctx.globalAlpha = 1;
}
function drawHills(off, base, amp, freq, color) {
    ctx.fillStyle = css(color); ctx.beginPath(); ctx.moveTo(-12, groundY + 12);
    for (let x = -12; x <= W + 12; x += 8) {
        const u = x + off;
        ctx.lineTo(x, base - (Math.sin(u * freq) * amp + Math.sin(u * freq * 2.3 + 1.7) * amp * .45 + Math.sin(u * freq * .45 + 4) * amp * .8));
    }
    ctx.lineTo(W + 12, groundY + 12); ctx.closePath(); ctx.fill();
}
function drawCity(pal) {
    const off = (scrollX * .22) % CITY_TILE, win = pal.win;
    ctx.fillStyle = css(pal.city);
    for (let tile = -1; tile * CITY_TILE - off < W + 80; tile++) {
        const ox = tile * CITY_TILE - off;
        if (ox + CITY_TILE < -80) continue;
        for (const b of buildings) {
            const x = ox + b.x; if (x > W + 10 || x + b.w < -10) continue;
            const top = groundY - 18 - b.h;
            ctx.fillStyle = css(pal.city); ctx.fillRect(x, top, b.w, b.h + 20);
            if (b.roof) { ctx.fillRect(x + b.w / 2 - 1.5, top - 14, 3, 14); }
            if (win > .04) {
                ctx.fillStyle = css([255, 222, 130], win * .85);
                for (let wy = top + 8, row = 0; wy < groundY - 40; wy += 14, row++)
                    for (let wx = x + 6, col = 0; wx < x + b.w - 7; wx += 11, col++)
                        if (((b.seed + row * 7 + col * 13) % 5) < 3) ctx.fillRect(wx, wy, 5, 7);
            }
        }
    }
}
function drawSky(pal) {
    const g = ctx.createLinearGradient(0, 0, 0, groundY);
    g.addColorStop(0, css(pal.top)); g.addColorStop(1, css(pal.bot));
    ctx.fillStyle = g; ctx.fillRect(-40, -40, W + 80, groundY + 80);
    // stars
    if (pal.scal > .02) {
        ctx.fillStyle = '#fff';
        for (const s of stars) { ctx.globalAlpha = pal.scal * (.55 + .45 * Math.sin(time * .04 + s.p)); ctx.beginPath(); ctx.arc(s.x * W, s.y * groundY, s.r, 0, TAU); ctx.fill(); }
        ctx.globalAlpha = 1;
    }
    // sun & moon
    const hy = groundY - 90, td = tod % 4;
    const sp = (td + 1) % 4;
    if (sp <= 2) {
        const x = lerp(W * .1, W * .9, sp / 2), y = hy - Math.sin(Math.PI * sp / 2) * 390, high = Math.sin(Math.PI * sp / 2);
        const col = mixC([255, 150, 80], [255, 240, 160], clamp(high * 1.6, 0, 1));
        const gl = ctx.createRadialGradient(x, y, 10, x, y, 150); gl.addColorStop(0, css(col, .6)); gl.addColorStop(1, css(col, 0));
        ctx.fillStyle = gl; ctx.fillRect(x - 150, y - 150, 300, 300);
        ctx.fillStyle = css(col); circle(x, y, 38);
    }
    const mp = (td + 3) % 4;
    if (mp <= 2) {
        const x = lerp(W * .1, W * .9, mp / 2), y = hy - Math.sin(Math.PI * mp / 2) * 380;
        const gl = ctx.createRadialGradient(x, y, 10, x, y, 120); gl.addColorStop(0, 'rgba(200,220,255,.45)'); gl.addColorStop(1, 'rgba(200,220,255,0)');
        ctx.fillStyle = gl; ctx.fillRect(x - 120, y - 120, 240, 240);
        ctx.fillStyle = '#f3f6ff'; circle(x, y, 30);
        ctx.fillStyle = 'rgba(150,165,205,.55)'; circle(x - 9, y - 6, 7); circle(x + 10, y + 8, 5); circle(x + 4, y - 14, 3.5);
    }
    for (const c of clouds) if (!c.layer) drawCloud(c, pal);
}
function drawPipe(p, pal) {
    const x = p.x, w = PIPE_W, top = p.cy - p.gap / 2, bot = p.cy + p.gap / 2, cx = x - 6, cw = w + 12;
    const body = ctx.createLinearGradient(x, 0, x + w, 0);
    body.addColorStop(0, css(pal.pipeD)); body.addColorStop(.18, css(pal.pipe)); body.addColorStop(.4, css(pal.pipeL)); body.addColorStop(.7, css(pal.pipe)); body.addColorStop(1, css(pal.pipeD));
    const cap = ctx.createLinearGradient(cx, 0, cx + cw, 0);
    cap.addColorStop(0, css(pal.pipeD)); cap.addColorStop(.16, css(pal.pipe)); cap.addColorStop(.38, css(pal.pipeL)); cap.addColorStop(.7, css(pal.pipe)); cap.addColorStop(1, css(pal.pipeD));
    // soft drop shadow on the right
    ctx.fillStyle = 'rgba(0,0,0,.14)';
    ctx.fillRect(x + w, -10, 12, top - CAP_H + 10); ctx.fillRect(x + w, bot + CAP_H, 12, groundY - bot - CAP_H);
    ctx.fillStyle = body;
    ctx.fillRect(x, -10, w, top - CAP_H + 10); ctx.fillRect(x, bot + CAP_H, w, groundY - bot - CAP_H + 4);
    ctx.fillStyle = cap; ctx.fillRect(cx, top - CAP_H, cw, CAP_H); ctx.fillRect(cx, bot, cw, CAP_H);
    // highlights
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.fillRect(x + 9, -10, 7, top - CAP_H + 10); ctx.fillRect(x + 9, bot + CAP_H, 7, groundY - bot - CAP_H);
    ctx.fillRect(cx + 9, top - CAP_H + 4, 7, CAP_H - 8); ctx.fillRect(cx + 9, bot + 4, 7, CAP_H - 8);
    // cap shadow onto body
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x, top - CAP_H - 6, w, 6); ctx.fillRect(x, bot + CAP_H, w, 6);
    // outlines
    ctx.strokeStyle = css(pal.pipeO); ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, -12, w - 3, top - CAP_H + 12); ctx.strokeRect(x + 1.5, bot + CAP_H, w - 3, groundY - bot - CAP_H + 6);
    ctx.strokeRect(cx + 1.5, top - CAP_H + 1.5, cw - 3, CAP_H - 3); ctx.strokeRect(cx + 1.5, bot + 1.5, cw - 3, CAP_H - 3);
}
function drawItem(it) {
    const bob = Math.sin(time * .07 + it.ph) * 5, y = it.y + bob;
    if (it.type === 'coin') {
        const sx = Math.abs(Math.cos(time * .07 + it.ph)) * .85 + .15;
        const gl = ctx.createRadialGradient(it.x, y, 4, it.x, y, 26); gl.addColorStop(0, 'rgba(255,220,80,.5)'); gl.addColorStop(1, 'rgba(255,220,80,0)');
        ctx.fillStyle = gl; ctx.fillRect(it.x - 26, y - 26, 52, 52);
        ctx.save(); ctx.translate(it.x, y); ctx.scale(sx, 1);
        ctx.fillStyle = '#c58a05'; circle(0, 0, 14.5);
        const g = ctx.createLinearGradient(-12, -12, 12, 12); g.addColorStop(0, '#fff1a0'); g.addColorStop(.5, '#ffd43b'); g.addColorStop(1, '#e8a90e');
        ctx.fillStyle = g; circle(0, 0, 12.5);
        ctx.strokeStyle = 'rgba(197,138,5,.8)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, 7.5, 0, TAU); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-5, -9, 3, 7);
        ctx.restore();
    } else {
        const col = POWER_COLORS[it.type], pulse = 1 + Math.sin(time * .12) * .08;
        const gl = ctx.createRadialGradient(it.x, y, 6, it.x, y, 40); gl.addColorStop(0, css(col, .55)); gl.addColorStop(1, css(col, 0));
        ctx.fillStyle = gl; ctx.fillRect(it.x - 40, y - 40, 80, 80);
        ctx.save(); ctx.translate(it.x, y); ctx.scale(pulse, pulse);
        ctx.fillStyle = 'rgba(255,255,255,.92)'; circle(0, 0, 20);
        ctx.fillStyle = css(col); circle(0, 0, 16);
        ctx.fillStyle = '#14203d'; ctx.strokeStyle = '#14203d';
        if (it.type === 'shield') { ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(9, -6); ctx.lineTo(9, 1); ctx.quadraticCurveTo(8, 8, 0, 11); ctx.quadraticCurveTo(-8, 8, -9, 1); ctx.lineTo(-9, -6); ctx.closePath(); ctx.fill(); }
        else if (it.type === 'slow') { ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.moveTo(0, -5); ctx.lineTo(0, 0); ctx.lineTo(4, 3); ctx.stroke(); }
        else { ctx.font = '800 15px Fredoka, Arial'; ctx.textAlign = 'center'; ctx.fillText('x2', 0, 5.5); }
        ctx.restore();
    }
}
function drawGround(pal) {
    const y = groundY, dirt = ctx.createLinearGradient(0, y, 0, H);
    dirt.addColorStop(0, css(pal.dirt)); dirt.addColorStop(1, css(mixC(pal.dirt, [0, 0, 0], .35)));
    ctx.fillStyle = dirt; ctx.fillRect(-40, y, W + 80, GROUND_H + 40);
    // pebbles
    ctx.fillStyle = 'rgba(0,0,0,.12)';
    const po = scrollX % 90;
    for (let x = -po; x < W + 90; x += 90) { ctx.fillRect(x + 20, y + 48, 12, 6); ctx.fillRect(x + 62, y + 70, 9, 5); ctx.fillRect(x + 40, y + 88, 14, 6); }
    ctx.fillStyle = css(pal.grass); ctx.fillRect(-40, y, W + 80, 24);
    ctx.fillStyle = css(pal.grassD);
    const sw = 28, off = scrollX % (sw * 2);
    for (let x = -off - sw * 2; x < W + sw * 2; x += sw * 2) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sw, y); ctx.lineTo(x + sw - 16, y + 24); ctx.lineTo(x - 16, y + 24); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-40, y, W + 80, 3);
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(-40, y + 24, W + 80, 4);
}
function drawBird() {
    const skin = SKINS[P.skin].img, w = 51, h = 36;
    // ground shadow
    const alt = clamp((groundY - bird.y) / 500, 0, 1);
    ctx.fillStyle = `rgba(0,0,0,${.22 * (1 - alt * .8)})`; ctx.beginPath(); ctx.ellipse(bird.x, groundY + 10, 22 * (1 - alt * .5), 5 * (1 - alt * .5), 0, 0, TAU); ctx.fill();
    if (bird.invul > 0 && Math.floor(bird.invul / 4) % 2 === 0 && state === 'play') ctx.globalAlpha = .4;
    ctx.save(); ctx.translate(bird.x, bird.y); ctx.rotate(bird.rot);
    const f = Math.sin(bird.flap * 1.6);
    const sy = state === 'dying' || state === 'over' ? 1 : 1 + f * .09; ctx.scale(1 - f * .04, sy);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(skin, -w / 2, -h / 2, w, h);
    ctx.restore(); ctx.globalAlpha = 1;
    if (power.shield && state !== 'dying') {
        const r = 31 + Math.sin(time * .15) * 2, g = ctx.createRadialGradient(bird.x, bird.y, r * .5, bird.x, bird.y, r);
        g.addColorStop(0, 'rgba(120,220,255,.04)'); g.addColorStop(1, 'rgba(120,220,255,.4)');
        ctx.fillStyle = g; circle(bird.x, bird.y, r);
        ctx.strokeStyle = 'rgba(190,240,255,.9)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(bird.x, bird.y, r, 0, TAU); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bird.x, bird.y, r - 5, -2.6, -1.7); ctx.stroke();
    }
}
function render() {
    ctx.setTransform(SC, 0, 0, SC, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const pal = computePal(tod);
    ctx.save();
    if (fx.shake > 0) ctx.translate(rand(-1, 1) * fx.shake, rand(-1, 1) * fx.shake);
    drawSky(pal);
    drawHills(scrollX * .12 + 100, groundY - 150, 28, .006, pal.hillF);
    drawCity(pal);
    for (const c of clouds) if (c.layer) drawCloud(c, pal);
    drawHills(scrollX * .35, groundY - 52, 20, .011, pal.hillN);
    for (const p of pipes) drawPipe(p, pal);
    for (const it of items) drawItem(it);
    drawGround(pal);
    if (state !== 'menu') drawBird();
    drawParticles();
    ctx.restore();
    // keep the page background in sync with the sky
    if ((time | 0) % 6 === 0) {
        const r = document.documentElement.style;
        r.setProperty('--sky-top', css(pal.top)); r.setProperty('--sky-bot', css(pal.bot));
    }
}

/* -------------------------------------- menu -------------------------------------- */
let skinIdx = P.skin;
const isOwned = i => P.owned.includes(i);
function renderMenu() {
    $('#menuBest').textContent = P.best[P.diff];
    $('#menuCoins').textContent = P.coins;
    const def = SKINS[skinIdx], owned = isOwned(skinIdx);
    $('.skin').classList.toggle('locked', !owned);
    $('#skinLock').classList.toggle('hidden', owned);
    $('#skinName').innerHTML = `${t('s_' + def.id)} <small>${owned ? (P.skin === skinIdx ? '✓ ' + t('equipped') : t('owned')) : t('locked')}</small>`;
    $('#buyBtn').classList.toggle('hidden', owned);
    $('#buyLabel').textContent = `${t('unlock')} · ${def.price}`;
    $('#skinDots').innerHTML = SKINS.map((s, i) => `<i class="${i === skinIdx ? 'on' : ''} ${isOwned(i) ? 'own' : ''}"></i>`).join('');
    const di = ['easy', 'normal', 'hard'].indexOf(P.diff);
    $('#diffSeg').dataset.i = di;
    $$('#diffSeg button').forEach(b => b.classList.toggle('on', b.dataset.diff === P.diff));
    $('#soundBtn').classList.toggle('off', !P.sound);
    $('#musicBtn').classList.toggle('off', !P.music);
    $('#langLabel').textContent = P.lang === 'ar' ? 'EN' : 'ع';
}
function drawSkinPreview() {
    sctx.clearRect(0, 0, skinCanvas.width, skinCanvas.height);
    sctx.imageSmoothingEnabled = false;
    const bob = Math.sin(ambient * .06) * 4, r = Math.sin(ambient * .06) * .06, f = Math.sin(ambient * .18);
    sctx.save(); sctx.translate(102, 72 + bob); sctx.rotate(r); sctx.scale(1 - f * .03, 1 + f * .07);
    sctx.drawImage(SKINS[skinIdx].img, -85, -60, 170, 120); sctx.restore();
}
function changeSkin(d) {
    skinIdx = (skinIdx + d + SKINS.length) % SKINS.length;
    if (isOwned(skinIdx)) P.skin = skinIdx;
    sfx.click(); persist(); renderMenu();
    $('.skin-stage').animate([{ transform: `translateX(${d * 28}px)`, opacity: .2 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'ease-out' });
}
function buySkin() {
    const def = SKINS[skinIdx];
    if (isOwned(skinIdx)) return;
    if (P.coins < def.price) {
        sfx.hit(); toast('🪙', t('notEnough'), `${P.coins} / ${def.price}`);
        const b = $('#buyBtn'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); return;
    }
    P.coins -= def.price; P.owned.push(skinIdx); P.skin = skinIdx;
    sfx.unlock(); toast('🐦', t('skinUnlocked'), t('s_' + def.id));
    launchConfetti(); checkAch(); persist(); renderMenu();
}
function setDiff(d) { P.diff = d; sfx.click(); persist(); renderMenu(); }

/* ----------------------------------- stats modal ----------------------------------- */
function openModal(id) {
    modalOpen = true; sfx.click();
    if (id === 'statsModal') buildStats();
    show($('#' + id));
}
function closeModals() { modalOpen = false; $$('.modal').forEach(hide); }
function buildStats() {
    const s = P.stats, loc = P.lang === 'ar' ? 'ar-EG' : 'en-US';
    const st = [['st_games', s.games], ['st_flaps', s.flaps], ['st_pipes', s.pipes], ['st_coins', s.coins], ['st_perfect', s.perfects], ['st_shield', s.shields]];
    const board = P.scores.length
        ? `<ol class="board">${P.scores.map((r, i) => `<li><span class="rk">${i + 1}</span><b>${r.s}</b><small>${t(r.d)} · ${new Date(r.t).toLocaleDateString(loc)}</small></li>`).join('')}</ol>`
        : `<p class="empty">${t('noScores')}</p>`;
    $('#statsBody').innerHTML =
        `<h3>${t('overall')}</h3><div class="stat-grid">${st.map(([k, v]) => `<div><b>${v.toLocaleString('en-US')}</b><small>${t(k)}</small></div>`).join('')}</div>` +
        `<h3>${t('top')}</h3>${board}` +
        `<h3>${t('achievements')} · ${ACH.filter(a => P.ach[a.id]).length}/${ACH.length}</h3>` +
        ACH.map(a => `<div class="ach ${P.ach[a.id] ? 'done' : ''}"><span class="ic">${a.ic}</span><div><b>${t('a_' + a.id)}</b><small>${t('a_' + a.id + '_d')}</small></div></div>`).join('');
}

/* ------------------------------------- language ------------------------------------- */
function applyLang() {
    document.documentElement.lang = P.lang; document.documentElement.dir = P.lang === 'ar' ? 'rtl' : 'ltr';
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('.pill').forEach(p => { const type = ['shield', 'slow', 'dbl'].find(k => p.classList.contains(k)); p.querySelector('.pl').textContent = t(POWER[type].label); });
    renderMenu();
}

/* -------------------------------------- input -------------------------------------- */
gameEl.addEventListener('pointerdown', e => {
    if (e.target.closest('button, .modal, .card, .sheet, .skin, .seg')) return;
    if (state === 'ready' || state === 'play') { e.preventDefault(); Sound.resume(); flap(); }
});
addEventListener('keydown', e => {
    if (e.repeat) return;
    const k = e.code;
    if (k === 'Escape') { if (modalOpen) { closeModals(); return; } if (state === 'play') { paused ? resumeGame() : pause(); } return; }
    if (modalOpen) return;
    if (k === 'KeyP') { if (state === 'play') paused ? resumeGame() : pause(); return; }
    if (k === 'KeyM') { toggleSound(); return; }
    if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') {
        if (document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur();
        e.preventDefault();
        if (state === 'ready' || state === 'play') { Sound.resume(); flap(); }
        else if (state === 'menu') startGame();
        else if (state === 'over' && performance.now() - overShownAt > 450) startGame();
    } else if (k === 'Enter') {
        if (state === 'menu' && document.activeElement === document.body) startGame();
        else if (state === 'over' && performance.now() - overShownAt > 450) startGame();
    }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (state === 'play') pause(); } });
addEventListener('pagehide', persist);
document.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTimeout(() => b.blur(), 0); });

function toggleSound() {
    P.sound = !P.sound; Sound.resume(); sfx.click(); persist(); renderMenu();
}
function toggleMusic() {
    P.music = !P.music; Sound.resume();
    if (P.music) Sound.startMusic(); else Sound.stopMusic();
    persist(); renderMenu();
}
function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen(); else (document.documentElement.requestFullscreen || (() => { })).call(document.documentElement);
}

$('#playBtn').addEventListener('click', startGame);
$('#againBtn').addEventListener('click', startGame);
$('#overMenuBtn').addEventListener('click', () => { sfx.click(); goMenu(); });
$('#pauseBtn').addEventListener('click', pause);
$('#resumeBtn').addEventListener('click', resumeGame);
$('#pauseRestartBtn').addEventListener('click', () => { paused = false; startGame(); });
$('#pauseMenuBtn').addEventListener('click', () => { sfx.click(); goMenu(); });
$('#skinPrev').addEventListener('click', () => changeSkin(-1));
$('#skinNext').addEventListener('click', () => changeSkin(1));
$('#buyBtn').addEventListener('click', buySkin);
$$('#diffSeg button').forEach(b => b.addEventListener('click', () => setDiff(b.dataset.diff)));
$('#soundBtn').addEventListener('click', toggleSound);
$('#musicBtn').addEventListener('click', toggleMusic);
$('#langBtn').addEventListener('click', () => { P.lang = P.lang === 'ar' ? 'en' : 'ar'; Sound.resume(); sfx.click(); persist(); applyLang(); });
$('#statsBtn').addEventListener('click', () => openModal('statsModal'));
$('#helpBtn').addEventListener('click', () => openModal('helpModal'));
$('#fsBtn').addEventListener('click', toggleFullscreen);
$('#shareBtn').addEventListener('click', shareScore);
$$('[data-close]').forEach(b => b.addEventListener('click', closeModals));
$$('.modal').forEach(m => m.addEventListener('pointerdown', e => { if (e.target === m) closeModals(); }));
if (!document.fullscreenEnabled) $('#fsBtn').classList.add('hidden');
// the first interaction anywhere unlocks audio
addEventListener('pointerdown', () => Sound.resume(), { once: true });

/* ------------------------------------- main loop ------------------------------------- */
let last = performance.now();
function frame(now) {
    let dt = (now - last) / 16.667; last = now;
    dt = clamp(dt, 0, 2.5);
    if (!document.hidden) {
        update(dt); render();
        if (state === 'menu') drawSkinPreview();
    }
    requestAnimationFrame(frame);
}

applyLang();
resize();
resetBird();
renderMenu();
requestAnimationFrame(frame);

// tiny debug hook (handy for testing)
$('.logo-bird').style.backgroundImage = `url(${SKINS[0].img.toDataURL()})`;
window.__flappy = { get state() { return state; }, get run() { return run; }, get pipes() { return pipes; }, get items() { return items; }, bird, power, P, startGame, flap, setScore(n) { run.score = n; todTarget = todBase + Math.floor(n / 10); setScoreHUD(n, false); } };
})();

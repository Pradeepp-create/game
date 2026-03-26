console.log('⚖️ PERFECT 50/50 BALANCE v4.1 — FULL GAME');

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// GAME STATE
let gameOn = false;

// Positions
let px = 80,
    py = 360;
let ex = 820,
    ey = 360;

// HP (still 200 base)
let pHealth = 200;
let eHealth = 200;

// Combo logic
let combo = 0;
let comboTimer = 0;

// ROUND TIMER
let timerSeconds = 60;

// Screen shake
let shake = 0;

// Jump
let pJump = 0;
let eJump = 0;

// Cooldowns
let pCooldown = 0;
let eCooldown = 0;

// Stun
let pStun = 0;
let eStun = 0;

// Enemy AI
let aiState = 'chase'; // chase, block, attack_punch, attack_kick, attack_special, stun

// Visual FX
let particles = [];
let damagePopups = [];

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(freq, duration, volume = 0.25) {
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

// Particle system
function spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 10,
            vy: Math.random() * -8,
            life: 25,
            color,
        });
    }
}

function spawnHitSpark(x, y, color, life = 30) {
    particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life,
        color,
        spark: true,
    });
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (!p.spark) p.vy += 0.3;
        p.life--;
        p.vx *= 0.97;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// Damage number popups
function spawnDamagePopup(x, y, damage, isPlayer) {
    damagePopups.push({
        x, y,
        damage: '-' + damage,
        vy: -3,
        life: 60,
        color: isPlayer ? '#ff4444' : '#44aaff',
        scale: 1,
    });
}

function updateDamagePopups() {
    for (let i = damagePopups.length - 1; i >= 0; i--) {
        const popup = damagePopups[i];
        popup.y += popup.vy;
        popup.vy += 0.1;
        popup.life--;
        popup.scale += 0.02;
        if (popup.life <= 0) damagePopups.splice(i, 1);
    }
}

// Low-HP UI helper
function setLowHpClass(el, health) {
    const container = el.parentNode;
    if (health <= 40) {
        container.classList.add('low-hp');
    } else {
        container.classList.remove('low-hp');
    }
}

// Input handler
const keys = {};
document.addEventListener('keydown', (e) => (keys[e.key] = true));
document.addEventListener('keyup', (e) => (keys[e.key] = false));

// START GAME
function startFight() {
    gameOn = true;
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    resetGame();
}

function restartFight() {
    document.getElementById('gameOver').classList.add('hidden');
    startFight();
}

function resetGame() {
    pHealth = 200;
    eHealth = 200;
    px = 80;
    ex = 820;
    py = ey = 360;
    combo = 0;
    comboTimer = 0;
    timerSeconds = 60;
    pStun = eStun = 0;
    aiState = 'chase';
    particles = [];
    damagePopups = [];
    pCooldown = eCooldown = 0;

    // Reset UI
    document.getElementById('pHealth').style.width = '100%';
    document.getElementById('eHealth').style.width = '100%';
    document.querySelector('.player-hp').textContent = '200';
    document.querySelector('.enemy-hp').textContent = '200';
    document.getElementById('timer').textContent = 'TIME: 60';
}

function update() {
    if (!gameOn) return;

    // Decrement timers
    comboTimer = Math.max(0, comboTimer - 1);
    pCooldown = Math.max(0, pCooldown - 1);
    eCooldown = Math.max(0, eCooldown - 1);
    pStun = Math.max(0, pStun - 1);
    eStun = Math.max(0, eStun - 1);

    // 60-second round timer
    timerSeconds = Math.max(0, timerSeconds - 1 / 60);
    const s = Math.floor(timerSeconds);
    const timerEl = document.getElementById('timer');
    if (timerEl) timerEl.textContent = `TIME: ${s}`;

    // TOUCH INPUT (MOBILE)
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (isMobile) {
        document.getElementById('mobileControls').classList.remove('hidden');
    }

    // Virtual joystick / D-pad helper
    const stickArea = document.getElementById('stickArea');
    let stickTouchId = null;
    let stickX = 0; // -1 to 1 horizontal

    stickArea.addEventListener('touchstart', (e) => {
        if (stickTouchId === null) {
            const touch = e.touches[0];
            stickTouchId = touch.identifier;
        }
    });

    stickArea.addEventListener('touchmove', (e) => {
        for (let i = 0; i < e.touches.length; i++) {
            const t = e.touches[i];
            if (t.identifier === stickTouchId) {
                const rect = stickArea.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const x = t.clientX - cx;
                const max = rect.width / 2;
                stickX = Math.max(-1, Math.min(1, x / max));
                e.preventDefault();
            }
        }
    });

    stickArea.addEventListener('touchend', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === stickTouchId) {
                stickTouchId = null;
                stickX = 0;
            }
        }
    });

    // Map touch buttons to keys
    const touchButtons = {
        btnJump: 'w',
        btnPunch: 'f',
        btnKick: 'g',
        btnUltra: 'q',
    };

    for (const [id, key] of Object.entries(touchButtons)) {
        const btn = document.getElementById(id);
        btn.addEventListener('touchstart', () => {
            keys[key] = true;
        });
        btn.addEventListener('touchend', () => {
            keys[key] = false;
        });
        // Prevent scroll when touching buttons
        btn.addEventListener('touchmove', (e) => e.preventDefault());
    }

    // END GAME ON TIME
    if (timerSeconds <= 0 && gameOn) {
        document.getElementById('result').textContent =
            pHealth > eHealth
                ? 'TIME VICTORY!'
                : eHealth > pHealth
                ? 'TIME DEFEAT'
                : 'TIME DRAW';
    }
}

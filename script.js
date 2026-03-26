console.log('⚖️ PERFECT 50/50 BALANCE v4.1 — FULL GAME');

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// GAME STATE
let gameOn = false;

// Positions
let px = 80, py = 360;
let ex = 820, ey = 360;

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

// Animations
let pAnim = 0, eAnim = 0;

// Enemy AI
let aiState = 'chase';

// Visual FX
let particles = [];
let damagePopups = [];

// Input
const keys = {};
let stickX = 0;

// Audio
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

// PARTICLES
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

// DAMAGE POPUPS
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

// UI HELPERS
function setLowHpClass(el, health) {
    const container = el.parentNode;
    if (health <= 40) {
        container.classList.add('low-hp');
    } else {
        container.classList.remove('low-hp');
    }
}

function updateHealthUI() {
    const pFill = document.getElementById('pHealth');
    const eFill = document.getElementById('eHealth');
    const pNum = document.querySelector('.player-hp');
    const eNum = document.querySelector('.enemy-hp');
    
    pFill.style.width = (pHealth / 2) + '%';
    eFill.style.width = (eHealth / 2) + '%';
    pNum.textContent = pHealth;
    eNum.textContent = eHealth;
    
    setLowHpClass(pFill, pHealth);
    setLowHpClass(eFill, eHealth);
}

// INPUT
document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

window.getStickX = () => stickX;

// MOBILE SETUP
function setupMobileControls() {
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isMobile) document.getElementById('mobileControls').classList.remove('hidden');

    const stickArea = document.getElementById('stickArea');
    let stickTouchId = null;

    stickArea.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (stickTouchId === null) stickTouchId = e.touches[0].identifier;
    }, { passive: false });

    stickArea.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let touch of e.touches) {
            if (touch.identifier === stickTouchId) {
                const rect = stickArea.getBoundingClientRect();
                const x = touch.clientX - (rect.left + rect.width / 2);
                stickX = Math.max(-1, Math.min(1, x / (rect.width / 2)));
                break;
            }
        }
    }, { passive: false });

    stickArea.addEventListener('touchend', (e) => {
        e.preventDefault();
        stickTouchId = null;
        stickX = 0;
    }, { passive: false });

    // Touch buttons
    ['btnJump', 'btnPunch', 'btnKick', 'btnUltra'].forEach((id, i) => {
        const btn = document.getElementById(id);
        if (btn) {
            const keyMap = ['w', 'f', 'g', 'q'][i];
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[keyMap] = true; });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[keyMap] = false; });
            btn.addEventListener('mousedown', () => keys[keyMap] = true);
            btn.addEventListener('mouseup', () => keys[keyMap] = false);
        }
    });
}

// GAME LOGIC
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
    pHealth = eHealth = 200;
    px = 80; ex = 820; py = ey = 360;
    combo = comboTimer = 0;
    timerSeconds = 60;
    pStun = eStun = pCooldown = eCooldown = 0;
    aiState = 'chase';
    particles = []; damagePopups = [];
    updateHealthUI();
    document.getElementById('timer').textContent = 'TIME: 60';
}

function update() {
    if (!gameOn) return;

    // Timers
    comboTimer = Math.max(0, comboTimer - 1);
    pCooldown = Math.max(0, pCooldown - 1);
    eCooldown = Math.max(0, eCooldown - 1);
    pStun = Math.max(0, pStun - 1);
    eStun = Math.max(0, eStun - 1);
    timerSeconds = Math.max(0, timerSeconds - 1/60);

    // Update timer display
    document.getElementById('timer').textContent = `TIME: ${Math.floor(timerSeconds)}`;

    // PLAYER MOVEMENT
    if (!pStun && keys['a']) px = Math.max(0, px - 3);
    if (!pStun && keys['d']) px = Math.min(900, px + 3);
    if (!pStun && keys['w'] && pJump === 0) { pJump = 14; playSound(400, 0.1); }

    // JUMP
    pJump = Math.max(0, pJump - 0.8);
    py = 360 - pJump * 8;

    // ENEMY AI (simple chase)
    if (!eStun) {
        if (ex > px + 60) ex -= 1.5;
        if (ex < px + 60) ex += 1;
        if (Math.random() < 0.02) eJump = 12;
    }
    eJump = Math.max(0, eJump - 0.8);
    ey = 360 - eJump * 8;

    // ATTACKS
    if (keys['f'] && pCooldown === 0) { // Punch
        if (Math.abs(px - ex) < 80) {
            eHealth -= 10;
            spawnHitSpark(ex, ey, '#ffff00');
            spawnDamagePopup(ex, ey - 20, 10, false);
            playSound(200, 0.1, 0.3);
            eStun = 30;
            combo++;
            comboTimer = 120;
        }
        pCooldown = 20;
        pAnim = 10;
    }

    if (keys['g'] && pCooldown === 0) { // Kick
        if (Math.abs(px - ex) < 100) {
            eHealth -= 15;
            spawnHitSpark(ex, ey, '#ff6600');
            spawnDamagePopup(ex, ey - 20, 15, false);
            playSound(180, 0.15, 0.4);
            eStun = 45;
            combo++;
            comboTimer = 120;
        }
        pCooldown = 30;
        pAnim = 15;
    }

    // Update health UI
    updateHealthUI();

    // Game over conditions
    if (timerSeconds <= 0 || pHealth <= 0 || eHealth <= 0) {
        gameOn = false;
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('result').textContent = 
            pHealth <= 0 ? 'DEFEAT!' :
            eHealth <= 0 ? 'KO VICTORY!' :
            pHealth > eHealth ? 'TIME VICTORY!' : 'TIME DRAW!';
    }

    // Update effects
    updateParticles();
    updateDamagePopups();
    pAnim = Math.max(0, pAnim - 1);
    eAnim = Math.max(0, eAnim - 1);
}

// RENDER FIGHTERS + EFFECTS
function render() {
    // Clear with shake
    ctx.save();
    if (shake > 0) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        shake--;
    }
    
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, 1000, 500);

    // GROUND
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(0, 380, 1000, 120);

    // PLAYER (RYU - Blue gi)
    ctx.fillStyle = pStun ? '#666' : '#4488ff';
    ctx.fillRect(px - 25, py - 60, 50, 80); // Body
    ctx.fillStyle = '#77aaff';
    ctx.fillRect(px - 15, py - 80, 30, 25); // Head
    ctx.fillStyle = pStun ? '#999' : '#ffffff';
    ctx.fillRect(px - 8, py - 75, 6, 8); // Eye
    ctx.fillRect(px + 2, py - 75, 6, 8);

    // Arms (punch anim)
    if (pAnim > 5) {
        ctx.fillStyle = '#3366cc';
        ctx.fillRect(px - 35, py - 40, 25, 15); // Punch arm
    } else {
        ctx.fillStyle = '#3366cc';
        ctx.fillRect(px - 20, py - 40, 15, 20); // Idle arm
    }

    // Legs (kick anim)
    if (pAnim > 8) {
        ctx.fillStyle = '#2244aa';
        ctx.fillRect(px - 15, py + 20, 12, 35); // Kick leg
        ctx.fillRect(px + 3, py + 20, 12, 25);  // Other leg
    } else {
        ctx.fillRect(px - 12, py + 20, 10, 30);
        ctx.fillRect(px + 2, py + 20, 10, 30);
    }

    // ENEMY (AKUMA - Red gi)
    ctx.fillStyle = eStun ? '#666' : '#cc4444';
    ctx.fillRect(ex - 25, ey - 60, 50, 80); // Body
    ctx.fillStyle = '#ff6666';
    ctx.fillRect(ex - 15, ey - 80, 30, 25); // Head
    ctx.fillStyle = eStun ? '#999' : '#ffaaaa';
    ctx.fillRect(ex - 8, ey - 75, 6, 8); // Eye
    ctx.fillRect(ex + 2, ey - 75, 6, 8);

    // Enemy arms/legs (mirror)
    ctx.fillStyle = '#aa3333';
    ctx.fillRect(ex + 5, ey - 40, 15, 20);
    ctx.fillRect(ex - 12, ey + 20, 10, 30);
    ctx.fillRect(ex + 2, ey + 20, 10, 30);

    // PARTICLES
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        ctx.restore();
    });

    // DAMAGE POPUPS
    damagePopups.forEach(popup => {
        ctx.save();
        ctx.globalAlpha = popup.life / 60;
        ctx.translate(popup.x, popup.y);
        ctx.scale(popup.scale, popup.scale);
        ctx.fillStyle = popup.color;
        ctx.font = 'bold 20px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(popup.damage, 0, 0);
        ctx.restore();
    });

    ctx.restore();
}

// GAME LOOP
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startBtn').addEventListener('click', startFight);
    document.getElementById('restartBtn').addEventListener('click', restartFight);
    setupMobileControls();
    gameLoop();
});

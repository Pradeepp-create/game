console.log('⚖️ PERFECT 50/50 BALANCE v4.1 — FULL FIGHTING GAME');

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// GAME STATE
let gameOn = false;

// Positions & Velocities
let px = 100, py = 360, pvx = 0, pvy = 0;
let ex = 800, ey = 360, evx = 0, evy = 0;

// Combat Stats
let pHealth = 200, eHealth = 200;
let pStamina = 100, eStamina = 100;
let combo = 0, comboTimer = 0;
let timerSeconds = 99;
let shakeAmount = 0;

// Status Effects
let pStun = 0, eStun = 0;
let pBlock = 0, eBlock = 0;
let pHitstun = 0, eHitstun = 0;
let pCooldowns = { punch: 0, kick: 0, special: 0, block: 0 };
let eCooldowns = { punch: 0, kick: 0, special: 0, block: 0 };
let dashCooldown = 0;

// Animations
let pAnimFrame = 0, eAnimFrame = 0;
let pFacingRight = false, eFacingRight = true;

// Visual FX
let particles = [];
let damagePopups = [];
let screenShakeFrames = 0;

// Inputs
const keys = {};
let stickX = 0, stickY = 0;

// CONSTANTS
const GROUND_Y = 360;
const MAX_SPEED = 5;
const JUMP_POWER = 14;
const FRICTION = 0.85;
const GRAVITY = 0.6;

// AUDIO
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, duration, type = 'square', vol = 0.2) {
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
}

// EFFECTS SYSTEM
function spawnParticles(x, y, count, color, velX = 0, velY = 0) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: velX + (Math.random() - 0.5) * 8,
            vy: velY + Math.random() * -6,
            life: 30 + Math.random() * 20,
            maxLife: 30 + Math.random() * 20,
            color: color || '#ffff88',
            size: Math.random() * 4 + 2
        });
    }
}

function spawnHitSpark(x, y, color = '#ffff00') {
    spawnParticles(x, y, 8, color, (Math.random() - 0.5) * 4, -2);
}

function spawnBlockSpark(x, y) {
    spawnParticles(x, y, 6, '#88aaff', 0, -3);
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.vx *= 0.96;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function spawnDamagePopup(x, y, dmg, isCrit = false) {
    damagePopups.push({
        x, y,
        text: isCrit ? 'CRIT ' + dmg : dmg.toString(),
        vy: -4,
        life: 90,
        color: isCrit ? '#ffaa00' : '#ff6666',
        scale: 1,
        isCrit
    });
}

function updateDamagePopups() {
    for (let i = damagePopups.length - 1; i >= 0; i--) {
        const popup = damagePopups[i];
        popup.y += popup.vy * 0.6;
        popup.vy *= 0.96;
        popup.life--;
        popup.scale = 1 + (popup.life / 90) * 0.3;
        if (popup.life <= 0) damagePopups.splice(i, 1);
    }
}

// UI UPDATE
function updateHealthUI() {
    const pFill = document.getElementById('pHealth');
    const eFill = document.getElementById('eHealth');
    const pNum = document.querySelector('.player-hp');
    const eNum = document.querySelector('.enemy-hp');
    
    pFill.style.width = Math.max(0, (pHealth / 200) * 100) + '%';
    eFill.style.width = Math.max(0, (eHealth / 200) * 100) + '%';
    pNum.textContent = Math.max(0, pHealth).toFixed(0);
    eNum.textContent = Math.max(0, eHealth).toFixed(0);
}

// INPUT HANDLING
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// MOBILE CONTROLS
function setupMobileControls() {
    const stickArea = document.getElementById('stickArea');
    let stickTouchId = null;

    stickArea.addEventListener('touchstart', e => {
        e.preventDefault();
        stickTouchId = e.changedTouches[0].identifier;
    }, {passive: false});

    stickArea.addEventListener('touchmove', e => {
        e.preventDefault();
        for (let touch of e.touches) {
            if (touch.identifier === stickTouchId) {
                const rect = stickArea.getBoundingClientRect();
                stickX = Math.max(-1, Math.min(1, (touch.clientX - rect.left - rect.width/2) / (rect.width/2)));
                stickY = Math.max(-1, Math.min(1, (touch.clientY - rect.top - rect.height/2) / (rect.height/2)));
                break;
            }
        }
    }, {passive: false});

    stickArea.addEventListener('touchend', e => {
        e.preventDefault();
        stickTouchId = null;
        stickX = stickY = 0;
    }, {passive: false});

    // Action buttons
    const btnMap = {btnJump: 'w', btnPunch: 'f', btnKick: 'g', btnUltra: 'q'};
    Object.entries(btnMap).forEach(([id, key]) => {
        const btn = document.getElementById(id);
        if (btn) {
            ['touchstart', 'mousedown'].forEach(ev => 
                btn.addEventListener(ev, e => {e.preventDefault(); keys[key] = true;})
            );
            ['touchend', 'mouseup'].forEach(ev => 
                btn.addEventListener(ev, e => {e.preventDefault(); keys[key] = false;})
            );
        }
    });
}

function playerAttack(type) {
    // Block spam + stun check
    if (pCooldowns[type] > 0 || pStun > 0 || pHitstun > 0) return;

    const attackData = {
        punch:   { dmg: 10, range: 65, stun: 20, cost: 8,  anim: 8,  sound: 220 },
        kick:    { dmg: 16, range: 85, stun: 30, cost: 12, anim: 12, sound: 180 },
        special: { dmg: 28, range: 95, stun: 50, cost: 30, anim: 20, sound: 150 }
    };

    const data = attackData[type];
    if (pStamina < data.cost) return;

    // Apply stamina + cooldown
    pStamina -= data.cost;
    pCooldowns[type] = data.anim * 2;
    pAnimFrame = data.anim;

    // Check distance
    const dist = Math.hypot(px - ex, py - ey);

    if (dist < data.range) {
        let finalDmg = data.dmg;

        // 🔥 HIT IMPACT FEEL
        screenShakeFrames = 6;

        // fake hit freeze (visual feel)
        for (let i = 0; i < 5; i++) {
            updateParticles();
        }

        // BLOCK SYSTEM
        if (eBlock > 0) {
            finalDmg *= 0.4;

            spawnBlockSpark(ex + (px > ex ? -20 : 20), ey - 30);
            playSound(300, 0.08, 'sine', 0.15);

            eBlock = Math.max(0, eBlock - 10);
        } 
        else {
            // COMBO SCALING
            if (combo > 3) finalDmg *= 1.2;

            eHealth -= finalDmg;
            eHitstun = data.stun;

            spawnHitSpark(ex, ey - 40, '#ffaa00');
            spawnDamagePopup(ex, ey - 50, Math.floor(finalDmg), finalDmg > 20);

            playSound(data.sound, 0.12, 'sawtooth', 0.3);

            combo++;
            comboTimer = 180;
        }
    }

    // Swing sound even if miss
    playSound(400, 0.08);
}

function enemyAI() {
    if (eStun > 0 || eHitstun > 0) return;

    const dist = Math.abs(px - ex);

    // FACE PLAYER
    if (px > ex) evx += 0.2;
    else evx -= 0.2;

    // KEEP DISTANCE SOMETIMES
    if (dist < 70) {
        evx += (px > ex ? -0.3 : 0.3);
    }

    // BLOCK SMARTLY
    if (dist < 90 && Math.random() < 0.4 && eCooldowns.block === 0) {
        eBlock = 40;
        eCooldowns.block = 40;
        return;
    }

    // ATTACK BASED ON DISTANCE
    if (dist < 80 && eCooldowns.punch === 0) {
        enemyAttack('punch');
    }
    else if (dist < 100 && eCooldowns.kick === 0) {
        enemyAttack('kick');
    }
    else if (dist < 110 && eStamina > 40 && eCooldowns.special === 0) {
        if (Math.random() < 0.3) enemyAttack('special');
    }
}

function enemyAttack(type) {
    const data = {
        punch: { dmg: 14, range: 70, stun: 28, cost: 10 },
        kick: { dmg: 20, range: 90, stun: 38, cost: 14 },
        special: { dmg: 40, range: 100, stun: 65, cost: 35 }
    };
    
    const d = data[type];
    if (eStamina < d.cost || eCooldowns[type] > 0) return;
    
    eStamina -= d.cost;
    eCooldowns[type] = d.stun * 1.5;
    eAnimFrame = d.stun / 2;
    
    const dist = Math.hypot(px - ex, py - ey);
    if (dist < d.range) {
        let finalDmg = d.dmg * (pBlock > 0 ? 0.5 : 1);
        if (pBlock > 0) {
            pBlock = Math.max(0, pBlock - 15);
            spawnBlockSpark(px + (ex > px ? -20 : 20), py - 30);
        } else {
            pHealth -= finalDmg;
            pHitstun = d.stun;
            spawnHitSpark(px, py - 40, '#ff4444');
            spawnDamagePopup(px, py - 50, finalDmg);
            screenShakeFrames = 10;
            playSound(160, 0.15, 'sawtooth', 0.35);
        }
    }
}

// MOVEMENT
function updateMovement() {
    // Player input
    let moveInput = stickX || (keys['d'] ? 1 : keys['a'] ? -1 : 0);
    pvx += moveInput * 0.5;
    // DASH (press Shift)
    if (keys['shift'] && dashCooldown === 0) {
        pvx += (pFacingRight ? 10 : -10);
        dashCooldown = 30;
    }
    
    if (keys['w'] || stickY < -0.5) {
        if (Math.abs(pvy) < 1) pvy = JUMP_POWER;
    }
    
    // Block input
    if (keys['s'] && pStamina > 5) {
        if (pCooldowns.block === 0) {
            pBlock = 40;
            pCooldowns.block = 25;
            pStamina -= 3;
        }
    }
    
    // Physics
    pvx *= FRICTION;
    pvy -= GRAVITY;
    px += pvx;
    py += pvy;
    
    // Ground collision
    if (py >= GROUND_Y) {
        py = GROUND_Y;
        pvy = 0;
    }
    
    px = Math.max(20, Math.min(950, px));
    
    // Face direction
    pFacingRight = pvx > 0;
    
    // Enemy physics (from AI)
    evx *= FRICTION;
    evy -= GRAVITY;
    ex += evx;
    ey += evy;
    if (ey >= GROUND_Y) {
        ey = GROUND_Y;
        evy = 0;
    }
    ex = Math.max(50, Math.min(920, ex));
    eFacingRight = evx > 0;
    
    // Regen stamina
    pStamina = Math.min(100, pStamina + 0.2);
    eStamina = Math.min(100, eStamina + 0.15);
}

// CORE UPDATE
function update() {
    if (!gameOn) return;
    dashCooldown = Math.max(0, dashCooldown - 1);
    
    // Decrement timers
    Object.keys(pCooldowns).forEach(k => pCooldowns[k] = Math.max(0, pCooldowns[k] - 1));
    Object.keys(eCooldowns).forEach(k => eCooldowns[k] = Math.max(0, eCooldowns[k] - 1));
    [pStun, eStun, pHitstun, eHitstun, pBlock, eBlock] = 
        [pStun, eStun, pHitstun, eHitstun, pBlock, eBlock].map(t => Math.max(0, t - 1));
    timerSeconds = Math.max(0, timerSeconds - 1/60);
    screenShakeFrames = Math.max(0, screenShakeFrames - 1);
    
    // Update UI
    document.getElementById('timer').textContent = `TIME: ${Math.floor(timerSeconds)}`;
    document.getElementById('combo').textContent = combo > 0 ? `COMBO x${combo}` : 'FIGHT!';
    updateHealthUI();
    
    // Game logic
    updateMovement();
    if (pHitstun === 0 && pStun === 0) {
        if (keys['f'] && pCooldowns.punch === 0) playerAttack('punch');
        if (keys['g'] && pCooldowns.kick === 0) playerAttack('kick');
        if (keys['q'] && pCooldowns.special === 0) playerAttack('special');
    }
    
    enemyAI();
    
    // Update effects
    updateParticles();
    updateDamagePopups();
    
    pAnimFrame = Math.max(0, pAnimFrame - 1);
    eAnimFrame = Math.max(0, eAnimFrame - 1);
    
    // Game Over
    if (timerSeconds <= 0 || pHealth <= 0 || eHealth <= 0) {
        gameOn = false;
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('hud').classList.add('hidden');
        const result = pHealth <= 0 ? 'DEFEAT!' : 
                      eHealth <= 0 ? 'PERFECT VICTORY!' : 
                      pHealth > eHealth ? 'TIME WIN!' : 'DRAW!';
        document.getElementById('result').textContent = result;
    }
    if (comboTimer > 0) {
        comboTimer--;
    } else {
        combo = 0;
    }
}

function renderFighter(x, y, healthPct, isPlayer, animFrame, facingRight, stunned, blocking) {
    ctx.save();
    ctx.translate(x, y);

    // Flip if facing left
    if (!facingRight) {
        ctx.scale(-1, 1);
    }

    // SHADOW
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(-20, 65, 40, 10);

    // COLOR STATES
    let bodyColor = isPlayer ? '#3b82f6' : '#ef4444';
    if (stunned) bodyColor = '#6b7280';
    if (blocking) bodyColor = '#60a5fa';

    // BODY
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-18, -50, 36, 60);

    // HEAD
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.arc(0, -65, 12, 0, Math.PI * 2);
    ctx.fill();

    // EYES
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-4, -67, 2, 0, Math.PI * 2);
    ctx.arc(4, -67, 2, 0, Math.PI * 2);
    ctx.fill();

    // ARMS (animated attack)
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 6;
    ctx.beginPath();

    if (animFrame > 5) {
        // attack arm forward
        ctx.moveTo(0, -35);
        ctx.lineTo(30, -30);
    } else {
        // idle arms
        ctx.moveTo(0, -35);
        ctx.lineTo(15, -25);
        ctx.moveTo(0, -35);
        ctx.lineTo(-15, -25);
    }

    ctx.stroke();

    // LEGS (simple animation)
    ctx.beginPath();
    if (animFrame > 8) {
        ctx.moveTo(0, 10);
        ctx.lineTo(15, 45); // kick leg
        ctx.moveTo(0, 10);
        ctx.lineTo(-10, 35);
    } else {
        ctx.moveTo(0, 10);
        ctx.lineTo(-10, 40);
        ctx.moveTo(0, 10);
        ctx.lineTo(10, 40);
    }
    ctx.stroke();

    // STUN EFFECT
    if (stunned > 0) {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(-15, -85, 4, 0, Math.PI * 2);
        ctx.arc(15, -85, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function render() {
    // Background + shake
    ctx.save();
    if (screenShakeFrames > 0) {
        ctx.translate(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
        );
    }
    
    // Arena
    const gradient = ctx.createLinearGradient(0, 0, 0, 500);
    gradient.addColorStop(0, '#0a0a1f');
    gradient.addColorStop(1, '#1a1a2f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1000, 500);
    
    // Ground
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(0, 380, 1000, 140);
    ctx.fillStyle = '#3a3a6a';
    ctx.fillRect(0, 385, 1000, 10);
    
    // Fighters
    renderFighter(px, py, pHealth/200, true, pAnimFrame, pFacingRight, pStun, pBlock);
    renderFighter(ex, ey, eHealth/200, false, eAnimFrame, eFacingRight, eStun, eBlock);
    
    // Particles
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        ctx.restore();
    });
    
    // Damage popups
    damagePopups.forEach(popup => {
        ctx.save();
        ctx.globalAlpha = popup.life / 90;
        ctx.translate(popup.x, popup.y);
        ctx.scale(popup.scale, popup.scale);
        ctx.fillStyle = popup.color;
        ctx.font = `bold ${popup.isCrit ? 24 : 20}px Courier New`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(popup.text, 0, 0);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(popup.text, 0, 0);
        ctx.restore();
    });
    
    ctx.restore();
}

// MAIN LOOP
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// GAME FUNCTIONS
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
    pStamina = eStamina = 100;
    px = 100; ex = 800;
    py = ey = GROUND_Y;
    combo = 0;
    timerSeconds = 99;
    particles = []; damagePopups = [];
    pStun = eStun = pHitstun = eHitstun = 0;
    Object.assign(pCooldowns, {punch:0, kick:0, special:0, block:0});
    Object.assign(eCooldowns, {punch:0, kick:0, special:0, block:0});
    updateHealthUI();
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startBtn').addEventListener('click', startFight);
    document.getElementById('restartBtn').addEventListener('click', restartFight);
    setupMobileControls();
    if (/Mobi|Android/i.test(navigator.userAgent)) {
        document.getElementById('mobileControls').classList.remove('hidden');
    }
    gameLoop();
});

console.log('🚀 PREMIUM FIGHT NIGHT v2.0!');

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Game state
let gameOn = false;
let px = 50, py = 320, ex = 780, ey = 320;
let pHealth = 100, eHealth = 100;
let combo = 0, comboTimer = 0;
let shake = 0;
let pJump = 0, eJump = 0;
let pCooldown = 0, eCooldown = 0;
let particles = [];

// Sounds (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playPunch() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 200;
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function playSpecial() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 400;
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

// Particles
function addParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12 - 2,
            life: 30,
            color
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// Input
const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

function startFight() {
    console.log('🎮 PREMIUM START!');
    gameOn = true;
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('ui').classList.remove('hidden');
    resetGame();
}

function restartFight() {
    document.getElementById('gameOver').classList.add('hidden');
    startFight();
}

function resetGame() {
    pHealth = 100; eHealth = 100;
    px = 50; ex = 780;
    py = ey = 320; pJump = eJump = 0;
    combo = 0; particles = [];
    pCooldown = 0;
}

function update() {
    if (!gameOn) return;
    
    comboTimer = Math.max(0, comboTimer - 1);
    pCooldown = Math.max(0, pCooldown - 1);
    
    // PLAYER MOVEMENT + JUMP PHYSICS
    if (keys['ArrowLeft']) px -= 6;
    if (keys['ArrowRight']) px += 6;
    if (keys['ArrowUp'] && pJump === 0) {
        pJump = -16;
        py += pJump;
    }
    if (pJump < 0) {
        pJump += 1;
        py += pJump;
    } else {
        pJump = 0;
        py = 320;
    }
    
    px = Math.max(0, Math.min(850, px));
    
    // ENEMY AI + JUMP
    const dist = ex - px;
    if (Math.abs(dist) > 100) ex -= Math.sign(dist) * 3;
    else if (Math.random() < 0.01) eJump = -14;
    
    if (eJump < 0) {
        eJump += 1;
        ey += eJump;
    } else {
        eJump = 0;
        ey = 320;
    }
    
    // PLAYER ATTACKS w/ COOLDOWN
    if (keys['f'] && pCooldown <= 0 && Math.abs(px - ex) < 90) {
        eHealth -= 18;
        combo++;
        shake = 12;
        pCooldown = 15;
        playPunch();
        addParticles(ex + 25, ey + 40, '#44aaff');
        keys['f'] = false;
    }
    if (keys['g'] && pCooldown <= 0 && Math.abs(px - ex) < 90) {
        eHealth -= 28;
        combo += 2;
        shake = 18;
        pCooldown = 25;
        playPunch();
        addParticles(ex + 25, ey + 40, '#ffff44');
        keys['g'] = false;
    }
    if (keys['q'] && pCooldown <= 0 && Math.abs(px - ex) < 110) {
        eHealth -= 45;
        combo += 4;
        shake = 25;
        pCooldown = 60;
        playSpecial();
        addParticles(ex + 25, ey + 20, '#ff44ff');
        keys['q'] = false;
    }
    
    // ENEMY ATTACKS
    if (Math.abs(px - ex) < 80 && Math.random() < 0.015) {
        pHealth -= 16;
        shake = 12;
        playPunch();
        addParticles(px + 25, py + 40, '#ff4444');
    }
    
    // UI
    document.getElementById('pHealth').style.width = Math.max(0, pHealth) + '%';
    document.getElementById('eHealth').style.width = Math.max(0, eHealth) + '%';
    document.getElementById('combo').textContent = 
        comboTimer > 0 ? `${combo} COMBO!` : 'FIGHT!';
    
    updateParticles();
    
    // GAME OVER
    if (pHealth <= 0 || eHealth <= 0) {
        document.getElementById('result').textContent = 
            pHealth > 0 ? '🏆 VICTORY!' : '💀 DEFEAT';
        document.getElementById('gameOver').classList.remove('hidden');
        gameOn = false;
    }
}

function draw() {
    ctx.clearRect(0, 0, 900, 450);
    
    // BACKGROUND
    const grad = ctx.createLinearGradient(0,0,0,450);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(0.7, '#16213e');
    grad.addColorStop(1, '#0f3460');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,900,450);
    
    // GROUND + DETAILS
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0,380,900,70);
    ctx.fillStyle = '#3d7b37';
    ctx.fillRect(0,385,900,10);
    
    // SHAKE + SPECIAL FLASH
    ctx.save();
    if (shake > 0) {
        ctx.translate(Math.random()*12, Math.random()*8);
        shake--;
    }
    
    // PARTICLES
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x, p.y, 6, 6);
        ctx.restore();
    });
    
    // PLAYER (ANIMATED)
    ctx.fillStyle = pHealth > 0 ? '#44aaff' : '#666';
    ctx.shadowBlur = pCooldown > 30 ? 30 : 20;
    ctx.shadowColor = '#44aaff';
    ctx.fillRect(px, py, 50, 80);
    
    // Attack glow
    if (pCooldown > 0) {
        ctx.shadowColor = '#ffff88';
        ctx.shadowBlur = 40;
        ctx.fillRect(px + (keys['ArrowRight'] ? 45 : -20), py + 25, 25, 25);
    }
    
    // ENEMY (ANIMATED)
    ctx.fillStyle = eHealth > 0 ? '#ff4444' : '#666';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff4444';
    ctx.fillRect(ex, ey, 50, 80);
    
    ctx.restore();
}

// 60FPS LOOP
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
console.log('✅ PREMIUM FEATURES: Jump/Sounds/Particles/Cooldowns!');

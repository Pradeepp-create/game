console.log('⚖️ BALANCED FIGHT NIGHT v3.0');

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// STATE
let gameOn = false;
let px = 80, py = 360, ex = 820, ey = 360;
let pHealth = 100, eHealth = 100;
let combo = 0, comboTimer = 0;
let shake = 0;
let pJump = 0, eJump = 0;
let pCooldown = 0;
let particles = [];
let enemyAggro = 0; // Balanced aggro

// Audio
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(freq, duration) {
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
}

// Particles (simplified)
function spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random()-0.5)*10,
            vy: Math.random()*-8,
            life: 25,
            color
        });
    }
}

function updateParticles() {
    for (let i = particles.length-1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life--;
        p.vx *= 0.97;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// Input
const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

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
    pHealth = eHealth = 100;
    px = 80; ex = 820;
    py = ey = 360;
    combo = enemyAggro = 0;
    particles = []; pCooldown = 0;
}

function update() {
    if (!gameOn) return;
    
    comboTimer = Math.max(0, comboTimer - 1);
    pCooldown = Math.max(0, pCooldown - 1);
    
    // PLAYER - SMOOTH CONTROLS
    const speed = 6;
    if (keys['ArrowLeft'] || keys['a']) px -= speed;
    if (keys['ArrowRight'] || keys['d']) px += speed;
    if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && Math.abs(pJump) < 0.1) {
        pJump = -16;
    }
    
    pJump += 1;
    py += pJump;
    if (py >= 360) {
        py = 360;
        pJump = 0;
    }
    
    px = Math.max(10, Math.min(930, px));
    
    // BALANCED ENEMY AI
    const dist = Math.abs(ex - px);
    const baseSpeed = 4;
    
    // Chase (not too fast)
    if (dist > 85) {
        ex += (px > ex ? 1 : -1) * baseSpeed;
    }
    
    // Jump less often
    if (Math.random() < 0.008 && Math.abs(eJump) < 0.1) {
        eJump = -14;
    }
    
    eJump += 1;
    ey += eJump;
    if (ey >= 360) {
        ey = 360;
        eJump = 0;
    }
    
    ex = Math.max(10, Math.min(930, ex));
    
    // PLAYER ATTACKS (EASIER HITS)
    const hitRange = 85;
    if (keys['f'] && pCooldown <= 0 && dist < hitRange) {
        eHealth -= 18;
        combo++;
        comboTimer = 90;
        shake = 8;
        spawnParticles(ex + 20, ey + 35, 8, '#44aaff');
        playSound(220, 0.12);
        pCooldown = 12;
        keys['f'] = false;
    }
    if (keys['g'] && pCooldown <= 0 && dist < hitRange) {
        eHealth -= 25;
        combo += 2;
        comboTimer = 120;
        shake = 12;
        spawnParticles(ex + 20, ey + 35, 12, '#ffff44');
        playSound(260, 0.15);
        pCooldown = 18;
        keys['g'] = false;
    }
    if (keys['q'] && pCooldown <= 0 && dist < hitRange + 20) {
        eHealth -= 40;
        combo += 4;
        comboTimer = 180;
        shake = 20;
        enemyAggro += 10;
        spawnParticles(ex + 20, ey + 20, 20, '#ff44ff');
        playSound(400, 0.3);
        pCooldown = 80;
        keys['q'] = false;
    }
    
    // ENEMY ATTACKS (FAIR DAMAGE)
    if (dist < 75 && Math.random() < 0.025) {
        pHealth -= 14;
        shake = 8;
        spawnParticles(px + 25, py + 35, 8, '#ff4444');
        playSound(180, 0.12);
    }
    
    // UI
    document.getElementById('pHealth').style.width = Math.max(0, pHealth) + '%';
    document.getElementById('eHealth').style.width = Math.max(0, eHealth) + '%';
    document.getElementById('combo').textContent = 
        comboTimer > 0 ? `${combo} COMBO!` : 'FIGHT ON';
    
    updateParticles();
    
    // GAME OVER
    if (pHealth <= 0 || eHealth <= 0) {
        document.getElementById('result').textContent = 
            pHealth > 0 ? 'VICTORY!' : 'DEFEAT';
        document.getElementById('gameOver').classList.remove('hidden');
        gameOn = false;
    }
}

function draw() {
    ctx.clearRect(0, 0, 1000, 500);
    
    // CLEAN BACKGROUND
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, 1000, 500);
    
    // ARENA GRADIENT
    const arenaGrad = ctx.createLinearGradient(0, 400, 0, 500);
    arenaGrad.addColorStop(0, '#1a472a');
    arenaGrad.addColorStop(1, '#0f2a17');
    ctx.fillStyle = arenaGrad;
    ctx.fillRect(0, 400, 1000, 100);
    
    // FLOOR LINES
    ctx.strokeStyle = '#2a5a37';
    ctx.lineWidth = 3;
    for (let x = 0; x < 1000; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 410);
        ctx.lineTo(x + 40, 410);
        ctx.stroke();
    }
    
    ctx.save();
    
    // SHAKE (SMOOTH)
    if (shake > 0) {
        ctx.translate(
            Math.sin(Date.now() * 0.02) * Math.min(shake, 8),
            Math.sin(Date.now() * 0.025) * Math.min(shake * 0.6, 5)
        );
        shake--;
    }
    
    // PARTICLES (CLEAN)
    ctx.shadowBlur = 12;
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life / 25;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x-3, p.y-3, 6, 6);
        ctx.restore();
    });
    
    // PLAYER (CLEAN SPRITE)
    ctx.shadowColor = '#44aaff';
    ctx.shadowBlur = 18;
    
    // Head
    ctx.fillStyle = '#44aaff';
    ctx.fillRect(px + 12, py - 8, 26, 28);
    
    // Body
    ctx.fillStyle = '#0066cc';
    ctx.fillRect(px + 8, py + 20, 34, 45);
    
    // Legs (dynamic)
    ctx.fillStyle = '#0044aa';
    ctx.fillRect(px + 10, py + 65, 12, py < 360 ? 20 : 25);
    ctx.fillRect(px + 28, py + 65, 12, py < 360 ? 20 : 25);
    
    // ENEMY (CLEAN SPRITE)
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 18;
    
    // Head
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(ex + 12, ey - 8, 26, 28);
    
    // Body
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(ex + 8, ey + 20, 34, 45);
    
    // Legs
    ctx.fillStyle = '#aa0000';
    ctx.fillRect(ex + 10, ey + 65, 12, ey < 360 ? 20 : 25);
    ctx.fillRect(ex + 28, ey + 65, 12, ey < 360 ? 20 : 25);
    
    ctx.restore();
}

// LOOP
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
console.log('✅ BALANCED + CLEAN v3.0 | Fair fights!');

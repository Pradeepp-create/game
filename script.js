console.log('🔥 FIGHT NIGHT PRO - BEAST MODE!');

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
let enemyRage = 0; // Beast mode meter

// Audio
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(freq, duration, type = 'punch') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(type === 'special' ? 0.5 : 0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Particles
function spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y, vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15 - 3,
            life: 40, maxLife: 40, color,
            size: Math.random()*4 + 2
        });
    }
}

function updateParticles() {
    for (let i = particles.length-1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.4;
        p.life--;
        p.vx *= 0.98;
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
    combo = enemyRage = 0;
    particles = [];
    pCooldown = 0;
}

function update() {
    if (!gameOn) return;
    
    comboTimer = Math.max(0, comboTimer - 1);
    pCooldown = Math.max(0, pCooldown - 1);
    
    // PLAYER CONTROLS
    let moveSpeed = 7;
    if (keys['ArrowLeft'] || keys['a']) px -= moveSpeed;
    if (keys['ArrowRight'] || keys['d']) px += moveSpeed;
    if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && pJump === 0) {
        pJump = -18;
    }
    
    // Jump physics
    if (pJump !== 0) {
        pJump += 1.1;
        py += pJump;
        if (pJump > 0 && py >= 360) {
            py = 360;
            pJump = 0;
        }
    }
    
    px = Math.max(0, Math.min(930, px));
    
    // BEAST ENEMY AI
    const dist = ex - px;
    let enemySpeed = 5 + enemyRage * 0.3; // Rages faster
    
    // Perfect chase
    if (Math.abs(dist) > 90) {
        ex -= Math.sign(dist) * enemySpeed;
    } else {
        // PERFECT BLOCK + COUNTER
        if (pCooldown > 0 && Math.random() < 0.4) {
            // Enemy blocks
            combo = 0;
        } else if (Math.random() < 0.08 + enemyRage * 0.02) {
            // DEADLY COUNTER
            pHealth -= 25 + enemyRage * 2;
            shake = 20;
            spawnParticles(px + 25, py + 40, 12, '#ff4444');
            playSound(180, 0.15);
        }
    }
    
    // Enemy jumps aggressively
    if (Math.random() < 0.02 + enemyRage * 0.005 && eJump === 0) {
        eJump = -16;
    }
    if (eJump !== 0) {
        eJump += 1;
        ey += eJump;
        if (eJump > 0 && ey >= 360) {
            ey = 360;
            eJump = 0;
        }
    }
    
    ex = Math.max(0, Math.min(930, ex));
    
    // PLAYER ATTACKS (Harder to land)
    const attackDist = 75 + Math.abs(pJump) * 2; // Jump extends range
    if (keys['f'] && pCooldown <= 0 && Math.abs(px - ex) < attackDist) {
        eHealth -= 16;
        combo++;
        shake = 10;
        pCooldown = 20;
        spawnParticles(ex + 25, ey + 40, 10, '#44aaff');
        playSound(220, 0.12);
        keys['f'] = false;
    }
    if (keys['g'] && pCooldown <= 0 && Math.abs(px - ex) < attackDist) {
        eHealth -= 26;
        combo += 2;
        shake = 16;
        pCooldown = 30;
        spawnParticles(ex + 25, ey + 40, 15, '#ffff44');
        playSound(250, 0.18);
        keys['g'] = false;
    }
    if (keys['q'] && pCooldown <= 0 && Math.abs(px - ex) < attackDist + 30) {
        eHealth -= 42;
        combo += 5;
        shake = 30;
        enemyRage += 15; // Enrage enemy!
        pCooldown = 90;
        spawnParticles(ex + 25, ey + 20, 25, '#ff44ff');
        playSound(450, 0.4, 'special');
        keys['q'] = false;
    }
    
    // Enemy rages when low HP
    enemyRage = Math.min(50, enemyRage + 0.1);
    if (eHealth < 30) enemyRage = 50;
    
    // UI
    document.getElementById('pHealth').style.width = Math.max(0, pHealth) + '%';
    document.getElementById('eHealth').style.width = Math.max(0, eHealth) + '%';
    document.getElementById('combo').textContent = 
        comboTimer > 0 ? `${combo} COMBO!` : 'ATTACK!';
    
    updateParticles();
    
    // WIN/LOSE
    if (pHealth <= 0 || eHealth <= 0) {
        document.getElementById('result').textContent = 
            pHealth > 0 ? '🏆 RYU WINS!' : '💀 AKUMA DOMINATES';
        document.getElementById('gameOver').classList.remove('hidden');
        gameOn = false;
    }
}

function draw() {
    ctx.clearRect(0, 0, 1000, 500);
    
    // EPIC BACKGROUND
    const bgGrad = ctx.createRadialGradient(500, 250, 0, 500, 250, 600);
    bgGrad.addColorStop(0, '#1a0033');
    bgGrad.addColorStop(0.3, '#2d004d');
    bgGrad.addColorStop(0.7, '#0a001a');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,1000,500);
    
    // ARENA FLOOR
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0,400,1000,100);
    ctx.fillStyle = '#333';
    for (let i = 0; i < 1000; i += 50) {
        ctx.fillRect(i, 410, 40, 8);
    }
    
    ctx.save();
    if (shake > 0) {
        ctx.translate(
            Math.sin(Date.now() * 0.02) * shake,
            Math.sin(Date.now() * 0.03) * (shake * 0.6)
        );
    }
    
    // PARTICLES (GLOWING)
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        ctx.restore();
    });
    
    // RYU (PLAYER) - SPRITE STYLE
    ctx.save();
    ctx.shadowBlur = pCooldown > 45 ? 40 : 25;
    ctx.shadowColor = '#44aaff';
    
    // Head
    ctx.fillStyle = '#44aaff';
    ctx.fillRect(px + 15, py - 10, 20, 25);
    
    // Body
    ctx.fillStyle = pHealth > 30 ? '#0066cc' : '#444';
    ctx.fillRect(px + 8, py + 15, 34, 50);
    
    // Legs
    ctx.fillStyle = '#004499';
    ctx.fillRect(px + 10, py + 65, 12, 25);
    ctx.fillRect(px + 28, py + 65, 12, 25);
    
    // Arms (attack pose)
    if (pCooldown > 0) {
        ctx.fillStyle = '#44aaff';
        ctx.fillRect(px + 42, py + 20, 25, 15);
    }
    ctx.restore();
    
    // AKUMA (ENEMY) - BEAST MODE
    ctx.save();
    ctx.shadowBlur = 30 + enemyRage;
    ctx.shadowColor = enemyRage > 30 ? '#ff0000' : '#ff4444';
    
    // Head (glowing eyes when raged)
    ctx.fillStyle = enemyRage > 30 ? '#ff0000' : '#cc0000';
    ctx.fillRect(ex + 15, ey - 10, 20, 25);
    
    // Body (muscular)
    ctx.fillStyle = '#990000';
    ctx.fillRect(ex + 5, ey + 15, 40, 55);
    
    // Horns (demon style)
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(ex + 18, ey - 25, 4, 15);
    ctx.fillRect(ex + 28, ey - 25, 4, 15);
    
    // Legs
    ctx.fillStyle = '#660000';
    ctx.fillRect(ex + 8, ey + 70, 15, 30);
    ctx.fillRect(ex + 27, ey + 70, 15, 30);
    
    ctx.restore();
    
    ctx.restore();
}

// 60FPS
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
console.log('💀 BEAST AKUMA ACTIVE | Neon graphics ON!');

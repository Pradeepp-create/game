console.log('⚖️ PERFECT 50/50 BALANCE v4.0 + UI');

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// STATE - DOUBLE HP
let gameOn = false;
let px = 80, py = 360, ex = 820, ey = 360;
let pHealth = 200, eHealth = 200;
let combo = 0, comboTimer = 0;
let shake = 0;
let pJump = 0, eJump = 0;
let pCooldown = 0, eCooldown = 0;
let particles = [];
let pStun = 0, eStun = 0;
let aiState = 'chase';
let damagePopups = []; // NEW: Damage numbers

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
    } catch(e) {}
}

// Particles
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

// Damage Popups
function spawnDamagePopup(x, y, damage, isPlayer) {
    damagePopups.push({
        x, y,
        damage: '-' + damage,
        vy: -3,
        life: 60,
        color: isPlayer ? '#ff4444' : '#44aaff',
        scale: 1
    });
}

function updateParticles() {
    for (let i = particles.length-1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life--;
        p.vx *= 0.97;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function updateDamagePopups() {
    for (let i = damagePopups.length-1; i >= 0; i--) {
        const popup = damagePopups[i];
        popup.y += popup.vy;
        popup.vy += 0.1;
        popup.life--;
        popup.scale += 0.02;
        if (popup.life <= 0) damagePopups.splice(i, 1);
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
    pHealth = eHealth = 200;
    px = 80; ex = 820;
    py = ey = 360;
    combo = 0;
    pStun = eStun = 0;
    aiState = 'chase';
    particles = [];
    damagePopups = [];
    pCooldown = eCooldown = 0;
    
    // RESET HEALTH BARS
    document.getElementById('pHealth').style.width = '100%';
    document.getElementById('eHealth').style.width = '100%';
    document.querySelector('.player-hp').textContent = '200';
    document.querySelector('.enemy-hp').textContent = '200';
}

function update() {
    if (!gameOn) return;
    
    comboTimer = Math.max(0, comboTimer - 1);
    pCooldown = Math.max(0, pCooldown - 1);
    eCooldown = Math.max(0, eCooldown - 1);
    pStun = Math.max(0, pStun - 1);
    eStun = Math.max(0, eStun - 1);
    
    // PLAYER CONTROLS
    if (pStun <= 0) {
        const speed = 6;
        if (keys['ArrowLeft'] || keys['a']) px -= speed;
        if (keys['ArrowRight'] || keys['d']) px += speed;
        if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && Math.abs(pJump) < 0.1) {
            pJump = -16;
        }
    }
    
    pJump += 1;
    py += pJump;
    if (py >= 360) {
        py = 360;
        pJump = 0;
    }
    
    px = Math.max(10, Math.min(930, px));
    
    // SMART ENEMY AI
    const dist = Math.abs(ex - px);
    
    if (eStun > 0) {
        aiState = 'stun';
    } else if (dist > 100) {
        aiState = 'chase';
    } else if (pCooldown > 0) {
        aiState = 'block';
    } else {
        aiState = 'attack';
    }
    
    if (aiState === 'chase') {
        ex += (px > ex ? 1 : -1) * 4.5;
    }
    
    if (eCooldown <= 0 && aiState === 'attack' && dist < 80) {
        eCooldown = 25;
        pHealth -= 15;
        spawnDamagePopup(px + 25, py + 20, 15, true);
        shake = 8;
        spawnParticles(px + 25, py + 35, 8, '#ff4444');
        playSound(190, 0.12);
        pStun = 10;
    }
    
    if (eCooldown <= 0 && aiState === 'block' && Math.random() < 0.3) {
        eCooldown = 15;
    }
    
    if (Math.random() < 0.007 && Math.abs(eJump) < 0.1) {
        eJump = -14;
    }
    
    eJump += 1;
    ey += eJump;
    if (ey >= 360) {
        ey = 360;
        eJump = 0;
    }
    
    ex = Math.max(10, Math.min(930, ex));
    
    // PLAYER ATTACKS
    const hitRange = 82;
    if (keys['f'] && pCooldown <= 0 && pStun <= 0 && dist < hitRange) {
        if (Math.random() < 0.7 || aiState !== 'block') {
            eHealth -= 16;
            spawnDamagePopup(ex + 25, ey + 20, 16, false);
            combo++;
            comboTimer = 90;
            shake = 8;
            eStun = 8;
            spawnParticles(ex + 20, ey + 35, 8, '#44aaff');
            playSound(220, 0.12);
        }
        pCooldown = 12;
        keys['f'] = false;
    }
    
    if (keys['g'] && pCooldown <= 0 && pStun <= 0 && dist < hitRange) {
        if (Math.random() < 0.85) {
            eHealth -= 24;
            spawnDamagePopup(ex + 25, ey + 20, 24, false);
            combo += 2;
            comboTimer = 120;
            shake = 12;
            eStun = 12;
            spawnParticles(ex + 20, ey + 35, 12, '#ffff44');
            playSound(260, 0.15);
        }
        pCooldown = 18;
        keys['g'] = false;
    }
    
    if (keys['q'] && pCooldown <= 0 && pStun <= 0 && dist < hitRange + 25) {
        eHealth -= 38;
        spawnDamagePopup(ex + 25, ey + 20, 38, false);
        combo += 4;
        comboTimer = 180;
        shake = 18;
        eStun = 25;
        spawnParticles(ex + 20, ey + 20, 20, '#ff44ff');
        playSound(420, 0.3);
        pCooldown = 75;
        keys['q'] = false;
    }
    
    // PERFECT UI UPDATE
    document.getElementById('pHealth').style.width = Math.max(0, pHealth) + '%';
    document.getElementById('eHealth').style.width = Math.max(0, eHealth) + '%';
    
    // LIVE HP NUMBERS
    const pHpEl = document.querySelector('.player-hp');
    const eHpEl = document.querySelector('.enemy-hp');
    if (pHpEl) pHpEl.textContent = Math.max(0, Math.round(pHealth));
    if (eHpEl) eHpEl.textContent = Math.max(0, Math.round(eHealth));
    
    document.getElementById('combo').textContent = 
        comboTimer > 0 ? `${combo} COMBO!` : 'PERFECT FIGHT';
    
    updateParticles();
    updateDamagePopups();
    
    // WIN/LOSE
    if (pHealth <= 0 || eHealth <= 0) {
        document.getElementById('result').textContent = 
            pHealth > 0 ? 'PERFECT VICTORY!' : 'NARROW DEFEAT';
        document.getElementById('gameOver').classList.remove('hidden');
        gameOn = false;
    }
}

function draw() {
    ctx.clearRect(0, 0, 1000, 500);
    
    // Stadium background
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, 1000, 500);
    
    // Crowd lights
    ctx.fillStyle = 'rgba(0, 255, 136, 0.1)';
    for (let i = 0; i < 20; i++) {
        ctx.fillRect(i * 50, 50, 30, 30);
    }
    
    // Arena floor
    const floorGrad = ctx.createLinearGradient(0, 400, 0, 500);
    floorGrad.addColorStop(0, '#1e4a2e');
    floorGrad.addColorStop(1, '#112a1a');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 400, 1000, 100);
    
    // Floor pattern
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    for (let x = 0; x < 1000; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 420);
        ctx.lineTo(x + 60, 420);
        ctx.stroke();
    }
    
    ctx.save();
    if (shake > 0) {
        ctx.translate(
            Math.sin(Date.now() * 0.015) * Math.min(shake, 6),
            Math.sin(Date.now() * 0.02) * Math.min(shake * 0.5, 4)
        );
        shake--;
    }
    
    // PARTICLES
    ctx.shadowBlur = 10;
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life / 25;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x-2, p.y-2, 4, 4);
        ctx.restore();
    });
    
    // DAMAGE POPUPS
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    damagePopups.forEach(popup => {
        ctx.save();
        ctx.globalAlpha = popup.life / 60;
        ctx.shadowBlur = 15;
        ctx.shadowColor = popup.color;
        ctx.fillStyle = popup.color;
        ctx.font = `bold ${18 * popup.scale}px Arial`;
        ctx.fillText(popup.damage, popup.x, popup.y);
        ctx.restore();
    });
    
    // PLAYER SPRITE
    ctx.shadowColor = '#44aaff';
    ctx.shadowBlur = pStun > 0 ? 5 : 15;
    
    ctx.fillStyle = pStun > 0 ? '#888' : '#44aaff';
    ctx.fillRect(px + 12, py - 8, 26, 28); // Head
    
    ctx.fillStyle = pStun > 0 ? '#666' : '#0066cc';
    ctx.fillRect(px + 8, py + 20, 34, 45); // Body
    
    ctx.fillStyle = pStun > 0 ? '#555' : '#0044aa';
    ctx.fillRect(px + 10, py + 65, 12, py < 360 ? 20 : 25);
    ctx.fillRect(px + 28, py + 65, 12, py < 360 ? 20 : 25);
    
    // ENEMY SPRITE
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = eStun > 0 ? 5 : 15;
    
    ctx.fillStyle = eStun > 0 ? '#888' : '#ff4444';
    ctx.fillRect(ex + 12, ey - 8, 26, 28);
    
    ctx.fillStyle = eStun > 0 ? '#666' : '#cc0000';
    ctx.fillRect(ex + 8, ey + 20, 34, 45);
    
    ctx.fillStyle = eStun > 0 ? '#555' : '#aa0000';
    ctx.fillRect(ex + 10, ey + 65, 12, ey < 360 ? 20 : 25);
    ctx.fillRect(ex + 28, ey + 65, 12, ey < 360 ? 20 : 25);
    
    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
console.log('✅ PERFECT UI + DAMAGE POPUPS + 200HP!');

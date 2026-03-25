console.log('🚀 FIGHT GAME JS LOADED!');

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let gameOn = false;
let px = 50, py = 320, ex = 780, ey = 320;
let pHealth = 100, eHealth = 100;
let combo = 0;
let shake = 0;

const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

function startFight() {
    console.log('🎮 START BUTTON WORKS!');
    gameOn = true;
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('ui').classList.remove('hidden');
    pHealth = 100;
    eHealth = 100;
    px = 50;
    ex = 780;
    combo = 0;
}

function restartFight() {
    document.getElementById('gameOver').classList.add('hidden');
    startFight();
}

function update() {
    if (!gameOn) return;
    
    // Player controls
    if (keys['ArrowLeft']) px -= 6;
    if (keys['ArrowRight']) px += 6;
    if (keys['ArrowUp'] && py === 320) py -= 80;
    
    px = Math.max(0, Math.min(850, px));
    if (py < 320) py += 4;
    
    // Enemy AI
    if (ex > px + 100) ex -= 3;
    if (ex < px + 50) ex += 2;
    
    // PLAYER ATTACKS
    if (keys['f'] && Math.abs(px - ex) < 80) {
        eHealth -= 20;
        combo++;
        shake = 10;
        keys['f'] = false; // Prevent spam
    }
    if (keys['g'] && Math.abs(px - ex) < 80) {
        eHealth -= 30;
        combo += 2;
        shake = 15;
        keys['g'] = false;
    }
    
    // ENEMY ATTACKS
    if (Math.abs(px - ex) < 70 && Math.random() < 0.02) {
        pHealth -= 15;
        shake = 10;
    }
    
    // UI UPDATE
    document.getElementById('pHealth').style.width = Math.max(0, pHealth) + '%';
    document.getElementById('eHealth').style.width = Math.max(0, eHealth) + '%';
    document.getElementById('combo').textContent = combo + ' HITS!';
    
    // GAME OVER
    if (pHealth <= 0) {
        document.getElementById('result').textContent = '💀 YOU LOSE';
        document.getElementById('gameOver').classList.remove('hidden');
        gameOn = false;
    }
    if (eHealth <= 0) {
        document.getElementById('result').textContent = '🏆 VICTORY!';
        document.getElementById('gameOver').classList.remove('hidden');
        gameOn = false;
    }
}

function draw() {
    ctx.clearRect(0, 0, 900, 450);
    
    // Sky gradient
    const grad = ctx.createLinearGradient(0,0,0,450);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#16213e');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,900,450);
    
    // Ground
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0,380,900,70);
    
    // SHAKE EFFECT
    ctx.save();
    if (shake > 0) {
        ctx.translate(Math.random()*10, Math.random()*5);
        shake--;
    }
    
    // PLAYER (BLUE BOX)
    ctx.fillStyle = pHealth > 0 ? '#44aaff' : '#666';
    ctx.shadowColor = '#44aaff';
    ctx.shadowBlur = 20;
    ctx.fillRect(px, py, 50, 80);
    
    // ENEMY (RED BOX)
    ctx.fillStyle = eHealth > 0 ? '#ff4444' : '#666';
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 20;
    ctx.fillRect(ex, ey, 50, 80);
    
    ctx.restore();
}

// GAME LOOP 60FPS
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
console.log('✅ Engine running! Click START → Arrows + F!');

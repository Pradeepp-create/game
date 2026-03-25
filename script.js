console.log('🚀 FIGHT GAME LOADED!');

// Get elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const playBtn = document.getElementById('playBtn');
const restartBtn = document.getElementById('restartBtn');
const diffSelect = document.getElementById('diffSelect');
const playerHealthEl = document.getElementById('playerHealth');
const enemyHealthEl = document.getElementById('enemyHealth');
const comboDisplay = document.getElementById('comboDisplay');

// Game state
let gameRunning = false;
let difficulty = 2;
let shakeTimer = 0;
let comboHits = 0;
let comboTime = 0;

// Player object
const player = {
    x: 100, y: 350,
    width: 50, height: 100,
    vx: 0, vy: 0,
    speed: 5, jumpPower: -15,
    health: 100,
    maxHealth: 100,
    facing: 1,
    attacking: false,
    attackTimer: 0
};

// Enemy object
const enemy = {
    x: 800, y: 350,
    width: 50, height: 100,
    vx: 0, vy: 0,
    speed: 3, jumpPower: -13,
    health: 100,
    maxHealth: 100,
    facing: -1,
    attacking: false,
    attackTimer: 0,
    aiTimer: 0
};

// Input
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});
document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Event listeners
playBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);
diffSelect.addEventListener('change', () => difficulty = parseInt(diffSelect.value));

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Attack hit detection
function playerAttack() {
    const attackBox = {
        x: player.facing > 0 ? player.x + player.width : player.x - 60,
        y: player.y + 20,
        width: 60,
        height: 60
    };
    return checkCollision(attackBox, enemy);
}

function enemyAttack() {
    const attackBox = {
        x: enemy.facing > 0 ? enemy.x + enemy.width : enemy.x - 60,
        y: enemy.y + 20,
        width: 60,
        height: 60
    };
    return checkCollision(attackBox, player);
}

// Update player
function updatePlayer() {
    // Movement
    player.vx = 0;
    if (keys['arrowleft'] || keys['a']) {
        player.vx = -player.speed;
        player.facing = -1;
    }
    if (keys['arrowright'] || keys['d']) {
        player.vx = player.speed;
        player.facing = 1;
    }
    
    // Jump
    if ((keys['arrowup'] || keys['w'] || keys[' ')) && player.vy === 0) {
        player.vy = player.jumpPower;
    }
    
    // Attacks
    if (keys['f'] && player.attackTimer <= 0) {
        player.attacking = true;
        player.attackTimer = 20;
        if (playerAttack()) {
            enemy.health -= 15;
            comboHits++;
            shakeTimer = 10;
        }
    }
    if (keys['g'] && player.attackTimer <= 0) {
        player.attacking = true;
        player.attackTimer = 25;
        if (playerAttack()) {
            enemy.health -= 25;
            comboHits += 2;
            shakeTimer = 15;
        }
    }
    if (keys['q'] && player.attackTimer <= 0) {
        player.attacking = true;
        player.attackTimer = 40;
        if (playerAttack()) {
            enemy.health -= 50;
            comboHits += 5;
            shakeTimer = 30;
        }
    }
    
    // Physics
    player.vy += 0.8; // gravity
    player.x += player.vx;
    player.y += player.vy;
    
    // Ground collision
    if (player.y >= 350) {
        player.y = 350;
        player.vy = 0;
    }
    
    // Boundaries
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    
    // Attack timer
    if (player.attackTimer > 0) player.attackTimer--;
    else player.attacking = false;
    
    // Friction
    player.vx *= 0.8;
}

// Update enemy AI
function updateEnemy() {
    const distance = Math.abs(player.x - enemy.x);
    
    // Chase player
    if (distance > 80) {
        enemy.vx = player.x > enemy.x ? enemy.speed : -enemy.speed;
        enemy.facing = player.x > enemy.x ? 1 : -1;
    } else {
        enemy.vx *= 0.9;
        // Attack
        enemy.aiTimer++;
        if (enemy.aiTimer > 60 / difficulty) {
            enemy.attacking = true;
            enemy.attackTimer = 25;
            if (enemyAttack()) {
                player.health -= 12 + difficulty * 3;
                shakeTimer = 12;
            }
            enemy.aiTimer = 0;
        }
    }
    
    // Jump occasionally
    if (Math.random() < 0.01 && enemy.vy === 0) {
        enemy.vy = enemy.jumpPower;
    }
    
    // Physics (same as player)
    enemy.vy += 0.8;
    enemy.x += enemy.vx;
    enemy.y += enemy.vy;
    
    if (enemy.y >= 350) {
        enemy.y = 350;
        enemy.vy = 0;
    }
    
    enemy.x = Math.max(0, Math.min(canvas.width - enemy.width, enemy.x));
    enemy.vx *= 0.8;
    
    if (enemy.attackTimer > 0) enemy.attackTimer--;
    else enemy.attacking = false;
}

// Check win condition
function checkGameOver() {
    if (player.health <= 0) {
        document.getElementById('gameOverText').textContent = '💀 YOU LOSE 💀';
        gameOverScreen.classList.remove('hidden');
        gameRunning = false;
    } else if (enemy.health <= 0) {
        document.getElementById('gameOverText').textContent = '🏆 YOU WIN! 🏆';
        gameOverScreen.classList.remove('hidden');
        gameRunning = false;
    }
}

// Update UI
function updateUI() {
    playerHealthEl.style.width = Math.max(0, (player.health / player.maxHealth) * 100) + '%';
    enemyHealthEl.style.width = Math.max(0, (enemy.health / enemy.maxHealth) * 100) + '%';
    
    if (comboTime > 0) {
        comboDisplay.textContent = `${comboHits} HIT COMBO!`;
        comboTime--;
    } else {
        comboDisplay.textContent = 'FIGHT!';
        comboHits = 0;
    }
}

// Render everything
function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#2c3e50');
    skyGrad.addColorStop(0.5, '#3498db');
    skyGrad.addColorStop(1, '#1abc9c');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Ground
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(0, 380, canvas.width, 120);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(0, 390, canvas.width, 20);
    
    // Shake effect
    ctx.save();
    if (shakeTimer > 0) {
        ctx.translate(Math.sin(Date.now() * 0.01) * 8, Math.sin(Date.now() * 0.015) * 6);
        shakeTimer--;
        canvas.classList.add('shake');
    } else {
        canvas.classList.remove('shake');
    }
    
    // Player
    ctx.fillStyle = player.health > 0 ? '#3498db' : '#95a5a6';
    ctx.shadowColor = player.attacking ? '#3498db' : 'transparent';
    ctx.shadowBlur = player.attacking ? 20 : 0;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Player attack effect
    if (player.attacking) {
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(
            player.facing > 0 ? player.x + player.width : player.x - 40,
            player.y + 30, 40, 30
        );
    }
    
    // Enemy
    ctx.fillStyle = enemy.health > 0 ? '#e74c3c' : '#95a5a6';
    ctx.shadowColor = enemy.attacking ? '#e74c3c' : 'transparent';
    ctx.shadowBlur = enemy.attacking ? 20 : 0;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    
    // Enemy attack effect
    if (enemy.attacking) {
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(
            enemy.facing > 0 ? enemy.x + enemy.width : enemy.x - 40,
            enemy.y + 30, 40, 30
        );
    }
    
    ctx.restore();
}

// Main game loop
function gameLoop() {
    if (gameRunning) {
        comboTime = Math.max(0, comboTime - 1);
        updatePlayer();
        updateEnemy();
        checkGameOver();
        updateUI();
    }
    render();
    requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    difficulty = parseInt(diffSelect.value);
    gameRunning = true;
    startScreen.classList.add('hidden');
    player.health = 100;
    enemy.health = 100;
    updateUI();
}

function restartGame() {
    gameOverScreen.classList.add('hidden');
    player.x = 100;
    enemy.x = 800;
    startGame();
}

// Start the engine!
gameLoop();
console.log('✅ Game engine running! Use arrows + F/G/Q');

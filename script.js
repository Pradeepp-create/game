// Fight Night - Fixed & Working Version
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const ui = document.getElementById('ui');
const comboCounter = document.getElementById('comboCounter');
const cooldownSpecial = document.getElementById('cooldownSpecial');

// Game state - FIXED: No auto-pause
let gameState = 'menu'; // menu, playing, gameover
let difficulty = 'med';
let shakeTime = 0;
let comboCount = 0;
let comboTimer = 0;
let specialCooldown = 0;

// Player
const player = {
    x: 100, y: 400, width: 60, height: 120, // Smaller for better collision
    velX: 0, velY: 0, speed: 6, jumpPower: -16,
    health: 100, maxHealth: 100,
    facing: 1,
    state: 'idle',
    attackRange: 80,
    lastAttack: 0
};

// Enemy
const enemy = {
    x: 1000, y: 400, width: 60, height: 120,
    velX: 0, velY: 0, speed: 4, jumpPower: -14,
    health: 100, maxHealth: 100,
    facing: -1,
    state: 'idle',
    aiTimer: 0,
    attackRange: 80,
    lastAttack: 0
};

// Keys
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// Elements
const startBtn = document.getElementById('startBtn');
const difficultySelect = document.getElementById('difficulty');
const restartBtn = document.getElementById('restartBtn');
const startMenu = document.getElementById('startMenu');
const endScreen = document.getElementById('endScreen');
const pauseScreen = document.getElementById('pauseScreen');
const healthPlayerFill = document.getElementById('healthFillPlayer');
const healthEnemyFill = document.getElementById('healthFillEnemy');

// Event listeners
startBtn.onclick = startGame;
restartBtn.onclick = startGame;
difficultySelect.onchange = () => { difficulty = difficultySelect.value; };

function startGame() {
    player.health = 100;
    enemy.health = 100;
    player.x = 100;
    enemy.x = 1000;
    comboCount = 0;
    specialCooldown = 0;
    gameState = 'playing';
    
    startMenu.classList.add('hidden');
    endScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    ui.classList.remove('hidden');
    updateUI();
}

function updateUI() {
    healthPlayerFill.style.width = (player.health / player.maxHealth * 100) + '%';
    healthEnemyFill.style.width = (enemy.health / enemy.maxHealth * 100) + '%';
    
    if (comboTimer > 0) {
        comboCounter.textContent = `${comboCount} HIT COMBO!`;
    } else {
        comboCounter.textContent = '0 HIT';
    }
    
    cooldownSpecial.textContent = specialCooldown > 0 ? 'Cooldown ' + Math.ceil(specialCooldown/60) + 's' : 'Q: Special Ready';
}

function rectCollide(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function attack(attacker, defender, damage) {
    const attackBox = {
        x: attacker.x + (attacker.facing > 0 ? attacker.width : -attacker.attackRange),
        y: attacker.y + 20,
        width: attacker.attackRange,
        height: 60
    };
    
    if (rectCollide(attackBox, defender)) {
        defender.health = Math.max(0, defender.health - damage);
        comboCount++;
        comboTimer = 90;
        shakeTime = 15;
        updateUI();
        checkWin();
    }
}

function checkWin() {
    if (player.health <= 0) {
        gameState = 'gameover';
        document.getElementById('endMessage').textContent = 'You Lose! 💀';
        endScreen.classList.remove('hidden');
        ui.classList.add('hidden');
    } else if (enemy.health <= 0) {
        gameState = 'gameover';
        document.getElementById('endMessage').textContent = 'You Win! 🏆';
        endScreen.classList.remove('hidden');
        ui.classList.add('hidden');
    }
}

function updatePlayer() {
    // Movement
    player.velX = 0;
    if (keys['arrowleft']) {
        player.velX = -player.speed;
        player.facing = -1;
        player.state = 'walk';
    }
    if (keys['arrowright']) {
        player.velX = player.speed;
        player.facing = 1;
        player.state = 'walk';
    }
    
    // Jump
    if (keys['arrowup'] && player.velY === 0) {
        player.velY = player.jumpPower;
        player.state = 'jump';
    }
    
    // Attacks - FIXED timing
    const now = Date.now();
    if (keys['f'] && now - player.lastAttack > 400) {
        player.state = 'attack';
        player.lastAttack = now;
        attack(player, enemy, 12);
        setTimeout(() => player.state = 'idle', 200);
    }
    if (keys['g'] && now - player.lastAttack > 400) {
        player.state = 'attack';
        player.lastAttack = now;
        attack(player, enemy, 18);
        setTimeout(() => player.state = 'idle', 200);
    }
    if (keys['q'] && specialCooldown <= 0) {
        player.state = 'special';
        specialCooldown = 180; // 3 sec
        attack(player, enemy, 35);
        setTimeout(() => player.state = 'idle', 400);
    }
    
    // Physics
    player.velY += 0.9; // Gravity
    player.x += player.velX;
    player.y += player.velY;
    
    // Boundaries
    if (player.y > 400) {
        player.y = 400;
        player.velY = 0;
    }
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    
    // Friction
    player.velX *= 0.85;
    
    // Cooldown tick
    if (specialCooldown > 0) specialCooldown -= 1;
    
    // Idle state
    if (player.velX === 0 && player.velY === 0 && player.state !== 'attack' && player.state !== 'special') {
        player.state = 'idle';
    }
}

function updateEnemy() {
    const dist = Math.abs(player.x - enemy.x);
    enemy.aiTimer++;
    
    // AI speeds
    const aiSpeeds = { easy: 3, med: 4.5, hard: 6 };
    const aiSpeed = aiSpeeds[difficulty];
    
    // Chase player
    if (dist > 120) {
        enemy.velX = player.x < enemy.x ? -aiSpeed : aiSpeed;
        enemy.facing = player.x < enemy.x ? 1 : -1;
    } else {
        enemy.velX *= 0.9;
        // Attack when close
        if (enemy.aiTimer > (difficulty === 'hard' ? 40 : 70)) {
            const now = Date.now();
            if (now - enemy.lastAttack > 800) {
                const dmg = 10 + (Math.random() * 8);
                attack(enemy, player, dmg);
                enemy.lastAttack = now;
            }
            enemy.aiTimer = 0;
        }
    }
    
    // Random jump
    if (Math.random() < 0.008 && enemy.velY === 0) {
        enemy.velY = enemy.jumpPower;
    }
    
    // Physics same as player
    enemy.velY += 0.9;
    enemy.x += enemy.velX;
    enemy.y += enemy.velY;
    
    if (enemy.y > 400) {
        enemy.y = 400;
        enemy.velY = 0;
    }
    enemy.x = Math.max(0, Math.min(canvas.width - enemy.width, enemy.x));
    
    enemy.velX *= 0.85;
    
    if (enemy.velX === 0 && enemy.velY === 0) enemy.state = 'idle';
}

function render() {
    // Clear + shake effect
    ctx.save();
    if (shakeTime > 0) {
        ctx.translate((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
        shakeTime--;
        canvas.classList.add('shake');
    } else {
        canvas.classList.remove('shake');
    }
    
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#4facfe');
    bgGrad.addColorStop(1, '#00f2fe');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Ground
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 450, canvas.width, 150);
    
    // Player render
    ctx.save();
    ctx.translate(player.x + player.width/2, player.y + player.height/2);
    ctx.scale(player.facing, 1);
    ctx.translate(-player.width/2, -player.height/2);
    
    // Body
    ctx.fillStyle = player.health > 0 ? '#00d4ff' : '#666';
    ctx.shadowColor = player.state === 'special' ? '#ffff00' : 'transparent';
    ctx.shadowBlur = 20;
    ctx.fillRect(0, player.height * 0.3, player.width, player.height * 0.7);
    
    // Attack effect
    if (player.state === 'attack') {
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(player.width * 0.8, player.height * 0.4, 40, 30);
    }
    
    ctx.restore();
    
    // Enemy render
    ctx.save();
    ctx.translate(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
    ctx.scale(enemy.facing, 1);
    ctx.translate(-enemy.width/2, -enemy.height/2);
    
    ctx.fillStyle = enemy.health > 0 ? '#ff6b81' : '#666';
    ctx.shadowColor = enemy.state === 'attack' ? '#ffaa00' : 'transparent';
    ctx.shadowBlur = 15;
    ctx.fillRect(0, enemy.height * 0.3, enemy.width, enemy.height * 0.7);
    
    if (enemy.state === 'attack') {
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(enemy.width * 0.8, enemy.height * 0.4, 40, 30);
    }
    
    ctx.restore();
    
    ctx.restore();
    
    // Special screen flash
    if (player.state === 'special' || enemy.state === 'special') {
        ctx.fillStyle = 'rgba(255, 255, 100, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// Main game loop - FIXED 60fps
let lastTime = 0;
function gameLoop(currentTime) {
    const delta = currentTime - lastTime;
    lastTime = currentTime;
    
    if (gameState === 'playing') {
        comboTimer = Math.max(0, comboTimer - 1);
        
        updatePlayer();
        updateEnemy();
        updateUI();
    }
    
    render();
    requestAnimationFrame(gameLoop);
}

// Start the engine
requestAnimationFrame(gameLoop);
updateUI();
